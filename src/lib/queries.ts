import supabase, { isSupabaseConfigured } from './supabase';
import type {
  FamilyMember, FamilyMemberWithRelations, Relationship,
  LifeEvent, MemberPhoto, GalleryItem, FamilyHistoryEntry,
  TreeNode, MemberStatus, RelationshipType,
} from '@/types';

// ── Local Storage Fallback Keys (Clean, empty defaults) ───────
const STORAGE_MEMBERS = 'kkc_members_v1';
const STORAGE_RELS = 'kkc_relationships_v1';
const STORAGE_HISTORY = 'kkc_history_v1';
const STORAGE_GALLERY = 'kkc_gallery_v1';
const STORAGE_EVENTS = 'kkc_life_events_v1';

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

// ── Members ───────────────────────────────────────────────────

export async function fetchPublishedMembers(): Promise<FamilyMember[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('status', 'published')
      .eq('is_public', true)
      .order('generation', { ascending: true })
      .order('full_name', { ascending: true });
    if (!error && data) return data;
    if (error) console.error('Error fetching published members:', error.message);
  }

  const all = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
  return all
    .filter(m => m.status === 'published' && m.is_public)
    .sort((a, b) => (a.generation ?? 1) - (b.generation ?? 1));
}

export async function fetchAllMembers(): Promise<FamilyMember[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .neq('status', 'archived')
      .order('generation', { ascending: true })
      .order('full_name', { ascending: true });
    if (!error && data) return data;
    if (error) console.error('Error fetching all members:', error.message);
  }

  const all = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
  return all.filter(m => m.status !== 'archived');
}

export async function fetchMemberById(id: string): Promise<FamilyMember | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) return data;
  }

  const all = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
  return all.find(m => m.id === id) ?? null;
}

export async function fetchMemberWithRelations(id: string): Promise<FamilyMemberWithRelations | null> {
  const member = await fetchMemberById(id);
  if (!member) return null;

  let relationships: Relationship[] = [];

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('relationships')
      .select('*')
      .or(`member_id.eq.${id},related_member_id.eq.${id}`);
    if (!error && data) relationships = data;
    if (error) console.error('fetchMemberWithRelations error:', error.message);
  } else {
    relationships = getLocal<Relationship[]>(STORAGE_RELS, []);
  }

  // Parents of `id`:
  // 1. Where this member points to their parent: (id, parentId, 'parent')
  // 2. Where parent points to this member as child: (parentId, id, 'child')
  const parentIds = [...new Set([
    ...relationships
      .filter(r => r.member_id === id && r.relationship_type === 'parent')
      .map(r => r.related_member_id),
    ...relationships
      .filter(r => r.related_member_id === id && r.relationship_type === 'child')
      .map(r => r.member_id),
  ])].filter(pid => pid !== id);

  // Children of `id`:
  // 1. Where this member points to their child: (id, childId, 'child')
  // 2. Where child points to this member as parent: (childId, id, 'parent')
  const childIds = [...new Set([
    ...relationships
      .filter(r => r.member_id === id && r.relationship_type === 'child')
      .map(r => r.related_member_id),
    ...relationships
      .filter(r => r.related_member_id === id && r.relationship_type === 'parent')
      .map(r => r.member_id),
  ])].filter(cid => cid !== id && !parentIds.includes(cid));

  // Spouses of `id`:
  const spouseIds = [...new Set(
    relationships
      .filter(r => (r.member_id === id || r.related_member_id === id) && r.relationship_type === 'spouse')
      .map(r => (r.member_id === id ? r.related_member_id : r.member_id))
  )].filter(sid => sid !== id);

  // Siblings of `id`:
  const siblingIds = [...new Set(
    relationships
      .filter(r => (r.member_id === id || r.related_member_id === id) && r.relationship_type === 'sibling')
      .map(r => (r.member_id === id ? r.related_member_id : r.member_id))
  )].filter(sid => sid !== id);

  const fetchByIds = async (ids: string[]): Promise<FamilyMember[]> => {
    if (!ids.length) return [];
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('family_members').select('*').in('id', ids);
      if (data && data.length) return data;
    }
    const all = getLocal<FamilyMember[]>(STORAGE_MEMBERS, []);
    return all.filter(m => ids.includes(m.id));
  };

  const [parents, children, spouses, siblings] = await Promise.all([
    fetchByIds(parentIds),
    fetchByIds(childIds),
    fetchByIds(spouseIds),
    fetchByIds(siblingIds),
  ]);

  return { ...member, parents, children, spouses, siblings };
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
    return;
  }
  // Local storage fallback
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
  }
}

