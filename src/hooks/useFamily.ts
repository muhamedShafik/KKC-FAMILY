import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchFounders, fetchPublishedMembers, fetchAllMembers, fetchMemberById,
  fetchMemberWithRelations, getCachedMemberWithRelations,
  upsertMember, archiveMember, deleteMember,
  updateMemberStatus, buildFamilyTree, fetchGallery,
  fetchHistory, upsertHistoryEntry, upsertGalleryItem,
  deleteGalleryItem, deleteHistoryEntry,
  exportFamilyData, setupFounders,
  type FoundersSetupPayload,
} from '@/lib/queries';
import type { FamilyMember, FamilyMemberWithRelations, TreeNode } from '@/types';

// ── Public Members ─────────────────────────────────────────────
export function usePublishedMembers() {
  return useQuery<FamilyMember[]>({
    queryKey: ['members', 'published'],
    queryFn: fetchPublishedMembers,
    initialData: () => {
      try {
        const raw = localStorage.getItem('kkc_published_members_cache_v2');
        if (raw) return JSON.parse(raw) as FamilyMember[];
      } catch {}
      return undefined;
    },
    initialDataUpdatedAt: 0,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

// ── Instant Founders Query (Lightweight — earliest published members) ────────
export function useFounders() {
  return useQuery<FamilyMember[]>({
    queryKey: ['founders'],
    queryFn: fetchFounders,
    initialData: () => {
      try {
        const raw = localStorage.getItem('kkc_founders_cache_v2');
        if (raw) {
          const parsed = JSON.parse(raw) as FamilyMember[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        // Fallback: take the first few published members (oldest)
        const pubRaw = localStorage.getItem('kkc_published_members_cache_v2');
        if (pubRaw) {
          const pub = JSON.parse(pubRaw) as FamilyMember[];
          if (pub.length > 0) return pub.slice(0, 4);
        }
        // Fallback: check storage members
        const memRaw = localStorage.getItem('kkc_members_v1');
        if (memRaw) {
          const mem = JSON.parse(memRaw) as FamilyMember[];
          const published = mem.filter(m => m.status === 'published');
          if (published.length > 0) return published.slice(0, 4);
        }
      } catch {}
      return undefined;
    },
    initialDataUpdatedAt: 0,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

// ── All Members (admin) ────────────────────────────────────────
export function useAllMembers() {
  return useQuery<FamilyMember[]>({
    queryKey: ['members', 'all'],
    queryFn: fetchAllMembers,
    staleTime: 1000 * 15,
  });
}

// ── Single Member ──────────────────────────────────────────────
export function useMember(id: string | undefined) {
  return useQuery<FamilyMember | null>({
    queryKey: ['member', id],
    queryFn: () => fetchMemberById(id!),
    enabled: !!id,
  });
}

export function useMemberWithRelations(id: string | undefined) {
  const qc = useQueryClient();
  return useQuery<FamilyMemberWithRelations | null>({
    queryKey: ['member', id, 'relations'],
    queryFn: () => fetchMemberWithRelations(id!),
    enabled: !!id,
    placeholderData: () => {
      if (!id) return undefined;
      // 1. Instant 0ms synchronous cache lookup (with relations populated)
      const cached = getCachedMemberWithRelations(id);
      if (cached) return cached;

      // 2. Fast lookup in query client cache
      const membersPool = qc.getQueryData<FamilyMember[]>(['members', 'published']) ||
                          qc.getQueryData<FamilyMember[]>(['members', 'all']);
      const found = membersPool?.find(m => m.id === id);
      if (found) {
        return {
          ...found,
          parents: [],
          children: [],
          spouses: [],
          siblings: [],
        };
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}

// ── Instant Prefetch Hook (hover or focus) ──────────────────────
export function usePrefetchMember() {
  const qc = useQueryClient();
  return (id: string) => {
    if (!id) return;
    qc.prefetchQuery({
      queryKey: ['member', id, 'relations'],
      queryFn: () => fetchMemberWithRelations(id),
      staleTime: 1000 * 60 * 5,
    });
  };
}

// ── Upsert Member ──────────────────────────────────────────────
export function useUpsertMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: Partial<FamilyMember> & { full_name: string }) => upsertMember(m),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['founders'] });
      qc.invalidateQueries({ queryKey: ['family-tree'] });
      qc.invalidateQueries({ queryKey: ['member'] });
    },
  });
}

// ── Archive Member ─────────────────────────────────────────────
export function useArchiveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['founders'] });
      qc.invalidateQueries({ queryKey: ['family-tree'] });
      qc.invalidateQueries({ queryKey: ['member'] });
    },
  });
}

// ── Delete Member (Permanent) ──────────────────────────────────
export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['founders'] });
      qc.invalidateQueries({ queryKey: ['family-tree'] });
      qc.invalidateQueries({ queryKey: ['member'] });
    },
  });
}

// ── Publish Member ─────────────────────────────────────────────
export function useUpdateMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'draft' | 'published' | 'archived' }) =>
      updateMemberStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['founders'] });
      qc.invalidateQueries({ queryKey: ['family-tree'] });
      qc.invalidateQueries({ queryKey: ['member'] });
    },
  });
}

// ── Family Tree ────────────────────────────────────────────────
export function useFamilyTree(preferredRootId?: string) {
  return useQuery<TreeNode | null>({
    queryKey: ['family-tree', preferredRootId || 'default'],
    queryFn: () => buildFamilyTree(preferredRootId),
    initialData: () => {
      if (!preferredRootId) {
        try {
          const cached = localStorage.getItem('kkc_cached_family_tree_v2');
          if (cached) return JSON.parse(cached) as TreeNode;
        } catch {}
      }
      return undefined;
    },
    initialDataUpdatedAt: 0,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 60,
  });
}

// ── Gallery ────────────────────────────────────────────────────
export function useGallery(adminMode = false) {
  return useQuery({
    queryKey: ['gallery', adminMode],
    queryFn: () => fetchGallery(!adminMode),
  });
}

export function useUpsertGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertGalleryItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
}

export function useDeleteGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteGalleryItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
}

// ── History ────────────────────────────────────────────────────
export function useHistory(adminMode = false) {
  return useQuery({
    queryKey: ['history', adminMode],
    queryFn: () => fetchHistory(!adminMode),
  });
}

export function useUpsertHistoryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertHistoryEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['history'] }),
  });
}

export function useDeleteHistoryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHistoryEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['history'] }),
  });
}

// ── Setup Founders Wizard ─────────────────────────────────────
export function useSetupFounders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FoundersSetupPayload) => setupFounders(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['founders'] });
      qc.invalidateQueries({ queryKey: ['family-tree'] });
      qc.invalidateQueries({ queryKey: ['member'] });
    },
  });
}

// ── Export ─────────────────────────────────────────────────────
export function useExport() {
  return useMutation({
    mutationFn: exportFamilyData,
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kkc-family-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
