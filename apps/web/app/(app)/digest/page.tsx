'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getToken } from '../../../lib/api';
import { BackButton } from '../../../components/ui/BackButton';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { showToast } from '../../../components/ui/Toast';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

type DigestPreview = {
  weekOf: string;
  topBattles: { id: string; title: string; total_votes_cached: number }[];
  newBattles: number;
  totalVotesThisWeek: number;
  yourVotes: number;
  yourRank: number;
  featured: string;
  topCollectors: string[];
};

export default function DigestPage() {
  const [frequency, setFrequency] = useState<'weekly' | 'daily'>('weekly');
  const token = getToken();

  const { data: digest, isLoading } = useQuery<DigestPreview>({
    queryKey: ['digest-preview'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/me/digest/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    },
    retry: false,
  });

  const subscribe = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE_URL}/me/digest/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ frequency }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) showToast(data.message || 'Digest subscribed!', 'success');
      else showToast(data.error || 'Not available', 'error');
    },
    onError: () => showToast('Please log in first', 'error'),
  });

  const sendDemo = useMutation({
    mutationFn: async () => new Promise(resolve => setTimeout(resolve, 600)),
    onSuccess: () => showToast('Digest sent! (Demo mode)', 'success'),
  });

  useEffect(() => {
    document.title = 'Weekly Digest | Card Battles';
    return () => { document.title = 'Card Battles ⚔️'; };
  }, []);

  const weekLabel = digest
    ? new Date(digest.weekOf).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-black text-white">📧 Weekly Digest</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Preview of your personalized email digest</p>
        </div>
      </div>

      {/* Preview label */}
      <div className="flex items-center gap-2 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl px-3 py-2">
        <span className="text-base">👀</span>
        <p className="text-sm text-[#f59e0b] font-semibold">
          <strong>Preview Mode</strong> — This is what your email digest will look like
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      ) : !digest ? (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-white font-bold mb-1">Login required</p>
          <p className="text-sm text-[#64748b] mb-4">Please log in to see your personalized digest preview.</p>
          <Link href="/login" className="px-6 py-2.5 bg-[#6c47ff] text-white font-bold rounded-xl text-sm">
            Log In
          </Link>
        </div>
      ) : (
        <>
          {/* Email card */}
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
            {/* Email header */}
            <div className="bg-gradient-to-r from-[#6c47ff] to-[#a855f7] px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-widest font-semibold">Card Battles Weekly</p>
                  <h2 className="text-lg font-black text-white mt-0.5">This Week in Card Battles</h2>
                </div>
                <span className="text-3xl">⚔️</span>
              </div>
              <p className="text-xs text-white/60 mt-1.5">Week of {weekLabel}</p>
            </div>

            <div className="p-4 space-y-5">
              {/* 🏆 Featured Event */}
              <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl px-3.5 py-3 flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-[10px] text-[#f59e0b] uppercase tracking-wider font-semibold">Featured This Week</p>
                  <p className="text-sm font-bold text-white mt-0.5">{digest.featured}</p>
                </div>
              </div>

              {/* 📊 Community Stats */}
              <div>
                <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-2.5">Community Stats</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#0a0a0f] rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-white">{digest.newBattles}</p>
                    <p className="text-[9px] text-[#64748b] uppercase tracking-wider mt-0.5">New Battles</p>
                  </div>
                  <div className="bg-[#0a0a0f] rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-white">{digest.totalVotesThisWeek.toLocaleString()}</p>
                    <p className="text-[9px] text-[#64748b] uppercase tracking-wider mt-0.5">Total Votes</p>
                  </div>
                  <div className="bg-[#0a0a0f] rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-[#f59e0b]">#{digest.yourRank}</p>
                    <p className="text-[9px] text-[#64748b] uppercase tracking-wider mt-0.5">Your Rank</p>
                  </div>
                </div>
              </div>

              {/* 🗳️ Your Stats */}
              <div className="bg-[#6c47ff]/10 border border-[#6c47ff]/20 rounded-xl px-3.5 py-3">
                <p className="text-[10px] font-black text-[#6c47ff] uppercase tracking-widest mb-2">Your Week</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-black text-white">{digest.yourVotes}</p>
                    <p className="text-xs text-[#64748b]">Votes Cast</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#f59e0b]">#{digest.yourRank}</p>
                    <p className="text-xs text-[#64748b]">Global Rank</p>
                  </div>
                </div>
              </div>

              {/* 🔥 Top Battles */}
              <div>
                <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-2.5">🔥 Top Battles This Week</p>
                <div className="space-y-2">
                  {digest.topBattles.map((battle, i) => (
                    <Link
                      key={battle.id}
                      href={`/battles/${battle.id}`}
                      className="flex items-center gap-2.5 bg-[#0a0a0f] rounded-xl px-3 py-2 hover:bg-[#1e1e2e] transition-colors"
                    >
                      <span className="text-base w-5 flex-shrink-0 text-center">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{battle.title || `Battle #${battle.id.slice(0, 6)}`}</p>
                        <p className="text-[10px] text-[#64748b]">{(battle.total_votes_cached || 0).toLocaleString()} votes</p>
                      </div>
                      <svg className="w-3.5 h-3.5 text-[#374151] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 🌟 Top Collectors */}
              {digest.topCollectors.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-2.5">🌟 Top Collectors</p>
                  <div className="flex gap-2 flex-wrap">
                    {digest.topCollectors.map((username, i) => (
                      <Link
                        key={username}
                        href={`/profile/${username}`}
                        className="flex items-center gap-1.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-full px-3 py-1 hover:border-[#6c47ff]/30 transition-colors"
                      >
                        <span className="text-xs">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                        <span className="text-xs font-bold text-white">@{username}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="bg-gradient-to-r from-[#6c47ff]/20 to-[#a855f7]/20 border border-[#6c47ff]/20 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-bold text-white mb-1">Ready to battle?</p>
                <p className="text-xs text-[#94a3b8] mb-3">Jump back in and climb the leaderboard</p>
                <Link
                  href="/feed"
                  className="inline-block px-5 py-2 bg-[#6c47ff] text-white text-sm font-bold rounded-xl hover:bg-[#5a38e0] transition-colors"
                >
                  Go to Feed →
                </Link>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-[#1e1e2e] text-center">
                <p className="text-[10px] text-[#374151]">cardbattle.app · You&apos;re receiving this because you subscribed to digest updates</p>
              </div>
            </div>
          </div>

          {/* Subscribe controls */}
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4 space-y-4">
            <h3 className="font-black text-white">Subscribe to Digest</h3>

            {/* Frequency toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setFrequency('weekly')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  frequency === 'weekly'
                    ? 'bg-[#6c47ff] border-[#6c47ff] text-white'
                    : 'bg-transparent border-[#1e1e2e] text-[#64748b] hover:border-[#374151]'
                }`}
              >
                📅 Weekly
              </button>
              <button
                onClick={() => setFrequency('daily')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  frequency === 'daily'
                    ? 'bg-[#f59e0b] border-[#f59e0b] text-black'
                    : 'bg-transparent border-[#1e1e2e] text-[#64748b] hover:border-[#374151]'
                }`}
              >
                🔆 Daily
              </button>
            </div>

            {/* Subscribe + Send Demo */}
            <div className="flex gap-2">
              <button
                onClick={() => subscribe.mutate()}
                disabled={subscribe.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#6c47ff] text-white text-sm font-bold hover:bg-[#5a38e0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {subscribe.isPending ? <LoadingSpinner className="w-4 h-4" /> : `Subscribe ${frequency === 'weekly' ? 'Weekly' : 'Daily'}`}
              </button>
              <button
                onClick={() => sendDemo.mutate()}
                disabled={sendDemo.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#12121a] border border-[#1e1e2e] text-white text-sm font-bold hover:border-[#6c47ff]/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendDemo.isPending ? <LoadingSpinner className="w-4 h-4" /> : '📨 Send Demo'}
              </button>
            </div>
            <p className="text-xs text-[#374151] text-center">Demo mode — emails are not actually sent</p>
          </div>
        </>
      )}
    </div>
  );
}
