-- ============================================================
-- KKKC Family Website – Complete Supabase Database Schema
-- Paste and Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Table 1: Family Members ──────────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name         TEXT NOT NULL,
  gender            TEXT NOT NULL DEFAULT 'male' CHECK (gender IN ('male','female','other')),
  dob               DATE,
  dod               DATE,
  bio               TEXT,
  occupation        TEXT,
  hometown          TEXT,
  branch            TEXT,
  generation        INTEGER DEFAULT 1,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  profile_photo_url TEXT,
  is_public         BOOLEAN NOT NULL DEFAULT TRUE,
  private_notes     TEXT,
  phone             TEXT,
  email             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table 2: Relationships ────────────────────────────────────
CREATE TABLE IF NOT EXISTS relationships (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id           UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  related_member_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  relationship_type   TEXT NOT NULL CHECK (relationship_type IN ('spouse','parent','child','sibling')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, related_member_id, relationship_type)
);

-- ── Table 3: Life Events ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS life_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  event_date  DATE,
  event_type  TEXT NOT NULL DEFAULT 'other'
                CHECK (event_type IN ('birth','death','marriage','achievement','migration','other')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table 4: Member Photos ────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id   UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT,
  taken_at    DATE,
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table 5: Gallery Items ───────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  image_url        TEXT NOT NULL,
  category         TEXT NOT NULL DEFAULT 'other'
                     CHECK (category IN ('portrait','reunion','historical','wedding','celebration','other')),
  date_taken       DATE,
  members_featured UUID[] DEFAULT '{}',
  is_published     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table 6: Family History ───────────────────────────────────
CREATE TABLE IF NOT EXISTS family_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  event_date    DATE,
  event_type    TEXT NOT NULL DEFAULT 'other'
                  CHECK (event_type IN ('birth','death','marriage','achievement','migration','other')),
  image_url     TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Table 7: Admin Users (Stores Admin ID, Email, Role) ───────
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sync any existing users from auth.users into admin_users
INSERT INTO admin_users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Trigger: Whenever a user is created in auth.users, auto-record them in admin_users
CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_users (id, email, role)
  VALUES (NEW.id, NEW.email, 'admin')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_admin_user();

-- ── Auto Updated-At Timestamp Trigger ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS family_members_updated_at ON family_members;
CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security (RLS) ──────────────────────────────────
ALTER TABLE family_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_photos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users     ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "public_read_members" ON family_members;
DROP POLICY IF EXISTS "admin_all_members" ON family_members;
DROP POLICY IF EXISTS "public_read_relationships" ON relationships;
DROP POLICY IF EXISTS "admin_all_relationships" ON relationships;
DROP POLICY IF EXISTS "public_read_life_events" ON life_events;
DROP POLICY IF EXISTS "admin_all_life_events" ON life_events;
DROP POLICY IF EXISTS "public_read_member_photos" ON member_photos;
DROP POLICY IF EXISTS "admin_all_member_photos" ON member_photos;
DROP POLICY IF EXISTS "public_read_gallery" ON gallery_items;
DROP POLICY IF EXISTS "admin_all_gallery" ON gallery_items;
DROP POLICY IF EXISTS "public_read_history" ON family_history;
DROP POLICY IF EXISTS "admin_all_history" ON family_history;
DROP POLICY IF EXISTS "admin_read_admin_users" ON admin_users;

-- Admin Users policies
CREATE POLICY "admin_read_admin_users"
  ON admin_users FOR ALL
  TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Public can view published members
CREATE POLICY "public_read_members"
  ON family_members FOR SELECT
  USING (status = 'published' AND is_public = TRUE);

-- Authenticated admins have full read/write access
CREATE POLICY "admin_all_members"
  ON family_members FOR ALL
  TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Relationships policies
CREATE POLICY "public_read_relationships"
  ON relationships FOR SELECT USING (TRUE);

CREATE POLICY "admin_all_relationships"
  ON relationships FOR ALL
  TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Life events policies
CREATE POLICY "public_read_life_events"
  ON life_events FOR SELECT USING (TRUE);

CREATE POLICY "admin_all_life_events"
  ON life_events FOR ALL
  TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Member photos policies
CREATE POLICY "public_read_member_photos"
  ON member_photos FOR SELECT USING (is_public = TRUE);

CREATE POLICY "admin_all_member_photos"
  ON member_photos FOR ALL
  TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Gallery policies
CREATE POLICY "public_read_gallery"
  ON gallery_items FOR SELECT USING (is_published = TRUE);

CREATE POLICY "admin_all_gallery"
  ON gallery_items FOR ALL
  TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- History policies
CREATE POLICY "public_read_history"
  ON family_history FOR SELECT USING (is_published = TRUE);

CREATE POLICY "admin_all_history"
  ON family_history FOR ALL
  TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- ── Storage Buckets & Policies ────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile-photos', 'profile-photos', true),
  ('gallery', 'gallery', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view gallery" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload gallery" ON storage.objects;

CREATE POLICY "Public can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Admins can upload profile photos"
  ON storage.objects FOR ALL
  TO authenticated USING (bucket_id = 'profile-photos') WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Public can view gallery"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery"
  ON storage.objects FOR ALL
  TO authenticated USING (bucket_id = 'gallery') WITH CHECK (bucket_id = 'gallery');

