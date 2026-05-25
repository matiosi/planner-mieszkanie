-- Dodanie pinterest_user_id do tabeli połączeń
-- (migracja zachowana dla spójności historii — funkcjonalność Pinterest usunięta)
ALTER TABLE pinterest_connections ADD COLUMN IF NOT EXISTS pinterest_user_id text;

CREATE INDEX IF NOT EXISTS idx_pinterest_connections_pid
  ON pinterest_connections (pinterest_user_id)
  WHERE pinterest_user_id IS NOT NULL;
