'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isLoggedIn } from '../lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface CommunityStats {
  totalBattles: number;
  totalVotes: number;
  totalMembers: number;
  liveBattles: number;
}

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!target) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

function AnimatedStat({ value, label, prefix = '', suffix = '' }: { value: number; label: string; prefix?: string; suffix?: string }) {
  const { value: displayValue, ref } = useCountUp(value);
  const formatted = displayValue >= 1000
    ? displayValue >= 1_000_000
      ? `${(displayValue / 1_000_000).toFixed(1)}M`
      : `${(displayValue / 1000).toFixed(1)}k`
    : displayValue.toString();

  return (
    <div ref={ref}>
      <div
        className="text-3xl sm:text-4xl font-black mb-1"
        style={{
          backgroundImage: 'linear-gradient(135deg, #6c47ff, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {prefix}{formatted}{suffix}
      </div>
      <div className="text-sm text-[#64748b] font-semibold">{label}</div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<CommunityStats | null>(null);

  useEffect(() => {
    if (isLoggedIn()) router.replace('/feed');
  }, [router]);

  useEffect(() => {
    fetch(`${API_BASE}/community/stats`)
      .then(r => r.json())
      .then((d: CommunityStats) => setStats(d))
      .catch(() => {});
  }, []);

  const displayStats = stats || { totalBattles: 12000, totalVotes: 50847, totalMembers: 5200, liveBattles: 3 };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(108,71,255,0.12)' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <span className="font-black text-lg text-white">CARD<span className="text-[#6c47ff]">BATTLES</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#94a3b8] hover:text-white transition-colors font-medium">
            Log in
          </Link>
          <Link href="/register"
            className="px-4 py-2 bg-[#6c47ff] text-white text-sm font-bold rounded-xl hover:bg-[#5a38e0] transition-all shadow-lg"
            style={{ boxShadow: '0 0 16px rgba(108,71,255,0.35)' }}>
            Sign Up Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(108,71,255,0.25) 0%, transparent 70%), #0a0a0f' }}>

        {/* Floating orbs */}
        <div className="absolute top-32 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6c47ff, transparent)' }} />
        <div className="absolute bottom-32 right-1/4 w-48 h-48 rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
            style={{ background: 'rgba(108,71,255,0.15)', border: '1px solid rgba(108,71,255,0.35)', color: '#a78bfa' }}>
            🔥 Now Live — NFL, NBA &amp; MLB Battles
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-none mb-6 tracking-tight">
            The Ultimate{' '}
            <span className="block sm:inline"
              style={{
                backgroundImage: 'linear-gradient(135deg, #6c47ff 0%, #a78bfa 50%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              Sports Card
            </span>{' '}
            Battle Platform
          </h1>

          <p className="text-lg sm:text-xl text-[#94a3b8] max-w-xl mx-auto mb-10 leading-relaxed">
            Vote on head-to-head card matchups, climb the leaderboards,<br className="hidden sm:block" />
            and prove your card knowledge.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register"
              className="px-8 py-4 font-black text-lg rounded-2xl text-white transition-all hover:scale-105 active:scale-100"
              style={{
                background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
                boxShadow: '0 0 32px rgba(108,71,255,0.5), 0 4px 20px rgba(0,0,0,0.4)',
              }}>
              Start Battling Free →
            </Link>
            <Link href="/feed"
              className="px-8 py-4 font-bold text-lg rounded-2xl border border-[#1e1e2e] text-[#94a3b8] hover:text-white hover:border-[#6c47ff]/40 transition-all"
              style={{ background: '#12121a' }}>
              Watch a Live Battle 👁️
            </Link>
          </div>

          {/* Animated Card Battle Preview */}
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {/* Card Left */}
            <div className="relative group animate-float">
              <div className="w-28 sm:w-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#6c47ff]/40 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1"
                style={{ boxShadow: '0 0 24px rgba(108,71,255,0.3)', aspectRatio: '3/4' }}>
                <img
                  src="https://placehold.co/150x200/1a1030/a78bfa?text=🏈+CARD&font=montserrat"
                  alt="Sports card"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)', boxShadow: '0 0 10px rgba(108,71,255,0.5)' }}>
                52% ▲
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6c47ff] to-[#a78bfa] animate-ping opacity-20" />
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-black text-lg sm:text-xl text-white border-2 border-[#6c47ff]"
                  style={{
                    background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
                    boxShadow: '0 0 20px rgba(108,71,255,0.6)',
                  }}>
                  VS
                </div>
              </div>
              {/* Live indicator */}
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-xs text-[#22c55e] font-semibold">LIVE</span>
              </div>
            </div>

            {/* Card Right */}
            <div className="relative group animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="w-28 sm:w-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#374151]/60 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1"
                style={{ aspectRatio: '3/4' }}>
                <img
                  src="https://placehold.co/150x200/0d1117/64748b?text=🏀+CARD&font=montserrat"
                  alt="Sports card"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-[#64748b] whitespace-nowrap border border-[#374151]"
                style={{ background: '#12121a' }}>
                48%
              </div>
            </div>
          </div>

          <p className="mt-10 text-xs text-[#374151] font-medium uppercase tracking-widest">
            No credit card required · Free forever
          </p>
        </div>
      </section>

      {/* ── Social Proof Stats ── */}
      <section className="py-12 px-6 border-y border-[#1e1e2e]"
        style={{ background: 'linear-gradient(135deg, #0f0721 0%, #0a0a0f 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center mb-6">
            <AnimatedStat value={displayStats.totalBattles} label="Battles Voted On" suffix="+" />
            <AnimatedStat value={displayStats.totalMembers} label="Collectors" suffix="+" />
            <AnimatedStat value={3} label="Sports Covered" />
          </div>

          {/* Live battles indicator */}
          {displayStats.liveBattles > 0 && (
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-sm text-[#22c55e] font-semibold">
                {displayStats.liveBattles} battle{displayStats.liveBattles !== 1 ? 's' : ''} happening right now
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Everything you need to{' '}
              <span style={{ backgroundImage: 'linear-gradient(135deg,#6c47ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                battle
              </span>
            </h2>
            <p className="text-[#64748b] text-lg">Built for serious collectors and casual fans alike.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: '⚔️',
                title: 'Head-to-Head Battles',
                desc: 'Vote on iconic card matchups across NFL, NBA & MLB. Every vote counts toward the ultimate card rankings.',
              },
              {
                icon: '🏆',
                title: 'Leaderboards',
                desc: 'Climb the ranks as a top voter or battle creator. Show off your sports card expertise to the world.',
              },
              {
                icon: '🎴',
                title: 'Pull Arena',
                desc: 'Share your pack pulls and react to others. The community lives here — celebrate the hits together.',
              },
            ].map((feature) => (
              <div key={feature.title}
                className="rounded-2xl p-6 border border-[#1e1e2e] hover:border-[#6c47ff]/40 transition-all hover:-translate-y-1 group"
                style={{ background: '#12121a' }}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{feature.icon}</div>
                <h3 className="text-lg font-black text-white mb-2">{feature.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-6 border-t border-[#1e1e2e]"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(108,71,255,0.08) 0%, transparent 70%), #0a0a0f' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">How it works</h2>
          <p className="text-[#64748b] mb-14 text-lg">Get started in under 60 seconds.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Connector line on desktop */}
            <div className="hidden sm:block absolute top-8 left-1/6 right-1/6 h-0.5 border-t border-dashed border-[#2d2d3f]" />

            {[
              { step: '01', title: 'Create a free account', desc: 'Sign up in seconds. No credit card needed.', icon: '👤' },
              { step: '02', title: 'Vote on card battles', desc: 'Pick your favorites in head-to-head matchups.', icon: '🗳️' },
              { step: '03', title: 'Climb the leaderboard', desc: 'Earn points, rank up, and flex your knowledge.', icon: '📈' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-[#1e1e2e] z-10"
                  style={{ background: '#12121a' }}>
                  {item.icon}
                </div>
                <div className="text-xs font-black text-[#6c47ff] uppercase tracking-widest mb-2">{item.step}</div>
                <h3 className="font-black text-white text-lg mb-2">{item.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/how-it-works"
              className="inline-flex items-center gap-2 text-sm text-[#a78bfa] hover:text-white transition-colors border border-[#6c47ff]/30 rounded-xl px-5 py-2.5 hover:border-[#6c47ff]/60"
              style={{ background: 'rgba(108,71,255,0.06)' }}
            >
              ⚡ See the full scoring formula →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-24 px-6 border-t border-[#1e1e2e]"
        style={{ background: 'linear-gradient(135deg, #0f0721 0%, #12121a 50%, #0a0a0f 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">⚔️</div>
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Ready to{' '}
            <span style={{ backgroundImage: 'linear-gradient(135deg,#6c47ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              battle?
            </span>
          </h2>
          <p className="text-[#94a3b8] text-lg mb-10">Join thousands of collectors already voting every day.</p>
          <Link href="/register"
            className="inline-block px-10 py-5 font-black text-xl rounded-2xl text-white transition-all hover:scale-105 active:scale-100"
            style={{
              background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
              boxShadow: '0 0 40px rgba(108,71,255,0.5), 0 8px 32px rgba(0,0,0,0.5)',
            }}>
            Join Card Battles Free 🚀
          </Link>
          <p className="mt-4 text-xs text-[#374151]">No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⚔️</span>
              <span className="font-black text-white">CARD<span className="text-[#6c47ff]">BATTLES</span></span>
            </div>
            <p className="text-xs text-[#374151]">The ultimate sports card battle platform</p>
          </div>

          <nav className="flex items-center gap-6">
            {[
              { label: 'Feed', href: '/feed' },
              { label: 'Leaderboards', href: '/leaderboards' },
              { label: 'Daily Picks', href: '/daily-picks' },
              { label: 'How It Works', href: '/how-it-works' },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className="text-sm text-[#64748b] hover:text-[#6c47ff] transition-colors font-medium">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-[#1e1e2e] text-center">
          <p className="text-xs text-[#374151]">© 2026 CardBattles. For demo purposes.</p>
        </div>
      </footer>

      {/* ── Keyframe styles ── */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}


export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (isLoggedIn()) router.replace('/feed');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(108,71,255,0.12)' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <span className="font-black text-lg text-white">CARD<span className="text-[#6c47ff]">BATTLES</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#94a3b8] hover:text-white transition-colors font-medium">
            Log in
          </Link>
          <Link href="/register"
            className="px-4 py-2 bg-[#6c47ff] text-white text-sm font-bold rounded-xl hover:bg-[#5a38e0] transition-all shadow-lg"
            style={{ boxShadow: '0 0 16px rgba(108,71,255,0.35)' }}>
            Sign Up Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(108,71,255,0.25) 0%, transparent 70%), #0a0a0f' }}>

        {/* Floating orbs */}
        <div className="absolute top-32 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6c47ff, transparent)' }} />
        <div className="absolute bottom-32 right-1/4 w-48 h-48 rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
            style={{ background: 'rgba(108,71,255,0.15)', border: '1px solid rgba(108,71,255,0.35)', color: '#a78bfa' }}>
            🔥 Now Live — NFL, NBA &amp; MLB Battles
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-none mb-6 tracking-tight">
            The Ultimate{' '}
            <span className="block sm:inline"
              style={{
                backgroundImage: 'linear-gradient(135deg, #6c47ff 0%, #a78bfa 50%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              Sports Card
            </span>{' '}
            Battle Platform
          </h1>

          <p className="text-lg sm:text-xl text-[#94a3b8] max-w-xl mx-auto mb-10 leading-relaxed">
            Vote on head-to-head card matchups, climb the leaderboards,<br className="hidden sm:block" />
            and prove your card knowledge.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register"
              className="px-8 py-4 font-black text-lg rounded-2xl text-white transition-all hover:scale-105 active:scale-100"
              style={{
                background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
                boxShadow: '0 0 32px rgba(108,71,255,0.5), 0 4px 20px rgba(0,0,0,0.4)',
              }}>
              ⚔️ Start Voting Free
            </Link>
            <Link href="/feed"
              className="px-8 py-4 font-bold text-lg rounded-2xl border border-[#1e1e2e] text-[#94a3b8] hover:text-white hover:border-[#6c47ff]/40 transition-all"
              style={{ background: '#12121a' }}>
              Browse Battles →
            </Link>
          </div>

          {/* Animated Card Battle Preview */}
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {/* Card Left */}
            <div className="relative group animate-float">
              <div className="w-28 sm:w-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#6c47ff]/40 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1"
                style={{ boxShadow: '0 0 24px rgba(108,71,255,0.3)', aspectRatio: '3/4' }}>
                <img
                  src="https://placehold.co/150x200/1a1030/a78bfa?text=🏈+CARD&font=montserrat"
                  alt="Sports card"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)', boxShadow: '0 0 10px rgba(108,71,255,0.5)' }}>
                52% ▲
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6c47ff] to-[#a78bfa] animate-ping opacity-20" />
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-black text-lg sm:text-xl text-white border-2 border-[#6c47ff]"
                  style={{
                    background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
                    boxShadow: '0 0 20px rgba(108,71,255,0.6)',
                  }}>
                  VS
                </div>
              </div>
              <span className="text-xs text-[#64748b] font-semibold animate-pulse">LIVE</span>
            </div>

            {/* Card Right */}
            <div className="relative group animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="w-28 sm:w-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#374151]/60 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1"
                style={{ aspectRatio: '3/4' }}>
                <img
                  src="https://placehold.co/150x200/0d1117/64748b?text=🏀+CARD&font=montserrat"
                  alt="Sports card"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-[#64748b] whitespace-nowrap border border-[#374151]"
                style={{ background: '#12121a' }}>
                48%
              </div>
            </div>
          </div>

          <p className="mt-10 text-xs text-[#374151] font-medium uppercase tracking-widest">
            No credit card required · Free forever
          </p>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-12 px-6 border-y border-[#1e1e2e]"
        style={{ background: 'linear-gradient(135deg, #0f0721 0%, #0a0a0f 100%)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { value: '12,000+', label: 'Battles Voted On' },
            { value: '5,000+', label: 'Collectors' },
            { value: '3 Sports', label: 'Covered' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl sm:text-4xl font-black mb-1"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #6c47ff, #a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {stat.value}
              </div>
              <div className="text-sm text-[#64748b] font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Everything you need to{' '}
              <span style={{ backgroundImage: 'linear-gradient(135deg,#6c47ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                battle
              </span>
            </h2>
            <p className="text-[#64748b] text-lg">Built for serious collectors and casual fans alike.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: '⚔️',
                title: 'Head-to-Head Battles',
                desc: 'Vote on iconic card matchups across NFL, NBA & MLB. Every vote counts toward the ultimate card rankings.',
              },
              {
                icon: '🏆',
                title: 'Leaderboards',
                desc: 'Climb the ranks as a top voter or battle creator. Show off your sports card expertise to the world.',
              },
              {
                icon: '🎴',
                title: 'Pull Arena',
                desc: 'Share your pack pulls and react to others. The community lives here — celebrate the hits together.',
              },
            ].map((feature) => (
              <div key={feature.title}
                className="rounded-2xl p-6 border border-[#1e1e2e] hover:border-[#6c47ff]/40 transition-all hover:-translate-y-1 group"
                style={{ background: '#12121a' }}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{feature.icon}</div>
                <h3 className="text-lg font-black text-white mb-2">{feature.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-6 border-t border-[#1e1e2e]"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(108,71,255,0.08) 0%, transparent 70%), #0a0a0f' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">How it works</h2>
          <p className="text-[#64748b] mb-14 text-lg">Get started in under 60 seconds.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Connector line on desktop */}
            <div className="hidden sm:block absolute top-8 left-1/6 right-1/6 h-0.5 border-t border-dashed border-[#2d2d3f]" />

            {[
              { step: '01', title: 'Create a free account', desc: 'Sign up in seconds. No credit card needed.', icon: '👤' },
              { step: '02', title: 'Vote on card battles', desc: 'Pick your favorites in head-to-head matchups.', icon: '🗳️' },
              { step: '03', title: 'Climb the leaderboard', desc: 'Earn points, rank up, and flex your knowledge.', icon: '📈' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-[#1e1e2e] z-10"
                  style={{ background: '#12121a' }}>
                  {item.icon}
                </div>
                <div className="text-xs font-black text-[#6c47ff] uppercase tracking-widest mb-2">{item.step}</div>
                <h3 className="font-black text-white text-lg mb-2">{item.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/how-it-works"
              className="inline-flex items-center gap-2 text-sm text-[#a78bfa] hover:text-white transition-colors border border-[#6c47ff]/30 rounded-xl px-5 py-2.5 hover:border-[#6c47ff]/60"
              style={{ background: 'rgba(108,71,255,0.06)' }}
            >
              ⚡ See the full scoring formula →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-24 px-6 border-t border-[#1e1e2e]"
        style={{ background: 'linear-gradient(135deg, #0f0721 0%, #12121a 50%, #0a0a0f 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">⚔️</div>
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Ready to{' '}
            <span style={{ backgroundImage: 'linear-gradient(135deg,#6c47ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              battle?
            </span>
          </h2>
          <p className="text-[#94a3b8] text-lg mb-10">Join thousands of collectors already voting every day.</p>
          <Link href="/register"
            className="inline-block px-10 py-5 font-black text-xl rounded-2xl text-white transition-all hover:scale-105 active:scale-100"
            style={{
              background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
              boxShadow: '0 0 40px rgba(108,71,255,0.5), 0 8px 32px rgba(0,0,0,0.5)',
            }}>
            Join Card Battles Free 🚀
          </Link>
          <p className="mt-4 text-xs text-[#374151]">No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⚔️</span>
              <span className="font-black text-white">CARD<span className="text-[#6c47ff]">BATTLES</span></span>
            </div>
            <p className="text-xs text-[#374151]">The ultimate sports card battle platform</p>
          </div>

          <nav className="flex items-center gap-6">
            {[
              { label: 'Feed', href: '/feed' },
              { label: 'Leaderboards', href: '/leaderboards' },
              { label: 'Daily Picks', href: '/daily-picks' },
              { label: 'How It Works', href: '/how-it-works' },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className="text-sm text-[#64748b] hover:text-[#6c47ff] transition-colors font-medium">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-[#1e1e2e] text-center">
          <p className="text-xs text-[#374151]">© 2026 CardBattles. For demo purposes.</p>
        </div>
      </footer>

      {/* ── Keyframe styles ── */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
