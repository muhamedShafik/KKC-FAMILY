import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Archive, Trash2, Eye, Search, Filter, Users } from 'lucide-react';
import { useAllMembers, useArchiveMember, useDeleteMember, useUpdateMemberStatus } from '@/hooks/useFamily';
import { Avatar, Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { formatDate, calcAge } from '@/lib/utils';
import type { MemberStatus } from '@/types';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<MemberStatus, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
  archived: 'bg-stone-100 text-stone-600',
};

export default function AdminMembersPage() {
  const { data: members = [], isLoading } = useAllMembers();
  const archive = useArchiveMember();
  const deleteMemberMutation = useDeleteMember();
  const updateStatus = useUpdateMemberStatus();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | ''>('');

  const filtered = members.filter(m => {
    const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive ${name}? They will be hidden from the public site.`)) return;
    await archive.mutateAsync(id);
    toast.success(`${name} archived`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This will remove them and all their relationships permanently.`)) return;
    try {
      await deleteMemberMutation.mutateAsync(id);
      toast.success(`${name} permanently deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete member');
    }
  };

  const handlePublish = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'published' });
    toast.success('Member published');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Family Members</h1>
          <p className="text-stone-500 text-sm mt-0.5">Manage all members of the KKKC family.</p>
        </div>
        <Link to="/admin/members/add">
          <Button size="sm"><Plus className="w-4 h-4" /> Add Member</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex gap-2">
          {(['', 'published', 'draft', 'archived'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-amber-500 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-amber-300'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members found"
            description="Try adjusting your search, or add a new family member."
            action={
              <Link to="/admin/members/add">
                <Button size="sm"><Plus className="w-4 h-4" /> Add Member</Button>
              </Link>
            }
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left p-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Member</th>
                <th className="text-left p-4 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Branch / Gen</th>
                <th className="text-left p-4 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">Born</th>
                <th className="text-left p-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="text-right p-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.full_name} src={m.profile_photo_url} size="sm" />
                      <div>
                        <p className="font-medium text-stone-900 text-sm">{m.full_name}</p>
                        {m.occupation && <p className="text-xs text-stone-400">{m.occupation}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <p className="text-sm text-stone-700">{m.branch ?? '—'}</p>
                    {/* <p className="text-xs text-stone-400">Gen {m.generation ?? '?'}</p> */}
                  </td>
                  <td className="p-4 hidden md:table-cell text-sm text-stone-600">
                    {formatDate(m.dob)}
                    {m.dob && <span className="text-xs text-stone-400 block">{calcAge(m.dob, m.dod)} yrs</span>}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {m.status !== 'published' && (
                        <button
                          onClick={() => handlePublish(m.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Publish"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        to={`/admin/members/${m.id}/edit`}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      {m.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(m.id, m.full_name)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(m.id, m.full_name)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


