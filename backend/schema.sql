-- CultivationReads PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Novels ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novels (
  id                  SERIAL PRIMARY KEY,
  title               TEXT NOT NULL,
  title_cn            TEXT,
  slug                TEXT NOT NULL UNIQUE,
  author              TEXT,
  cover_url           TEXT,
  description         TEXT,
  genres              TEXT[] DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  source_language     TEXT NOT NULL DEFAULT 'zh',
  total_chapters      INTEGER DEFAULT 0,
  translated_chapters INTEGER DEFAULT 0,
  views               BIGINT DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS novels_slug_idx        ON novels (slug);
CREATE INDEX IF NOT EXISTS novels_status_idx      ON novels (status);
CREATE INDEX IF NOT EXISTS novels_genres_idx      ON novels USING GIN (genres);
CREATE INDEX IF NOT EXISTS novels_updated_at_idx  ON novels (updated_at DESC);
CREATE INDEX IF NOT EXISTS novels_fts_idx         ON novels USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ── Chapters ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
  id              SERIAL PRIMARY KEY,
  novel_id        INTEGER NOT NULL REFERENCES novels (id) ON DELETE CASCADE,
  chapter_number  INTEGER NOT NULL,
  slug            TEXT NOT NULL,
  title           TEXT,
  content_raw     TEXT,
  content_en      TEXT,
  word_count      INTEGER DEFAULT 0,
  is_translated   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (novel_id, chapter_number),
  UNIQUE (novel_id, slug)
);

CREATE INDEX IF NOT EXISTS chapters_novel_idx      ON chapters (novel_id, chapter_number);
CREATE INDEX IF NOT EXISTS chapters_translated_idx ON chapters (novel_id, is_translated);

-- ── Translation Queue ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS translation_queue (
  id            SERIAL PRIMARY KEY,
  novel_id      INTEGER NOT NULL REFERENCES novels (id) ON DELETE CASCADE,
  chapter_id    INTEGER REFERENCES chapters (id) ON DELETE CASCADE,
  novel_slug    TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  raw_text      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  error_message TEXT,
  attempts      INTEGER NOT NULL DEFAULT 0,
  priority      INTEGER NOT NULL DEFAULT 5,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS queue_status_priority_idx ON translation_queue (status, priority DESC, created_at ASC);

-- ── Reading Progress ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_progress (
  id              SERIAL PRIMARY KEY,
  session_id      TEXT NOT NULL,
  novel_id        INTEGER NOT NULL REFERENCES novels (id) ON DELETE CASCADE,
  chapter_id      INTEGER NOT NULL REFERENCES chapters (id) ON DELETE CASCADE,
  scroll_position INTEGER DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, novel_id)
);

CREATE INDEX IF NOT EXISTS progress_session_idx ON reading_progress (session_id);

-- ── Bookmarks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id         SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  novel_id   INTEGER NOT NULL REFERENCES novels (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, novel_id)
);

CREATE INDEX IF NOT EXISTS bookmarks_session_idx ON bookmarks (session_id);

-- ── Novel Daily Views ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novel_views_daily (
  novel_id   INTEGER NOT NULL REFERENCES novels (id) ON DELETE CASCADE,
  view_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count BIGINT NOT NULL DEFAULT 1,
  PRIMARY KEY (novel_id, view_date)
);

-- ── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER novels_updated_at
  BEFORE UPDATE ON novels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER queue_updated_at
  BEFORE UPDATE ON translation_queue
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Auto-sync translated_chapters count ──────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_translated_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE novels
  SET translated_chapters = (
    SELECT COUNT(*) FROM chapters
    WHERE novel_id = COALESCE(NEW.novel_id, OLD.novel_id)
      AND is_translated = TRUE
  )
  WHERE id = COALESCE(NEW.novel_id, OLD.novel_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER chapters_sync_translated
  AFTER INSERT OR UPDATE OR DELETE ON chapters
  FOR EACH ROW EXECUTE FUNCTION sync_translated_count();
