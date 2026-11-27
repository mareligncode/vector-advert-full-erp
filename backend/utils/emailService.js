import nodemailer from 'nodemailer';

let transporter = null;

export const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass
      }
    });
  } else if (process.env.EMAIL_SERVICE) {
    // If provider like 'gmail' is specified
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  return transporter;
};

/**
 * Send an email
 * @param {Object} options { to, subject, text, html }
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailClient = getTransporter();
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@vectoradvert.com';

    if (!mailClient) {
      console.warn(`[Nodemailer] SMTP is not configured. Email to ${to} was not sent via network.`);
      console.log(`[Nodemailer Mock] To: ${to} | Subject: ${subject}\nContent: ${text || html}`);
      return { success: false, mock: true, message: 'SMTP not configured' };
    }

    const info = await mailClient.sendMail({
      from: `"Vector Advert ERP" <${fromAddress}>`,
      to,
      subject,
      text,
      html
    });

    console.log(`[Nodemailer] Email sent: %s`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Nodemailer] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetCode) => {
  const subject = 'Vector Advert ERP - Password Reset Code';
  const text = `Hello,\n\nYou requested a password reset for your Vector Advert ERP account.\nYour 6-digit verification code is: ${resetCode}\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #1e293b; text-align: center;">Vector Advert ERP</h2>
      <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
      <p style="font-size: 16px; color: #334155;">Hello,</p>
      <p style="font-size: 15px; color: #334155;">You requested a password reset for your account. Please use the verification code below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background: #eff6ff; padding: 12px 24px; border-radius: 6px; border: 1px dashed #3b82f6;">
          ${resetCode}
        </span>
      </div>
      <p style="font-size: 14px; color: #64748b;">This code is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; Vector Advert ERP System. All rights reserved.</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, text, html });
};
