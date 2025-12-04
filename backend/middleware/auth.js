// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.warn('[Auth] Token failed:', err.message);
    res.status(401).json({ message: 'Not authorized' });
  }
}

module.exports = { protect };
