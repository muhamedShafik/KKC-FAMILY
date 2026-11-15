import supabase, { isSupabaseConfigured } from './supabase';
import type { InviteToken } from '@/types';

const STORAGE_TOKENS = 'kkc_invite_tokens_v1';

function getLocal<T>(key: string, def: T): T {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : def;
  } catch {
    return def;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

/**
 * Generate a self-verifying token that encodes its expiration time (7 hours).
 * This ensures the token works on any device (phone, laptop) even before database migration.
 */
function encodeToken(expiresAtMs: number): string {
  const randomBytes = new Uint8Array(12);
  crypto.getRandomValues(randomBytes);
  const randomPart = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
  const raw = `${randomPart}.${expiresAtMs}`;
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode and extract the expiration date from the self-verifying token */
function decodeToken(token: string): { randomPart: string; expiresAt: Date } | null {
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const decoded = atob(base64);
    const parts = decoded.split('.');
    if (parts.length !== 2) return null;
    const [randomPart, expStr] = parts;
    const expMs = Number(expStr);
    if (!randomPart || isNaN(expMs)) return null;
    return { randomPart, expiresAt: new Date(expMs) };
  } catch {
    return null;
  }
}

/** Create a new invite token valid for exactly 7 hours */
export async function createInviteToken(): Promise<InviteToken> {
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const token = encodeToken(expires.getTime());

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('invite_tokens')
        .insert([{ token, expires_at: expires.toISOString() }])
        .select()
        .single();
      if (!error && data) {
        const all = getLocal<InviteToken[]>(STORAGE_TOKENS, []);
        all.unshift(data as InviteToken);
        setLocal(STORAGE_TOKENS, all);
        return data as InviteToken;
      }
    } catch (e) {
      console.warn('Supabase invite_tokens insert fallback:', e);
    }
  }

  // Local storage fallback (always succeeds)
  const newToken: InviteToken = {
    id: crypto.randomUUID(),
    token,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
    created_by: null,
    is_active: true,
  };
  const all = getLocal<InviteToken[]>(STORAGE_TOKENS, []);
  all.unshift(newToken);
  setLocal(STORAGE_TOKENS, all);
  return newToken;
}

/** Fetch all invite tokens (for admin view) */
export async function fetchInviteTokens(): Promise<InviteToken[]> {
  const localTokens = getLocal<InviteToken[]>(STORAGE_TOKENS, []);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('invite_tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data && data.length > 0) {
        const tokenMap = new Map<string, InviteToken>();
        (data as InviteToken[]).forEach(t => tokenMap.set(t.token, t));
        localTokens.forEach(t => {
          if (!tokenMap.has(t.token)) tokenMap.set(t.token, t);
        });
        return Array.from(tokenMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch (e) {
      console.warn('Supabase fetch invite_tokens fallback:', e);
    }
  }
  return localTokens;
}

/** Verify a token is valid (not expired and active) across any device */
export async function verifyInviteToken(token: string): Promise<{ valid: boolean; expiresAt?: string }> {
  if (!token) return { valid: false };

  // 1. If Supabase is available, check if token was revoked or exists there
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('invite_tokens')
        .select('expires_at, is_active')
        .eq('token', token)
        .maybeSingle();

      if (data) {
        // If explicitly revoked, invalidate
        if (!data.is_active) return { valid: false };
        // Check if expired
        const isNotExpired = new Date(data.expires_at) > new Date();
        return { valid: isNotExpired, expiresAt: data.expires_at };
      }
    } catch (e) {
      console.warn('Supabase token verification check error, using self-verification:', e);
    }
  }

  // 2. Self-verifying token check (works on any device, anywhere)
  const decoded = decodeToken(token);
  if (decoded) {
    const isNotExpired = decoded.expiresAt > new Date();
    return {
      valid: isNotExpired,
      expiresAt: decoded.expiresAt.toISOString(),
    };
  }

  // 3. Fallback check for raw tokens in local storage
  const all = getLocal<InviteToken[]>(STORAGE_TOKENS, []);
  const found = all.find(t => t.token === token && t.is_active && new Date(t.expires_at) > new Date());
  if (!found) return { valid: false };
  return { valid: true, expiresAt: found.expires_at };
}

/** Revoke/deactivate a token */
export async function revokeInviteToken(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('invite_tokens').update({ is_active: false }).eq('id', id);
    } catch (e) {
      console.warn('Supabase revoke token error:', e);
    }
  }
  const all = getLocal<InviteToken[]>(STORAGE_TOKENS, []);
  const updated = all.map(t => (t.id === id ? { ...t, is_active: false } : t));
  setLocal(STORAGE_TOKENS, updated);
}
