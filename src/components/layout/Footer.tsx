import { Link } from 'react-router-dom';
import { TreePine, Heart } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-stone-900 text-stone-300 mt-20">
      {/* Heritage band */}
      <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
                <TreePine className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block font-serif font-bold text-white text-base leading-none">KKC Family</span>
                <span className="block text-xs text-amber-400 leading-none mt-0.5">Our Roots, Our Story</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-stone-400 max-w-xs">
              Preserving the legacy of the KKC family — connecting generations through shared memory, stories, and love.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-serif font-semibold text-white mb-4 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Family Tree', to: '/tree' },
                { label: 'Members', to: '/members' },
                { label: 'Family History', to: '/history' },
                { label: 'Photo Gallery', to: '/gallery' },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-amber-400 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin */}
          <div>
            <h4 className="font-serif font-semibold text-white mb-4 text-sm uppercase tracking-wider">Family Admins</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/admin" className="hover:text-amber-400 transition-colors">Admin Dashboard</Link></li>
              <li><Link to="/admin/members/add" className="hover:text-amber-400 transition-colors">Add Family Member</Link></li>
              <li><Link to="/admin/gallery" className="hover:text-amber-400 transition-colors">Manage Gallery</Link></li>
              <li><Link to="/admin/history" className="hover:text-amber-400 transition-colors">Edit History</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <p>© {year} KKC Family. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-amber-400 fill-current" /> for the KKC Family
          </p>
        </div>
      </div>
    </footer>
  );
}
