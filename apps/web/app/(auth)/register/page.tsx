'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '../../../lib/auth';
import { Button } from '../../../components/ui/Button';
import { Swords, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

function getPasswordStrength(p: string): { level: 'weak' | 'fair' | 'strong'; label: string; color: string; width: string } {
  if (!p) return { level: 'weak', label: '', color: '#374151', width: '0%' };
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(p);
  const hasNumber = /\d/.test(p);
  const hasUpper = /[A-Z]/.test(p);
  const score = (p.length >= 8 ? 1 : 0) + (p.length >= 12 ? 1 : 0) + (hasSpecial ? 1 : 0) + (hasNumber ? 1 : 0) + (hasUpper ? 1 : 0);
  if (score <= 2) return { level: 'weak', label: 'Weak', color: '#ef4444', width: '33%' };
  if (score <= 3) return { level: 'fair', label: 'Fair', color: '#f59e0b', width: '66%' };
  return { level: 'strong', label: 'Strong', color: '#22c55e', width: '100%' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Username availability check
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsername = useCallback((name: string) => {
    if (!name || name.length < 3) {
      setUsernameStatus('idle');
      setUsernameError('');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(name)) {
      setUsernameStatus('error');
      setUsernameError('Letters, numbers, underscores only (3-32 chars)');
      return;
    }
    setUsernameStatus('checking');
    fetch(`${BASE_URL}/auth/check-username?username=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(data => {
        if (data.available) {
          setUsernameStatus('available');
          setUsernameError('');
        } else {
          setUsernameStatus('taken');
          setUsernameError(data.error || 'Username is taken');
        }
      })
      .catch(() => {
        setUsernameStatus('idle');
        setUsernameError('');
      });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkUsername(username), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [username, checkUsername]);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword === '' || password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!acceptTerms) { setError('Please accept the terms to continue.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (usernameStatus === 'taken') { setError('That username is already taken.'); return; }
    setLoading(true);
    try {
      await registerUser(username, email, password);
      router.push('/onboarding');
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
        {/* Username */}
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Username</label>
          <div className="relative">
            <input
              type="text"
              required
              minLength={3}
              maxLength={32}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="cardking"
              className={`w-full bg-[#12121a] border rounded-xl px-4 py-3 pr-10 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none transition-colors ${
                usernameStatus === 'available' ? 'border-green-500/50' :
                usernameStatus === 'taken' || usernameStatus === 'error' ? 'border-red-500/50' :
                'border-[#1e1e2e] focus:border-[#6c47ff]'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && <Loader2 size={14} className="text-[#64748b] animate-spin" />}
              {usernameStatus === 'available' && <Check size={14} className="text-green-400" />}
              {(usernameStatus === 'taken' || usernameStatus === 'error') && <X size={14} className="text-red-400" />}
            </div>
          </div>
          {usernameStatus === 'available' && (
            <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1"><Check size={9} /> Username available!</p>
          )}
          {(usernameStatus === 'taken' || usernameStatus === 'error') && usernameError && (
            <p className="text-[10px] text-red-400 mt-1">{usernameError}</p>
          )}
          {usernameStatus === 'idle' && (
            <p className="text-xs text-[#374151] mt-1">Letters, numbers, and underscores only</p>
          )}
        </div>

        {/* Email */}
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

        {/* Password */}
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              minLength={8}
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
          {/* Strength indicator */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="h-1 w-full bg-[#1e1e2e] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: strength.width, background: strength.color }}
                />
              </div>
              <p className="text-[10px] font-semibold" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPass ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-[#12121a] border rounded-xl px-4 py-3 pr-11 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none transition-colors ${
                !passwordsMatch ? 'border-red-500/50' : 'border-[#1e1e2e] focus:border-[#6c47ff]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              aria-label={showConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#374151] hover:text-[#64748b] transition-colors"
            >
              {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {!passwordsMatch && confirmPassword && (
            <p className="text-[10px] text-red-400 mt-1">Passwords do not match</p>
          )}
        </div>

        {/* Referral code (optional) */}
        <div>
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">
            Referral Code <span className="text-[#374151] font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="e.g. CARDKI123"
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors font-mono"
          />
          <p className="text-xs text-[#374151] mt-1">Have a friend&apos;s code? Enter it for a bonus!</p>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                acceptTerms ? 'bg-[#6c47ff] border-[#6c47ff]' : 'border-[#374151] bg-[#12121a]'
              }`}
            >
              {acceptTerms && <Check size={10} className="text-white" />}
            </div>
          </div>
          <span className="text-xs text-[#64748b] leading-relaxed">
            I agree to the{' '}
            <span className="text-[#6c47ff]">Terms of Service</span>
            {' '}and{' '}
            <span className="text-[#6c47ff]">Privacy Policy</span>
          </span>
        </label>

        {error && <p className="text-sm text-[#ef4444] text-center">{error}</p>}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={!acceptTerms || !passwordsMatch || usernameStatus === 'taken' || usernameStatus === 'error'}
        >
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
