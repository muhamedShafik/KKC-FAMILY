// src/lib/env.ts
// Robust environment variable loader with static Vite access and production defaults

export const CLOUDINARY_CLOUD_NAME = (
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
  import.meta.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  'jgpvz2ft'
).trim();

export const CLOUDINARY_UPLOAD_PRESET = (
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  import.meta.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
  'kkkc-family'
).trim();

export const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://buiusscodbkzcbgecvpg.supabase.co'
).trim();

export const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ECzsuJHKtyRGUALFHag7gw_gYdKBOZS'
).trim();

export const SUPABASE_PUBLISHABLE_KEY = SUPABASE_ANON_KEY;
