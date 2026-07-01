const dns = require('dns');
const nodemailer = require('nodemailer');
const { env } = require('../config/env');

// Some PaaS environments resolve smtp.gmail.com to IPv6 first but do not provide
// outbound IPv6 routing. Prefer IPv4 globally for SMTP/DNS resolution.
dns.setDefaultResultOrder?.('ipv4first');

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    family: 4,
    requireTLS: !env.SMTP_SECURE,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    tls: {
      servername: env.SMTP_HOST
    }
  });
}

async function sendMail({ to, subject, html, text }) {
  if (!hasSmtpConfig()) {
    if (env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured. Email verification cannot be sent in production.');
    }
    console.info('\n[email preview: SMTP not configured]');
    console.info(`To: ${to}`);
    console.info(`Subject: ${subject}`);
    console.info(text);
    console.info('[/email preview]\n');
    return { sent: false, preview: true };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
    text
  });

  return { sent: true, messageId: info.messageId };
}

async function sendVerificationEmail({ user, verificationLink, expiresMinutes }) {
  const subject = 'Verify your Cure Cafe account';
  const text = `Dear ${user.name},\n\nWelcome to Cure Cafe. Please verify your email address to activate your account.\n\nVerification link: ${verificationLink}\n\nThis link expires in ${expiresMinutes} minutes. If you did not request this account, you can safely ignore this email.\n\nRegards,\nCure Cafe Team`;
  const html = `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(135deg,#064e3b,#059669,#c2410c);padding:28px 32px;color:#ffffff;">
                  <h1 style="margin:0;font-size:28px;line-height:1.2;">Cure Cafe</h1>
                  <p style="margin:8px 0 0;color:#ecfdf5;font-size:14px;">Clinical meals, warmly managed</p>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <h2 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Verify your email address</h2>
                  <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">Dear ${user.name},</p>
                  <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#475569;">Thank you for registering with Cure Cafe. To protect patient and hospital meal data, please verify your email address before accessing your account.</p>
                  <p style="margin:0 0 26px;">
                    <a href="${verificationLink}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:700;border-radius:14px;padding:13px 22px;">Verify my account</a>
                  </p>
                  <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#64748b;">This verification link expires in <strong>${expiresMinutes} minutes</strong>.</p>
                  <p style="margin:0;font-size:13px;line-height:1.7;color:#94a3b8;">If the button does not work, copy and paste this link into your browser:<br/><a href="${verificationLink}" style="color:#047857;word-break:break-all;">${verificationLink}</a></p>
                </td>
              </tr>
              <tr>
                <td style="background:#f8fafc;padding:20px 32px;font-size:12px;line-height:1.6;color:#64748b;">If you did not request this account, you can safely ignore this email.</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return sendMail({ to: user.email, subject, html, text });
}

module.exports = { sendMail, sendVerificationEmail, hasSmtpConfig };
