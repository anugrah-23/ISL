-- backend/db/migrations/001_create_media_tables.sql
-- Drop existing tables (safe for dev); creates tables and then adds FK constraints

BEGIN;

-- drop existing to avoid partial state (development only)
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS isl_users CASCADE;

-- users table (minimal)
CREATE TABLE isl_users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE,
  last_reminder_sent TIMESTAMP WITH TIME ZONE
);

-- courses
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- lessons (belongs to course) -- create without FK first
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  transcript TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- videos (belongs to lesson) -- create without FK first
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL,
  s3_key TEXT,
  url TEXT,
  content_type TEXT,
  size_bytes BIGINT,
  duration_sec INTEGER,
  thumbnail_path TEXT,
  status TEXT DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- user progress (optional) -- create without FKs first
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  course_id INTEGER,
  lesson_id INTEGER,
  video_id INTEGER,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- quiz_results (optional)
CREATE TABLE quiz_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  quiz_id INTEGER,
  score INTEGER,
  answers JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Now add foreign key constraints (separate statements)
ALTER TABLE lessons
  ADD CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE videos
  ADD CONSTRAINT fk_videos_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE user_progress
  ADD CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES isl_users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_up_course FOREIGN KEY (course_id) REFERENCES courses(id),
  ADD CONSTRAINT fk_up_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  ADD CONSTRAINT fk_up_video FOREIGN KEY (video_id) REFERENCES videos(id);

ALTER TABLE quiz_results
  ADD CONSTRAINT fk_qr_user FOREIGN KEY (user_id) REFERENCES isl_users(id);

COMMIT;
