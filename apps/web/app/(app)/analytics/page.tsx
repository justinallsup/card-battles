'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { BackButton } from '../../../components/ui/BackButton';
import { getToken } from '../../../lib/api';

type AnalyticsData = {
  summary: {
    totalVotes: number;
    battlesWon: number;
    battlesCreated: number;
    currentStreak: number;
    bestStreak: number;
    winRate: number;
  };
  votesTimeline: { day: string; votes: number }[];
  sportBreakdown: { sport: string; winRate: number; battles: number }[];
  topCategory: string;
  peakVotingHour: number;
};

function formatHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}${ampm}`;
}

function SimpleBarChart({ data }: { data: { day: string; votes: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.votes), 1);
  const chartH = 80;
  const barW = 280 / data.length;

  return (
    <svg width="100%" viewBox="0 0 280 100" style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(frac => (
        <line
          key={frac}
          x1={0} y1={chartH * (1 - frac)}
          x2={280} y2={chartH * (1 - frac)}
          stroke="#1e1e2e" strokeWidth={0.5} strokeDasharray="3,3"
        />
      ))}
      {data.map((d, i) => {
        const barH = (d.votes / max) * chartH;
        const x = i * barW + barW * 0.15;
        const bw = barW * 0.7;
        return (
          <g key={i}>
            <rect
              x={x} y={chartH - barH}
              width={bw} height={barH}
              rx={3} fill="#6c47ff" opacity={0.85}
            />
            <text
              x={x + bw / 2} y={chartH + 12}
              textAnchor="middle" fill="#64748b"
              fontSize={8} fontFamily="system-ui"
            >
              {d.day}
            </text>
            <text
              x={x + bw / 2} y={chartH - barH - 3}
              textAnchor="middle" fill="#a78bfa"
              fontSize={7} fontFamily="system-ui"
            >
              {d.votes}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    fetch('/api/v1/me/analytics', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-xl font-black text-white mb-2">Sign in to see analytics</h2>
        <p className="text-[#64748b] text-sm mb-6">Track your votes, win rates, and streaks</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 rounded-xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: '#1e1e2e' }} />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#1e1e2e' }} />
          ))}
        </div>
        <div className="h-40 rounded-2xl animate-pulse" style={{ background: '#1e1e2e' }} />
      </div>
    );
  }

  const summary = data?.summary || { totalVotes: 0, battlesWon: 0, battlesCreated: 0, currentStreak: 0, bestStreak: 0, winRate: 0 };

  return (
    <div className="pb-4">
      <BackButton />
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white">📊 My Analytics</h1>
        <p className="text-[#64748b] text-sm mt-0.5">Your Card Battles stats</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Total Votes', value: summary.totalVotes.toLocaleString(), icon: '🗳️', color: '#6c47ff' },
          { label: 'Battles Won', value: summary.battlesWon.toLocaleString(), icon: '🏆', color: '#f59e0b' },
          { label: 'Win Rate', value: `${summary.winRate}%`, icon: '🎯', color: '#22c55e' },
          { label: 'Current Streak', value: `${summary.currentStreak} 🔥`, icon: '⚡', color: '#ef4444' },
        ].map(stat => (
          <div
            key={stat.label}
            className="p-4 rounded-2xl"
            style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{stat.icon}</span>
              <p className="text-[#64748b] text-xs font-semibold">{stat.label}</p>
            </div>
            <p className="text-white font-black text-2xl" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Votes this week */}
      <div
        className="p-4 rounded-2xl mb-4"
        style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
      >
        <h2 className="text-white font-black text-base mb-3">📈 Votes This Week</h2>
        {data?.votesTimeline ? (
          <SimpleBarChart data={data.votesTimeline} />
        ) : (
          <div className="h-20 flex items-center justify-center text-[#64748b] text-sm">
            No data yet
          </div>
        )}
      </div>

      {/* Win rate by sport */}
      <div
        className="p-4 rounded-2xl mb-4"
        style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
      >
        <h2 className="text-white font-black text-base mb-3">🏅 Win Rate by Sport</h2>
        <div className="space-y-3">
          {(data?.sportBreakdown || []).map(({ sport, winRate, battles }) => (
            <div key={sport}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[#94a3b8] text-sm font-semibold">{sport}</span>
                <span className="text-[#64748b] text-xs">{winRate}% · {battles} battles</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1e1e2e' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${winRate}%`,
                    background: winRate >= 60
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : winRate >= 45
                      ? 'linear-gradient(90deg, #6c47ff, #a78bfa)'
                      : 'linear-gradient(90deg, #ef4444, #f87171)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Peak activity */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
        >
          <p className="text-[#64748b] text-xs font-semibold mb-2">⏰ Peak Activity</p>
          <p className="text-white font-black text-base">
            {data ? formatHour(data.peakVotingHour) : '—'}
          </p>
          <p className="text-[#64748b] text-[10px] mt-1">You vote most at this time</p>
        </div>

        {/* Best category */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
        >
          <p className="text-[#64748b] text-xs font-semibold mb-2">🎯 Best Category</p>
          <p className="text-white font-black text-base capitalize">
            {data?.topCategory || '—'}
          </p>
          <p className="text-[#64748b] text-[10px] mt-1">You win most on investment votes</p>
        </div>
      </div>

      {/* Streak history */}
      <div
        className="p-4 rounded-2xl mb-4"
        style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
      >
        <h2 className="text-white font-black text-base mb-3">🔥 Streak History</h2>
        <div className="flex gap-4">
          <div className="flex-1 text-center p-3 rounded-xl" style={{ background: '#0a0a0f' }}>
            <p className="text-4xl">🔥</p>
            <p className="text-white font-black text-2xl mt-1">{summary.currentStreak}</p>
            <p className="text-[#64748b] text-xs mt-0.5">Current Streak</p>
          </div>
          <div className="flex-1 text-center p-3 rounded-xl" style={{ background: '#0a0a0f' }}>
            <p className="text-4xl">🏆</p>
            <p className="text-white font-black text-2xl mt-1">{summary.bestStreak}</p>
            <p className="text-[#64748b] text-xs mt-0.5">Best Streak</p>
          </div>
          <div className="flex-1 text-center p-3 rounded-xl" style={{ background: '#0a0a0f' }}>
            <p className="text-4xl">⚔️</p>
            <p className="text-white font-black text-2xl mt-1">{summary.battlesCreated}</p>
            <p className="text-[#64748b] text-xs mt-0.5">Created</p>
          </div>
        </div>
      </div>

      {/* Pro upsell */}
      <div
        className="p-4 rounded-2xl text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(108,71,255,0.1), rgba(167,139,250,0.08))',
          border: '1px solid rgba(108,71,255,0.25)',
        }}
      >
        <div className="text-3xl mb-2">⭐</div>
        <p className="text-white font-black text-base mb-1">Unlock Advanced Analytics</p>
        <p className="text-[#94a3b8] text-sm mb-3">
          Monthly reports, opponent analysis, prediction accuracy &amp; more
        </p>
        <a
          href="/pro"
          className="inline-block px-6 py-2.5 rounded-xl font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}
        >
          Upgrade to Pro →
        </a>
      </div>
    </div>
  );
}
