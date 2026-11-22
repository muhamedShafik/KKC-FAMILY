import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { TreePine, Eye, EyeOff, Lock, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { signIn, resetPasswordForEmail, isAdmin, loading, isLocalMode } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

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

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setSubmitting(true);
    const { error } = await resetPasswordForEmail(email.trim());
    setSubmitting(false);

    if (error) {
      setError(error.message || 'Failed to send password reset email');
      toast.error('Reset failed: ' + (error.message || 'Please check email'));
    } else {
      setResetSent(true);
      toast.success('Password reset link sent to your email!');
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
          {mode === 'login' ? (
            <>
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

                <div className="space-y-1">
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
                  <div className="text-right pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setResetSent(false);
                        setMode('forgot');
                      }}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <Button type="submit" loading={submitting} className="w-full py-3 mt-2" size="lg">
                  Sign In to Admin
                </Button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setResetSent(false);
                  setMode('login');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 mb-4 transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>

              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-1">
                Reset Password
              </h2>
              <p className="text-stone-500 text-xs mb-6">
                Enter your admin email address. We'll send you a secure link to reset your password.
              </p>

              {isLocalMode && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  Running in Local Mode. Supabase environment variables are not configured yet, so email sending will be simulated.
                </div>
              )}

              {error && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs leading-relaxed">
                  {error}
                </div>
              )}

              {resetSent ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-800">
                      <p className="font-semibold text-emerald-900 mb-1">Reset link sent!</p>
                      <p>
                        We have sent a password reset link to <strong className="font-medium text-emerald-950">{email}</strong>.
                        Please check your inbox (and spam/junk folder) and click the link to reset your password.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setResetSent(false);
                      setMode('login');
                    }}
                    className="w-full py-2.5"
                  >
                    Return to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
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

                  <Button type="submit" loading={submitting} className="w-full py-3" size="lg">
                    Send Reset Link
                  </Button>
                </form>
              )}
            </>
          )}

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

