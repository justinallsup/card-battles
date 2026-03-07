'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PriceHistoryChart } from '../../../components/ui/PriceHistoryChart';
import { formatNumber } from '../../../lib/utils';
import { Share2, Copy, Check } from 'lucide-react';
import { BackButton } from '../../../components/ui/BackButton';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface SpotlightCard {
  id: string;
  player_name: string;
  image_url: string;
  title: string;
  year: number;
  sport: string;
}

interface SpotlightData {
  card: SpotlightCard;
  estimatedValue: number;
  voteCount: number;
  featuredDate: string;
  reason: string;
}

interface RelatedBattle {
  id: string;
  title: string;
  total_votes_cached: number;
  status: string;
}

export default function SpotlightPage() {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const { data, isLoading, isError } = useQuery<SpotlightData>({
    queryKey: ['spotlight'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/spotlight`);
      if (!res.ok) throw new Error('No spotlight');
      return res.json();
    },
    staleTime: 300_000,
  });

  const { data: battlesData } = useQuery({
    queryKey: ['related-battles', data?.card?.player_name],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/battles?limit=20`);
      if (!res.ok) return { items: [] };
      return res.json();
    },
    enabled: !!data?.card,
    staleTime: 60_000,
  });

  const sportEmoji = data?.card
    ? { nfl: '🏈', nba: '🏀', mlb: '⚾' }[data.card.sport] ?? '🃏'
    : '🃏';

  // Filter related battles that feature this player
  const relatedBattles: RelatedBattle[] = data?.card
    ? ((battlesData?.items ?? []) as RelatedBattle[])
        .filter((b: RelatedBattle & {title: string}) =>
          b.title?.toLowerCase().includes((data.card.player_name ?? '').toLowerCase().split(' ')[0]) ||
          b.title?.toLowerCase().includes((data.card.player_name ?? '').toLowerCase().split(' ').pop() ?? '')
        )
        .slice(0, 4)
    : [];

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `🃏 Card of the Day: ${data?.card?.player_name} (${data?.card?.year}) — Est. $${data?.estimatedValue}\n#CardBattles #SportCards`;
    if (typeof navigator !== 'undefined') {
      if ('share' in navigator) {
        try { await (navigator as Navigator).share({ title: 'Card Spotlight', text, url }); setShared(true); } catch {}
      } else {
        try {
          await (navigator as Navigator).clipboard.writeText(`${text}\n${url}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackButton />
        <div className="animate-pulse space-y-4">
          <div className="h-64 rounded-2xl bg-[#12121a]" />
          <div className="h-8 w-48 rounded bg-[#12121a]" />
          <div className="h-32 rounded-2xl bg-[#12121a]" />
        </div>
      </div>
    );
  }

  if (isError || !data?.card) {
    return (
      <div className="space-y-4">
        <BackButton />
        <div className="text-center py-16 text-[#64748b]">
          <p className="text-4xl mb-3">🃏</p>
          <p className="font-semibold">No spotlight available</p>
          <p className="text-sm text-[#374151] mt-1">Check back after some battles get votes!</p>
          <Link href="/feed" className="mt-4 inline-block text-[#6c47ff] text-sm hover:underline">
            ← Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const { card, estimatedValue, voteCount, featuredDate, reason } = data;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <BackButton />
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-[#ffd700] uppercase tracking-widest">⭐ Card Spotlight</span>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.3)' }}
        >
          {copied ? <><Check size={12} /> Copied!</> : shared ? <><Check size={12} /> Shared!</> : <><Share2 size={12} /> Share</>}
        </button>
      </div>

      {/* Featured date */}
      <div className="text-center">
        <p className="text-xs text-[#374151]">Featured on {featuredDate}</p>
      </div>

      {/* Full-width card display */}
      <div
        className="rounded-3xl overflow-hidden border"
        style={{
          background: 'linear-gradient(135deg, #0f0721 0%, #12121a 70%)',
          borderColor: 'rgba(255,215,0,0.3)',
          boxShadow: '0 0 40px rgba(255,215,0,0.08)',
        }}
      >
        {/* Card image — full width */}
        <div className="relative">
          <img
            src={card.image_url}
            alt={card.player_name}
            className="w-full object-cover"
            style={{ maxHeight: '380px', objectPosition: 'top' }}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0f0721 0%, transparent 60%)' }} />
          {/* Gold spotlight badge */}
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
              style={{ background: 'rgba(255,215,0,0.2)', border: '1px solid rgba(255,215,0,0.4)', color: '#ffd700', backdropFilter: 'blur(8px)' }}>
              ⭐ Card of the Day
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="p-6 -mt-6 relative">
          <h1 className="text-2xl font-black text-white mb-1">{card.player_name}</h1>
          <p className="text-sm text-[#94a3b8] mb-4">{card.year} {sportEmoji} {card.sport.toUpperCase()} · {card.title}</p>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 text-center p-3 rounded-xl border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
              <p className="text-xl font-black" style={{ color: '#ffd700' }}>${estimatedValue}</p>
              <p className="text-[10px] text-[#64748b] mt-0.5">Est. Value</p>
            </div>
            <div className="flex-1 text-center p-3 rounded-xl border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
              <p className="text-xl font-black text-white">{formatNumber(voteCount)}</p>
              <p className="text-[10px] text-[#64748b] mt-0.5">Votes Today</p>
            </div>
            <div className="flex-1 text-center p-3 rounded-xl border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
              <p className="text-xl font-black text-[#22c55e]">🔥</p>
              <p className="text-[10px] text-[#64748b] mt-0.5">Hot Card</p>
            </div>
          </div>

          {/* Reason */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1e1e2e] mb-4"
            style={{ background: 'rgba(108,71,255,0.08)' }}>
            <span className="text-base">💡</span>
            <p className="text-xs text-[#a78bfa]">{reason}</p>
          </div>

          {/* CTA */}
          <Link
            href={`/search?q=${encodeURIComponent(card.player_name)}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-white text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)', boxShadow: '0 0 20px rgba(108,71,255,0.35)' }}
          >
            ⚔️ Vote in a Battle featuring {card.player_name.split(' ')[0]}
          </Link>
        </div>
      </div>

      {/* Price History Chart */}
      <div className="rounded-2xl border border-[#1e1e2e] p-4" style={{ background: '#12121a' }}>
        <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2">
          <span>📈</span> Price History
        </h2>
        <PriceHistoryChart cardId={card.id} />
      </div>

      {/* Related Battles */}
      {relatedBattles.length > 0 && (
        <div className="rounded-2xl border border-[#1e1e2e] p-4 space-y-3" style={{ background: '#12121a' }}>
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <span>⚔️</span> Related Battles
          </h2>
          <div className="space-y-2">
            {relatedBattles.map((battle) => (
              <Link
                key={battle.id}
                href={`/battles/${battle.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-[#1e1e2e] hover:border-[#6c47ff]/30 transition-all group"
                style={{ background: '#0a0a0f' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{battle.title}</p>
                  <p className="text-[10px] text-[#64748b] mt-0.5">
                    🗳️ {formatNumber(battle.total_votes_cached ?? 0)} votes
                    {battle.status === 'live' && (
                      <span className="ml-1.5 text-[#22c55e] font-bold">● LIVE</span>
                    )}
                  </p>
                </div>
                <span className="text-xs text-[#6c47ff] font-semibold opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  Vote →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Share Spotlight */}
      <div className="text-center pb-4">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white text-sm transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)', boxShadow: '0 0 20px rgba(108,71,255,0.3)' }}
        >
          <Share2 size={14} />
          Share this Spotlight
        </button>
      </div>
    </div>
  );
}
