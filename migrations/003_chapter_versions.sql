-- Migration 003: Chapter Versions
-- Create versioning table for chapter snapshots

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

-- Enable RLS
ALTER TABLE chapter_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies: user can access versions of chapters in their own projects
CREATE POLICY "chapter_versions_select_own" ON chapter_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN projects ON projects.id = chapters.project_id
      WHERE chapters.id = chapter_versions.chapter_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "chapter_versions_insert_own" ON chapter_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN projects ON projects.id = chapters.project_id
      WHERE chapters.id = chapter_versions.chapter_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "chapter_versions_delete_own" ON chapter_versions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chapters
      JOIN projects ON projects.id = chapters.project_id
      WHERE chapters.id = chapter_versions.chapter_id
        AND projects.user_id = auth.uid()
    )
  );