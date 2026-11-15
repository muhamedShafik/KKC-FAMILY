import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createInviteToken, fetchInviteTokens, revokeInviteToken, verifyInviteToken } from '@/lib/inviteTokens';

export function useInviteTokens() {
  return useQuery({
    queryKey: ['invite-tokens'],
    queryFn: fetchInviteTokens,
    staleTime: 1000 * 30,
  });
}

export function useCreateInviteToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInviteToken,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invite-tokens'] }),
  });
}

export function useRevokeInviteToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeInviteToken,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invite-tokens'] }),
  });
}

export function useVerifyToken(token: string | null) {
  return useQuery({
    queryKey: ['verify-token', token],
    queryFn: () => verifyInviteToken(token!),
    enabled: !!token,
    staleTime: 1000 * 60,
    retry: false,
  });
}
