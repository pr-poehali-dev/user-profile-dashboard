CREATE TABLE t_p79710325_user_profile_dashboa.sessions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES t_p79710325_user_profile_dashboa.users(id),
  token       VARCHAR(128) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE t_p79710325_user_profile_dashboa.activity_log (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES t_p79710325_user_profile_dashboa.users(id),
  user_name   VARCHAR(100),
  action      VARCHAR(200) NOT NULL,
  detail      TEXT,
  event_type  VARCHAR(30) NOT NULL DEFAULT 'system',
  ip          VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);