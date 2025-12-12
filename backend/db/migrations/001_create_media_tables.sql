-- backend/db/migrations/001_media_and_features.sql
BEGIN;

-- STORY PROGRESS
CREATE TABLE IF NOT EXISTS story_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  story_id TEXT NOT NULL,
  unlocked_frames_bitmask JSONB DEFAULT '[]'::jsonb,
  current_streak INTEGER DEFAULT 0,
  last_practice_date TIMESTAMP WITH TIME ZONE,
  grace_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_story_progress_user_story ON story_progress(user_id, story_id);
ALTER TABLE story_progress ADD CONSTRAINT fk_sp_user FOREIGN KEY (user_id) REFERENCES isl_users(id) ON DELETE CASCADE;

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  description TEXT,
  secret BOOLEAN DEFAULT FALSE,
  trigger_spec JSONB,
  reward JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
ALTER TABLE user_achievements
  ADD CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES isl_users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_ua_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE;

-- BATTLE ROOMS
CREATE TABLE IF NOT EXISTS battle_rooms (
  id SERIAL PRIMARY KEY,
  room_key TEXT UNIQUE,
  type TEXT,
  meta JSONB,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMIT;
