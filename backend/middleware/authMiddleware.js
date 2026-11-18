import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ACCOUNT_STATUS } from '../constants/roles.js';

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'vector_advert_erp_secret_key_2026', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'vector_advert_erp_secret_key_2026'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
        return res.status(403).json({
          success: false,
          message: `Account is ${user.accountStatus}. Please contact administrator.`
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token not provided'
    });
  }
};

/**
 * Optional protection middleware:
 * If Bearer token is provided, verify and attach req.user.
 * If not provided, continue without error (req.user remains undefined).
 */
export const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    return protect(req, res, next);
  }
  next();
};

/**
 * Role-based authorization middleware
 * Accepts any number of allowed roles.
 * Supports checking if user's roles array contains any of the required roles.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: user role not found'
      });
    }

    const hasPermission = req.user.roles.some((role) =>
      allowedRoles.includes(role)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: required roles [${allowedRoles.join(
          ', '
        )}], but your roles are [${req.user.roles.join(', ')}]`
      });
    }

    next();
  };
};

