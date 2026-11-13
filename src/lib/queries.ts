import supabase, { isSupabaseConfigured } from './supabase';
import type {
  FamilyMember, FamilyMemberWithRelations, Relationship,
  LifeEvent, MemberPhoto, GalleryItem, FamilyHistoryEntry,
  TreeNode, MemberStatus, RelationshipType,
} from '@/types';

// ── Local Storage Fallback & Cache Keys ───────────────────────
const STORAGE_MEMBERS = 'kkc_members_v1';
const STORAGE_RELS = 'kkc_relationships_v1';
const STORAGE_HISTORY = 'kkc_history_v1';
const STORAGE_GALLERY = 'kkc_gallery_v1';
const STORAGE_EVENTS = 'kkc_life_events_v1';
export const STORAGE_MEMBERS_CACHE = 'kkc_published_members_cache_v2';
export const STORAGE_FOUNDERS_CACHE = 'kkc_founders_cache_v2';
export const STORAGE_TREE_CACHE = 'kkc_cached_family_tree_v2';
export const STORAGE_RELS_CACHE = 'kkc_relationships_cache_v2';
export const STORAGE_STATS_CACHE = 'kkc_family_stats_v2';
export const STORAGE_MEMBER_DETAIL_PREFIX = 'kkc_member_detail_v2_';

// ── In-Memory Fast Caches (Instant 0ms Lookups) ───────────────
const membersCacheMap = new Map<string, FamilyMember>();
const memberDetailsCacheMap = new Map<string, FamilyMemberWithRelations>();
let relationshipsMemoryCache: Relationship[] | null = null;

function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage unavailable', e);
  }
}

// ── Family Stats Cache ─────────────────────────────────────────
export interface FamilyStats {
  totalMembers: number;
  totalGenerations: number;
  totalBranches: number;
}

export function getCachedFamilyStats(): FamilyStats | null {
  return getLocal<FamilyStats | null>(STORAGE_STATS_CACHE, null);
}

export function saveCachedFamilyStats(members: FamilyMember[]): void {
  if (!members || members.length === 0) return;
  const totalGenerations = Math.max(...members.map(m => m.generation ?? 1), 1);
  const totalBranches = new Set(members.map(m => m.branch).filter(Boolean)).size || 1;
  const stats: FamilyStats = {
    totalMembers: members.length,
    totalGenerations,
    totalBranches,
  };
  setLocal(STORAGE_STATS_CACHE, stats);
}

// ── Relationships Cache & Fetch ────────────────────────────────
export function invalidateRelationshipsCache(): void {
  relationshipsMemoryCache = null;
  try {
    localStorage.removeItem(STORAGE_TREE_CACHE);
    localStorage.removeItem(STORAGE_RELS_CACHE);
    localStorage.removeItem(STORAGE_MEMBERS_CACHE);
  } catch {}
}

export function getCachedRelationships(): Relationship[] {
  if (relationshipsMemoryCache && relationshipsMemoryCache.length > 0) {
    return relationshipsMemoryCache;
  }
  const cached = getLocal<Relationship[]>(STORAGE_RELS_CACHE, []);
  if (cached.length > 0) {
    relationshipsMemoryCache = cached;
    return cached;
  }
  return getLocal<Relationship[]>(STORAGE_RELS, []);
}

