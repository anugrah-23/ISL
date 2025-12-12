-- 002_live_games.sql
BEGIN;

-- Live quiz games (Loco-like)
CREATE TABLE IF NOT EXISTS live_games (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  total_questions INT DEFAULT 10,
  question_time_seconds INT DEFAULT 12,
  scheduled_at TIMESTAMP WITH TIME ZONE, -- optional schedule
  status TEXT DEFAULT 'waiting', -- waiting | running | finished | cancelled
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_game_questions (
  id SERIAL PRIMARY KEY,
  game_id INT NOT NULL REFERENCES live_games(id) ON DELETE CASCADE,
  idx INT NOT NULL, -- 0..n-1
  statement TEXT NOT NULL, -- text or link to sign media
  options JSONB NOT NULL, -- array of strings
  answer_index INT NOT NULL, -- 0..3
  meta JSONB -- optional (media key etc.)
);

CREATE TABLE IF NOT EXISTS live_game_players (
  id SERIAL PRIMARY KEY,
  game_id INT NOT NULL REFERENCES live_games(id) ON DELETE CASCADE,
  user_id INT NOT NULL,
  socket_user_id TEXT, -- optional
  score INT DEFAULT 0,
  answered_count INT DEFAULT 0,
  current_question INT DEFAULT 0,
  eliminated BOOLEAN DEFAULT FALSE, -- can't continue if true
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (game_id, user_id)
);

CREATE TABLE IF NOT EXISTS live_game_results (
  id SERIAL PRIMARY KEY,
  game_id INT NOT NULL REFERENCES live_games(id) ON DELETE CASCADE,
  user_id INT NOT NULL,
  rank INT,
  score INT,
  awarded_xp INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Duel 1v1 matches
CREATE TABLE IF NOT EXISTS duel_queue (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  match_length INT NOT NULL, -- number of questions
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS duel_matches (
  id SERIAL PRIMARY KEY,
  match_key TEXT UNIQUE,
  player_a INT NOT NULL, -- user id
  player_b INT NOT NULL,
  length INT NOT NULL,
  state TEXT DEFAULT 'pending', -- pending | running | finished
  result JSONB, -- { scores: {a:.., b:..}, winner: userId, details: ... }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS duel_questions (
  id SERIAL PRIMARY KEY,
  match_id INT NOT NULL REFERENCES duel_matches(id) ON DELETE CASCADE,
  idx INT NOT NULL,
  statement TEXT NOT NULL,
  options JSONB NOT NULL,
  answer_index INT NOT NULL
);

CREATE TABLE IF NOT EXISTS duel_results (
  id SERIAL PRIMARY KEY,
  match_id INT NOT NULL REFERENCES duel_matches(id) ON DELETE CASCADE,
  user_id INT NOT NULL,
  score INT,
  awarded_xp INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMIT;
