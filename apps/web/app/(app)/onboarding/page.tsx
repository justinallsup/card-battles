'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { battles as battlesApi, getToken } from '../../../lib/api';
import type { Battle } from '@card-battles/types';

const SPORTS = [
  { id: 'nfl', label: 'NFL', emoji: '🏈' },
  { id: 'nba', label: 'NBA', emoji: '🏀' },
  { id: 'mlb', label: 'MLB', emoji: '⚾' },
];

const WELCOME_CARDS = [
  { icon: '⚔️', title: 'Battle Feed', desc: 'Vote on daily head-to-head matchups', href: '/feed' },
  { icon: '➕', title: 'Create Battle', desc: 'Start your own card matchup', href: '/create' },
  { icon: '🏆', title: 'Leaderboards', desc: 'See where you rank', href: '/leaderboards' },
  { icon: '🗓️', title: 'Daily Picks', desc: 'Curator\'s top picks each day', href: '/daily-picks' },
];

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
            style={
              i < step
                ? { background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)', color: 'white', boxShadow: '0 0 12px rgba(108,71,255,0.4)' }
                : i === step
                ? { background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)', color: 'white', boxShadow: '0 0 12px rgba(108,71,255,0.4)', outline: '3px solid rgba(108,71,255,0.3)', outlineOffset: '2px' }
                : { background: '#1e1e2e', color: '#374151' }
            }
          >
            {i < step ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className="w-8 h-0.5 transition-all duration-500"
              style={{ background: i < step ? '#6c47ff' : '#1e1e2e' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// Step 1: Pick sports
function StepSports({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const handleNext = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cb_sports_prefs', JSON.stringify(selected.length > 0 ? selected : ['nfl', 'nba', 'mlb']));
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white mb-2">Pick your sports</h2>
        <p className="text-[#64748b]">We'll tailor your feed to what you care about.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {SPORTS.map((sport) => {
          const active = selected.includes(sport.id);
          return (
            <button
              key={sport.id}
              onClick={() => toggle(sport.id)}
              className="flex flex-col items-center gap-3 py-6 px-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105 active:scale-100 font-bold"
              style={active
                ? { background: 'rgba(108,71,255,0.15)', border: '2px solid #6c47ff', color: 'white', boxShadow: '0 0 20px rgba(108,71,255,0.25)' }
                : { background: '#12121a', border: '2px solid #1e1e2e', color: '#64748b' }}
            >
              <span className="text-4xl">{sport.emoji}</span>
              <span className="text-sm font-black">{sport.label}</span>
              {active && <span className="text-xs text-[#a78bfa]">✓ Selected</span>}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNext}
        className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all hover:opacity-90 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)', boxShadow: '0 0 24px rgba(108,71,255,0.35)' }}
      >
        Continue →
      </button>

      <p className="text-center text-xs text-[#374151]">
        Select any or skip to get all sports
      </p>
    </div>
  );
}

// Step 2: Vote on first battle
function StepVote({ onNext }: { onNext: () => void }) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<'left' | 'right' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    battlesApi.feed({ cursor: undefined }).then((res) => {
      if (res.items.length > 0) setBattle(res.items[0]);
    }).catch(() => {
      setError('Could not load a battle right now.');
    }).finally(() => setLoading(false));
  }, []);

  const handleVote = async (choice: 'left' | 'right') => {
    if (!battle || voted) return;
    setVoted(choice);
    try {
      // Use first category for the onboarding vote
      const category = battle.categories[0] ?? 'overall';
      await battlesApi.vote(battle.id, category, choice);
    } catch {
      // Vote may fail without auth — that's OK, proceed anyway
    }
  };

  const pctLeft = battle?.result?.overall
    ? Math.round(
        Object.values(battle.result.byCategory).reduce((s, c) => s + c.leftPercent, 0) /
        Math.max(Object.keys(battle.result.byCategory).length, 1)
      )
    : 50;
  const pctRight = 100 - pctLeft;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white mb-2">Vote on your first battle</h2>
        <p className="text-[#64748b]">Pick the card you think wins. It's that simple.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="text-4xl animate-pulse">⚔️</div>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 text-center text-[#64748b] border border-[#1e1e2e]"
          style={{ background: '#12121a' }}>
          <p>{error}</p>
          <button onClick={onNext} className="mt-3 text-[#6c47ff] text-sm font-bold hover:underline">
            Skip this step →
          </button>
        </div>
      )}

      {battle && !loading && (
        <div className="rounded-2xl p-5 border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest text-center mb-4">{battle.title}</p>
          <div className="flex items-center gap-4">
            {/* Left card */}
            <button
              onClick={() => handleVote('left')}
              disabled={!!voted}
              className="flex-1 group transition-all duration-200 disabled:cursor-default"
              style={voted === 'left' ? { transform: 'scale(1.02)' } : voted ? { opacity: 0.6 } : {}}
            >
              <div className="rounded-xl overflow-hidden border-2 transition-all"
                style={{
                  aspectRatio: '3/4',
                  borderColor: voted === 'left' ? '#6c47ff' : '#252535',
                  boxShadow: voted === 'left' ? '0 0 20px rgba(108,71,255,0.4)' : undefined,
                }}>
                <img src={battle.left.imageUrl || 'https://placehold.co/150x200/1a1030/a78bfa?text=Card'}
                  alt={battle.left.title}
                  className="w-full h-full object-cover" />
              </div>
              <p className="mt-2 text-xs text-[#94a3b8] text-center line-clamp-2">{battle.left.playerName ?? battle.left.title}</p>
              {voted && (
                <div className="mt-1 text-center text-xs font-black"
                  style={{ color: voted === 'left' ? '#6c47ff' : '#374151' }}>
                  {pctLeft}%
                </div>
              )}
            </button>

            {/* VS */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-white border border-[#6c47ff]"
                style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)', boxShadow: '0 0 10px rgba(108,71,255,0.4)' }}>
                VS
              </div>
            </div>

            {/* Right card */}
            <button
              onClick={() => handleVote('right')}
              disabled={!!voted}
              className="flex-1 group transition-all duration-200 disabled:cursor-default"
              style={voted === 'right' ? { transform: 'scale(1.02)' } : voted ? { opacity: 0.6 } : {}}
            >
              <div className="rounded-xl overflow-hidden border-2 transition-all"
                style={{
                  aspectRatio: '3/4',
                  borderColor: voted === 'right' ? '#6c47ff' : '#252535',
                  boxShadow: voted === 'right' ? '0 0 20px rgba(108,71,255,0.4)' : undefined,
                }}>
                <img src={battle.right.imageUrl || 'https://placehold.co/150x200/0d1117/64748b?text=Card'}
                  alt={battle.right.title}
                  className="w-full h-full object-cover" />
              </div>
              <p className="mt-2 text-xs text-[#94a3b8] text-center line-clamp-2">{battle.right.playerName ?? battle.right.title}</p>
              {voted && (
                <div className="mt-1 text-center text-xs font-black"
                  style={{ color: voted === 'right' ? '#6c47ff' : '#374151' }}>
                  {pctRight}%
                </div>
              )}
            </button>
          </div>

          {voted && (
            <div className="mt-4 text-center">
              <p className="text-[#a78bfa] font-bold text-sm">Vote cast! ✓</p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!voted && !error && !loading && !!battle}
        className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: voted || error ? 'linear-gradient(135deg,#6c47ff,#8b5cf6)' : '#1e1e2e', boxShadow: voted || error ? '0 0 24px rgba(108,71,255,0.35)' : 'none' }}
      >
        {voted ? 'Next Step →' : error ? 'Skip →' : 'Vote to continue'}
      </button>

      {(!voted && !error && !loading) && (
        <button onClick={onNext} className="w-full text-center text-xs text-[#374151] hover:text-[#64748b] transition-colors">
          Skip for now
        </button>
      )}
    </div>
  );
}

