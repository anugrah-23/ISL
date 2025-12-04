// backend/models/User.js
const bcrypt = require('bcryptjs');
const getPool = require('../config/db');

const User = {
  async createUser({ name, email, phone, password }) {
    const pool = getPool();
    const hashed = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO isl_users (name, email, phone, password, created_at)
      VALUES ($1, $2, $3, $4, now())
      RETURNING id, name, email, phone, created_at, last_login, last_activity
    `;

    const { rows } = await pool.query(sql, [
      name,
      email.toLowerCase(),
      phone,
      hashed,
    ]);

    return rows[0];
  },

  async findByEmail(email, includePassword = false) {
    const pool = getPool();
    const cols = includePassword
      ? 'id, name, email, phone, password, created_at, last_login, last_activity'
      : 'id, name, email, phone, created_at, last_login, last_activity';

    const { rows } = await pool.query(
      `SELECT ${cols} FROM isl_users WHERE email = $1`,
      [email.toLowerCase()]
    );

    return rows[0] || null;
  },

  async findByPhone(phone) {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT id, name, email, phone FROM isl_users WHERE phone = $1',
      [phone]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, created_at, last_login, last_activity FROM isl_users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  },
};

module.exports = User;
