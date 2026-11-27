import { sendEmail, sendPasswordResetEmail } from './emailService.js';
import { sendTelegramMessage, sendTelegramNotificationToUser } from './telegramService.js';
import User from '../models/User.js';

/**
 * Unified notification dispatcher to send via Email, Telegram, or both.
 * @param {Object} options
 * @param {string|Object} options.recipient - User document or email address or userId
 * @param {string} options.subject - Subject line (for Email and header in Telegram)
 * @param {string} options.message - Plain text message
 * @param {string} [options.html] - HTML content for email
 * @param {string[]} [options.channels] - Optional array ['email', 'telegram'], defaults to both
 */
export const notifyUser = async ({ recipient, subject, message, html, channels = ['email', 'telegram'] }) => {
  let user = null;

  if (typeof recipient === 'string') {
    // Check if it's an email or an ObjectId
    if (recipient.includes('@')) {
      user = await User.findOne({ email: recipient.toLowerCase() });
    } else {
      user = await User.findById(recipient);
    }
  } else if (recipient && recipient._id) {
    user = recipient;
  }

  const results = {
    email: null,
    telegram: null
  };

  const targetEmail = user ? user.email : (typeof recipient === 'string' && recipient.includes('@') ? recipient : null);

  // 1. Send Email if channel requested
  if (channels.includes('email') && targetEmail) {
    const formattedHtml = html || `
      <div style="font-family: 'Inter', sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #1e293b;">${subject}</h3>
        <p style="color: #334155; line-height: 1.5;">${message.replace(/\n/g, '<br/>')}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 20px;" />
        <p style="font-size: 12px; color: #94a3b8;">Vector Advert ERP Automated Notification</p>
      </div>
    `;

    results.email = await sendEmail({
      to: targetEmail,
      subject,
      text: message,
      html: formattedHtml
    });
  }

  // 2. Send Telegram if channel requested
  if (channels.includes('telegram')) {
    if (user && user.telegramChatId) {
      const tgText = `🔔 <b>${subject}</b>\n\n${message}`;
      results.telegram = await sendTelegramMessage(user.telegramChatId, tgText);
    } else {
      results.telegram = { success: false, message: 'No linked Telegram chat found for user' };
    }
  }

  return results;
};

/**
 * Notify all users with given roles (e.g. HR_MANAGER, SUPER_ADMIN)
 */
export const notifyRoles = async (roles, { subject, message, html }) => {
  try {
    const users = await User.find({ roles: { $in: roles }, accountStatus: 'active' });
    const promises = users.map((user) => notifyUser({ recipient: user, subject, message, html }));
    return await Promise.allSettled(promises);
  } catch (error) {
    console.error('[Notification Hub] Error notifying roles:', error);
    return [];
  }
};
