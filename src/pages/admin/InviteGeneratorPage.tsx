import { useState } from 'react';
import {
  Link, QrCode, Copy, Check, ExternalLink, Trash2, Plus, Clock, Info, Share2
} from 'lucide-react';
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
    dateStyle: 'medium',
    timeStyle: 'short',
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
    try {
      await navigator.clipboard.writeText(getUrl(token.token));
      setCopiedId(token.id);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Could not copy link to clipboard');
    }
  };

  const handleShare = async (token: InviteToken) => {
    const url = getUrl(token.token);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KKKC Family Contribution Link',
          text: 'Here is your 7-hour invite link to add family members, photos, and history to the KKKC Family website:',
          url,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy(token);
        }
      }
    } else {
      handleCopy(token);
    }
  };

  const handleGenerate = async () => {
    try {
      const newToken = await createToken.mutateAsync();
      toast.success('New 7-hour invite link generated!');
      if (newToken) {
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
    <div className="max-w-3xl w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Public Invite Links
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Generate a secure 7-hour link and QR code to let family members add content without an admin account.
        </p>
      </div>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-800 leading-relaxed">
          <p className="font-semibold mb-1">How it works</p>
          <p>
            Share the generated link or QR code with family members on WhatsApp or messages. They can open it to submit family members, upload photos, and write history entries — without needing a password. The link automatically expires after 7 hours.
          </p>
        </div>
      </div>

      {/* Generate button card */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif font-semibold text-stone-900 text-base sm:text-lg">
              Generate New Invite
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Each link is valid for exactly 7 hours from creation.
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            loading={createToken.isPending}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Generate 7-Hour Link
          </Button>
        </div>
      </Card>

      {/* Latest active token display */}
      {latestActive && (
        <Card className="mb-6 border-amber-200 bg-amber-50/40 p-4 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-600" />
              <h2 className="font-serif font-semibold text-stone-900 text-base sm:text-lg">
                Active Invite Link
              </h2>
            </div>
            <Badge variant="green" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {formatExpiry(latestActive.expires_at)}
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* QR Code Container (Responsive & Centered on mobile) */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="bg-white p-2.5 rounded-2xl border border-stone-200 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(getUrl(latestActive.token))}`}
                  alt="QR Code"
                  className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
                />
              </div>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(getUrl(latestActive.token))}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Download QR Code
              </a>
            </div>

            {/* Link Details and Responsive Buttons */}
            <div className="flex-1 w-full min-w-0">
              <p className="text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">
                Shareable Link URL
              </p>

              {/* Responsive URL box (break-all prevents overflow on all mobile screens) */}
              <div className="bg-white border border-stone-200 rounded-xl p-3 mb-3 text-xs font-mono text-stone-800 break-all select-all leading-relaxed shadow-inner">
                {getUrl(latestActive.token)}
              </div>

              {/* Main Share and Copy Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCopy(latestActive)}
                  className="w-full"
                >
                  {copiedId === latestActive.id ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedId === latestActive.id ? 'Copied to Clipboard!' : 'Copy Link'}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleShare(latestActive)}
                  className="w-full"
                >
                  <Share2 className="w-4 h-4" /> Share on WhatsApp / Phone
                </Button>
              </div>

              <div className="space-y-1 text-xs text-stone-600 bg-stone-100/70 p-3 rounded-xl mb-4">
                <p>
                  <span className="font-medium text-stone-800">Created:</span>{' '}
                  {formatTime(latestActive.created_at)}
                </p>
                <p>
                  <span className="font-medium text-stone-800">Expires:</span>{' '}
                  {formatTime(latestActive.expires_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={getUrl(latestActive.token)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none"
                >
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <ExternalLink className="w-3.5 h-3.5" /> Open Portal
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                  onClick={() => handleRevoke(latestActive.id)}
                  loading={revokeToken.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke Early
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Token History */}
      <Card className="p-4 sm:p-6">
        <h2 className="font-serif font-semibold text-stone-900 mb-4 text-base sm:text-lg">
          Link History
        </h2>
        {isLoading ? (
          <p className="text-sm text-stone-400">Loading invite links...</p>
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
                <div
                  key={t.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge
                        variant={
                          status === 'active'
                            ? 'green'
                            : status === 'revoked'
                            ? 'red'
                            : 'stone'
                        }
                      >
                        {status}
                      </Badge>
                      {status === 'active' && (
                        <span className="text-[11px] text-green-700 font-medium">
                          {formatExpiry(t.expires_at)}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-stone-600 break-all select-all bg-stone-50 p-2 rounded-lg border border-stone-200/60 leading-relaxed">
                      {getUrl(t.token)}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Created {formatTime(t.created_at)} · Expires {formatTime(t.expires_at)}
                    </p>
                  </div>

                  {status === 'active' && (
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleCopy(t)}>
                        {copiedId === t.id ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-xs">{copiedId === t.id ? 'Copied' : 'Copy'}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => handleRevoke(t.id)}
                        loading={revokeToken.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-xs">Revoke</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

