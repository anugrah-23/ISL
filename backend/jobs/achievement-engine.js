// backend/jobs/achievement-engine.js
const getPool = require('../config/db');


async function runAchievementEngine() {
console.log('[achievements] engine start');
const pool = getPool();


const { rows: achievements } = await pool.query('SELECT id, key, trigger_spec, reward FROM achievements');
const { rows: users } = await pool.query('SELECT id FROM isl_users');


for (const ach of achievements) {
const spec = ach.trigger_spec || {};


if (spec.type === 'streak') {
const days = Number(spec.days || 7);
for (const u of users) {
const { rows: pRows } = await pool.query('SELECT current_streak FROM story_progress WHERE user_id = $1 LIMIT 1', [u.id]);
if (!pRows.length) continue;
const streak = Number(pRows[0].current_streak || 0);
if (streak >= days) {
const existing = await pool.query('SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2 LIMIT 1', [u.id, ach.id]);
if (existing.rows.length) continue;
await pool.query('INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1,$2)', [u.id, ach.id]);
const xp = (ach.reward && ach.reward.xp) ? Number(ach.reward.xp) : 0;
if (xp) await pool.query('UPDATE isl_users SET xp = COALESCE(xp,0) + $1 WHERE id = $2', [xp, u.id]);
console.log(`[achievements] awarded ${ach.key} to ${u.id}`);
}
}
}


else if (spec.type === 'complete_count') {
// award when user completed >= count videos (or lessons)
const count = Number(spec.count || 10);
for (const u of users) {
const { rows: r } = await pool.query('SELECT COUNT(*)::int AS completed FROM quiz_results WHERE user_id = $1', [u.id]);
const completed = (r[0] && r[0].completed) ? Number(r[0].completed) : 0;
if (completed >= count) {
const existing = await pool.query('SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2 LIMIT 1', [u.id, ach.id]);
if (existing.rows.length) continue;
await pool.query('INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1,$2)', [u.id, ach.id]);
const xp = (ach.reward && ach.reward.xp) ? Number(ach.reward.xp) : 0;
if (xp) await pool.query('UPDATE isl_users SET xp = COALESCE(xp,0) + $1 WHERE id = $2', [xp, u.id]);
console.log(`[achievements] awarded ${ach.key} to ${u.id}`);
}
}
}


else if (spec.type === 'custom_sql') {
// run a custom SQL (be careful) that should insert rows into user_achievements
// This branch allows advanced, pre-seeded SQL in trigger_spec.sql
if (spec.sql) {
try {
await pool.query(spec.sql);
console.log('[achievements] ran custom_sql for', ach.key);
} catch (e) {
console.warn('[achievements] custom_sql failed for', ach.key, e.message || e);
}
}
}


// add more trigger types here as needed
}


console.log('[achievements] engine done');
}


module.exports = runAchievementEngine;