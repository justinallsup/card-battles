'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { leaderboards as lbApi } from '../../../lib/api';
import { Avatar } from '../../../components/ui/Avatar';
import { Trophy } from 'lucide-react';
import { formatNumber } from '../../../lib/utils';

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

export default function LeaderboardsPage() {
  const [type, setType] = useState<LbType>('creators');
  const [period, setPeriod] = useState<LbPeriod>('week');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboards', type, period],
    queryFn: () => lbApi.get(type, period),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-white flex items-center gap-2">
        <Trophy size={20} className="text-[#f59e0b]" /> Leaderboards
      </h1>

      {/* Type tabs */}
      <div className="flex gap-2 bg-[#12121a] p-1 rounded-xl border border-[#1e1e2e]">
        {(['creators', 'voters'] as LbType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize
              ${type === t ? 'bg-[#6c47ff] text-white' : 'text-[#64748b] hover:text-white'}`}
          >
            Top {t}
          </button>
        ))}
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'all'] as LbPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize
              ${period === p
                ? 'bg-[#6c47ff]/15 border-[#6c47ff] text-[#6c47ff]'
                : 'border-[#1e1e2e] text-[#64748b] hover:border-[#374151]'
              }`}
          >
            {p === 'all' ? 'All Time' : `This ${p.charAt(0).toUpperCase() + p.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Rankings */}
      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />
            ))
          : data?.items.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:border-[#374151]"
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
        }
      </div>
    </div>
  );
}
