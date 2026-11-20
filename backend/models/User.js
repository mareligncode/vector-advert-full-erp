import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ALL_ROLES, ROLES, ACCOUNT_STATUS } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    roles: {
      type: [String],
      enum: ALL_ROLES,
      default: [ROLES.EMPLOYEE],
      validate: {
        validator: function (roles) {
          return Array.isArray(roles) && roles.length > 0;
        },
        message: 'A user must have at least one role'
      }
    },
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE
    },
    passwordResetCode: {
      type: String,
      default: null,
      select: false
    },
    passwordResetCodeExpiry: {
      type: Date,
      default: null,
      select: false
    },
    telegramChatId: {
      type: String,
      default: null,
      trim: true
    },
    telegramUsername: {
      type: String,
      default: null,
      trim: true
    },
    telegramConnectCode: {
      type: String,
      default: null,
      select: false
    },
    mustChangePassword: {
      type: Boolean,
      default: false
    },
    isTemporaryPassword: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastLoginTime: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;

