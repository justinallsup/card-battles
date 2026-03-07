'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TrendingUp, Trophy, Swords } from 'lucide-react';
import { formatNumber } from '../../../lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

const SPORT_COLORS: Record<string, string> = {
  nfl: '#ef4444',
  nba: '#f59e0b',
  mlb: '#3b82f6',
  default: '#6c47ff',
};

const SPORT_EMOJIS: Record<string, string> = {
  nfl: '🏈',
  nba: '🏀',
  mlb: '⚾',
  default: '🃏',
};

interface TrendingPlayer {
  player_name: string;
  sport: string;
  image_url: string;
  battle_count: number;
  total_votes: number;
}

function PlayerRow({ player, rank }: { player: TrendingPlayer; rank: number }) {
  const color = SPORT_COLORS[player.sport?.toLowerCase()] ?? SPORT_COLORS.default;
  const emoji = SPORT_EMOJIS[player.sport?.toLowerCase()] ?? SPORT_EMOJIS.default;
  const sport = player.sport?.toUpperCase() ?? 'SPORT';

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl border border-[#1e1e2e] hover:border-[#6c47ff]/30 transition-all group"
      style={{ background: '#12121a' }}
    >
      {/* Rank */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
        style={{
          background: rank <= 3 ? `${color}22` : '#0a0a0f',
          color: rank <= 3 ? color : '#64748b',
          border: rank <= 3 ? `1px solid ${color}44` : '1px solid #1e1e2e',
        }}
      >
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
      </div>

      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border"
        style={{ borderColor: `${color}44` }}
      >
        {player.image_url ? (
          <img src={player.image_url} alt={player.player_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: `linear-gradient(135deg, ${color}88, ${color}44)` }}>
            {player.player_name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white truncate">{player.player_name}</p>
          <span
            className="px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0"
            style={{ background: `${color}22`, color }}
          >
            {emoji} {sport}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-[#64748b]">🗳️ {formatNumber(Number(player.total_votes ?? 0))} votes</span>
          <span className="text-[10px] text-[#64748b]">⚔️ {player.battle_count} battles</span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/search?q=${encodeURIComponent(player.player_name)}`}
        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all group-hover:opacity-100 opacity-70"
        style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.2)' }}
      >
        <span className="flex items-center gap-1">
          <Swords size={10} />
          Vote
        </span>
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-[#1e1e2e] animate-pulse" style={{ background: '#12121a' }}>
          <div className="w-7 h-7 rounded-full bg-[#1e1e2e]" />
          <div className="w-10 h-10 rounded-xl bg-[#1e1e2e]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#1e1e2e] rounded w-3/4" />
            <div className="h-2.5 bg-[#1e1e2e] rounded w-1/2" />
          </div>
          <div className="w-14 h-7 bg-[#1e1e2e] rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function TrendingPlayersPage() {
  const { data, isLoading, isError } = useQuery<{ players: TrendingPlayer[]; period: string }>({
    queryKey: ['trending-players'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/trending/players`);
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    },
    staleTime: 120_000,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden px-5 py-5 text-center"
        style={{
          background: 'linear-gradient(135deg, #0f0721 0%, #12121a 60%)',
          border: '1px solid rgba(108,71,255,0.2)',
        }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <TrendingUp size={18} className="text-[#6c47ff]" />
          <h1 className="text-xl font-black text-white">Trending Players</h1>
        </div>
        <p className="text-sm text-[#64748b]">Top players by vote activity this week</p>
        {data?.period && (
          <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(108,71,255,0.12)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.2)' }}>
            📅 Last {data.period}
          </span>
        )}
      </div>

      {/* Stats bar */}
      {data && data.players.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Players', value: data.players.length, icon: '👤' },
            { label: 'Total Votes', value: formatNumber(data.players.reduce((s, p) => s + Number(p.total_votes ?? 0), 0)), icon: '🗳️' },
            { label: 'Battles', value: data.players.reduce((s, p) => s + Number(p.battle_count ?? 0), 0), icon: '⚔️' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-[#1e1e2e] p-3 text-center" style={{ background: '#12121a' }}>
              <p className="text-base">{stat.icon}</p>
              <p className="text-sm font-black text-white">{stat.value}</p>
              <p className="text-[10px] text-[#64748b]">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Trophy size={32} className="text-[#374151]" />
          <p className="text-[#ef4444] font-semibold text-sm">Failed to load trending players</p>
          <p className="text-[#64748b] text-xs">Make sure the API is running</p>
        </div>
      ) : data?.players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <TrendingUp size={32} className="text-[#374151]" />
          <p className="text-white font-bold">No trending players yet</p>
          <p className="text-[#64748b] text-sm">Vote in battles to see players trend!</p>
          <Link href="/feed"
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}>
            Browse Battles
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.players.map((player, i) => (
            <PlayerRow key={`${player.player_name}-${i}`} player={player} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Footer CTA */}
      {data && data.players.length > 0 && (
        <div className="flex gap-2 pt-2">
          <Link href="/feed" className="flex-1 py-3 text-center text-sm font-bold text-white rounded-xl transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', boxShadow: '0 0 16px rgba(108,71,255,0.25)' }}>
            ⚔️ Vote in Battles
          </Link>
          <Link href="/leaderboards" className="flex-1 py-3 text-center text-sm font-bold text-[#94a3b8] rounded-xl border border-[#1e1e2e] hover:border-[#6c47ff]/30 transition-all"
            style={{ background: '#12121a' }}>
            🏆 Leaderboard
          </Link>
        </div>
      )}
    </div>
  );
}
