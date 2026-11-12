import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPublishedMembers, fetchAllMembers, fetchMemberById,
  fetchMemberWithRelations, upsertMember, archiveMember, deleteMember,
  updateMemberStatus, buildFamilyTree, fetchGallery,
  fetchHistory, upsertHistoryEntry, upsertGalleryItem,
  deleteGalleryItem, deleteHistoryEntry,
  exportFamilyData, setupFounders,
  type FoundersSetupPayload,
} from '@/lib/queries';
import type { FamilyMember } from '@/types';

// ── Public Members ─────────────────────────────────────────────
export function usePublishedMembers() {
  return useQuery({
    queryKey: ['members', 'published'],
    queryFn: fetchPublishedMembers,
  });
}

// ── All Members (admin) ────────────────────────────────────────
export function useAllMembers() {
  return useQuery({
    queryKey: ['members', 'all'],
    queryFn: fetchAllMembers,
  });
}

// ── Single Member ──────────────────────────────────────────────
export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: () => fetchMemberById(id!),
    enabled: !!id,
  });
}

export function useMemberWithRelations(id: string | undefined) {
  return useQuery({
    queryKey: ['member', id, 'relations'],
    queryFn: () => fetchMemberWithRelations(id!),
    enabled: !!id,
  });
}

// ── Upsert Member ──────────────────────────────────────────────
export function useUpsertMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: Partial<FamilyMember> & { full_name: string }) => upsertMember(m),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['family-tree'] });
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
      qc.invalidateQueries({ queryKey: ['family-tree'] });
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
      qc.invalidateQueries({ queryKey: ['family-tree'] });
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
      qc.invalidateQueries({ queryKey: ['family-tree'] });
    },
  });
}

// ── Family Tree ────────────────────────────────────────────────
export function useFamilyTree() {
  return useQuery({
    queryKey: ['family-tree'],
    queryFn: buildFamilyTree,
    staleTime: 1000 * 60 * 2,
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
      qc.invalidateQueries({ queryKey: ['family-tree'] });
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
