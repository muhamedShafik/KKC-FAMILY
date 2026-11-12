import { useState } from 'react';
import { Settings, Shield, Database, Download } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useExport } from '@/hooks/useFamily';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const exportData = useExport();
  const [familyName, setFamilyName] = useState('KKC');
  const [tagline, setTagline] = useState('Our Roots, Our Story');

  const handleExport = async () => {
    await exportData.mutateAsync();
    toast.success('Family data exported as JSON');
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Settings</h1>
        <p className="text-stone-500 text-sm mt-0.5">Manage your family website configuration.</p>
      </div>

      <div className="space-y-6">
        {/* Site Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <Settings className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-semibold text-stone-900">Site Information</h2>
          </div>
          <div className="space-y-4">
            <Input
              label="Family Name"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              hint="Displayed throughout the website"
            />
            <Input
              label="Tagline"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              hint="Short phrase shown on homepage"
            />
            <Button>Save Settings</Button>
          </div>
        </Card>

        {/* Account */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-semibold text-stone-900">Admin Account</h2>
          </div>
          <div className="space-y-2 text-sm text-stone-600">
            <p><span className="font-medium text-stone-800">Admin User ID:</span> <code className="text-xs bg-stone-100 px-2 py-0.5 rounded font-mono text-stone-700">{user?.id}</code></p>
            <p><span className="font-medium text-stone-800">Email:</span> {user?.email}</p>
            <p><span className="font-medium text-stone-800">Role:</span> Administrator</p>
            <p className="text-stone-400 text-xs mt-3">
              To add more admin users, invite them via Supabase Authentication dashboard.
            </p>
          </div>
        </Card>

        {/* Backup & Export */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <Database className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-semibold text-stone-900">Backup & Export</h2>
          </div>
          <p className="text-sm text-stone-500 mb-4">
            Download a complete JSON export of all family data including members, relationships, history, and gallery.
          </p>
          <Button variant="outline" onClick={handleExport} loading={exportData.isPending}>
            <Download className="w-4 h-4" /> Export Family Data (JSON)
          </Button>
        </Card>

        {/* Supabase Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-medium text-amber-900 mb-2">Supabase Configuration</p>
          <p className="text-xs text-amber-700">
            Your data is stored in Supabase. To manage authentication users, storage buckets, or run database queries, visit your{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-medium">
              Supabase Dashboard
            </a>.
          </p>
          <p className="text-xs text-amber-600 mt-2 font-mono">
            Project URL: {import.meta.env.VITE_SUPABASE_URL ?? 'Not configured'}
          </p>
        </div>
      </div>
    </div>
  );
}