// Step 3: Welcome
function StepWelcome() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-black text-white mb-2">You're all set!</h2>
        <p className="text-[#64748b] text-lg">Here's what you can do on CardBattles:</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {WELCOME_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex flex-col gap-2 p-4 rounded-2xl border border-[#1e1e2e] hover:border-[#6c47ff]/40 hover:-translate-y-1 transition-all group"
            style={{ background: '#12121a' }}
          >
            <span className="text-3xl group-hover:scale-110 transition-transform inline-block">{card.icon}</span>
            <span className="font-black text-white text-sm">{card.title}</span>
            <span className="text-xs text-[#64748b] leading-tight">{card.desc}</span>
          </Link>
        ))}
      </div>

      <button
        onClick={() => router.replace('/feed')}
        className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all hover:opacity-90 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)', boxShadow: '0 0 24px rgba(108,71,255,0.35)' }}
      >
        Go to Feed ⚔️
      </button>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (typeof window !== 'undefined' && !getToken()) {
      router.replace('/register');
    }
  }, [router]);

  const TOTAL_STEPS = 3;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(108,71,255,0.12) 0%, transparent 70%), #0a0a0f' }}>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <span className="text-2xl">⚔️</span>
          <span className="font-black text-xl text-white">CARD<span className="text-[#6c47ff]">BATTLES</span></span>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 border border-[#1e1e2e]" style={{ background: '#12121a' }}>
          <div className="flex justify-center">
            <StepIndicator step={step} total={TOTAL_STEPS} />
          </div>

          <div className="transition-all duration-300">
            {step === 0 && <StepSports onNext={() => setStep(1)} />}
            {step === 1 && <StepVote onNext={() => setStep(2)} />}
            {step === 2 && <StepWelcome />}
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-[#374151]">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
      </div>
    </div>
  );
}
