'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '../../../lib/auth';
import { Button } from '../../../components/ui/Button';
import { Swords, Eye, EyeOff } from 'lucide-react';

type ToastType = 'info' | 'error';

function Toast({ msg, type, onDismiss }: { msg: string; type: ToastType; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl max-w-xs text-center"
      style={{
        background: type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(108,71,255,0.15)',
        border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(108,71,255,0.4)'}`,
        color: type === 'error' ? '#f87171' : '#a78bfa',
      }}
    >
      {msg}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  // Auto-focus email on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      router.push('/feed');
      router.refresh();
    } catch {
      // Generic error — don't reveal which field failed
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setToast({ msg: `${provider} login is not available in demo`, type: 'info' });
  };

  return (
    <div className="space-y-8">
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Swords size={28} className="text-[#6c47ff]" />
          <span className="font-black text-2xl text-white">CARD<span className="text-[#6c47ff]">BATTLES</span></span>
        </div>
        <h1 className="text-2xl font-black text-white">Welcome back</h1>
        <p className="text-[#64748b] mt-1">Log in to your account</p>
      </div>

      {/* Social login buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSocialLogin('Google')}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#1e1e2e] text-sm font-semibold text-[#94a3b8] hover:border-[#374151] hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin('Apple')}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#1e1e2e] text-sm font-semibold text-[#94a3b8] hover:border-[#374151] hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.125 1c.161 1.335-.377 2.646-1.101 3.577-.743.955-1.989 1.671-3.21 1.577-.192-1.27.47-2.593 1.153-3.458C13.725 1.756 15.016 1.09 16.125 1zm3.96 19.979c-.755 1.108-1.543 2.207-2.777 2.22-1.208.012-1.597-.718-2.983-.718-1.385 0-1.816.697-2.963.73-1.182.032-2.082-1.184-2.848-2.285-1.56-2.222-2.755-6.284-1.152-9.024.794-1.357 2.215-2.215 3.754-2.238 1.157-.019 2.253.777 2.963.777.71 0 2.044-.96 3.44-.818.585.024 2.228.237 3.281 1.777-.086.053-1.96 1.14-1.938 3.401.022 2.697 2.37 3.595 2.395 3.606a10.54 10.54 0 0 1-.172.572z"/>
          </svg>
          Apple
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#1e1e2e]" />
        <span className="text-xs text-[#374151] font-semibold">or</span>
        <div className="flex-1 h-px bg-[#1e1e2e]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Email</label>
          <input
            ref={emailRef}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Password</label>
            <Link
              href="/forgot-password"
              className="text-[10px] text-[#6c47ff] hover:underline font-semibold"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3 pr-11 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#374151] hover:text-[#64748b] transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-[#ef4444] text-center">{error}</p>}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Log In
        </Button>
      </form>

      <p className="text-center text-sm text-[#64748b]">
        No account?{' '}
        <Link href="/register" className="text-[#6c47ff] font-semibold hover:underline">
          Sign up free
        </Link>
      </p>

      <div className="bg-[#12121a] rounded-xl border border-[#1e1e2e] p-3 text-xs text-[#64748b] text-center">
        Demo: <span className="text-[#94a3b8]">cardking@demo.com</span> / <span className="text-[#94a3b8]">password123</span>
      </div>

      {/* Social proof strip */}
      <div className="text-center text-[11px] text-[#374151] py-2">
        Join <span className="text-[#64748b] font-semibold">5,200+</span> collectors ·{' '}
        <span className="text-[#64748b] font-semibold">50,847</span> votes cast ·{' '}
        Built this weekend 🚀
      </div>
    </div>
  );
}
