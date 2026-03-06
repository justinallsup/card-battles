'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboards as lbApi } from '../../../lib/api';
import { Avatar } from '../../../components/ui/Avatar';
import { Trophy } from 'lucide-react';
import { formatNumber } from '../../../lib/utils';

type LbType = 'creators' | 'voters';
type LbPeriod = 'week' | 'month' | 'all';

const MEDAL = ['🥇', '🥈', '🥉'];

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
              <div key={i} className="h-14 bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />
            ))
          : data?.items.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center gap-3 bg-[#12121a] rounded-xl border border-[#1e1e2e] px-4 py-3"
              >
                <span className="w-8 text-center text-lg">
                  {entry.rank <= 3 ? MEDAL[entry.rank - 1] : `#${entry.rank}`}
                </span>
                <Avatar username={entry.username} avatarUrl={entry.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{entry.username}</p>
                  <p className="text-xs text-[#64748b]">
                    {type === 'creators' ? `${entry.battlesWon} wins` : `${formatNumber(entry.votesCast)} votes`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#6c47ff]">{formatNumber(entry.score)}</p>
                  <p className="text-xs text-[#374151]">pts</p>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}
