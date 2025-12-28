const express = require("express");
const router = express.Router();
const getPool = require("../config/db");

/**
 * -----------------------------
 * ADD FRIEND BY USERNAME
 * -----------------------------
 */
router.post("/add-by-username", async (req, res) => {
  try {
    const { userId, username } = req.body;
    if (!userId || !username) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const pool = getPool();

    // lookup user by name (USERNAME = name in your system)
    const friendRes = await pool.query(
      `SELECT id, name FROM isl_users WHERE name = $1`,
      [username]
    );

    if (friendRes.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const friend = friendRes.rows[0];

    if (String(friend.id) === String(userId)) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    // check existing relationship
    const exists = await pool.query(
      `
      SELECT 1 FROM friends
      WHERE (user_id=$1 AND friend_id=$2)
         OR (user_id=$2 AND friend_id=$1)
      `,
      [userId, friend.id]
    );

    if (exists.rowCount > 0) {
      return res
        .status(409)
        .json({ message: "Friend request already exists" });
    }

    // insert pending request
    await pool.query(
      `
      INSERT INTO friends (user_id, friend_id, status)
      VALUES ($1, $2, 'pending')
      `,
      [userId, friend.id]
    );

    res.json({
      ok: true,
      friend: { id: friend.id, name: friend.name },
    });
  } catch (err) {
    console.error("add-by-username", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * -----------------------------
 * GET PENDING REQUESTS (MUST COME FIRST)
 * -----------------------------
 */
router.get("/:userId/pending", async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `
      SELECT 
        f.user_id AS from_user_id,
        u.name AS from_username
      FROM friends f
      JOIN isl_users u ON u.id = f.user_id
      WHERE f.friend_id = $1 AND f.status = 'pending'
      `,
      [req.params.userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("pending friends", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * -----------------------------
 * GET ACCEPTED FRIENDS
 * -----------------------------
 */
router.get("/:userId", async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `
      SELECT u.id, u.name
      FROM friends f
      JOIN isl_users u ON u.id = f.friend_id
      WHERE f.user_id = $1 AND f.status = 'accepted'
      `,
      [req.params.userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("get friends", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * -----------------------------
 * ACCEPT FRIEND REQUEST
 * -----------------------------
 */
router.post("/accept", async (req, res) => {
  try {
    const { userId, fromUserId } = req.body;
    const pool = getPool();

    await pool.query(
      `
      UPDATE friends
      SET status='accepted'
      WHERE user_id=$2 AND friend_id=$1 AND status='pending'
      `,
      [userId, fromUserId]
    );

    // insert reverse direction
    await pool.query(
      `
      INSERT INTO friends (user_id, friend_id, status)
      VALUES ($1, $2, 'accepted')
      ON CONFLICT DO NOTHING
      `,
      [userId, fromUserId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("accept friend", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * -----------------------------
 * REJECT FRIEND REQUEST
 * -----------------------------
 */
router.post("/reject", async (req, res) => {
  try {
    const { userId, fromUserId } = req.body;
    const pool = getPool();

    await pool.query(
      `
      DELETE FROM friends
      WHERE user_id=$2 AND friend_id=$1 AND status='pending'
      `,
      [userId, fromUserId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("reject friend", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
