import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TreePine, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import supabase, { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

export default function AdminResetPasswordPage() {
  const { updatePassword, isLocalMode } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Local development simulation
      setIsRecoveryReady(true);
      setCheckingLink(false);
      return;
    }

    // Check if we are in recovery mode from URL hash or existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If session exists or hash contains access_token / type=recovery
      const hash = window.location.hash;
      const isRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token');

      if (session || isRecoveryHash) {
        setIsRecoveryReady(true);
      } else {
        // Wait briefly for supabase auth client to parse hash
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            setIsRecoveryReady(true);
          } else {
            setError('This password reset link is invalid or has expired. Please request a new link.');
          }
          setCheckingLink(false);
        }, 1000);
        return;
      }
      setCheckingLink(false);
    };

    checkSession();

    // Listen for auth state change specifically for PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryReady(true);
        setCheckingLink(false);
        setError('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const { error: resetError } = await updatePassword(password);
    setSubmitting(false);

    if (resetError) {
      setError(resetError.message || 'Failed to update password');
      toast.error(resetError.message || 'Failed to update password');
    } else {
      setSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => {
        navigate('/admin');
      }, 2500);
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
          <p className="text-stone-400 text-sm">Admin Password Reset</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {checkingLink ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-stone-600 text-sm">Verifying reset link...</p>
            </div>
          ) : success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">Password Changed!</h2>
              <p className="text-stone-600 text-xs">
                Your admin password has been updated successfully. Redirecting you to the admin dashboard...
              </p>
              <Button
                type="button"
                className="w-full mt-4"
                onClick={() => navigate('/admin')}
              >
                Go to Admin Dashboard
              </Button>
            </div>
          ) : !isRecoveryReady && error ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="font-serif text-xl font-bold text-stone-900">Invalid or Expired Link</h2>
              <p className="text-stone-600 text-xs leading-relaxed">
                {error}
              </p>
              <Link to="/admin/login">
                <Button type="button" variant="outline" className="w-full mt-4">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-1">
                Set New Password
              </h2>
              <p className="text-stone-500 text-xs mb-6">
                Please choose a strong, secure password for your administrator account.
              </p>

              {isLocalMode && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  Running in Local Mode (simulated update).
                </div>
              )}

              {error && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs leading-relaxed">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
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
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      minLength={6}
                      className="w-full pl-9 pr-10 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-stone-900 placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" loading={submitting} className="w-full py-3 mt-2" size="lg">
                  Update Password
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <Link to="/admin/login" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
              Return to Sign In
            </Link>
          </div>
        </div>

        <p className="text-center mt-6 text-stone-500 text-sm">
          <Link to="/" className="text-amber-400 hover:text-amber-300">Back to Family Website</Link>
        </p>
      </div>
    </div>
  );
}
