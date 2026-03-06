'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { leaderboards as lbApi } from '../../../lib/api';
import { Avatar } from '../../../components/ui/Avatar';
import { Trophy } from 'lucide-react';
import { formatNumber } from '../../../lib/utils';
import { useAuth } from '../../../hooks/useAuth';

type LbType = 'creators' | 'voters';
type LbPeriod = 'week' | 'month' | 'all';

const MEDAL = ['🥇', '🥈', '🥉'];

function StreakDots({ streak }: { streak: number }) {
  const dots = Math.min(streak, 5);
  const empty = 5 - dots;
  return (
    <div className="flex gap-0.5 items-center" title={`${streak} win streak`}>
      {Array.from({ length: dots }).map((_, i) => (
        <span key={`filled-${i}`} className="text-[10px]">🟢</span>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`empty-${i}`} className="text-[10px] opacity-20">⚫</span>
      ))}
    </div>
  );
}

// Shimmer placeholder rows
function ShimmerRow({ rank }: { rank: number }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-[#1e1e2e] px-4 py-3"
      style={{ background: '#12121a' }}
    >
      <span className="w-8 text-center text-sm font-bold text-[#374151]">#{rank}</span>
      <div className="w-8 h-8 rounded-full bg-[#1e1e2e] animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-[#1e1e2e] rounded-full w-1/3 animate-pulse" />
        <div className="h-2 bg-[#1e1e2e] rounded-full w-1/5 animate-pulse" />
      </div>
      <div className="h-5 w-10 bg-[#1e1e2e] rounded-full animate-pulse" />
    </div>
  );
}

export default function LeaderboardsPage() {
  const [type, setType] = useState<LbType>('creators');
  const [period, setPeriod] = useState<LbPeriod>('week');
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboards', type, period],
    queryFn: () => lbApi.get(type, period),
  });

  const items = data?.items ?? [];

  // Find user's rank in current data
  const myRank = user ? items.find(e => e.username === user.username) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-white flex items-center gap-2">
        <Trophy size={20} className="text-[#f59e0b]" /> Leaderboards
      </h1>

      {/* Type tabs — with smooth transition */}
      <div className="flex gap-2 bg-[#12121a] p-1 rounded-xl border border-[#1e1e2e] relative">
        {(['creators', 'voters'] as LbType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize relative z-10
              ${type === t ? 'text-white' : 'text-[#64748b] hover:text-white'}`}
            style={type === t ? { background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' } : {}}
          >
            {t === 'creators' ? '⚔️ Top Creators' : '🗳️ Top Voters'}
          </button>
        ))}
      </div>

      {/* Period selector — with smooth transition */}
      <div className="flex gap-2">
        {(['week', 'month', 'all'] as LbPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize"
            style={period === p
              ? { background: 'rgba(108,71,255,0.15)', borderColor: '#6c47ff', color: '#6c47ff' }
              : { borderColor: '#1e1e2e', color: '#64748b' }
            }
          >
            {p === 'all' ? 'All Time' : `This ${p.charAt(0).toUpperCase() + p.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Your rank section (if logged in and in data) */}
      {user && myRank && (
        <div
          className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ background: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.3)' }}
        >
          <span className="text-xs font-bold text-[#6c47ff] uppercase tracking-widest">📍 Your Rank</span>
          <div className="w-px h-5 bg-[#1e1e2e]" />
          <span className="text-lg font-black text-white">#{myRank.rank}</span>
          <div className="flex-1" />
          <span className="text-sm font-black text-[#6c47ff]">{formatNumber(myRank.score)} pts</span>
        </div>
      )}

      {/* Rankings */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ShimmerRow key={i} rank={i + 1} />)
        ) : items.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <ShimmerRow key={i} rank={i + 1} />)}
            <p className="text-center text-xs text-[#374151] pt-2">No data for this period yet</p>
          </div>
        ) : (
          items.map((entry) => (
            <div
              key={entry.userId}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all hover:border-[#374151]"
              style={{
                background: entry.rank <= 3 ? 'rgba(108,71,255,0.05)' : '#12121a',
                border: entry.rank <= 3 ? '1px solid rgba(108,71,255,0.2)' : '1px solid #1e1e2e',
              }}
            >
              {/* Rank */}
              <span className="w-8 text-center text-lg flex-shrink-0">
                {entry.rank <= 3 ? MEDAL[entry.rank - 1] : (
                  <span className="text-sm font-bold text-[#374151]">#{entry.rank}</span>
                )}
              </span>

              {/* Avatar */}
              <Avatar username={entry.username} avatarUrl={entry.avatarUrl} size="sm" />

              {/* Name + streak */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{entry.username}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-[#64748b]">
                    {type === 'creators' ? `${entry.battlesWon} wins` : `${formatNumber(entry.votesCast)} votes`}
                  </p>
                  {(entry.streak ?? 0) > 0 && (
                    <StreakDots streak={entry.streak ?? 0} />
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0 mr-2">
                <p className="text-sm font-black text-[#6c47ff]">{formatNumber(entry.score)}</p>
                <p className="text-xs text-[#374151]">pts</p>
              </div>

              {/* View Profile */}
              <Link
                href={`/profile/${entry.username}`}
                className="text-[10px] text-[#374151] hover:text-[#6c47ff] transition-colors whitespace-nowrap font-medium"
              >
                View →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
