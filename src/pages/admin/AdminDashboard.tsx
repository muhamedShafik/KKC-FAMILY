import { Link } from 'react-router-dom';
import { Users, TreePine, Image, BookOpen, Plus, Download, RefreshCw } from 'lucide-react';
import { useAllMembers, useGallery, useHistory, useExport } from '@/hooks/useFamily';
import { Button, Card, Skeleton } from '@/components/ui';
import { Avatar } from '@/components/ui';
import toast from 'react-hot-toast';

function StatCard({ label, value, icon: Icon, to, color }: {
  label: string; value: number | string; icon: React.ElementType; to: string; color: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="hover:shadow-md hover:border-amber-200 transition-all">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-stone-500 mb-1">{label}</p>
            <p className="text-3xl font-serif font-bold text-stone-900">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: members = [], isLoading: loadingMembers } = useAllMembers();
  const { data: gallery = [] } = useGallery(true);
  const { data: history = [] } = useHistory(true);
  const exportData = useExport();

  const published = members.filter(m => m.status === 'published').length;
  const drafts = members.filter(m => m.status === 'draft').length;
  const pendingPhotos = gallery.filter(g => !g.is_published).length;
  const pendingHistory = history.filter(h => !h.is_published).length;
  const totalPending = drafts + pendingPhotos + pendingHistory;

  const handleExport = async () => {
    await exportData.mutateAsync();
    toast.success('Family data exported!');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-500 text-sm mt-1">Welcome back to the KKKC Family admin.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleExport} loading={exportData.isPending}>
            <Download className="w-4 h-4" /> Export Data
          </Button>
          <Link to="/admin/members/add">
            <Button size="sm">
              <Plus className="w-4 h-4" /> Add Member
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Members" value={loadingMembers ? '…' : members.length} icon={Users} to="/admin/members" color="bg-amber-50 text-amber-600" />
        <StatCard label="Published" value={loadingMembers ? '…' : published} icon={TreePine} to="/admin/members" color="bg-green-50 text-green-600" />
        <StatCard label="Gallery Photos" value={gallery.length} icon={Image} to="/admin/gallery" color="bg-blue-50 text-blue-600" />
        <StatCard label="History Entries" value={history.length} icon={BookOpen} to="/admin/history" color="bg-purple-50 text-purple-600" />
      </div>

      {/* Founders Setup Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 flex-shrink-0 bg-stone-800">
              <img
                src="/uploads/founders.jpg"
                alt="Founders Portrait"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-1 border border-amber-400/30">
                <TreePine className="w-3.5 h-3.5" /> Starting Point
              </div>
              <h2 className="font-serif text-xl md:text-2xl font-bold text-white">
                Family Founders Setup
              </h2>
              <p className="text-stone-300 text-sm mt-1 max-w-xl">
                Configure the first family head and their partner, attach the archival photo, and initialize your official family tree roots.
              </p>
            </div>
          </div>
          <Link to="/admin/setup-founders" className="w-full md:w-auto">
            <Button size="lg" className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-white shadow-lg whitespace-nowrap">
              Open Founders Setup Wizard
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Submissions Requiring Review */}
      {totalPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Pending Contributions ({totalPending})
              </h3>
            </div>
            <p className="text-stone-600 text-sm">
              {drafts > 0 && `${drafts} member${drafts > 1 ? 's' : ''}`}
              {drafts > 0 && (pendingPhotos > 0 || pendingHistory > 0) && ', '}
              {pendingPhotos > 0 && `${pendingPhotos} photo${pendingPhotos > 1 ? 's' : ''}`}
              {pendingPhotos > 0 && pendingHistory > 0 && ', '}
              {pendingHistory > 0 && `${pendingHistory} story${pendingHistory > 1 ? 'ies' : ''}`}
              {' '}awaiting your review before being published.
            </p>
          </div>
          <Link to="/admin/review" className="flex-shrink-0">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              Review Submissions →
            </Button>
          </Link>
        </div>
      )}

      {/* Recent members */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-stone-900">Recent Members</h2>
          <Link to="/admin/members" className="text-sm text-amber-600 hover:underline">View all</Link>
        </div>
        {loadingMembers ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No members added yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {members.slice(0, 8).map(m => (
              <Link
                key={m.id}
                to={`/admin/members/${m.id}/edit`}
                className="flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors"
              >
                <Avatar name={m.full_name} src={m.profile_photo_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{m.full_name}</p>
                  {/* <p className="text-xs text-stone-400">{m.branch ?? 'No branch'} · Gen {m.generation ?? '?'}</p> */}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.status === 'published' ? 'bg-green-100 text-green-700'
                  : m.status === 'draft' ? 'bg-amber-100 text-amber-700'
                  : 'bg-stone-100 text-stone-600'
                }`}>
                  {m.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


