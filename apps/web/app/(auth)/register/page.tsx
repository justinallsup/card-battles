'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '../../../lib/auth';
import { Button } from '../../../components/ui/Button';
import { Swords } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser(username, email, password);
      router.push('/feed');
      router.refresh();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Registration failed');
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
        <h1 className="text-2xl font-black text-white">Join the arena</h1>
        <p className="text-[#64748b] mt-1">Create your free account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Username</label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={32}
            pattern="[a-zA-Z0-9_]+"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="cardking"
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
          <p className="text-xs text-[#374151] mt-1">Letters, numbers, and underscores only</p>
        </div>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
        </div>

        {error && <p className="text-sm text-[#ef4444] text-center">{error}</p>}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create Account ⚔️
        </Button>
      </form>

      <p className="text-center text-sm text-[#64748b]">
        Already have an account?{' '}
        <Link href="/login" className="text-[#6c47ff] font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
