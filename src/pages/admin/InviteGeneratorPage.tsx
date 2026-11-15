import { useState } from 'react';
import { Link, QrCode, Copy, Check, ExternalLink, Trash2, Plus, Clock, Info } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { useInviteTokens, useCreateInviteToken, useRevokeInviteToken } from '@/hooks/useInviteTokens';
import toast from 'react-hot-toast';
import type { InviteToken } from '@/types';

function getStatus(token: InviteToken): 'active' | 'expired' | 'revoked' {
  if (!token.is_active) return 'revoked';
  if (new Date(token.expires_at) < new Date()) return 'expired';
  return 'active';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short',
  });
}

function formatExpiry(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

export default function InviteGeneratorPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { data: tokens = [], isLoading } = useInviteTokens();
  const createToken = useCreateInviteToken();
  const revokeToken = useRevokeInviteToken();

  const activeTokens = tokens.filter(t => getStatus(t) === 'active');
  const latestActive = activeTokens[0] ?? null;

  const getUrl = (token: string) =>
    `${window.location.origin}/contribute?token=${token}`;

  const handleCopy = async (token: InviteToken) => {
    await navigator.clipboard.writeText(getUrl(token.token));
    setCopiedId(token.id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = async () => {
    try {
      const newToken = await createToken.mutateAsync();
      toast.success('New 7-hour invite link generated!');
      if (newToken) {
        // Automatically copy URL on generation for convenience
        try {
          await navigator.clipboard.writeText(getUrl(newToken.token));
        } catch {}
      }
    } catch (err: any) {
      console.error('Failed to generate invite link:', err);
      toast.error(err?.message || 'Failed to generate invite link');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeToken.mutateAsync(id);
      toast.success('Invite link revoked');
    } catch {
      toast.error('Failed to revoke link');
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Public Invite Links</h1>
        <p className="text-stone-500 text-sm mt-0.5">
          Generate a secure 7-hour link to let family members add content without an admin account.
        </p>
      </div>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">How it works</p>
          <p>Share the generated link or QR code with family members. They can open it to add family members, upload gallery photos, and submit history entries — without needing an admin password. The link automatically expires after 7 hours for security.</p>
        </div>
      </div>

      {/* Generate button */}
      <Card className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-serif font-semibold text-stone-900">Generate New Invite</h2>
            <p className="text-sm text-stone-500 mt-0.5">Each link is valid for exactly 7 hours from creation.</p>
          </div>
          <Button onClick={handleGenerate} loading={createToken.isPending}>
            <Plus className="w-4 h-4" />
            Generate 7-Hour Link
          </Button>
        </div>
      </Card>

      {/* Latest active token display */}
      {latestActive && (
        <Card className="mb-6 border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-semibold text-stone-900">Active Invite Link</h2>
            <Badge variant="green">
              <Clock className="w-3 h-3 mr-1" />
              {formatExpiry(latestActive.expires_at)}
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* QR Code */}
            <div className="flex-shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(getUrl(latestActive.token))}`}
                alt="QR Code"
                className="rounded-xl border border-stone-200 shadow-sm"
                width={220}
                height={220}
              />
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(getUrl(latestActive.token))}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900"
              >
                <ExternalLink className="w-3 h-3" /> Download QR (High-res)
              </a>
            </div>

            {/* Link + details */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-stone-500 mb-1">Share this link</p>
              <div className="flex items-stretch gap-2 mb-4">
                <div className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 font-mono text-xs text-stone-700 overflow-hidden overflow-ellipsis whitespace-nowrap">
                  {getUrl(latestActive.token)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(latestActive)}
                  className="flex-shrink-0"
                >
                  {copiedId === latestActive.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copiedId === latestActive.id ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              <div className="space-y-1 text-xs text-stone-600">
                <p><span className="font-medium">Created:</span> {formatTime(latestActive.created_at)}</p>
                <p><span className="font-medium">Expires:</span> {formatTime(latestActive.expires_at)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a href={getUrl(latestActive.token)} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-3.5 h-3.5" /> Open Link
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRevoke(latestActive.id)}
                  loading={revokeToken.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Token History */}
      <Card>
        <h2 className="font-serif font-semibold text-stone-900 mb-4">Link History</h2>
        {isLoading ? (
          <p className="text-sm text-stone-400">Loading...</p>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8">
            <Link className="w-10 h-10 text-stone-200 mx-auto mb-3" />
            <p className="text-sm text-stone-400">No invite links generated yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {tokens.map(t => {
              const status = getStatus(t);
              return (
                <div key={t.id} className="py-3 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-stone-500 truncate">{getUrl(t.token)}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Created {formatTime(t.created_at)} · Expires {formatTime(t.expires_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={status === 'active' ? 'green' : status === 'revoked' ? 'red' : 'stone'}>
                      {status}
                    </Badge>
                    {status === 'active' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(t)}>
                          {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => handleRevoke(t.id)}
                          loading={revokeToken.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
