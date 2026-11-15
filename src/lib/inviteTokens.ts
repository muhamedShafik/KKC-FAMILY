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

/** Generate a random token string */
function generateToken(): string {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

/** Create a new invite token valid for 7 hours */
export async function createInviteToken(): Promise<InviteToken> {
  const token = generateToken();
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 60 * 60 * 1000);

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
      console.warn('Supabase invite_tokens insert failed, using local storage fallback:', error?.message);
    } catch (e) {
      console.warn('Supabase invite_tokens error, using local storage fallback:', e);
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
      console.warn('Could not fetch invite_tokens from Supabase, using local cache:', e);
    }
  }
  return localTokens;
}

/** Verify a token is valid (not expired and active) */
export async function verifyInviteToken(token: string): Promise<{ valid: boolean; expiresAt?: string }> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('invite_tokens')
        .select('expires_at, is_active')
        .eq('token', token)
        .eq('is_active', true)
        .gt('expires_at', now)
        .maybeSingle();
      if (!error && data) {
        return { valid: true, expiresAt: data.expires_at };
      }
    } catch (e) {
      console.warn('Supabase token verification error, checking local storage:', e);
    }
  }

  // Local fallback
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
