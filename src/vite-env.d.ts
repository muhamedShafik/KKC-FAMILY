

interface ImportMetaEnv {
  VITE_CLOUDINARY_CLOUD_NAME: string;
  VITE_CLOUDINARY_UPLOAD_PRESET: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
  // add any other VITE_… variables you need
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

