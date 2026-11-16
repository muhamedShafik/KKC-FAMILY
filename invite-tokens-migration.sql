-- ============================================================
-- KKKC Family Website: Public Invite Tokens & Contributor Policies
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create table for 7-hour invite tokens
CREATE TABLE IF NOT EXISTS invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 hours'),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- Enable RLS on invite_tokens
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can create, view, and revoke invite tokens
DROP POLICY IF EXISTS "Admins manage tokens" ON invite_tokens;
CREATE POLICY "Admins manage tokens"
  ON invite_tokens FOR ALL
  TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Public can verify active, unexpired tokens
DROP POLICY IF EXISTS "Public can verify active tokens" ON invite_tokens;
CREATE POLICY "Public can verify active tokens"
  ON invite_tokens FOR SELECT
  USING (is_active = TRUE AND expires_at > NOW());

-- 2. Allow public contributor submissions as 'draft' or unpublished
-- (Admins will review and publish them from the admin panel)

-- Family Members: allow public to insert draft members
DROP POLICY IF EXISTS "public_insert_draft_members" ON family_members;
CREATE POLICY "public_insert_draft_members"
  ON family_members FOR INSERT
  WITH CHECK (status = 'draft');

-- Gallery: allow public to submit unpublished photos
DROP POLICY IF EXISTS "public_insert_gallery" ON gallery_items;
CREATE POLICY "public_insert_gallery"
  ON gallery_items FOR INSERT
  WITH CHECK (is_published = FALSE);

-- History: allow public to submit unpublished history stories
DROP POLICY IF EXISTS "public_insert_history" ON family_history;
CREATE POLICY "public_insert_history"
  ON family_history FOR INSERT
  WITH CHECK (is_published = FALSE);

-- 3. Storage buckets upload policies for contributors
DROP POLICY IF EXISTS "Public can upload profile photos" ON storage.objects;
CREATE POLICY "Public can upload profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Public can upload gallery photos" ON storage.objects;
CREATE POLICY "Public can upload gallery photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery');

