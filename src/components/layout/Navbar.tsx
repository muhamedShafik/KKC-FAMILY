import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useFounders } from '@/hooks/useFamily';

const NAV = [
  { label: 'Home',    to: '/' },
  { label: 'Family Tree', to: '/tree' },
  { label: 'Members', to: '/members' },
  { label: 'History', to: '/history' },
  { label: 'Gallery', to: '/gallery' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  const { data: founders = [] } = useFounders();

  const founderPhoto =
    founders[0]?.profile_photo_url ||
    founders[1]?.profile_photo_url ||
    '/uploads/founders.jpg';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className={cn(
      'fixed top-0 inset-x-0 z-40 transition-all duration-300',
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-amber-100'
        : 'bg-transparent',
    )}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo with Founder Photo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-400 shadow-sm bg-stone-900 flex-shrink-0 group-hover:border-amber-500 transition-colors">
            <img
              src={founderPhoto}
              alt="KKKC Founder"
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/uploads/founders.jpg';
              }}
            />
          </div>
          <div className="leading-tight">
            <span className="block font-serif font-bold text-stone-900 text-base leading-none">KKKC</span>
            <span className="block text-xs text-amber-700 font-medium leading-none mt-0.5">Family</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn(
                'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50',
              )}
            >
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => cn(
                'ml-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100',
              )}
            >
              Admin
            </NavLink>
          )}

          {!isAdmin && (
            <Link
              to="/admin/login"
              className="ml-2 px-3.5 py-2 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-stone-100 shadow-lg px-4 py-4 space-y-1">
          {NAV.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn(
                'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                isActive ? 'bg-amber-50 text-amber-800' : 'text-stone-700 hover:bg-stone-50',
              )}
            >
              {label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-stone-100">
            {isAdmin ? (
              <Link to="/admin" className="block px-4 py-3 rounded-xl text-sm font-medium bg-amber-500 text-white">
                Admin Dashboard
              </Link>
            ) : (
              <Link to="/admin/login" className="block px-4 py-3 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50">
                Admin Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