export async function fetchAllRelationships(forceRefresh = false): Promise<Relationship[]> {
  if (!forceRefresh && relationshipsMemoryCache && relationshipsMemoryCache.length > 0) {
    return relationshipsMemoryCache;
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .limit(25000);
      if (!error && data && data.length > 0) {
        relationshipsMemoryCache = data;
        setLocal(STORAGE_RELS_CACHE, data);
        setLocal(STORAGE_RELS, data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch relationships from Supabase:', e);
    }
  }

  const cached = getCachedRelationships();
  relationshipsMemoryCache = cached;
  return cached;
}

// ── Members Pool Helper ────────────────────────────────────────
export function getCachedMembersPool(): FamilyMember[] {
  if (membersCacheMap.size > 0) {
    return Array.from(membersCacheMap.values());
  }
  const cached = getLocal<FamilyMember[]>(STORAGE_MEMBERS_CACHE, []);
  if (cached.length > 0) {
    cached.forEach(m => membersCacheMap.set(m.id, m));
    return cached;
  }
  const allLocal = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
  allLocal.forEach(m => membersCacheMap.set(m.id, m));
  return allLocal;
}

// ── Synchronous Member With Relations Assembler (0ms) ──────────
export function assembleMemberWithRelations(
  member: FamilyMember,
  relationships: Relationship[],
  membersPool: FamilyMember[]
): FamilyMemberWithRelations {
  const poolMap = new Map<string, FamilyMember>();
  membersPool.forEach(m => poolMap.set(m.id, m));
  poolMap.set(member.id, member);

  const id = member.id;

  // Parents:
  const parentIds = [...new Set([
    ...relationships.filter(r => r.member_id === id && r.relationship_type === 'parent').map(r => r.related_member_id),
    ...relationships.filter(r => r.related_member_id === id && r.relationship_type === 'child').map(r => r.member_id),
  ])].filter(pid => pid !== id);

  // Children:
  const childIds = [...new Set([
    ...relationships.filter(r => r.member_id === id && r.relationship_type === 'child').map(r => r.related_member_id),
    ...relationships.filter(r => r.related_member_id === id && r.relationship_type === 'parent').map(r => r.member_id),
  ])].filter(cid => cid !== id && !parentIds.includes(cid));

  // Spouses:
  const spouseIds = [...new Set(
    relationships.filter(r => (r.member_id === id || r.related_member_id === id) && r.relationship_type === 'spouse')
      .map(r => (r.member_id === id ? r.related_member_id : r.member_id))
  )].filter(sid => sid !== id);

  // Siblings:
  const siblingIds = [...new Set(
    relationships.filter(r => (r.member_id === id || r.related_member_id === id) && r.relationship_type === 'sibling')
      .map(r => (r.member_id === id ? r.related_member_id : r.member_id))
  )].filter(sid => sid !== id);

  const result: FamilyMemberWithRelations = {
    ...member,
    parents: parentIds.map(pid => poolMap.get(pid)).filter(Boolean) as FamilyMember[],
    children: childIds.map(cid => poolMap.get(cid)).filter(Boolean) as FamilyMember[],
    spouses: spouseIds.map(sid => poolMap.get(sid)).filter(Boolean) as FamilyMember[],
    siblings: siblingIds.map(sid => poolMap.get(sid)).filter(Boolean) as FamilyMember[],
  };

  // Cache in-memory and local
  memberDetailsCacheMap.set(id, result);
  setLocal(STORAGE_MEMBER_DETAIL_PREFIX + id, result);

  return result;
}

// ── Instant Synchronous Member Lookup (0ms for UI) ─────────────
export function getCachedMemberWithRelations(id: string): FamilyMemberWithRelations | null {
  if (!id) return null;

  // 1. In-memory detail cache
  if (memberDetailsCacheMap.has(id)) {
    return memberDetailsCacheMap.get(id)!;
  }

  // 2. LocalStorage detail cache
  const localDetail = getLocal<FamilyMemberWithRelations | null>(STORAGE_MEMBER_DETAIL_PREFIX + id, null);
  if (localDetail) {
    memberDetailsCacheMap.set(id, localDetail);
    return localDetail;
  }

  // 3. Assemble from cached members + relationships
  const pool = getCachedMembersPool();
  const member = pool.find(m => m.id === id);
  if (member) {
    const rels = getCachedRelationships();
    if (rels.length > 0) {
      return assembleMemberWithRelations(member, rels, pool);
    }
    // Return member with empty relations as instant 0ms placeholder
    return {
      ...member,
      parents: [],
      children: [],
      spouses: [],
      siblings: [],
    };
  }

  return null;
}

// ── Members ───────────────────────────────────────────────────

export async function fetchFounders(): Promise<FamilyMember[]> {
  // 1. Instant check from local cache
  const cached = getLocal<FamilyMember[]>(STORAGE_FOUNDERS_CACHE, []);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('generation', 1)
        .neq('status', 'archived')
        .eq('is_public', true)
        .order('created_at', { ascending: true })
        .limit(5);

      if (!error && data && data.length > 0) {
        setLocal(STORAGE_FOUNDERS_CACHE, data);
        data.forEach(m => membersCacheMap.set(m.id, m));
        return data;
      }
    } catch (e) {
      console.warn('Network error in fetchFounders, using cache:', e);
    }
  }

  if (cached.length > 0) return cached;

  const pool = getCachedMembersPool();
  const gen1 = pool.filter(m => (m.generation ?? 1) === 1 && m.status !== 'archived');
  if (gen1.length > 0) {
    setLocal(STORAGE_FOUNDERS_CACHE, gen1);
    return gen1;
  }
  return [];
}

export async function fetchPublishedMembers(): Promise<FamilyMember[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .neq('status', 'archived')
        .eq('is_public', true)
        .order('generation', { ascending: true })
        .order('full_name', { ascending: true })
        .limit(10000);

      if (!error && data && data.length > 0) {
        setLocal(STORAGE_MEMBERS_CACHE, data);
        data.forEach(m => membersCacheMap.set(m.id, m));
        saveCachedFamilyStats(data);
        const gen1 = data.filter(m => (m.generation ?? 1) === 1);
        if (gen1.length > 0) setLocal(STORAGE_FOUNDERS_CACHE, gen1);
        return data;
      }
      if (error) console.error('Error fetching published members:', error.message);
    } catch (e) {
      console.warn('Network error in fetchPublishedMembers:', e);
    }
  }

  // Fallback to persistent published cache
  const cached = getLocal<FamilyMember[]>(STORAGE_MEMBERS_CACHE, []);
  if (cached.length > 0) {
    cached.forEach(m => membersCacheMap.set(m.id, m));
    saveCachedFamilyStats(cached);
    return cached;
  }

  const all = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
  const filtered = all
    .filter(m => m.status !== 'archived' && m.is_public)
    .sort((a, b) => (a.generation ?? 1) - (b.generation ?? 1));
  filtered.forEach(m => membersCacheMap.set(m.id, m));
  saveCachedFamilyStats(filtered);
  return filtered;
}

