export const MIGRATIONS: string[] = [
  `
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE subjects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    from_recommended_node_id TEXT,
    model TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX conversations_subject ON conversations(subject_id, created_at);
  CREATE TABLE items (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    type TEXT NOT NULL,
    role TEXT,
    text TEXT,
    item_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(conversation_id, seq)
  );
  CREATE TABLE experience_cards (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    interview_line TEXT NOT NULL,
    star_situation TEXT NOT NULL,
    star_task TEXT NOT NULL,
    star_action TEXT NOT NULL,
    star_result TEXT,
    concepts_json TEXT NOT NULL,
    next_steps TEXT NOT NULL,
    useful INTEGER CHECK (useful IN (0, 1)),
    rated_at INTEGER,
    redactions_json TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE recommended_nodes (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    source_card_id TEXT NOT NULL REFERENCES experience_cards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    rank INTEGER NOT NULL
  );
  `,
  // kind and format get no CHECK: SQLite changes one only by rebuilding the table, so zod checks them.
  `
  CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    source_seq INTEGER,
    question_no INTEGER,
    kind TEXT NOT NULL DEFAULT 'excerpt',
    format TEXT NOT NULL DEFAULT 'plain',
    text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 4000),
    x REAL NOT NULL DEFAULT 0,
    y REAL NOT NULL DEFAULT 0,
    w REAL,
    h REAL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX notes_conversation ON notes(conversation_id, created_at);
  `,
];
