'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BackButton } from '../../../../components/ui/BackButton';
import { PriceHistoryChart } from '../../../../components/ui/PriceHistoryChart';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

const SPORT_EMOJI: Record<string, string> = {
  nfl: '🏈', nba: '🏀', mlb: '⚾', nhl: '🏒', soccer: '⚽',
};

interface Card {
  id: string;
  image_url: string;
  player_name: string;
  year: number;
  sport: string;
  title: string;
}

interface Battle {
  id: string;
  title: string;
  total_votes_cached: number;
  ends_at: string;
  status: string;
}

interface PlayerProfile {
  playerName: string;
  sport: string;
  cards: Card[];
  battles: Battle[];
  totalCards: number;
  totalBattles: number;
  estimatedValue: number;
  trend: string;
  popularityScore: number;
}

function CardShimmer() {
  return (
    <div className="rounded-xl border border-[#1e1e2e] overflow-hidden animate-pulse" style={{ background: '#12121a' }}>
      <div className="w-full aspect-[3/4] bg-[#1e1e2e]" />
      <div className="p-2">
        <div className="h-3 bg-[#1e1e2e] rounded w-3/4" />
      </div>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-[#22c55e]" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-[#ef4444]" />;
  return <Minus size={14} className="text-[#94a3b8]" />;
}

function trendColor(trend: string) {
  if (trend === 'up') return '#22c55e';
  if (trend === 'down') return '#ef4444';
  return '#94a3b8';
}

export default function PlayerProfilePage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const router = useRouter();
  const decodedName = decodeURIComponent(name);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/players/${encodeURIComponent(decodedName)}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(data => {
        if (data) {
          setProfile(data as PlayerProfile);
          document.title = `${(data as PlayerProfile).playerName} | Card Battles`;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [decodedName]);

  if (loading) {
    return (
      <div className="space-y-4">
        <BackButton href="/players" />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1e1e2e] rounded w-2/3" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-[#1e1e2e] rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <CardShimmer key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="space-y-4">
        <BackButton href="/players" />
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="text-5xl">🔍</div>
          <p className="text-white font-bold text-lg">Player not found</p>
          <p className="text-[#64748b] text-sm">No cards found for "{decodedName}"</p>
          <Link href="/players" className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}>
            Browse Players
          </Link>
        </div>
      </div>
    );
  }

  const sportEmoji = SPORT_EMOJI[profile.sport] || '🃏';
  const valDisplay = profile.estimatedValue >= 1000
    ? `$${(profile.estimatedValue / 1000).toFixed(1)}k`
    : `$${profile.estimatedValue}`;

  return (
    <div className="space-y-4">
      <BackButton href="/players" />

      {/* Player hero */}
      <div
        className="rounded-2xl p-5 border border-[#1e1e2e] space-y-3"
        style={{ background: 'linear-gradient(135deg, #12121a, #1a0a2e)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">{sportEmoji}</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.3)' }}
              >
                {profile.sport?.toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">{profile.playerName}</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Popularity</p>
            <p className="text-2xl font-black text-[#6c47ff]">{profile.popularityScore}</p>
            <p className="text-[10px] text-[#64748b]">/ 100</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className="rounded-xl p-3 text-center border border-[#1e1e2e]"
            style={{ background: '#0a0a0f' }}
          >
            <p className="text-xl font-black text-white">{profile.totalCards}</p>
            <p className="text-[10px] text-[#64748b] uppercase tracking-wide">Cards</p>
          </div>
          <div
            className="rounded-xl p-3 text-center border border-[#1e1e2e]"
            style={{ background: '#0a0a0f' }}
          >
            <p className="text-xl font-black text-white">{profile.totalBattles}</p>
            <p className="text-[10px] text-[#64748b] uppercase tracking-wide">Battles</p>
          </div>
          <div
            className="rounded-xl p-3 text-center border border-[#1e1e2e]"
            style={{ background: '#0a0a0f' }}
          >
            <p className="text-lg font-black" style={{ color: trendColor(profile.trend) }}>{valDisplay}</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <TrendIcon trend={profile.trend} />
              <p className="text-[10px] text-[#64748b] uppercase tracking-wide">PSA 10</p>
            </div>
          </div>
        </div>

        {/* Value estimate */}
        <div
          className="rounded-xl p-3 flex items-center gap-3 border"
          style={{
            background: `rgba(${profile.trend === 'up' ? '34,197,94' : profile.trend === 'down' ? '239,68,68' : '148,163,184'},0.05)`,
            borderColor: `rgba(${profile.trend === 'up' ? '34,197,94' : profile.trend === 'down' ? '239,68,68' : '148,163,184'},0.2)`,
          }}
        >
          <TrendIcon trend={profile.trend} />
          <p className="text-xs text-[#f1f5f9]">
            Estimated PSA 10 value: <span className="font-bold" style={{ color: trendColor(profile.trend) }}>{valDisplay}</span>
            {' '}— trend is <span className="font-bold" style={{ color: trendColor(profile.trend) }}>{profile.trend}</span>
          </p>
        </div>
        <p className="text-[9px] text-[#374151]">* Estimated values only. Not financial advice.</p>
      </div>

      {/* Price History Chart for featured card */}
      {profile.cards.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-[#94a3b8] uppercase tracking-wider">
            📈 30-Day Price History
          </h2>
          <PriceHistoryChart cardId={profile.cards[0].id} />
        </div>
      )}

      {/* Cards grid */}
      <div>
        <h2 className="text-sm font-bold text-[#94a3b8] uppercase tracking-wider mb-3">
          🃏 Cards in System ({profile.totalCards})
        </h2>
        {profile.cards.length === 0 ? (
          <p className="text-center text-[#64748b] text-sm py-8">No cards found</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {profile.cards.map(card => (
              <div
                key={card.id}
                className="rounded-xl border border-[#1e1e2e] overflow-hidden"
                style={{ background: '#12121a' }}
              >
                <img src={card.image_url} alt={card.player_name} className="w-full aspect-[3/4] object-cover" />
                <div className="p-1.5">
                  <p className="text-[10px] font-bold text-white text-center">{card.year}</p>
                  <p className="text-[9px] text-[#64748b] text-center truncate">{card.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Battles list */}
      {profile.battles.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#94a3b8] uppercase tracking-wider mb-3">
            ⚔️ Featured in Battles
          </h2>
          <div className="space-y-2">
            {profile.battles.map(battle => (
              <Link
                key={battle.id}
                href={`/battles/${battle.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-[#1e1e2e] hover:border-[#6c47ff]/40 transition-all"
                style={{ background: '#12121a' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{battle.title}</p>
                  <p className="text-xs text-[#64748b]">{battle.total_votes_cached?.toLocaleString() ?? 0} votes</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={battle.status === 'live'
                      ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                      : { background: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.3)' }
                    }
                  >
                    {battle.status === 'live' ? '🟢 Live' : '⚡ Ended'}
                  </span>
                  <ExternalLink size={12} className="text-[#374151]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div
        className="rounded-xl p-4 text-center border border-[#6c47ff]/30 space-y-2"
        style={{ background: 'rgba(108,71,255,0.05)' }}
      >
        <p className="text-sm font-bold text-white">Vote on a Battle featuring {profile.playerName}</p>
        <Link
          href="/feed"
          className="inline-block px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
        >
          ⚔️ Vote Now
        </Link>
      </div>
    </div>
  );
}
