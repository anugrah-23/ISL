// backend/lib/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

async function sendMail({ to, subject, text, html }) {
  const message = { from: process.env.SMTP_FROM, to, subject, text, html };
  return transporter.sendMail(message);
}

module.exports = { sendMail, transporter };
