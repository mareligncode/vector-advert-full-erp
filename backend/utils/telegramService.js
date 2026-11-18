import { Telegraf } from 'telegraf';
import User from '../models/User.js';

let bot = null;

/**
 * Initialize Telegram Bot instance and register event handlers
 */
export const initTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN not provided in .env. Bot is disabled.');
    return null;
  }

  try {
    bot = new Telegraf(token);

    // /start command - supports deep linking e.g. /start link_CODE
    bot.start(async (ctx) => {
      try {
        const payload = ctx.payload; // argument after /start
        const chatId = ctx.chat.id.toString();
        const username = ctx.from.username || ctx.from.first_name || '';

        if (payload && payload.startsWith('link_')) {
          const connectCode = payload.replace('link_', '').trim();
          const user = await User.findOne({ telegramConnectCode: connectCode });

          if (user) {
            user.telegramChatId = chatId;
            user.telegramUsername = username;
            user.telegramConnectCode = undefined;
            await user.save();

            return ctx.reply(
              `🎉 Welcome, ${user.email}!\n\nYour Telegram account has been successfully linked to your Vector Advert ERP account. You will now receive system notifications, alerts, and password reset codes directly here.`
            );
          } else {
            return ctx.reply(
              '⚠️ The connection token is invalid or has expired. Please generate a new connection link from your ERP profile settings.'
            );
          }
        }

        return ctx.reply(
          `👋 Hello ${ctx.from.first_name}!\n\nWelcome to Vector Advert ERP Notification Bot.\nTo connect your account:\n1. Log in to your ERP dashboard\n2. Click "Connect Telegram"\n3. Or use the command /link <your_verification_code>`
        );
      } catch (err) {
        console.error('[Telegram Bot] /start error:', err);
        return ctx.reply('An error occurred while processing your request.');
      }
    });

    // /link <code> command
    bot.command('link', async (ctx) => {
      try {
        const parts = ctx.message.text.trim().split(/\s+/);
        if (parts.length < 2) {
          return ctx.reply('Please provide your verification code. Example:\n/link 123456');
        }

        const connectCode = parts[1].trim();
        const user = await User.findOne({ telegramConnectCode: connectCode });

        if (!user) {
          return ctx.reply('⚠️ Verification code is invalid or expired.');
        }

        user.telegramChatId = ctx.chat.id.toString();
        user.telegramUsername = ctx.from.username || ctx.from.first_name || '';
        user.telegramConnectCode = undefined;
        await user.save();

        return ctx.reply(
          `✅ Successfully connected to account: ${user.email}!\nYou will now receive instant notifications from Vector Advert ERP.`
        );
      } catch (err) {
        console.error('[Telegram Bot] /link error:', err);
        return ctx.reply('An error occurred during linking.');
      }
    });

    // /unlink command
    bot.command('unlink', async (ctx) => {
      try {
        const chatId = ctx.chat.id.toString();
        const user = await User.findOne({ telegramChatId: chatId });

        if (!user) {
          return ctx.reply('No ERP account is currently linked to this Telegram chat.');
        }

        user.telegramChatId = null;
        user.telegramUsername = null;
        await user.save();

        return ctx.reply(`Account (${user.email}) has been unlinked from this Telegram chat.`);
      } catch (err) {
        console.error('[Telegram Bot] /unlink error:', err);
        return ctx.reply('An error occurred during unlinking.');
      }
    });

    // /status command
    bot.command('status', async (ctx) => {
      const chatId = ctx.chat.id.toString();
      const user = await User.findOne({ telegramChatId: chatId });
      if (user) {
        return ctx.reply(`✅ Linked to: ${user.email} (Roles: ${user.roles.join(', ')})`);
      } else {
        return ctx.reply(`❌ Not connected to any Vector Advert ERP account.`);
      }
    });

    // Launch bot non-blocking
    bot.launch()
      .then(() => {
        console.log('[Telegram Bot] Bot launched successfully');
      })
      .catch((err) => {
        console.warn('[Telegram Bot] Failed to launch bot polling:', err.message);
      });

    // Enable graceful stop
    process.once('SIGINT', () => bot?.stop('SIGINT'));
    process.once('SIGTERM', () => bot?.stop('SIGTERM'));

    return bot;
  } catch (error) {
    console.error('[Telegram Bot] Initialization error:', error.message);
    return null;
  }
};

/**
 * Send message to a specific Telegram Chat ID
 */
export const sendTelegramMessage = async (chatId, message, extra = {}) => {
  if (!bot && !process.env.TELEGRAM_BOT_TOKEN) {
    console.warn(`[Telegram Bot] Bot not active. Message to chat ${chatId} skipped: ${message}`);
    return { success: false, message: 'Bot not configured' };
  }

  try {
    if (!bot) {
      bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    }
    const result = await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      ...extra
    });
    return { success: true, result };
  } catch (error) {
    console.error(`[Telegram Bot] Failed to send message to ${chatId}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Telegram notification to user by email or User model
 */
export const sendTelegramNotificationToUser = async (userOrEmail, message) => {
  try {
    let user = userOrEmail;
    if (typeof userOrEmail === 'string') {
      user = await User.findOne({ email: userOrEmail.toLowerCase() });
    }

    if (!user || !user.telegramChatId) {
      return { success: false, message: 'User has no linked Telegram account' };
    }

    return await sendTelegramMessage(user.telegramChatId, message);
  } catch (error) {
    return { success: false, error: error.message };
  }
};
