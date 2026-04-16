CREATE TABLE t_p79710325_user_profile_dashboa.users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30) NOT NULL DEFAULT 'Пользователь',
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  twofa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  twofa_secret  VARCHAR(64),
  avatar        VARCHAR(10),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);