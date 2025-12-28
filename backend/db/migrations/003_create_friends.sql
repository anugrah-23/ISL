BEGIN;

CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted')) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),

  CONSTRAINT friends_no_self CHECK (user_id <> friend_id),
  CONSTRAINT friends_unique_pair UNIQUE (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id
  ON friends (user_id);

CREATE INDEX IF NOT EXISTS idx_friends_friend_id
  ON friends (friend_id);

COMMIT;
