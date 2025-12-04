// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const getPool = require('../config/db');

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
}

function mapUserRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    lastLogin: row.last_login,
    lastActivity: row.last_activity,
  };
}

// REGISTER
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }),
    body('email').isEmail(),
    body('phone').matches(/^[6-9]\d{9}$/),
    body('password').isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, phone, password } = req.body;

    try {
      if (await User.findByEmail(email))
        return res
          .status(400)
          .json({ message: 'User exists with this email' });

      if (await User.findByPhone(phone))
        return res
          .status(400)
          .json({ message: 'User exists with this phone' });

      const created = await User.createUser({
        name,
        email,
        phone,
        password,
      });

      // Set initial last_activity
      try {
        const pool = getPool();
        pool
          .query('UPDATE isl_users SET last_activity = now() WHERE id = $1', [
            created.id,
          ])
          .catch(() => {});
      } catch {}

      const token = generateToken(created.id);

      return res
        .status(201)
        .json({ success: true, token, user: mapUserRow(created) });
    } catch (err) {
      console.error('Register error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// LOGIN
router.post(
  '/login',
  [body('email').isEmail(), body('password').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const userRow = await User.findByEmail(email, true);
      if (!userRow)
        return res.status(401).json({ message: 'Invalid credentials' });

      const ok = await User.comparePassword(password, userRow.password);
      if (!ok)
        return res.status(401).json({ message: 'Invalid credentials' });

      // Update last_login asynchronously
      try {
        const pool = getPool();
        pool
          .query('UPDATE isl_users SET last_login = now() WHERE id = $1', [
            userRow.id,
          ])
          .catch(() => {});
      } catch {}

      const token = generateToken(userRow.id);

      return res.json({
        success: true,
        token,
        user: mapUserRow(userRow),
      });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET CURRENT USER (protected)
router.get('/me', async (req, res) => {
  try {
    if (!req.user?.id)
      return res.status(401).json({ message: 'Not authorized' });

    const row = await User.findById(req.user.id);
    if (!row)
      return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, user: mapUserRow(row) });
  } catch (err) {
    console.error('/me error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
