CREATE TABLE IF NOT EXISTS enquiries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  company     TEXT,
  budget      TEXT,
  service     TEXT,
  message     TEXT    NOT NULL,
  source_ip   TEXT,
  handled     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_handled ON enquiries (handled, created_at DESC);
