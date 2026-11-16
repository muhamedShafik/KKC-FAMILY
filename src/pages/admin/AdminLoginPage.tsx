import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { TreePine, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { signIn, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      setError(error.message || 'Invalid email or password');
      toast.error('Sign in failed: ' + (error.message || 'Check credentials'));
    } else {
      toast.success('Welcome back, Admin!');
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <TreePine className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mb-1">KKKC Family</h1>
          <p className="text-stone-400 text-sm">Private Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-1">
            Admin Sign In
          </h2>
          <p className="text-stone-500 text-xs mb-6">
            Authorized administrators only. Please sign in with your email and password.
          </p>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs leading-relaxed">
              <strong>Login failed:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-stone-900 placeholder:text-stone-400"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-9 pr-10 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-stone-900 placeholder:text-stone-400"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" loading={submitting} className="w-full py-3 mt-2" size="lg">
              Sign In to Admin
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-400">
              Accounts are created by family administrators via Supabase console.
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-stone-500 text-sm">
          Not an admin? <a href="/" className="text-amber-400 hover:text-amber-300">Back to Family Website</a>
        </p>
      </div>
    </div>
  );
}

