INSERT INTO t_p79710325_user_profile_dashboa.users (name, email, password_hash, role, status, twofa_enabled, avatar)
VALUES
  ('Алексей Петров', 'admin@mail.ru',
   'pbkdf2:sha256:260000:seed_salt_admin_fixed:9a3b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
   'Администратор', 'active', TRUE, 'АП'),
  ('Мария Иванова', 'user@mail.ru',
   'pbkdf2:sha256:260000:seed_salt_user_fixed:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
   'Менеджер', 'active', FALSE, 'МИ')
