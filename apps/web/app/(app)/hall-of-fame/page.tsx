'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BackButton } from '../../../components/ui/BackButton';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

const SPORT_EMOJI: Record<string, string> = {
  nfl: '🏈', nba: '🏀', mlb: '⚾', nhl: '🏒', soccer: '⚽',
};

interface Inductee {
  rank: number;
  cardId: string;
  playerName: string;
  imageUrl: string;
  title: string;
  year: number;
  sport: string;
  totalVotes: number;
  wins: number;
  inducted: string;
}

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS = [
  { border: 'rgba(245,158,11,0.5)', bg: 'rgba(245,158,11,0.08)', text: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  { border: 'rgba(148,163,184,0.5)', bg: 'rgba(148,163,184,0.06)', text: '#94a3b8', glow: 'rgba(148,163,184,0.3)' },
  { border: 'rgba(180,120,60,0.5)', bg: 'rgba(180,120,60,0.06)', text: '#b47c3c', glow: 'rgba(180,120,60,0.3)' },
];

function TrophyAnimation() {
  return (
    <div className="relative inline-block">
      <span
        className="text-4xl"
        style={{
          display: 'inline-block',
          animation: 'trophyPulse 2s ease-in-out infinite',
        }}
      >
        🏆
      </span>
      <style>{`
        @keyframes trophyPulse {
          0%, 100% { transform: scale(1) rotate(-5deg); filter: drop-shadow(0 0 8px rgba(245,158,11,0.6)); }
          50% { transform: scale(1.15) rotate(5deg); filter: drop-shadow(0 0 16px rgba(245,158,11,0.9)); }
        }
      `}</style>
    </div>
  );
}

function PodiumCard({ inductee, rank }: { inductee: Inductee; rank: number }) {
  const colors = PODIUM_COLORS[rank - 1];
  const isFirst = rank === 1;

  return (
    <div
      className="rounded-2xl p-3 flex flex-col items-center text-center border transition-all hover:scale-105"
      style={{
        background: colors.bg,
        borderColor: colors.border,
        boxShadow: isFirst ? `0 0 24px ${colors.glow}` : undefined,
      }}
    >
      {isFirst ? (
        <TrophyAnimation />
      ) : (
        <span className="text-3xl">{MEDAL[rank - 1]}</span>
      )}
      <div className="mt-2 w-full aspect-[3/4] max-h-28 overflow-hidden rounded-xl border border-[#1e1e2e]">
        <img
          src={inductee.imageUrl}
          alt={inductee.playerName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `https://placehold.co/200x266/12121a/6c47ff?text=${encodeURIComponent(inductee.playerName.split(' ')[1] || inductee.playerName)}`;
          }}
        />
      </div>
      <p className="text-xs font-black text-white mt-2 leading-tight">{inductee.playerName}</p>
      <p className="text-[9px] text-[#64748b]">{inductee.year}</p>
      <p className="text-[10px] font-bold mt-1" style={{ color: colors.text }}>
        {inductee.totalVotes.toLocaleString()} votes
      </p>
      <span className="text-[9px] text-[#64748b] mt-0.5">
        {SPORT_EMOJI[inductee.sport] || '🃏'} {inductee.sport?.toUpperCase()}
      </span>
    </div>
  );
}

function InducteeRow({ inductee }: { inductee: Inductee }) {
  return (
    <Link
      href={`/players/${encodeURIComponent(inductee.playerName)}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-[#1e1e2e] hover:border-[#6c47ff]/40 transition-all group"
      style={{ background: '#12121a' }}
    >
      {/* Rank badge */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ background: 'rgba(108,71,255,0.1)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.3)' }}
      >
        #{inductee.rank}
      </div>

      {/* Card thumbnail */}
      <div className="w-10 h-14 rounded-lg overflow-hidden border border-[#1e1e2e] flex-shrink-0">
        <img
          src={inductee.imageUrl}
          alt={inductee.playerName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `https://placehold.co/80x112/12121a/6c47ff?text=${encodeURIComponent(inductee.playerName.split(' ')[0])}`;
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white group-hover:text-[#a78bfa] transition-colors truncate">
            {inductee.playerName}
          </p>
          <span className="text-xs">{SPORT_EMOJI[inductee.sport] || '🃏'}</span>
        </div>
        <p className="text-[10px] text-[#64748b] truncate">{inductee.title}</p>
        <p className="text-[10px] text-[#475569]">Inducted {inductee.inducted}</p>
      </div>

      {/* Stats */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-white">{inductee.totalVotes.toLocaleString()}</p>
        <p className="text-[9px] text-[#64748b]">votes</p>
        <p className="text-[10px] font-bold text-[#22c55e]">{inductee.wins.toLocaleString()} wins</p>
      </div>
    </Link>
  );
}

export default function HallOfFamePage() {
  const [inductees, setInductees] = useState<Inductee[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => { document.title = 'Hall of Fame | Card Battles'; }, []);

  useEffect(() => {
    fetch(`${BASE}/hall-of-fame`)
      .then(r => r.json())
      .then(data => {
        setInductees(data.inductees || []);
        setLastUpdated(data.lastUpdated || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const top3 = inductees.slice(0, 3);
  const rest = inductees.slice(3);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-[#1e1e2e] rounded w-2/3 mx-auto" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-[#1e1e2e] rounded-2xl" />
          ))}
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-16 bg-[#1e1e2e] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <BackButton href="/feed" />

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-white">🏛️ Hall of Fame</h1>
        <p className="text-[#64748b] text-sm font-semibold">The Greatest Cards Ever Voted On</p>
        {lastUpdated && (
          <p className="text-[10px] text-[#374151]">
            Updated {new Date(lastUpdated).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Podium — top 3 */}
      {top3.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider text-center mb-3">
            ✨ Hall of Fame Inductees
          </p>
          {/* Podium display: 2nd | 1st | 3rd */}
          <div className="grid grid-cols-3 gap-2 items-end">
            {/* 2nd place */}
            {top3[1] && (
              <div className="mt-4">
                <PodiumCard inductee={top3[1]} rank={2} />
              </div>
            )}
            {/* 1st place - elevated */}
            {top3[0] && (
              <div className="-mt-2">
                <PodiumCard inductee={top3[0]} rank={1} />
              </div>
            )}
            {/* 3rd place */}
            {top3[2] && (
              <div className="mt-8">
                <PodiumCard inductee={top3[2]} rank={3} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ranked list #4-#10 */}
      {rest.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-3">
            🎖️ Honorable Mentions
          </p>
          <div className="space-y-2">
            {rest.map(inductee => (
              <InducteeRow key={inductee.cardId} inductee={inductee} />
            ))}
          </div>
        </div>
      )}

      {inductees.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">🏛️</div>
          <p className="text-white font-bold">The Hall awaits its first inductees</p>
          <p className="text-[#64748b] text-sm">Start voting on battles to fill the Hall of Fame!</p>
          <Link
            href="/feed"
            className="inline-block px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
          >
            ⚔️ Vote Now
          </Link>
        </div>
      )}

      {/* CTA */}
      {inductees.length > 0 && (
        <div
          className="rounded-xl p-4 text-center border border-[#6c47ff]/30 space-y-2"
          style={{ background: 'rgba(108,71,255,0.05)' }}
        >
          <p className="text-sm font-bold text-white">🗳️ Voting starts battles</p>
          <p className="text-xs text-[#64748b]">Contribute to the next induction by casting your votes!</p>
          <Link
            href="/feed"
            className="inline-block px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
          >
            ⚔️ Vote Now
          </Link>
        </div>
      )}
    </div>
  );
}
