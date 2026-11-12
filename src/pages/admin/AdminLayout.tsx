import { Outlet, NavLink, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, Image, Settings,
  LogOut, TreePine, ChevronRight, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const ADMIN_NAV = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Founders Setup', to: '/admin/setup-founders', icon: TreePine },
  { label: 'Family Members', to: '/admin/members', icon: Users },
  { label: 'Family History', to: '/admin/history', icon: BookOpen },
  { label: 'Gallery', to: '/admin/gallery', icon: Image },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
  };

  return (
    <div className={cn(
      'flex flex-col bg-stone-900 text-white',
      mobile ? 'w-full h-full' : 'w-64 min-h-screen sticky top-0 h-screen',
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-stone-800 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
            <TreePine className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-serif font-bold text-white text-sm leading-none">KKC Family</p>
            <p className="text-amber-400 text-xs leading-none mt-0.5">Admin</p>
          </div>
        </Link>
        {mobile && onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-800">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {ADMIN_NAV.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              isActive
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-stone-400 hover:text-white hover:bg-stone-800',
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-stone-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-stone-400 truncate">{user?.email}</p>
            <p className="text-xs text-amber-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 w-full px-3 py-2 mt-1 rounded-xl text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          View Public Site
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-stone-900 border-b border-stone-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <TreePine className="w-5 h-5 text-amber-400" />
            <span className="font-serif font-bold text-white text-sm">KKC Admin</span>
          </div>
        </div>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

