import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { ALL_ROLES, ROLES, getAllowedRegistrationRoles } from '../constants/roles.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import { sendTelegramMessage } from '../utils/telegramService.js';

/**
 * Generate a cryptographically random, readable temporary password
 */
export const generateRandomTemporaryPassword = () => {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const specials = '!@#$%&*';
  const allChars = uppers + lowers + digits + specials;

  const pwd = [
    uppers[crypto.randomInt(0, uppers.length)],
    lowers[crypto.randomInt(0, lowers.length)],
    digits[crypto.randomInt(0, digits.length)],
    specials[crypto.randomInt(0, specials.length)]
  ];

  for (let i = 0; i < 6; i++) {
    pwd.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  return pwd.sort(() => 0.5 - Math.random()).join('');
};

/**
 * @desc    Register a new user (Hierarchical flow)
 *          - CEO can register: CEO, CAO, COO
 *          - CAO can register: HR Manager, Purchaser, Storekeeper, Finance, etc.
 *          - COO can register: Department Head, Manager, Designer
 *          - HR Manager can register: Employee, Intern
 *          - Generates random temporary password and enforces password change on first login
 * @route   POST /api/auth/register
 * @access  Protected (except bootstrap initial user when 0 users exist)
 */
export const register = async (req, res) => {
  try {
    const { email, password, roles } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const totalUsers = await User.countDocuments();
    const isFirstUser = totalUsers === 0;

    // Public registration check:
    // Only the very first user (initial system bootstrap) can register without auth.
    if (!isFirstUser && !req.user) {
      return res.status(403).json({
        success: false,
        message: 'Public self-registration is disabled. Accounts must be registered by authorized executive leadership (CEO, CAO, COO, or HR Manager).'
      });
    }

    let userRoles = [];
    if (isFirstUser) {
      // First root user defaults to CEO or Super Admin
      userRoles = roles && roles.length > 0 ? roles : [ROLES.CEO];
    } else {
      // Check hierarchical permissions
      const callerRoles = req.user.roles || [];
      const allowedRoles = getAllowedRegistrationRoles(callerRoles);

      if (allowedRoles.length === 0) {
        return res.status(403).json({
          success: false,
          message: `Your role (${callerRoles.join(', ')}) is not authorized to register users.`
        });
      }

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Please specify user role(s). Allowed for you: ${allowedRoles.join(', ')}`
        });
      }

      const invalidRoles = roles.filter((r) => !ALL_ROLES.includes(r));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid role(s): ${invalidRoles.join(', ')}`
        });
      }

      const unauthorizedRoles = roles.filter((r) => !allowedRoles.includes(r));
      if (unauthorizedRoles.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Unauthorized role(s): [${unauthorizedRoles.join(', ')}]. As ${callerRoles.join(', ')}, you are only permitted to register: [${allowedRoles.join(', ')}]`
        });
      }

      userRoles = roles;
    }

    // Temporary password generation
    let finalPassword = password;
    let isTemporary = false;

    if (!finalPassword || finalPassword.trim() === '') {
      finalPassword = generateRandomTemporaryPassword();
      isTemporary = true;
    } else if (!isFirstUser) {
      // When registered by another user, enforce first-login password change
      isTemporary = true;
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password: finalPassword,
      roles: userRoles,
      mustChangePassword: isTemporary,
      isTemporaryPassword: isTemporary,
      createdBy: req.user ? req.user._id : null
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: isTemporary
        ? 'User registered successfully with a temporary password'
        : 'User registered successfully',
      data: {
        _id: user._id,
        email: user.email,
        roles: user.roles,
        accountStatus: user.accountStatus,
        mustChangePassword: user.mustChangePassword,
        temporaryPassword: isTemporary ? finalPassword : undefined,
        token: isFirstUser ? token : undefined
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.accountStatus}. Please contact administration.`
      });
    }

    user.lastLoginTime = new Date();
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: user.mustChangePassword
        ? 'Temporary password detected. You must change your password to continue.'
        : 'Logged in successfully',
      data: {
        _id: user._id,
        email: user.email,
        roles: user.roles,
        accountStatus: user.accountStatus,
        mustChangePassword: !!user.mustChangePassword,
        lastLoginTime: user.lastLoginTime,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Enforce changing password (e.g. on first login with temporary password)
 * @route   POST /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be identical to your temporary password'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current/temporary password is incorrect'
      });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    user.isTemporaryPassword = false;
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. You may now access the platform.',
      data: {
        _id: user._id,
        email: user.email,
        roles: user.roles,
        accountStatus: user.accountStatus,
        mustChangePassword: false,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get registration permissions for current authenticated user
 * @route   GET /api/auth/registration-permissions
 * @access  Private
 */
export const getRegistrationPermissions = async (req, res) => {
  try {
    const callerRoles = req.user.roles || [];
    const allowedRoles = getAllowedRegistrationRoles(callerRoles);

    return res.status(200).json({
      success: true,
      data: {
        canRegister: allowedRoles.length > 0,
        callerRoles,
        allowedRoles
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Request password reset code
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    // Generate 6-digit numeric reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.passwordResetCode = hashedCode;
    user.passwordResetCodeExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // Send reset code via Email (Nodemailer)
    const emailResult = await sendPasswordResetEmail(user.email, resetCode);

    // If user has linked Telegram, also send code to Telegram Bot
    let telegramResult = null;
    if (user.telegramChatId) {
      telegramResult = await sendTelegramMessage(
        user.telegramChatId,
        `🔐 <b>Password Reset Request</b>\n\nYour Vector Advert ERP verification code is: <code>${resetCode}</code>\n\nThis code will expire in 15 minutes. If you did not request this, please secure your account immediately.`
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset code generated and sent via email' + (user.telegramChatId ? ' and Telegram' : ''),
      emailDelivered: emailResult.success,
      telegramDelivered: !!(telegramResult && telegramResult.success),
      // For development/testing convenience:
      resetCode: process.env.NODE_ENV === 'production' ? undefined : resetCode
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reset password using reset code
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, reset code and newPassword'
      });
    }

    const hashedCode = crypto.createHash('sha256').update(code.toString()).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetCode: hashedCode,
      passwordResetCodeExpiry: { $gt: Date.now() }
    }).select('+passwordResetCode +passwordResetCodeExpiry');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset code'
      });
    }

    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Generate Telegram bot link / connection code for the authenticated user
 * @route   POST /api/auth/telegram/link-code
 * @access  Private
 */
export const getTelegramLinkCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate random code for deep linking
    const connectCode = crypto.randomBytes(6).toString('hex');
    user.telegramConnectCode = connectCode;
    await user.save();

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || '';
    const deepLink = botUsername
      ? `https://t.me/${botUsername}?start=link_${connectCode}`
      : null;

    return res.status(200).json({
      success: true,
      data: {
        connectCode,
        deepLink,
        isLinked: !!user.telegramChatId,
        telegramUsername: user.telegramUsername || null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Unlink Telegram bot from user profile
 * @route   POST /api/auth/telegram/unlink
 * @access  Private
 */
export const unlinkTelegram = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.telegramChatId = null;
    user.telegramUsername = null;
    user.telegramConnectCode = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Telegram account unlinked successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user roles (Admin / HR Manager only)
 * @route   PATCH /api/auth/users/:id/roles
 * @access  Private (Authorized roles only)
 */
export const updateUserRoles = async (req, res) => {
  try {
    const { roles } = req.body;
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Roles must be a non-empty array of strings'
      });
    }

    const invalidRoles = roles.filter((r) => !ALL_ROLES.includes(r));
    if (invalidRoles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid role(s): ${invalidRoles.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { roles },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User roles updated successfully',
      data: user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