export async function fetchAllMembers(): Promise<FamilyMember[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .neq('status', 'archived')
        .order('generation', { ascending: true })
        .order('full_name', { ascending: true })
        .limit(10000);
      if (!error && data && data.length > 0) {
        data.forEach(m => membersCacheMap.set(m.id, m));
        return data;
      }
      if (error) console.error('Error fetching all members:', error.message);
    } catch (e) {
      console.warn('Network error in fetchAllMembers:', e);
    }
  }

  const all = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
  all.forEach(m => membersCacheMap.set(m.id, m));
  return all.filter(m => m.status !== 'archived');
}

export async function fetchMemberById(id: string): Promise<FamilyMember | null> {
  if (membersCacheMap.has(id)) return membersCacheMap.get(id)!;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        membersCacheMap.set(id, data);
        return data;
      }
    } catch (e) {
      console.warn('Network error in fetchMemberById:', e);
    }
  }

  const all = getCachedMembersPool();
  return all.find(m => m.id === id) ?? null;
}

export async function fetchMemberWithRelations(id: string): Promise<FamilyMemberWithRelations | null> {
  // Step 1: Check instant synchronous cache
  const instantCached = getCachedMemberWithRelations(id);

  let member: FamilyMember | null = membersCacheMap.get(id) || null;
  let relationships: Relationship[] = [];

  // Check if relationships are already cached in memory or localStorage
  const cachedRels = getCachedRelationships();
  const relsForThisMember = cachedRels.filter(r => r.member_id === id || r.related_member_id === id);

  if (isSupabaseConfigured) {
    const queries: Promise<any>[] = [];
    let memberIndex = -1;
    let relsIndex = -1;

    // Only query member row from network if not already in memory cache
    if (!member) {
      memberIndex = queries.length;
      queries.push(Promise.resolve(supabase.from('family_members').select('*').eq('id', id).maybeSingle()));
    }

    // Always fetch latest relationships row for this member to ensure up-to-date relations
    relsIndex = queries.length;
    queries.push(
      Promise.resolve(
        supabase
          .from('relationships')
          .select('*')
          .or(`member_id.eq.${id},related_member_id.eq.${id}`)
          .limit(500)
      )
    );

    try {
      const results = await Promise.all(queries);
      if (memberIndex >= 0 && results[memberIndex]?.data) {
        member = results[memberIndex].data;
        membersCacheMap.set(id, member!);
      }
      if (relsIndex >= 0 && results[relsIndex]?.data) {
        relationships = results[relsIndex].data;
      }
    } catch (e) {
      console.warn('Network error in fetchMemberWithRelations:', e);
    }
  }

  // Fallback to cached pool if member is still null
  if (!member) {
    const pool = getCachedMembersPool();
    member = pool.find(m => m.id === id) ?? null;
    if (!member) return instantCached;
  }

  // Use cached relationships if network returned empty or failed
  if (!relationships.length && relsForThisMember.length > 0) {
    relationships = relsForThisMember;
  }

  // Parents:
  const parentIds = [...new Set([
    ...relationships.filter(r => r.member_id === id && r.relationship_type === 'parent').map(r => r.related_member_id),
    ...relationships.filter(r => r.related_member_id === id && r.relationship_type === 'child').map(r => r.member_id),
  ])].filter(pid => pid !== id);

  // Children:
  const childIds = [...new Set([
    ...relationships.filter(r => r.member_id === id && r.relationship_type === 'child').map(r => r.related_member_id),
    ...relationships.filter(r => r.related_member_id === id && r.relationship_type === 'parent').map(r => r.member_id),
  ])].filter(cid => cid !== id && !parentIds.includes(cid));

  // Spouses:
  const spouseIds = [...new Set(
    relationships.filter(r => (r.member_id === id || r.related_member_id === id) && r.relationship_type === 'spouse')
      .map(r => (r.member_id === id ? r.related_member_id : r.member_id))
  )].filter(sid => sid !== id);

  // Siblings:
  const siblingIds = [...new Set(
    relationships.filter(r => (r.member_id === id || r.related_member_id === id) && r.relationship_type === 'sibling')
      .map(r => (r.member_id === id ? r.related_member_id : r.member_id))
  )].filter(sid => sid !== id);

  // Step 2: Instant batch resolution of related members
  const allRelatedIds = [...new Set([...parentIds, ...childIds, ...spouseIds, ...siblingIds])];
  const relatedMap = new Map<string, FamilyMember>();

  // Resolve from cached members pool FIRST (0ms, avoids network roundtrip!)
  const pool = getCachedMembersPool();
  pool.forEach(m => {
    if (allRelatedIds.includes(m.id)) {
      relatedMap.set(m.id, m);
    }
  });

  // Only query Supabase for IDs missing from cache (rare)
  const missingIds = allRelatedIds.filter(rid => !relatedMap.has(rid));
  if (missingIds.length > 0 && isSupabaseConfigured) {
    try {
      const { data: missingMembers } = await supabase
        .from('family_members')
        .select('*')
        .in('id', missingIds);

      if (missingMembers) {
        missingMembers.forEach(m => {
          relatedMap.set(m.id, m);
          membersCacheMap.set(m.id, m);
        });
      }
    } catch (e) {
      console.warn('Network error fetching missing related members:', e);
    }
  }

  const result: FamilyMemberWithRelations = {
    ...member,
    parents: parentIds.map(pid => relatedMap.get(pid)).filter(Boolean) as FamilyMember[],
    children: childIds.map(cid => relatedMap.get(cid)).filter(Boolean) as FamilyMember[],
    spouses: spouseIds.map(sid => relatedMap.get(sid)).filter(Boolean) as FamilyMember[],
    siblings: siblingIds.map(sid => relatedMap.get(sid)).filter(Boolean) as FamilyMember[],
  };

  // Cache in memory and localStorage for instant future lookups
  memberDetailsCacheMap.set(id, result);
  setLocal(STORAGE_MEMBER_DETAIL_PREFIX + id, result);

  return result;
}

