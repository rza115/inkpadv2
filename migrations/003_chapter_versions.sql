-- Migration 003: Chapter Versions
-- Create versioning table for chapter snapshots
-- RLS disabled: API route runs server-side with anon key, auth.uid() would be null

CREATE TABLE IF NOT EXISTS chapter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, version_number)
);

-- Index for fast lookups by chapter
CREATE INDEX IF NOT EXISTS idx_chapter_versions_chapter_id ON chapter_versions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_versions_created_at ON chapter_versions(created_at DESC);

-- RLS disabled — server-side API routes use anon key, auth context unavailable
ALTER TABLE chapter_versions DISABLE ROW LEVEL SECURITY;