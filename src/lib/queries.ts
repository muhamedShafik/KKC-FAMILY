// src/lib/queries.ts
// Full data-layer for KKKC Family – Supabase + Cloudinary
import { uploadToCloudinary } from '@/lib/cloudinary';
import supabase, { isSupabaseConfigured } from './supabase';
import type {
  FamilyMember,
  FamilyMemberWithRelations,
  GalleryItem,
  FamilyHistoryEntry,
  TreeNode,
  RelationshipType,
  MemberStatus,
} from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary upload (with Supabase storage fallback)
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadFile(
  _bucket: string,
  _path: string,
  file: File
): Promise<string> {
  try {
    const secureUrl = await uploadToCloudinary(file, { bucket: _bucket });
    return secureUrl;
  } catch (err: any) {
    console.warn('Cloudinary upload error:', err);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.storage.from(_bucket).upload(_path, file, { upsert: true });
        if (!error) {
          const { data } = supabase.storage.from(_bucket).getPublicUrl(_path);
          if (data?.publicUrl) return data.publicUrl;
        }
      } catch (sbErr) {
        console.warn('Supabase storage fallback failed:', sbErr);
      }
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Family stats cache (localStorage for instant first-paint)
// ─────────────────────────────────────────────────────────────────────────────
export interface FamilyStats {
  totalMembers: number;
  totalGenerations: number;
  totalBranches: number;
}

const STATS_KEY = 'kkkc_family_stats';

export function getCachedFamilyStats(): FamilyStats | null {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FamilyStats;
  } catch {
    return null;
  }
}