export async function upsertMember(member: Partial<FamilyMember> & { full_name: string }): Promise<FamilyMember> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    if (member.id) {
      // Update existing record
      const { data, error } = await supabase
        .from('family_members')
        .update({
          full_name: member.full_name,
          gender: member.gender ?? 'male',
          dob: member.dob || null,
          dod: member.dod || null,
          bio: member.bio || null,
          occupation: member.occupation || null,
          hometown: member.hometown || null,
          branch: member.branch || null,
          generation: member.generation ?? 1,
          status: member.status ?? 'draft',
          profile_photo_url: member.profile_photo_url || null,
          is_public: member.is_public ?? true,
          private_notes: member.private_notes || null,
          phone: member.phone || null,
          email: member.email || null,
          updated_at: now,
        })
        .eq('id', member.id)
        .select()
        .single();
      if (error) {
        console.error('Supabase update failed:', error.message);
        throw error;
      }
      if (data) {
        membersCacheMap.set(data.id, data);
        const cached = getLocal<FamilyMember[]>(STORAGE_MEMBERS_CACHE, []);
        const idx = cached.findIndex(m => m.id === data.id);
        if (idx >= 0) cached[idx] = data; else cached.push(data);
        setLocal(STORAGE_MEMBERS_CACHE, cached);
      }
      return data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('family_members')
        .insert([{
          full_name: member.full_name,
          gender: member.gender ?? 'male',
          dob: member.dob || null,
          dod: member.dod || null,
          bio: member.bio || null,
          occupation: member.occupation || null,
          hometown: member.hometown || null,
          branch: member.branch || 'KKC Family',
          generation: member.generation ?? 1,
          status: member.status ?? 'draft',
          profile_photo_url: member.profile_photo_url || null,
          is_public: member.is_public ?? true,
          private_notes: member.private_notes || null,
          phone: member.phone || null,
          email: member.email || null,
        }])
        .select()
        .single();
      if (error) {
        console.error('Supabase insert failed:', error.message);
        throw error;
      }
      if (data) {
        membersCacheMap.set(data.id, data);
        const cached = getLocal<FamilyMember[]>(STORAGE_MEMBERS_CACHE, []);
        cached.push(data);
        setLocal(STORAGE_MEMBERS_CACHE, cached);
      }
      return data;
    }
  }

  // Local storage fallback
  const all = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
  const existingIdx = member.id ? all.findIndex(m => m.id === member.id) : -1;

  if (existingIdx >= 0) {
    const updated: FamilyMember = {
      ...all[existingIdx],
      ...member,
      updated_at: now,
    };
    all[existingIdx] = updated;
    setLocal(STORAGE_MEMBERS, all);
    return updated;
  } else {
    const created: FamilyMember = {
      id: member.id || `member-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      full_name: member.full_name,
      gender: member.gender ?? 'male',
      dob: member.dob ?? null,
      dod: member.dod ?? null,
      bio: member.bio ?? null,
      occupation: member.occupation ?? null,
      hometown: member.hometown ?? null,
      branch: member.branch ?? 'KKC Family',
      generation: member.generation ?? 1,
      status: member.status ?? 'draft',
      profile_photo_url: member.profile_photo_url ?? null,
      is_public: member.is_public ?? true,
      private_notes: member.private_notes ?? null,
      phone: member.phone ?? null,
      email: member.email ?? null,
      created_at: now,
      updated_at: now,
    };
    all.push(created);
    setLocal(STORAGE_MEMBERS, all);
    return created;
  }
}

export async function archiveMember(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('family_members')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return;
  }

  const all = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
  const updated = all.map(m => m.id === id ? { ...m, status: 'archived' as MemberStatus, updated_at: new Date().toISOString() } : m);
  setLocal(STORAGE_MEMBERS, updated);
}

export async function deleteMember(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteMember error:', error.message);
      throw error;
    }
    return;
  }

  const all = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
  setLocal(STORAGE_MEMBERS, all.filter(m => m.id !== id));
  const rels = getLocal<Relationship[]>(STORAGE_RELS, []);
  setLocal(STORAGE_RELS, rels.filter(r => r.member_id !== id && r.related_member_id !== id));
}

export async function publishMember(id: string): Promise<void> {
  return updateMemberStatus(id, 'published');
}

export async function updateMemberStatus(id: string, status: MemberStatus): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('family_members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return;
  }

  const all = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
  const updated = all.map(m => m.id === id ? { ...m, status, updated_at: new Date().toISOString() } : m);
  setLocal(STORAGE_MEMBERS, updated);
}

// ── Relationships ─────────────────────────────────────────────

/**
 * Insert a relationship row using UPSERT (safe on duplicates).
 * Also handles bidirectional auto-linking:
 *   - 'parent'  : stores (parentId → childId). We also store reverse
 *                 so child profile sees its parent.
 *   - 'child'   : normalised to 'parent' convention automatically
 *                 by the caller (handleAddRelation in AdminMemberForm).
 *   - 'sibling' : always bidirectional — both rows inserted.
 *   - 'spouse'  : always bidirectional — both rows inserted.
 */
async function upsertRelRow(
  memberId: string,
  relatedId: string,
  type: RelationshipType,
): Promise<void> {
  invalidateRelationshipsCache();

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('relationships')
      .upsert(
        [{ member_id: memberId, related_member_id: relatedId, relationship_type: type }],
        { onConflict: 'member_id,related_member_id,relationship_type', ignoreDuplicates: true },
      );
    if (error) {
      // 23505 = unique_violation — already exists, safe to ignore
      if (error.code !== '23505') {
        console.error('Supabase upsertRelRow error:', error.message);
        throw error;
      }
    }
  }

  // Always update local storage for offline / instant fallback
  const all = getLocal<Relationship[]>(STORAGE_RELS, []);
  const exists = all.some(
    r => r.member_id === memberId &&
         r.related_member_id === relatedId &&
         r.relationship_type === type,
  );
  if (!exists) {
    all.push({
      id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      member_id: memberId,
      related_member_id: relatedId,
      relationship_type: type,
      created_at: new Date().toISOString(),
    });
    setLocal(STORAGE_RELS, all);
    setLocal(STORAGE_RELS_CACHE, all);
  }
}

export async function addRelationship(
  memberId: string,
  relatedId: string,
  type: RelationshipType,
): Promise<void> {
  invalidateRelationshipsCache();

  let primaryType: RelationshipType = type;
  let reverseType: RelationshipType = type;

  if (type === 'parent') {
    primaryType = 'parent';
    reverseType = 'child';
  } else if (type === 'child') {
    primaryType = 'child';
    reverseType = 'parent';
  } else if (type === 'spouse') {
    primaryType = 'spouse';
    reverseType = 'spouse';
  } else if (type === 'sibling') {
    primaryType = 'sibling';
    reverseType = 'sibling';
  }

  const rowsToInsert = [
    { member_id: memberId, related_member_id: relatedId, relationship_type: primaryType },
    { member_id: relatedId, related_member_id: memberId, relationship_type: reverseType },
  ];

  // Single-roundtrip batch upsert in Supabase
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('relationships')
        .upsert(rowsToInsert, {
          onConflict: 'member_id,related_member_id,relationship_type',
          ignoreDuplicates: true,
        });
      if (error && error.code !== '23505') {
        console.error('Supabase batch addRelationship error:', error.message);
      }
    } catch (e) {
      console.warn('Network error in addRelationship:', e);
    }
  }

  // Update local storage and memory cache directly in RAM (0ms!)
  const all = getLocal<Relationship[]>(STORAGE_RELS, []);
  rowsToInsert.forEach(row => {
    const exists = all.some(
      r => r.member_id === row.member_id &&
           r.related_member_id === row.related_member_id &&
           r.relationship_type === row.relationship_type,
    );
    if (!exists) {
      all.push({
        id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        member_id: row.member_id,
        related_member_id: row.related_member_id,
        relationship_type: row.relationship_type,
        created_at: new Date().toISOString(),
      });
    }
  });

  setLocal(STORAGE_RELS, all);
  setLocal(STORAGE_RELS_CACHE, all);
  relationshipsMemoryCache = all;

  // For siblings: link shared parents in background if available
  if (type === 'sibling') {
    try {
      const parentsOfMember = all
        .filter(r => (r.member_id === memberId && r.relationship_type === 'parent') ||
                     (r.related_member_id === memberId && r.relationship_type === 'child'))
        .map(r => r.relationship_type === 'parent' ? r.related_member_id : r.member_id);

      const parentsOfRelated = all
        .filter(r => (r.member_id === relatedId && r.relationship_type === 'parent') ||
                     (r.related_member_id === relatedId && r.relationship_type === 'child'))
        .map(r => r.relationship_type === 'parent' ? r.related_member_id : r.member_id);

      const extraRows: { member_id: string; related_member_id: string; relationship_type: RelationshipType }[] = [];

      for (const pId of parentsOfMember) {
        if (!parentsOfRelated.includes(pId)) {
          extraRows.push(
            { member_id: relatedId, related_member_id: pId, relationship_type: 'parent' },
            { member_id: pId, related_member_id: relatedId, relationship_type: 'child' }
          );
        }
      }
      for (const pId of parentsOfRelated) {
        if (!parentsOfMember.includes(pId)) {
          extraRows.push(
            { member_id: memberId, related_member_id: pId, relationship_type: 'parent' },
            { member_id: pId, related_member_id: memberId, relationship_type: 'child' }
          );
        }
      }

      if (extraRows.length > 0) {
        if (isSupabaseConfigured) {
          supabase.from('relationships').upsert(extraRows, {
            onConflict: 'member_id,related_member_id,relationship_type',
            ignoreDuplicates: true,
          }).then(() => {});
        }
        extraRows.forEach(r => {
          all.push({
            id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            member_id: r.member_id,
            related_member_id: r.related_member_id,
            relationship_type: r.relationship_type,
            created_at: new Date().toISOString(),
          });
        });
        setLocal(STORAGE_RELS, all);
        setLocal(STORAGE_RELS_CACHE, all);
        relationshipsMemoryCache = all;
      }
    } catch (e) {
      console.warn('Auto-link sibling parents error:', e);
    }
  }
}

export async function removeRelationship(memberId: string, relatedId: string): Promise<void> {
  invalidateRelationshipsCache();

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('relationships')
        .delete()
        .or(
          `and(member_id.eq.${memberId},related_member_id.eq.${relatedId}),` +
          `and(member_id.eq.${relatedId},related_member_id.eq.${memberId})`
        );
    } catch (e) {
      console.warn('Network error in removeRelationship:', e);
    }
  }

  const all = getLocal<Relationship[]>(STORAGE_RELS, []);
  const filtered = all.filter(r => !(
    (r.member_id === memberId && r.related_member_id === relatedId) ||
    (r.member_id === relatedId && r.related_member_id === memberId)
  ));
  setLocal(STORAGE_RELS, filtered);
  setLocal(STORAGE_RELS_CACHE, filtered);
  relationshipsMemoryCache = filtered;
}

// ── Life Events ───────────────────────────────────────────────

export async function fetchLifeEvents(memberId: string): Promise<LifeEvent[]> {
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('life_events')
      .select('*')
      .eq('member_id', memberId)
      .order('event_date', { ascending: true });
    if (data) return data;
  }

  const all = getLocal<LifeEvent[]>(STORAGE_EVENTS, []);
  return all.filter(e => e.member_id === memberId);
}

export async function upsertLifeEvent(event: Partial<LifeEvent> & { member_id: string; title: string }): Promise<LifeEvent> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('life_events')
      .upsert(event)
      .select()
      .single();
    if (!error && data) return data;
  }

  const all = getLocal<LifeEvent[]>(STORAGE_EVENTS, []);
  const created: LifeEvent = {
    id: event.id || `event-${Date.now()}`,
    member_id: event.member_id,
    title: event.title,
    description: event.description ?? null,
    event_date: event.event_date ?? null,
    event_type: event.event_type ?? 'other',
    created_at: new Date().toISOString(),
  };
  all.push(created);
  setLocal(STORAGE_EVENTS, all);
  return created;
}

// ── Gallery ───────────────────────────────────────────────────

export async function fetchGallery(publishedOnly = false): Promise<GalleryItem[]> {
  if (isSupabaseConfigured) {
    let q = supabase.from('gallery_items').select('*');
    if (publishedOnly) q = q.eq('is_published', true);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (!error && data) return data;
  }

  const all = getLocal<GalleryItem[]>(STORAGE_GALLERY, []);
  return publishedOnly ? all.filter(i => i.is_published) : all;
}

export async function upsertGalleryItem(item: Partial<GalleryItem> & { title: string; image_url: string }): Promise<GalleryItem> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('gallery_items')
      .upsert(item)
      .select()
      .single();
    if (!error && data) return data;
  }

  const all = getLocal<GalleryItem[]>(STORAGE_GALLERY, []);
  const created: GalleryItem = {
    id: item.id || `gal-${Date.now()}`,
    title: item.title,
    description: item.description ?? null,
    image_url: item.image_url,
    category: item.category ?? 'other',
    date_taken: item.date_taken ?? null,
    members_featured: item.members_featured ?? [],
    is_published: item.is_published ?? true,
    created_at: new Date().toISOString(),
  };
  const idx = all.findIndex(i => i.id === created.id);
  if (idx >= 0) all[idx] = created;
  else all.unshift(created);
  setLocal(STORAGE_GALLERY, all);
  return created;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('gallery_items').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteGalleryItem error:', error.message);
      throw error;
    }
    return;
  }

  const all = getLocal<GalleryItem[]>(STORAGE_GALLERY, []);
  setLocal(STORAGE_GALLERY, all.filter(i => i.id !== id));
}

// ── History ────────────────────────────────────────────────────

export async function fetchHistory(publishedOnly = false): Promise<FamilyHistoryEntry[]> {
  if (isSupabaseConfigured) {
    let q = supabase.from('family_history').select('*');
    if (publishedOnly) q = q.eq('is_published', true);
    const { data, error } = await q.order('display_order', { ascending: true });
    if (!error && data) return data;
  }

  const all = getLocal<FamilyHistoryEntry[]>(STORAGE_HISTORY, []);
  return publishedOnly ? all.filter(h => h.is_published) : all;
}

export async function upsertHistoryEntry(
  entry: Partial<FamilyHistoryEntry> & { title: string; content: string }
): Promise<FamilyHistoryEntry> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('family_history')
      .upsert(entry)
      .select()
      .single();
    if (!error && data) return data;
  }

  const all = getLocal<FamilyHistoryEntry[]>(STORAGE_HISTORY, []);
  const created: FamilyHistoryEntry = {
    id: entry.id || `hist-${Date.now()}`,
    title: entry.title,
    content: entry.content,
    event_date: entry.event_date ?? null,
    event_type: entry.event_type ?? 'other',
    image_url: entry.image_url ?? null,
    is_published: entry.is_published ?? true,
    display_order: entry.display_order ?? (all.length + 1),
    created_at: new Date().toISOString(),
  };
  const idx = all.findIndex(h => h.id === created.id);
  if (idx >= 0) all[idx] = created;
  else all.push(created);
  setLocal(STORAGE_HISTORY, all);
  return created;
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('family_history').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteHistoryEntry error:', error.message);
      throw error;
    }
    return;
  }

  const all = getLocal<FamilyHistoryEntry[]>(STORAGE_HISTORY, []);
  setLocal(STORAGE_HISTORY, all.filter(h => h.id !== id));
}

// ── File Storage ──────────────────────────────────────────────

export async function uploadFile(
  bucket: 'profile-photos' | 'gallery' | 'documents',
  path: string,
  file: File,
): Promise<string> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }
    console.error('Storage upload error:', error.message);
  }

  // Local DataURL fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Family Tree Builder ───────────────────────────────────────

export async function buildFamilyTree(preferredRootId?: string): Promise<TreeNode | null> {
  // Use all members so any newly added or drafted members are in the tree
  let allMembers = await fetchAllMembers();
  if (!allMembers.length) {
    allMembers = await fetchPublishedMembers();
  }

  // If still empty (e.g. offline or DB error), try to retrieve from persistent local cache
  if (!allMembers.length) {
    try {
      const cached = localStorage.getItem(STORAGE_TREE_CACHE);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  }

  // Always fetch fresh relationships
  const rels = await fetchAllRelationships(true);

  const memberMap = new Map(allMembers.map(m => [m.id, m]));

  // Find the best root
  let rootMember: FamilyMember | null = null;
  if (preferredRootId && memberMap.has(preferredRootId)) {
    rootMember = memberMap.get(preferredRootId)!;
  } else {
    // 1. Identify members with NO parents
    const membersWithParents = new Set<string>();
    rels.forEach(r => {
      // (child, parent, 'parent') -> child has parent
      if (r.relationship_type === 'parent' && memberMap.has(r.member_id)) {
        membersWithParents.add(r.member_id);
      }
      // (parent, child, 'child') -> child has parent
      if (r.relationship_type === 'child' && memberMap.has(r.related_member_id)) {
        membersWithParents.add(r.related_member_id);
      }
    });

    const candidateRoots = allMembers.filter(m => !membersWithParents.has(m.id));

    // Helper: count total descendants reachable from a candidate root
    const countSubtree = (id: string, visited = new Set<string>()): number => {
      if (visited.has(id)) return 0;
      visited.add(id);

      const spouses = rels
        .filter(r => (r.member_id === id || r.related_member_id === id) && r.relationship_type === 'spouse')
        .map(r => (r.member_id === id ? r.related_member_id : r.member_id));
      const parents = [id, ...spouses];

      const childIds: string[] = [];
      rels.forEach(r => {
        // (parent, child, 'child')
        if (parents.includes(r.member_id) && r.relationship_type === 'child') {
          childIds.push(r.related_member_id);
        }
        // (child, parent, 'parent')
        if (parents.includes(r.related_member_id) && r.relationship_type === 'parent') {
          childIds.push(r.member_id);
        }
      });

      let total = 1;
      for (const cid of new Set(childIds)) {
        if (!parents.includes(cid) && !visited.has(cid) && memberMap.has(cid)) {
          total += countSubtree(cid, visited);
        }
      }
      return total;
    };

    // Rank candidate roots:
    // Primary: lowest generation (Gen 1 is the ancestral generation)
    // Secondary: highest descendant count (the root of the actual main family tree)
    // Tertiary: gender male (traditional lineage head if couple)
    const validCandidates = (candidateRoots.length ? candidateRoots : allMembers);
    const ranked = validCandidates.map(c => ({
      member: c,
      gen: c.generation ?? 1,
      descendants: countSubtree(c.id),
    })).sort((a, b) => {
      if (a.gen !== b.gen) return a.gen - b.gen;
      if (b.descendants !== a.descendants) return b.descendants - a.descendants;
      if (a.member.gender === 'male' && b.member.gender !== 'male') return -1;
      if (b.member.gender === 'male' && a.member.gender !== 'male') return 1;
      return a.member.full_name.localeCompare(b.member.full_name);
    });

    rootMember = ranked[0]?.member || allMembers[0];
  }

  if (!rootMember) return null;

  // Build the recursive tree node
  const buildNode = (id: string, visited = new Set<string>()): TreeNode | null => {
    if (visited.has(id)) return null;
    visited.add(id);
    const m = memberMap.get(id);
    if (!m) return null;

    // Spouses
    const spouseIds = [
      ...new Set(
        rels
          .filter(r => (r.member_id === id || r.related_member_id === id) && r.relationship_type === 'spouse')
          .map(r => (r.member_id === id ? r.related_member_id : r.member_id))
      )
    ].filter(sid => sid !== id);

    // Parents to check for children: this member + any of their spouses
    const parentsToCheck = [id, ...spouseIds];

    // Collect child IDs
    const rawChildIds: string[] = [];
    rels.forEach(r => {
      // 1. (parent, child, 'child')
      if (parentsToCheck.includes(r.member_id) && r.relationship_type === 'child') {
        rawChildIds.push(r.related_member_id);
      }
      // 2. (child, parent, 'parent')
      if (parentsToCheck.includes(r.related_member_id) && r.relationship_type === 'parent') {
        rawChildIds.push(r.member_id);
      }
    });

    // Also include siblings of existing children
    const siblingChildIds: string[] = [];
    rawChildIds.forEach(cid => {
      rels.forEach(r => {
        if (r.relationship_type === 'sibling') {
          if (r.member_id === cid && !rawChildIds.includes(r.related_member_id)) {
            siblingChildIds.push(r.related_member_id);
          }
          if (r.related_member_id === cid && !rawChildIds.includes(r.member_id)) {
            siblingChildIds.push(r.member_id);
          }
        }
      });
    });
    rawChildIds.push(...siblingChildIds);

    // Clean and validate child IDs (prevent cycles, avoid duplicates)
    const childIds = [...new Set(rawChildIds)].filter(cid => {
      if (cid === id || spouseIds.includes(cid)) return false;
      if (visited.has(cid)) return false;
      if (!memberMap.has(cid)) return false;

      // Ensure this node is not actually a parent of id
      const isParentOfId = rels.some(r =>
        (r.member_id === id && r.related_member_id === cid && r.relationship_type === 'parent') ||
        (r.member_id === cid && r.related_member_id === id && r.relationship_type === 'child')
      );
      if (isParentOfId) return false;
      return true;
    });

    return {
      id: m.id,
      name: m.full_name,
      gender: m.gender,
      dob: m.dob,
      dod: m.dod,
      profile_photo_url: m.profile_photo_url,
      generation: m.generation ?? 1,
      branch: m.branch,
      spouses: spouseIds
        .map(sid => memberMap.get(sid))
        .filter(Boolean)
        .map(s => ({
          id: s!.id,
          name: s!.full_name,
          gender: s!.gender,
          dob: s!.dob,
          dod: s!.dod,
          profile_photo_url: s!.profile_photo_url,
          generation: s!.generation ?? 1,
          branch: s!.branch,
          spouses: [],
          children: [],
        })),
      children: childIds
        .map(cid => buildNode(cid, new Set(visited)))
        .filter((n): n is TreeNode => n !== null)
        .sort((a, b) => {
          if (a.dob && b.dob) return a.dob.localeCompare(b.dob);
          return a.name.localeCompare(b.name);
        }),
    };
  };

  const tree = buildNode(rootMember.id);

  // Persist built tree to local cache for instant zero-latency loading
  if (tree && !preferredRootId) {
    try {
      localStorage.setItem(STORAGE_TREE_CACHE, JSON.stringify(tree));
    } catch (e) {
      console.warn('Could not cache family tree in localStorage:', e);
    }
  }

  return tree;
}

// ── Founders Wizard Helper (Direct to Supabase) ───────────────

export interface FoundersSetupPayload {
  headId?: string;
  headName: string;
  headGender: 'male' | 'female' | 'other';
  headDob: string | null;
  headDod: string | null;
  headOccupation: string | null;
  headHometown: string | null;
  headBio: string | null;
  headPhotoUrl: string | null;

  partnerId?: string;
  partnerName: string;
  partnerGender: 'male' | 'female' | 'other';
  partnerDob: string | null;
  partnerDod: string | null;
  partnerOccupation: string | null;
  partnerHometown: string | null;
  partnerBio: string | null;
  partnerPhotoUrl: string | null;

  branchName: string;
}

export async function setupFounders(data: FoundersSetupPayload): Promise<{ head: FamilyMember; partner: FamilyMember }> {
  // 1. Create or Update Head
  const head = await upsertMember({
    ...(data.headId ? { id: data.headId } : {}),
    full_name: data.headName,
    gender: data.headGender,
    dob: data.headDob,
    dod: data.headDod,
    occupation: data.headOccupation,
    hometown: data.headHometown,
    bio: data.headBio,
    profile_photo_url: data.headPhotoUrl || '/uploads/founders.jpg',
    generation: 1,
    branch: data.branchName || 'Founding Roots',
    status: 'published',
    is_public: true,
  });

  // 2. Create or Update Partner
  const partner = await upsertMember({
    ...(data.partnerId ? { id: data.partnerId } : {}),
    full_name: data.partnerName,
    gender: data.partnerGender,
    dob: data.partnerDob,
    dod: data.partnerDod,
    occupation: data.partnerOccupation,
    hometown: data.partnerHometown,
    bio: data.partnerBio,
    profile_photo_url: data.partnerPhotoUrl || '/uploads/founders.jpg',
    generation: 1,
    branch: data.branchName || 'Founding Roots',
    status: 'published',
    is_public: true,
  });

  // 3. Link them as spouses directly in relationships table
  await addRelationship(head.id, partner.id, 'spouse');

  return { head, partner };
}

// ── Export / Backup ───────────────────────────────────────────

export async function exportFamilyData(): Promise<Record<string, unknown>> {
  const [members, history, gallery] = await Promise.all([
    fetchAllMembers(),
    fetchHistory(false),
    fetchGallery(false),
  ]);

  let rels: Relationship[] = [];
  if (isSupabaseConfigured) {
    const { data } = await supabase.from('relationships').select('*');
    if (data) rels = data;
  } else {
    rels = getLocal<Relationship[]>(STORAGE_RELS, []);
  }

  return {
    family: 'KKC Family Archive',
    exported_at: new Date().toISOString(),
    members_count: members.length,
    family_members: members,
    relationships: rels,
    family_history: history,
    gallery_items: gallery,
  };
}
