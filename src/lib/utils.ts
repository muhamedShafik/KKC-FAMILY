import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInYears, format, parseISO, isValid } from 'date-fns';

// ── Tailwind class utility ────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date helpers ──────────────────────────────────────────────
export function calcAge(dob: string | null, dod?: string | null): number | null {
  if (!dob) return null;
  try {
    const birth = parseISO(dob);
    const end = dod ? parseISO(dod) : new Date();
    if (!isValid(birth)) return null;
    return differenceInYears(end, birth);
  } catch {
    return null;
  }
}

export function formatDate(date: string | null, fmt = 'dd MMM yyyy'): string {
  if (!date) return '—';
  try {
    const d = parseISO(date);
    return isValid(d) ? format(d, fmt) : '—';
  } catch {
    return '—';
  }
}

export function yearOnly(date: string | null): string {
  if (!date) return '—';
  try {
    const d = parseISO(date);
    return isValid(d) ? format(d, 'yyyy') : '—';
  } catch {
    return '—';
  }
}

// ── String helpers ────────────────────────────────────────────
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + '…';
}

// ── Generation label ──────────────────────────────────────────
const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
export function generationLabel(gen: number | null): string {
  if (!gen) return 'Unknown';
  if (gen <= 8) return `${ORDINALS[gen]} Generation`;
  return `${gen}th Generation`;
}

// ── Build Supabase public URL ─────────────────────────────────
export function storageUrl(bucket: string, path: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

// ── Placeholder avatar colour (deterministic from name) ───────
const PALETTE = [
  '#c8871f', '#855511', '#a66c17', '#6b420d',
  '#8B6914', '#D4A853', '#7c5c10', '#b07d25',
];
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