export function setCachedFamilyStats(stats: FamilyStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

/**
 * Synchronize and invalidate all localStorage caches when members are added, updated, or deleted
 */
export function invalidateMemberLocalCaches(
  updatedMember?: Partial<FamilyMember> & { id: string },
  deletedMemberId?: string
): void {
  try {
    // 1. Published members cache
    const rawPub = localStorage.getItem('kkc_published_members_cache_v2');
    if (rawPub) {
      let pubList: FamilyMember[] = JSON.parse(rawPub);
      if (deletedMemberId) {
        pubList = pubList.filter(m => m.id !== deletedMemberId);
      }
      if (updatedMember) {
        const idx = pubList.findIndex(m => m.id === updatedMember.id);
        const isPub = updatedMember.status === 'published';
        if (isPub) {
          if (idx >= 0) {
            pubList[idx] = { ...pubList[idx], ...updatedMember } as FamilyMember;
          } else {
            pubList.push(updatedMember as FamilyMember);
          }
        } else if (updatedMember.status && idx >= 0) {
          pubList.splice(idx, 1);
        }
      }
      localStorage.setItem('kkc_published_members_cache_v2', JSON.stringify(pubList));
    }

    // 2. Founders cache (generation 1 published members)
    const rawFounders = localStorage.getItem('kkc_founders_cache_v2');
    if (rawFounders) {
      let foundersList: FamilyMember[] = JSON.parse(rawFounders);
      if (deletedMemberId) {
        foundersList = foundersList.filter(m => m.id !== deletedMemberId);
      }
      if (updatedMember) {
        const idx = foundersList.findIndex(m => m.id === updatedMember.id);
        const isFounder = updatedMember.status === 'published' && (updatedMember.generation ?? 1) === 1;
        if (isFounder) {
          if (idx >= 0) {
            foundersList[idx] = { ...foundersList[idx], ...updatedMember } as FamilyMember;
          } else {
            foundersList.push(updatedMember as FamilyMember);
          }
        } else if (idx >= 0) {
          foundersList.splice(idx, 1);
        }
      }
      localStorage.setItem('kkc_founders_cache_v2', JSON.stringify(foundersList));
    }

    // 3. Fallback members cache
    const rawAll = localStorage.getItem('kkc_members_v1');
    if (rawAll) {
      let allList: FamilyMember[] = JSON.parse(rawAll);
      if (deletedMemberId) {
        allList = allList.filter(m => m.id !== deletedMemberId);
      }
      if (updatedMember) {
        const idx = allList.findIndex(m => m.id === updatedMember.id);
        if (idx >= 0) {
          allList[idx] = { ...allList[idx], ...updatedMember } as FamilyMember;
        } else {
          allList.push(updatedMember as FamilyMember);
        }
      }
      localStorage.setItem('kkc_members_v1', JSON.stringify(allList));
    }

    // 4. Invalidate family tree cache so the hierarchy updates immediately
    localStorage.removeItem('kkc_cached_family_tree_v2');

    // 5. Invalidate relations cache
    const relsRaw = localStorage.getItem('kkc_member_relations_cache_v2');
    if (relsRaw) {
      try {
        const rels = JSON.parse(relsRaw) as Record<string, unknown>;
        if (deletedMemberId) delete rels[deletedMemberId];
        if (updatedMember?.id) delete rels[updatedMember.id];
        localStorage.setItem('kkc_member_relations_cache_v2', JSON.stringify(rels));
      } catch {}
    }

    // 6. Reset family stats cache
    localStorage.removeItem(STATS_KEY);
  } catch (err) {
    console.warn('Failed to update local storage caches:', err);
  }
}

export function clearRelationsLocalCache(idA?: string, idB?: string): void {
  try {
    localStorage.removeItem('kkc_cached_family_tree_v2');
    const raw = localStorage.getItem('kkc_member_relations_cache_v2');
    if (raw) {
      const cache = JSON.parse(raw) as Record<string, unknown>;
      if (idA) delete cache[idA];
      if (idB) delete cache[idB];
      localStorage.setItem('kkc_member_relations_cache_v2', JSON.stringify(cache));
    }
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Members
// ─────────────────────────────────────────────────────────────────────────────

/** Generation-1 founders only (fast query) */
export async function fetchFounders(): Promise<FamilyMember[]> {
  if (!isSupabaseConfigured) return getLocalMembers().filter(m => (m.generation ?? 1) === 1);
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('generation', 1)
    .eq('status', 'published')
    .order('created_at', { ascending: true });
  if (error) throw error;
  const members = data as FamilyMember[];
  if (members.length) {
    try { localStorage.setItem('kkc_founders_cache_v2', JSON.stringify(members)); } catch {}
  }
  return members;
}

/** All published members */
export async function fetchPublishedMembers(): Promise<FamilyMember[]> {
  if (!isSupabaseConfigured) return getLocalMembers().filter(m => m.status === 'published');
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('status', 'published')
    .order('generation', { ascending: true });
  if (error) throw error;
  const members = data as FamilyMember[];
  try { localStorage.setItem('kkc_published_members_cache_v2', JSON.stringify(members)); } catch {}
  return members;
}

/** All members (admin) */
export async function fetchAllMembers(): Promise<FamilyMember[]> {
  if (!isSupabaseConfigured) return getLocalMembers();
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .order('generation', { ascending: true });
  if (error) throw error;
  return data as FamilyMember[];
}

/** Single member by ID */
export async function fetchMemberById(id: string): Promise<FamilyMember | null> {
  if (!isSupabaseConfigured) return getLocalMembers().find(m => m.id === id) ?? null;
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as FamilyMember;
}

/** Member with related members (parents, spouses, children, siblings) */
export async function fetchMemberWithRelations(id: string): Promise<FamilyMemberWithRelations | null> {
  if (!isSupabaseConfigured) {
    const member = getLocalMembers().find(m => m.id === id);
    if (!member) return null;
    return { ...member, parents: [], spouses: [], children: [], siblings: [] };
  }

  const { data: member, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !member) return null;

  const { data: rels } = await supabase
    .from('relationships')
    .select('*')
    .or(`member_id.eq.${id},related_member_id.eq.${id}`);

  const relIds = (rels ?? []).map(r => r.member_id === id ? r.related_member_id : r.member_id);
  const relTypes: Record<string, string> = {};
  (rels ?? []).forEach(r => {
    const otherId = r.member_id === id ? r.related_member_id : r.member_id;
    relTypes[otherId] = r.relationship_type;
  });

  let relatedMembers: FamilyMember[] = [];
  if (relIds.length) {
    const { data: rm } = await supabase
      .from('family_members')
      .select('*')
      .in('id', relIds);
    relatedMembers = (rm ?? []) as FamilyMember[];
  }

  const result: FamilyMemberWithRelations = {
    ...(member as FamilyMember),
    parents: relatedMembers.filter(m => relTypes[m.id] === 'parent'),
    spouses: relatedMembers.filter(m => relTypes[m.id] === 'spouse'),
    children: relatedMembers.filter(m => relTypes[m.id] === 'child'),
    siblings: relatedMembers.filter(m => relTypes[m.id] === 'sibling'),
  };

  // Cache for instant re-use
  try {
    const cache = JSON.parse(localStorage.getItem('kkc_member_relations_cache_v2') || '{}');
    cache[id] = result;
    localStorage.setItem('kkc_member_relations_cache_v2', JSON.stringify(cache));
  } catch {}

  return result;
}

/** Read from member-with-relations cache synchronously */
export function getCachedMemberWithRelations(id: string): FamilyMemberWithRelations | null {
  try {
    const raw = localStorage.getItem('kkc_member_relations_cache_v2');
    if (!raw) return null;
    const cache = JSON.parse(raw) as Record<string, FamilyMemberWithRelations>;
    return cache[id] ?? null;
  } catch {
    return null;
  }
}

/** Create or update a member */
export async function upsertMember(
  member: Partial<FamilyMemberWithRelations> & { full_name: string }
): Promise<FamilyMember> {
  // Strip relational or non-column fields so Supabase schema doesn't reject them
  const {
    parents,
    spouses,
    children,
    siblings,
    ...memberPayload
  } = member as any;

  if (!isSupabaseConfigured) {
    const members = getLocalMembers();
    const existing = members.findIndex(m => m.id === memberPayload.id);
    const now = new Date().toISOString();
    const saved: FamilyMember = {
      id: memberPayload.id ?? crypto.randomUUID(),
      full_name: memberPayload.full_name,
      gender: memberPayload.gender ?? 'male',
      dob: memberPayload.dob ?? null,
      dod: memberPayload.dod ?? null,
      bio: memberPayload.bio ?? null,
      occupation: memberPayload.occupation ?? null,
      hometown: memberPayload.hometown ?? null,
      branch: memberPayload.branch ?? null,
      generation: memberPayload.generation ?? 1,
      status: memberPayload.status ?? 'draft',
      profile_photo_url: memberPayload.profile_photo_url ?? null,
      is_public: memberPayload.is_public ?? true,
      private_notes: memberPayload.private_notes ?? null,
      phone: memberPayload.phone ?? null,
      email: memberPayload.email ?? null,
      created_at: memberPayload.id ? (members[existing]?.created_at ?? now) : now,
      updated_at: now,
    };
    if (existing >= 0) members[existing] = saved; else members.push(saved);
    saveLocalMembers(members);
    invalidateMemberLocalCaches(saved);
    return saved;
  }

  const { data, error } = await supabase
    .from('family_members')
    .upsert({ ...memberPayload, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  const saved = data as FamilyMember;
  invalidateMemberLocalCaches(saved);
  return saved;
}

/** Archive (soft-delete) a member */
export async function archiveMember(id: string): Promise<void> {
  await updateMemberStatus(id, 'archived');
}

/** Permanently delete a member */
export async function deleteMember(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    saveLocalMembers(getLocalMembers().filter(m => m.id !== id));
    invalidateMemberLocalCaches(undefined, id);
    return;
  }
  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) throw error;
  invalidateMemberLocalCaches(undefined, id);
}

/** Update member status */
export async function updateMemberStatus(
  id: string,
  status: MemberStatus
): Promise<void> {
  if (!isSupabaseConfigured) {
    const members = getLocalMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx >= 0) {
      members[idx].status = status;
      saveLocalMembers(members);
      invalidateMemberLocalCaches(members[idx]);
    }
    return;
  }
  const { data, error } = await supabase
    .from('family_members')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  invalidateMemberLocalCaches(data as FamilyMember);
}

// ─────────────────────────────────────────────────────────────────────────────
// Relationships
// ─────────────────────────────────────────────────────────────────────────────

export async function addRelationship(
  memberId: string,
  relatedId: string,
  type: RelationshipType
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('relationships')
    .insert({ member_id: memberId, related_member_id: relatedId, relationship_type: type });
  if (error) throw error;
  clearRelationsLocalCache(memberId, relatedId);
}

export async function removeRelationship(
  memberId: string,
  relatedId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('relationships')
    .delete()
    .or(`and(member_id.eq.${memberId},related_member_id.eq.${relatedId}),and(member_id.eq.${relatedId},related_member_id.eq.${memberId})`);
  if (error) throw error;
  clearRelationsLocalCache(memberId, relatedId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Family Tree builder
// ─────────────────────────────────────────────────────────────────────────────

export async function buildFamilyTree(rootId?: string): Promise<TreeNode | null> {
  const members = await fetchAllMembers();
  if (!members.length) return null;

  if (!isSupabaseConfigured) {
    const root = rootId ? members.find(m => m.id === rootId) : members.find(m => (m.generation ?? 1) === 1);
    if (!root) return null;
    const toNode = (m: FamilyMember): TreeNode => ({
      id: m.id, name: m.full_name, gender: m.gender,
      dob: m.dob, dod: m.dod, profile_photo_url: m.profile_photo_url,
      generation: m.generation ?? 1, branch: m.branch,
      spouses: [], children: [],
    });
    return toNode(root);
  }

  const { data: rels } = await supabase.from('relationships').select('*');
  const relationships = rels ?? [];

  const memberMap = new Map(members.map(m => [m.id, m]));

  const toNode = (m: FamilyMember, visited = new Set<string>()): TreeNode => {
    if (visited.has(m.id)) return {
      id: m.id, name: m.full_name, gender: m.gender,
      dob: m.dob, dod: m.dod, profile_photo_url: m.profile_photo_url,
      generation: m.generation ?? 1, branch: m.branch,
      spouses: [], children: [],
    };
    visited.add(m.id);

    const spouseIds = relationships
      .filter(r => (r.member_id === m.id || r.related_member_id === m.id) && r.relationship_type === 'spouse')
      .map(r => r.member_id === m.id ? r.related_member_id : r.member_id);

    const childIds = relationships
      .filter(r => r.member_id === m.id && r.relationship_type === 'child')
      .map(r => r.related_member_id);

    return {
      id: m.id, name: m.full_name, gender: m.gender,
      dob: m.dob, dod: m.dod, profile_photo_url: m.profile_photo_url,
      generation: m.generation ?? 1, branch: m.branch,
      spouses: spouseIds.map(id => memberMap.get(id)).filter(Boolean).map(s => toNode(s!, new Set(visited))),
      children: childIds.map(id => memberMap.get(id)).filter(Boolean).map(c => toNode(c!, new Set(visited))),
    };
  };

  const root = rootId ? memberMap.get(rootId) : members.find(m => (m.generation ?? 1) === 1);
  if (!root) return null;

  const tree = toNode(root);
  try { localStorage.setItem('kkc_cached_family_tree_v2', JSON.stringify(tree)); } catch {}
  return tree;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gallery
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchGallery(publishedOnly = true): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured) return [];
  let q = supabase.from('gallery_items').select('*').order('created_at', { ascending: false });
  if (publishedOnly) q = q.eq('is_published', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as GalleryItem[];
}

export async function upsertGalleryItem(item: Partial<GalleryItem>): Promise<GalleryItem> {
  if (!isSupabaseConfigured) throw new Error('Supabase not connected');
  const { data, error } = await supabase
    .from('gallery_items')
    .upsert(item)
    .select()
    .single();
  if (error) throw error;
  return data as GalleryItem;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('gallery_items').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// History
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchHistory(publishedOnly = true): Promise<FamilyHistoryEntry[]> {
  if (!isSupabaseConfigured) return [];
  let q = supabase.from('life_events').select('*').order('created_at', { ascending: false });
  if (publishedOnly) q = q.eq('is_published', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as FamilyHistoryEntry[];
}

export async function upsertHistoryEntry(entry: Partial<FamilyHistoryEntry>): Promise<FamilyHistoryEntry> {
  if (!isSupabaseConfigured) throw new Error('Supabase not connected');
  const { data, error } = await supabase
    .from('life_events')
    .upsert(entry)
    .select()
    .single();
  if (error) throw error;
  return data as FamilyHistoryEntry;
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('life_events').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Founders setup wizard
// ─────────────────────────────────────────────────────────────────────────────

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

export async function setupFounders(data: FoundersSetupPayload): Promise<{ head: FamilyMember; partner?: FamilyMember }> {
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

  let partner: FamilyMember | undefined;
  if (data.partnerName?.trim()) {
    partner = await upsertMember({
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
    await addRelationship(head.id, partner.id, 'spouse');
  }

  return { head, partner };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export async function exportFamilyData() {
  const members = await fetchAllMembers();
  const gallery = await fetchGallery(false);
  const history = await fetchHistory(false);
  return { members, gallery, history, exportedAt: new Date().toISOString() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Local-storage helpers (offline / no-Supabase mode)
// ─────────────────────────────────────────────────────────────────────────────

function getLocalMembers(): FamilyMember[] {
  try {
    return JSON.parse(localStorage.getItem('kkc_members_v1') || '[]') as FamilyMember[];
  } catch {
    return [];
  }
}

function saveLocalMembers(members: FamilyMember[]): void {
  try {
    localStorage.setItem('kkc_members_v1', JSON.stringify(members));
  } catch {}
}
