// backend/lib/email.js
const nodemailer = require('nodemailer');

let transporter = null;

function createTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !process.env.SMTP_FROM) {
    // No SMTP configured — use a no-op transporter that logs instead of sending.
    transporter = {
      sendMail: async (msg) => {
        console.warn('SMTP not configured. Skipping sendMail. Message:', msg);
        return { skipped: true };
      }
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined
  });

  // Try to verify transporter; don't throw in production, just warn.
  transporter.verify((err, success) => {
    if (err) console.warn('SMTP verify failed:', err.message || err);
    else console.log('SMTP transporter ready');
  });

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const t = createTransporter();
  const message = { from: process.env.SMTP_FROM || 'no-reply@localhost', to, subject, text, html };
  try {
    return await t.sendMail(message);
  } catch (err) {
    console.error('sendMail error:', err.message || err);
    throw err;
  }
}

module.exports = { sendMail, createTransporter };
