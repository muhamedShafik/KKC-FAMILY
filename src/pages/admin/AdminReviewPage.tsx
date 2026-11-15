import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox, Check, Trash2, Edit, Users, Image as ImageIcon,
  BookOpen, Clock, AlertCircle, Phone, MapPin, Briefcase
} from 'lucide-react';
import {
  useAllMembers, useUpdateMemberStatus, useDeleteMember,
  useGallery, useUpsertGalleryItem, useDeleteGalleryItem,
  useHistory, useUpsertHistoryEntry, useDeleteHistoryEntry,
} from '@/hooks/useFamily';
import { Button, Card, Badge, Avatar, EmptyState } from '@/components/ui';
import type { FamilyMember, GalleryItem, FamilyHistoryEntry } from '@/types';
import toast from 'react-hot-toast';

type Tab = 'all' | 'members' | 'gallery' | 'history';

export default function AdminReviewPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Queries
  const { data: allMembers = [], isLoading: loadingMembers } = useAllMembers();
  const { data: allGallery = [], isLoading: loadingGallery } = useGallery(true);
  const { data: allHistory = [], isLoading: loadingHistory } = useHistory(true);

  // Mutations
  const updateMemberStatus = useUpdateMemberStatus();
  const deleteMember = useDeleteMember();
  const upsertGallery = useUpsertGalleryItem();
  const deleteGallery = useDeleteGalleryItem();
  const upsertHistory = useUpsertHistoryEntry();
  const deleteHistory = useDeleteHistoryEntry();

  // Filter pending items
  const pendingMembers = allMembers.filter(m => m.status === 'draft');
  const pendingGallery = allGallery.filter(g => !g.is_published);
  const pendingHistory = allHistory.filter(h => !h.is_published);

  const totalPending = pendingMembers.length + pendingGallery.length + pendingHistory.length;
  const isLoading = loadingMembers || loadingGallery || loadingHistory;

  // ── Member Actions ───────────────────────────────────────────
  const handleAcceptMember = async (member: FamilyMember) => {
    setProcessingId(member.id);
    try {
      await updateMemberStatus.mutateAsync({ id: member.id, status: 'published' });
      toast.success(`${member.full_name} accepted and published to family tree!`);
    } catch {
      toast.error('Failed to accept member');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to reject and remove "${name}"?`)) return;
    setProcessingId(id);
    try {
      await deleteMember.mutateAsync(id);
      toast.success(`Request for "${name}" rejected and removed`);
    } catch {
      toast.error('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  // ── Gallery Actions ──────────────────────────────────────────
  const handleAcceptGallery = async (item: GalleryItem) => {
    setProcessingId(item.id);
    try {
      await upsertGallery.mutateAsync({ ...item, is_published: true });
      toast.success(`Photo "${item.title}" published to gallery!`);
    } catch {
      toast.error('Failed to publish photo');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectGallery = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to reject photo "${title}"?`)) return;
    setProcessingId(id);
    try {
      await deleteGallery.mutateAsync(id);
      toast.success(`Photo "${title}" rejected and deleted`);
    } catch {
      toast.error('Failed to reject photo');
    } finally {
      setProcessingId(null);
    }
  };

  // ── History Actions ──────────────────────────────────────────
  const handleAcceptHistory = async (entry: FamilyHistoryEntry) => {
    setProcessingId(entry.id);
    try {
      await upsertHistory.mutateAsync({ ...entry, is_published: true });
      toast.success(`History story "${entry.title}" published!`);
    } catch {
      toast.error('Failed to publish history story');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectHistory = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to reject story "${title}"?`)) return;
    setProcessingId(id);
    try {
      await deleteHistory.mutateAsync(id);
      toast.success(`History story "${title}" rejected and deleted`);
    } catch {
      toast.error('Failed to reject story');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900">
              Review Submissions
            </h1>
            {totalPending > 0 && (
              <Badge variant="amber" className="text-xs px-2.5 py-1">
                {totalPending} pending
              </Badge>
            )}
          </div>
          <p className="text-stone-500 text-sm mt-1">
            Review and approve public requests from family members to publish them to the website.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-stone-200/70 rounded-xl mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-white text-amber-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>All Requests</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
            {totalPending}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-white text-amber-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
            {pendingMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'gallery'
              ? 'bg-white text-amber-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Photos</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
            {pendingGallery.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-white text-amber-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>History Stories</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
            {pendingHistory.length}
          </span>
        </button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-stone-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading pending submissions...</p>
        </Card>
      ) : totalPending === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="All caught up!"
            description="There are no pending submissions awaiting review. When family members submit through public invite links, they will appear here."
            action={
              <Link to="/admin/invite-links">
                <Button variant="outline" size="sm">
                  Manage Public Invite Links
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Members Section */}
          {(activeTab === 'all' || activeTab === 'members') && pendingMembers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif font-semibold text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  Family Member Requests ({pendingMembers.length})
                </h2>
              </div>

              <div className="space-y-3">
                {pendingMembers.map(member => (
                  <Card key={member.id} className="p-5 border-amber-200 bg-amber-50/20">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar
                          name={member.full_name}
                          src={member.profile_photo_url}
                          size="lg"
                          className="border border-stone-200"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif font-bold text-stone-900 text-lg">
                              {member.full_name}
                            </h3>
                            <Badge variant="amber">Pending Draft</Badge>
                            <span className="text-xs text-stone-500 capitalize">
                              {member.gender}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-stone-600">
                            {member.branch && (
                              <p className="flex items-center gap-1">
                                <span className="font-medium text-stone-800">Branch:</span> {member.branch}
                              </p>
                            )}
                            {member.dob && (
                              <p className="flex items-center gap-1">
                                <span className="font-medium text-stone-800">Born:</span> {member.dob}
                              </p>
                            )}
                            {member.hometown && (
                              <p className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-stone-400" /> {member.hometown}
                              </p>
                            )}
                            {member.occupation && (
                              <p className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-stone-400" /> {member.occupation}
                              </p>
                            )}
                            {member.phone && (
                              <p className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-stone-400" /> {member.phone}
                              </p>
                            )}
                          </div>

                          {member.bio && (
                            <p className="mt-2.5 text-xs text-stone-700 bg-white/80 p-2.5 rounded-lg border border-stone-200">
                              <span className="font-medium text-stone-900">Notes / Bio:</span> {member.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col gap-2 flex-shrink-0 self-end sm:self-auto">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptMember(member)}
                          loading={processingId === member.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4" />
                          Accept & Publish
                        </Button>
                        <div className="flex gap-2">
                          <Link to={`/admin/members/${member.id}/edit`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRejectMember(member.id, member.full_name)}
                            loading={processingId === member.id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Section */}
          {(activeTab === 'all' || activeTab === 'gallery') && pendingGallery.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif font-semibold text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Gallery Photo Requests ({pendingGallery.length})
              </h2>

              <div className="space-y-3">
                {pendingGallery.map(photo => (
                  <Card key={photo.id} className="p-5 border-blue-200 bg-blue-50/20">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
                          <img
                            src={photo.image_url}
                            alt={photo.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif font-bold text-stone-900 text-lg">
                              {photo.title}
                            </h3>
                            <Badge variant="blue">{photo.category}</Badge>
                            <Badge variant="stone">Unpublished</Badge>
                          </div>
                          {photo.date_taken && (
                            <p className="text-xs text-stone-500 mt-1">
                              Taken on: {photo.date_taken}
                            </p>
                          )}
                          {photo.description && (
                            <p className="mt-2 text-xs text-stone-700 bg-white/80 p-2 rounded-lg border border-stone-200">
                              {photo.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 flex-shrink-0 self-end sm:self-auto">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptGallery(photo)}
                          loading={processingId === photo.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4" />
                          Accept & Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRejectGallery(photo.id, photo.title)}
                          loading={processingId === photo.id}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* History Section */}
          {(activeTab === 'all' || activeTab === 'history') && pendingHistory.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif font-semibold text-stone-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                History Story Requests ({pendingHistory.length})
              </h2>

              <div className="space-y-3">
                {pendingHistory.map(story => (
                  <Card key={story.id} className="p-5 border-purple-200 bg-purple-50/20">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {story.image_url && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
                            <img
                              src={story.image_url}
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif font-bold text-stone-900 text-lg">
                              {story.title}
                            </h3>
                            <Badge variant="stone">{story.event_type}</Badge>
                            <Badge variant="amber">Unpublished</Badge>
                          </div>
                          {story.event_date && (
                            <p className="text-xs text-stone-500 mt-1">
                              Date: {story.event_date}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-stone-700 bg-white/80 p-3 rounded-lg border border-stone-200 whitespace-pre-line">
                            {story.content}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 flex-shrink-0 self-end sm:self-auto">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptHistory(story)}
                          loading={processingId === story.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4" />
                          Accept & Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRejectHistory(story.id, story.title)}
                          loading={processingId === story.id}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