export async function addRelationship(
  memberId: string,
  relatedId: string,
  type: RelationshipType,
): Promise<void> {
  if (type === 'parent') {
    // memberId has parent relatedId (memberId is child, relatedId is parent)
    // 1. Primary: memberId is child of relatedId
    await upsertRelRow(memberId, relatedId, 'parent');
    // 2. Reverse: relatedId has child memberId
    await upsertRelRow(relatedId, memberId, 'child');
  } else if (type === 'child') {
    // memberId has child relatedId (memberId is parent, relatedId is child)
    // 1. Primary: memberId has child relatedId
    await upsertRelRow(memberId, relatedId, 'child');
    // 2. Reverse: relatedId has parent memberId
    await upsertRelRow(relatedId, memberId, 'parent');
  } else if (type === 'spouse') {
    // Bidirectional spouse
    await upsertRelRow(memberId, relatedId, 'spouse');
    await upsertRelRow(relatedId, memberId, 'spouse');
  } else if (type === 'sibling') {
    // Bidirectional sibling
    await upsertRelRow(memberId, relatedId, 'sibling');
    await upsertRelRow(relatedId, memberId, 'sibling');
  }
}

export async function removeRelationship(memberId: string, relatedId: string): Promise<void> {
  if (isSupabaseConfigured) {
    // Delete ALL relationship rows between these two members (both directions, all types)
    const { error } = await supabase
      .from('relationships')
      .delete()
      .or(
        `and(member_id.eq.${memberId},related_member_id.eq.${relatedId}),` +
        `and(member_id.eq.${relatedId},related_member_id.eq.${memberId})`,
      );
    if (error) console.error('Supabase removeRelationship error:', error.message);
    return;
  }

  const all = getLocal<Relationship[]>(STORAGE_RELS, []);
  setLocal(STORAGE_RELS, all.filter(r => !(
    (r.member_id === memberId && r.related_member_id === relatedId) ||
    (r.member_id === relatedId && r.related_member_id === memberId)
  )));
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

export async function buildFamilyTree(): Promise<TreeNode | null> {
  let allMembers = await fetchPublishedMembers();
  // If no published members exist yet, fallback to all members
  if (!allMembers.length) {
    allMembers = await fetchAllMembers();
  }
  if (!allMembers.length) return null;

  let rels: Relationship[] = [];
  if (isSupabaseConfigured) {
    const { data } = await supabase.from('relationships').select('*');
    if (data) rels = data;
  } else {
    rels = getLocal<Relationship[]>(STORAGE_RELS, []);
  }

  // Find root: lowest generation (generation 1, or min generation)
  const minGen = Math.min(...allMembers.map(m => m.generation ?? 1));
  const founders = allMembers.filter(m => (m.generation ?? 1) === minGen);
  if (!founders.length) return null;

  // Prefer male founder / family head if available, otherwise first founder
  const rootMember = founders.find(m => m.gender === 'male') || founders[0];

  const memberMap = new Map(allMembers.map(m => [m.id, m]));

  const buildNode = (id: string, visited = new Set<string>()): TreeNode | null => {
    if (visited.has(id)) return null;
    visited.add(id);
    const m = memberMap.get(id);
    if (!m) return null;

    // Spouses of this member
    const spouseIds = [
      ...new Set(
        rels
          .filter(r => (r.member_id === id || r.related_member_id === id) && r.relationship_type === 'spouse')
          .map(r => (r.member_id === id ? r.related_member_id : r.member_id))
      )
    ].filter(sid => sid !== id);

    // Parents to check for children: this member + any of their spouses
    const parentsToCheck = [id, ...spouseIds];

    // Collect child IDs:
    // 1. Where parent points to child: (parentId, childId, 'child')
    // 2. Where child points to parent: (childId, parentId, 'parent')
    // 3. Legacy: (parentId, childId, 'parent')
    const rawChildIds: string[] = [];
    rels.forEach(r => {
      if (parentsToCheck.includes(r.member_id)) {
        if (r.relationship_type === 'child') rawChildIds.push(r.related_member_id);
        else if (r.relationship_type === 'parent') rawChildIds.push(r.related_member_id);
      }
      if (parentsToCheck.includes(r.related_member_id)) {
        if (r.relationship_type === 'parent') rawChildIds.push(r.member_id);
        else if (r.relationship_type === 'child') rawChildIds.push(r.member_id);
      }
    });

    // Clean and validate child IDs:
    const childIds = [...new Set(rawChildIds)].filter(cid => {
      if (cid === id || spouseIds.includes(cid)) return false;
      if (visited.has(cid)) return false;
      if (!memberMap.has(cid)) return false;

      // Ensure this node is not actually a parent of id (prevent loops)
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
        .filter((n): n is TreeNode => n !== null),
    };
  };

  return buildNode(rootMember.id);
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
