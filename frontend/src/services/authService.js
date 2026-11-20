import api from './api';

export const authService = {
  // Login
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  // Register
  register: async (email, password, roles) => {
    const payload = { email, password };
    if (roles && roles.length > 0) {
      payload.roles = roles;
    }
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  // Get current user profile
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  // Request password reset code
  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  // Reset password
  resetPassword: async (email, code, newPassword) => {
    const res = await api.post('/auth/reset-password', { email, code, newPassword });
    return res.data;
  },

  // Change password (mandatory first login with temporary password or self-service)
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const res = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return res.data;
  },

  // Get current user registration permissions
  getRegistrationPermissions: async () => {
    const res = await api.get('/auth/registration-permissions');
    return res.data;
  },

  // Telegram deep link code
  getTelegramLinkCode: async () => {
    const res = await api.post('/auth/telegram/link-code');
    return res.data;
  },

  // Unlink Telegram
  unlinkTelegram: async () => {
    const res = await api.post('/auth/telegram/unlink');
    return res.data;
  }
};
