import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { ALL_ROLES, ROLES } from '../constants/roles.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public (or protected by HR/Admin depending on config)
 */
export const register = async (req, res) => {
  try {
    const { email, password, roles } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Validate roles if provided, otherwise default to employee
    let userRoles = [ROLES.EMPLOYEE];
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const invalidRoles = roles.filter((r) => !ALL_ROLES.includes(r));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid role(s): ${invalidRoles.join(', ')}. Available roles: ${ALL_ROLES.join(', ')}`
        });
      }
      userRoles = roles;
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      roles: userRoles
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        email: user.email,
        roles: user.roles,
        accountStatus: user.accountStatus,
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
      message: 'Logged in successfully',
      data: {
        _id: user._id,
        email: user.email,
        roles: user.roles,
        accountStatus: user.accountStatus,
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

    // In production, send via Email / SMS
    return res.status(200).json({
      success: true,
      message: 'Password reset code generated and sent',
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

