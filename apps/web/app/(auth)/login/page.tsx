'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '../../../lib/auth';
import { Button } from '../../../components/ui/Button';
import { Swords } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      router.push('/feed');
      router.refresh();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Swords size={28} className="text-[#6c47ff]" />
          <span className="font-black text-2xl text-white">CARD<span className="text-[#6c47ff]">BATTLES</span></span>
        </div>
        <h1 className="text-2xl font-black text-white">Welcome back</h1>
        <p className="text-[#64748b] mt-1">Log in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
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
    </div>
  );
}
