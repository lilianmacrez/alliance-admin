import type { Database as DatabaseInstance } from '@tauri-apps/plugin-sql'

const SCHEMA_VERSION = 2

const MIGRATIONS: Record<number, string> = {
  1: `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS financeurs (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      type          TEXT NOT NULL CHECK(type IN ('DPEJ', 'MECS', 'FOYER', 'AUTRE')),
      contact_email TEXT,
      contact_phone TEXT,
      address       TEXT
    );

    CREATE TABLE IF NOT EXISTS act_types (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      default_rate REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS situations (
      id                      TEXT PRIMARY KEY,
      name                    TEXT NOT NULL,
      parents_names           TEXT,
      children_names          TEXT,
      financeur_id            TEXT NOT NULL,
      eds_referent            TEXT,
      judge_name              TEXT,
      placement_location      TEXT,
      rate_vm_override        REAL,
      rate_entretien_override REAL,
      is_active               INTEGER DEFAULT 1,
      notes                   TEXT,
      created_at              TEXT NOT NULL,
      updated_at              TEXT NOT NULL,
      FOREIGN KEY (financeur_id) REFERENCES financeurs(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS acts (
      id            TEXT PRIMARY KEY,
      situation_id  TEXT NOT NULL,
      act_type_id   TEXT NOT NULL,
      act_date      TEXT NOT NULL,
      attendees     TEXT,
      status        TEXT NOT NULL DEFAULT 'PLANNED'
                      CHECK(status IN ('PLANNED', 'REALIZED', 'ABSENT', 'CANCELED')),
      amount        REAL NOT NULL,
      is_billed     INTEGER DEFAULT 0,
      notes         TEXT,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      FOREIGN KEY (situation_id) REFERENCES situations(id) ON DELETE CASCADE,
      FOREIGN KEY (act_type_id) REFERENCES act_types(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id              TEXT PRIMARY KEY,
      type            TEXT NOT NULL CHECK(type IN ('DEVIS', 'FACTURE')),
      document_number TEXT UNIQUE NOT NULL,
      situation_id    TEXT NOT NULL,
      financeur_id    TEXT NOT NULL,
      month_year      TEXT,
      total_amount    REAL NOT NULL DEFAULT 0.0,
      status          TEXT NOT NULL DEFAULT 'DRAFT'
                        CHECK(status IN ('DRAFT', 'SENT', 'PAID')),
      issue_date      TEXT NOT NULL,
      notes           TEXT,
      created_at      TEXT NOT NULL,
      FOREIGN KEY (situation_id) REFERENCES situations(id) ON DELETE RESTRICT,
      FOREIGN KEY (financeur_id) REFERENCES financeurs(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS document_lines (
      id          TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      act_id      TEXT,
      description TEXT NOT NULL,
      quantity    INTEGER NOT NULL DEFAULT 1,
      unit_price  REAL NOT NULL,
      total       REAL NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (act_id) REFERENCES acts(id) ON DELETE SET NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('db_version', '2');

    INSERT OR IGNORE INTO act_types (id, name, default_rate) VALUES
      ('VM',        'Visite Médiatisée',            235.00),
      ('ENTRETIEN', 'Entretien clinique préalable',  95.00);

    INSERT OR IGNORE INTO financeurs (id, name, type, contact_email, contact_phone, address) VALUES
      ('DPEJ-T1', 'DPEJ Territoire 1', 'DPEJ', 'Dpej-territoire1@valdemarne.fr', NULL, NULL),
      ('DPEJ-T2', 'DPEJ Territoire 2', 'DPEJ', 'Dpej-territoire2@valdemarne.fr', NULL, NULL),
      ('DPEJ-T3', 'DPEJ Territoire 3', 'DPEJ', 'Dpej-territoire3@valdemarne.fr', NULL, NULL),
      ('DPEJ-T4', 'DPEJ Territoire 4', 'DPEJ', 'Dpej-territoire4@valdemarne.fr', NULL, NULL);
  `,
}

export async function runMigrations(db: DatabaseInstance): Promise<void> {
  await db.execute('PRAGMA foreign_keys = ON')

  let currentVersion = 0
  try {
    const rows = await db.select<Array<{ value: string }>>(
      "SELECT value FROM settings WHERE key = 'db_version'",
    )
    if (rows.length > 0) {
      currentVersion = parseInt(rows[0].value, 10)
    }
  } catch {
    // settings table doesn't exist yet → version 0
  }

  for (let v = currentVersion + 1; v <= SCHEMA_VERSION; v++) {
    const sql = MIGRATIONS[v]
    if (!sql) continue

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const stmt of statements) {
      await db.execute(stmt)
    }
  }

  if (currentVersion < SCHEMA_VERSION) {
    await db.execute(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('db_version', $1)",
      [String(SCHEMA_VERSION)],
    )
  }
}
