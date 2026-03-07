'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useFeed } from '../../../hooks/useBattles';
import { BattleCard } from '../../../components/battle/BattleCard';
import { BattleCardSkeleton } from '../../../components/ui/LoadingSpinner';
import { trending as trendingApi, getToken } from '../../../lib/api';
import { formatNumber } from '../../../lib/utils';
import { RefreshCw, X, TrendingUp, Star } from 'lucide-react';
import type { Battle } from '@card-battles/types';
import { useBattleOfTheDay } from '../../../hooks/useBattleOfTheDay';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

const SPORT_FILTERS = [
  { label: 'All', value: '' },
  { label: '🏈 NFL', value: 'nfl' },
  { label: '🏀 NBA', value: 'nba' },
  { label: '⚾ MLB', value: 'mlb' },
];

const CATEGORY_FILTERS = [
  { label: 'All', value: '' },
  { label: '💰 Investment', value: 'investment' },
  { label: '😎 Coolest', value: 'coolest' },
  { label: '💎 Rarity', value: 'rarity' },
];

// Placeholder battle cards for empty state
function PlaceholderBattleCard({ index }: { index: number }) {
  const pairs = [
    { left: 'Mahomes RC', right: 'Brady RC', votes: '1.2k' },
    { left: 'LeBron 03 RC', right: 'Jordan 86 RC', votes: '2.8k' },
    { left: 'Ohtani RC', right: 'Trout RC', votes: '943' },
  ];
  const p = pairs[index % pairs.length];
  return (
    <div
      className="rounded-2xl border border-[#1e1e2e] overflow-hidden opacity-50"
      style={{ background: '#12121a' }}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="w-16 h-20 bg-[#1e1e2e] rounded-xl animate-pulse flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 bg-[#1e1e2e] rounded-full w-3/4 animate-pulse" />
          <p className="text-xs text-[#64748b]">{p.left} vs {p.right}</p>
          <p className="text-[11px] text-[#374151]">🗳️ {p.votes} votes</p>
        </div>
        <span className="text-[#374151] font-black text-sm">⚔</span>
        <div className="w-16 h-20 bg-[#1e1e2e] rounded-xl animate-pulse flex-shrink-0" />
      </div>
    </div>
  );
}

function TrendingCard({ battle, rank }: { battle: Battle; rank: number }) {
  return (
    <Link
      href={`/battles/${battle.id}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-[#1e1e2e] bg-[#0a0a0f] hover:border-[#6c47ff]/30 transition-all group"
    >
      <span className="text-lg font-black text-[#374151] group-hover:text-[#6c47ff] w-5 text-center transition-colors">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate leading-tight">{battle.title}</p>
        <p className="text-[10px] text-[#64748b] mt-0.5">
          🗳️ {formatNumber(battle.totalVotesCached ?? 0)} votes
        </p>
      </div>
      <span className="text-xs font-semibold text-[#6c47ff] opacity-0 group-hover:opacity-100 transition-opacity">
        Vote →
      </span>
    </Link>
  );
}

function ActivitySidebar() {
  const { data: feedData } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => import('../../../lib/api').then(m => m.battles.feed()),
    staleTime: 120_000,
  });

  const battles = (feedData?.items ?? []).slice(0, 5);
  const demoVoters = ['cardking', 'slabmaster', 'rookiehunter', 'packripper', 'gradegod'];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
    >
      <div className="px-3 py-2.5 border-b border-[#1e1e2e] flex items-center justify-between">
        <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">📡 Activity</span>
        <Link href="/activity" className="text-[10px] text-[#6c47ff] hover:underline">See all</Link>
      </div>
      <div className="divide-y divide-[#1e1e2e]">
        {battles.map((battle, i) => (
          <div key={battle.id} className="px-3 py-2 flex gap-2 items-start">
            <span className="text-sm flex-shrink-0">🗳️</span>
            <p className="text-[11px] text-[#94a3b8] leading-snug">
              <span className="text-[#6c47ff] font-semibold">{demoVoters[i % demoVoters.length]}</span>
              {' '}voted on{' '}
              <Link href={`/battles/${battle.id}`} className="text-white hover:underline font-medium">
                {battle.title.split('—')[0].trim()}
              </Link>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Active Event Banner — shows when a live event exists
function BattleOfTheDayBanner() {
  const botd = useBattleOfTheDay();
  if (!botd?.battle) return null;

  return (
    <Link
      href={`/battles/${botd.battle.id}`}
      className="block"
    >
      <div
        className="relative rounded-2xl overflow-hidden px-4 py-4 flex items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, #2d1a00 0%, #1a1200 50%, #0a0a0f 100%)',
          border: '2px solid rgba(245,158,11,0.5)',
          boxShadow: '0 0 20px rgba(245,158,11,0.15), inset 0 0 30px rgba(245,158,11,0.05)',
        }}
      >
        {/* Gold shimmer */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(245,158,11,0.6) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
          }}
        />
        <div className="text-3xl leading-none flex-shrink-0">🏆</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}
            >
              BATTLE OF THE DAY
            </span>
          </div>
          <p className="text-sm font-bold text-white truncate">
            {String((botd.battle as Record<string, unknown>).lp ?? 'Card 1')} vs {String((botd.battle as Record<string, unknown>).rp ?? 'Card 2')}
          </p>
          <p className="text-[10px] text-[#f59e0b]/80 mt-0.5">
            🗳️ {formatNumber(Number((botd.battle as Record<string, unknown>).total_votes_cached ?? 0))} votes · Tap to vote!
          </p>
        </div>
        <span className="text-[#f59e0b] text-lg flex-shrink-0">→</span>
      </div>
    </Link>
  );
}

function ActiveEventBanner() {
  const [liveEvent, setLiveEvent] = useState<{
    id: string; title: string; participantCount: number; endDate: string; emoji: string; bannerColor: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/events`)
      .then(r => r.json())
      .then(data => {
        const live = (data.events ?? []).find((e: { status: string }) => e.status === 'live');
        if (live) setLiveEvent(live);
      })
      .catch(() => {});
  }, []);

  if (!liveEvent || dismissed) return null;

  const daysLeft = Math.ceil((new Date(liveEvent.endDate).getTime() - Date.now()) / 86400000);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all"
      style={{ background: `${liveEvent.bannerColor}12`, borderColor: `${liveEvent.bannerColor}40` }}
    >
      <span className="text-lg flex-shrink-0">{liveEvent.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">
          <span className="inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-[#22c55e]/15 text-[#22c55e]">
            <span className="w-1 h-1 rounded-full bg-[#22c55e] animate-pulse inline-block" />
            LIVE
          </span>
          {liveEvent.title}
        </p>
        <p className="text-[10px] text-[#64748b] truncate">
          {liveEvent.participantCount.toLocaleString()} participants · {daysLeft > 0 ? `${daysLeft}d left` : 'Ending soon'}
        </p>
      </div>
      <Link
        href="/events"
        className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
        style={{ background: `${liveEvent.bannerColor}20`, color: liveEvent.bannerColor }}
      >
        Join
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[#374151] hover:text-[#64748b] transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// Onboarding banner for new users
function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('cb_onboarded')) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    if (typeof window !== 'undefined') localStorage.setItem('cb_onboarded', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#6c47ff]/30"
      style={{ background: 'linear-gradient(135deg, rgba(108,71,255,0.12), rgba(139,92,246,0.06))' }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg flex-shrink-0">👋</span>
        <p className="text-sm text-white">
          New here? <span className="text-[#a78bfa] font-semibold">Vote on your first battle to get on the leaderboard!</span>
        </p>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[#64748b] hover:text-white hover:bg-[#1e1e2e] transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Card Spotlight ────────────────────────────────────────────────────────────
interface SpotlightData {
  card: {
    id: string;
    player_name: string;
    image_url: string;
    title: string;
    year: number;
    sport: string;
  };
  estimatedValue: number;
  voteCount: number;
  featuredDate: string;
  reason: string;
}

function CardSpotlight() {
  const { data, isLoading } = useQuery<SpotlightData>({
    queryKey: ['spotlight'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/spotlight`);
      if (!res.ok) throw new Error('No spotlight');
      return res.json();
    },
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#1e1e2e] p-4 animate-pulse" style={{ background: '#12121a' }}>
        <div className="h-3 w-32 bg-[#1e1e2e] rounded mb-3" />
        <div className="flex gap-4">
          <div className="w-24 h-32 rounded-xl bg-[#1e1e2e]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-[#1e1e2e] rounded" />
            <div className="h-3 w-1/2 bg-[#1e1e2e] rounded" />
            <div className="h-3 w-2/3 bg-[#1e1e2e] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.card) return null;

  const { card, estimatedValue, voteCount } = data;
  const sportEmoji = { nfl: '🏈', nba: '🏀', mlb: '⚾' }[card.sport] ?? '🃏';

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ background: 'linear-gradient(135deg, #0f0721 0%, #12121a 60%)', borderColor: 'rgba(255,215,0,0.25)' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">⭐</span>
          <span className="text-xs font-black text-[#ffd700] uppercase tracking-widest">Card Spotlight</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700' }}>
            Today's Pick
          </span>
        </div>
        <Link href="/spotlight" className="text-[10px] text-[#6c47ff] hover:underline font-semibold">
          Full spotlight →
        </Link>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 flex gap-4 items-start">
        {/* Card image */}
        <Link href={`/search?q=${encodeURIComponent(card.player_name)}`} className="flex-shrink-0">
          <div className="w-24 rounded-xl overflow-hidden border-2 shadow-lg transition-transform hover:scale-105"
            style={{ aspectRatio: '3/4', borderColor: 'rgba(255,215,0,0.3)', boxShadow: '0 0 20px rgba(255,215,0,0.15)' }}>
            <img src={card.image_url} alt={card.player_name}
              className="w-full h-full object-cover" />
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-white font-black text-base leading-tight">{card.player_name}</p>
            <p className="text-xs text-[#94a3b8]">{card.year} {sportEmoji} {card.sport.toUpperCase()}</p>
          </div>

          <p className="text-[11px] text-[#64748b]">Today's Most Voted Card</p>

          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: '#ffd700' }}>${estimatedValue}</p>
              <p className="text-[10px] text-[#64748b]">Est. Value</p>
            </div>
            <div className="w-px h-8 bg-[#1e1e2e]" />
            <div className="text-center">
              <p className="text-lg font-black text-white">{formatNumber(voteCount)}</p>
              <p className="text-[10px] text-[#64748b]">Votes today</p>
            </div>
          </div>

          <Link
            href={`/search?q=${encodeURIComponent(card.player_name)}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)', boxShadow: '0 0 12px rgba(108,71,255,0.3)' }}
          >
            ⚔️ Vote in a Battle
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Recommendations ───────────────────────────────────────────────────────────
interface RecommendedBattle {
  id: string;
  title: string;
  total_votes_cached: number;
  ends_at: string;
  lp: string;
  li: string;
  rp: string;
  ri: string;
}

interface RecommendationsData {
  battles: RecommendedBattle[];
  basedOn: string;
}

function RecommendedBattleCard({ battle }: { battle: RecommendedBattle }) {
  return (
    <Link
      href={`/battles/${battle.id}`}
      className="flex-shrink-0 w-56 rounded-2xl border border-[#1e1e2e] overflow-hidden hover:border-[#6c47ff]/40 transition-all group"
      style={{ background: '#0a0a0f' }}
    >
      {/* Card images preview */}
      <div className="flex h-28 overflow-hidden relative">
        <div className="w-1/2 overflow-hidden">
          <img src={battle.li || `https://placehold.co/120x160/6c47ff/ffffff?text=${encodeURIComponent(battle.lp?.split(' ')[0] ?? 'L')}`}
            alt={battle.lp}
            className="w-full h-full object-cover" />
        </div>
        <div className="w-1/2 overflow-hidden">
          <img src={battle.ri || `https://placehold.co/120x160/1e1e2e/64748b?text=${encodeURIComponent(battle.rp?.split(' ')[0] ?? 'R')}`}
            alt={battle.rp}
            className="w-full h-full object-cover" />
        </div>
        {/* VS badge */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white border border-[#6c47ff]"
            style={{ background: '#0a0a0f', boxShadow: '0 0 8px rgba(0,0,0,0.6)' }}>VS</div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-bold text-white line-clamp-2 leading-tight mb-1">{battle.title}</p>
        <p className="text-[10px] text-[#64748b]">
          🗳️ {formatNumber(battle.total_votes_cached ?? 0)} votes
        </p>
        <p className="text-[10px] text-[#6c47ff] font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Vote now →
        </p>
      </div>
    </Link>
  );
}

function Recommendations() {
  const token = getToken();
  const { data, isLoading } = useQuery<RecommendationsData>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/me/recommendations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { battles: [], basedOn: 'Popular battles' };
      return res.json();
    },
    staleTime: 120_000,
    enabled: !!token,
  });

  if (!token) return null;
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#1e1e2e] p-4" style={{ background: '#12121a' }}>
        <div className="h-3 w-48 bg-[#1e1e2e] rounded mb-3 animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-56 h-40 rounded-2xl bg-[#1e1e2e] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const battles = data?.battles ?? [];
  if (battles.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#1e1e2e] p-4 space-y-3" style={{ background: '#12121a' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1">
            🎯 Recommended for You
          </h2>
          <p className="text-[10px] text-[#374151] mt-0.5">Based on {data?.basedOn ?? 'your activity'}</p>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {battles.map((battle) => (
          <RecommendedBattleCard key={battle.id} battle={battle} />
        ))}
      </div>
    </div>
  );
}

// ── Featured This Week ────────────────────────────────────────────────────────
interface FeaturedData {
  weekOf: string;
  featuredBattle: { id: string; title: string; total_votes_cached: number; lp: string; li: string; rp: string; ri: string; ends_at: string } | null;
  cardOfTheWeek: { id: string; player_name: string; image_url: string; year: number; sport: string; votes: number; estimatedValue: number } | null;
  risingBattle: { id: string; title: string; total_votes_cached: number; lp: string; li: string; rp: string; ri: string } | null;
  editorsPick: { title: string; description: string; battleId: string };
}

function FeaturedThisWeek() {
  const { data, isLoading } = useQuery<FeaturedData>({
    queryKey: ['featured-this-week'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/featured`);
      if (!res.ok) throw new Error('No featured');
      return res.json();
    },
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#1e1e2e] p-4 animate-pulse" style={{ background: '#12121a' }}>
        <div className="h-3 w-40 bg-[#1e1e2e] rounded mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-[#1e1e2e] rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { featuredBattle, cardOfTheWeek, risingBattle } = data;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: '#12121a', borderColor: 'rgba(108,71,255,0.2)' }}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2">
          <Star size={14} className="text-[#f59e0b]" />
          <span className="text-xs font-black text-[#f59e0b] uppercase tracking-widest">Featured This Week</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
            {data.weekOf}
          </span>
        </div>
        <Link href="/trending" className="text-[10px] text-[#6c47ff] hover:underline font-semibold">See all →</Link>
      </div>

      <div className="p-3 grid grid-cols-3 gap-2">
        {/* Battle of the Week */}
        {featuredBattle && (
          <Link href={`/battles/${featuredBattle.id}`} className="col-span-1 rounded-xl border border-[#1e1e2e] overflow-hidden hover:border-[#ef4444]/40 transition-all group" style={{ background: '#0a0a0f' }}>
            <div className="relative h-20 overflow-hidden">
              <div className="flex h-full">
                <img src={featuredBattle.li || `https://placehold.co/80x100/6c47ff/fff?text=${encodeURIComponent(featuredBattle.lp?.[0] ?? 'L')}`}
                  alt={featuredBattle.lp} className="w-1/2 h-full object-cover" />
                <img src={featuredBattle.ri || `https://placehold.co/80x100/1e1e2e/fff?text=${encodeURIComponent(featuredBattle.rp?.[0] ?? 'R')}`}
                  alt={featuredBattle.rp} className="w-1/2 h-full object-cover" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-white bg-[#ef4444] rounded-full w-5 h-5 flex items-center justify-center">🔥</span>
              </div>
            </div>
            <div className="p-2">
              <p className="text-[9px] font-black text-[#ef4444] uppercase">Battle of the Week</p>
              <p className="text-[10px] text-white font-bold truncate leading-tight mt-0.5">{featuredBattle.title}</p>
              <p className="text-[9px] text-[#64748b] mt-0.5">🗳️ {formatNumber(featuredBattle.total_votes_cached ?? 0)}</p>
            </div>
          </Link>
        )}

        {/* Card of the Week */}
        {cardOfTheWeek && (
          <div className="col-span-1 rounded-xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#0a0a0f', borderColor: 'rgba(255,215,0,0.2)' }}>
            <div className="h-20 overflow-hidden">
              <img src={cardOfTheWeek.image_url || `https://placehold.co/120x160/ffd700/000?text=${encodeURIComponent(cardOfTheWeek.player_name?.[0] ?? 'C')}`}
                alt={cardOfTheWeek.player_name} className="w-full h-full object-cover" />
            </div>
            <div className="p-2">
              <p className="text-[9px] font-black text-[#ffd700] uppercase">🃏 Card of Week</p>
              <p className="text-[10px] text-white font-bold truncate leading-tight mt-0.5">{cardOfTheWeek.player_name}</p>
              <p className="text-[9px] text-[#ffd700] font-bold mt-0.5">${cardOfTheWeek.estimatedValue}</p>
            </div>
          </div>
        )}

        {/* Rising Battle */}
        {risingBattle && (
          <Link href={`/battles/${risingBattle.id}`} className="col-span-1 rounded-xl border border-[#1e1e2e] overflow-hidden hover:border-[#22c55e]/40 transition-all group" style={{ background: '#0a0a0f' }}>
            <div className="relative h-20 overflow-hidden">
              <div className="flex h-full">
                <img src={risingBattle.li || `https://placehold.co/80x100/22c55e/fff?text=${encodeURIComponent(risingBattle.lp?.[0] ?? 'L')}`}
                  alt={risingBattle.lp} className="w-1/2 h-full object-cover" />
                <img src={risingBattle.ri || `https://placehold.co/80x100/1e1e2e/fff?text=${encodeURIComponent(risingBattle.rp?.[0] ?? 'R')}`}
                  alt={risingBattle.rp} className="w-1/2 h-full object-cover" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp size={14} className="text-[#22c55e] drop-shadow" />
              </div>
            </div>
            <div className="p-2">
              <p className="text-[9px] font-black text-[#22c55e] uppercase">📈 Rising</p>
              <p className="text-[10px] text-white font-bold truncate leading-tight mt-0.5">{risingBattle.title}</p>
              <p className="text-[9px] text-[#64748b] mt-0.5">🗳️ {formatNumber(risingBattle.total_votes_cached ?? 0)}</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [sportFilter, setSportFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useFeed();
  const botd = useBattleOfTheDay();

  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: () => trendingApi.get(),
    staleTime: 60_000,
  });

  const allBattles = data?.pages.flatMap((p) => p.items) ?? [];
  const liveBattleCount = allBattles.filter(b => b.status === 'live').length;

  let battles = allBattles;

  if (sportFilter) {
    battles = battles.filter((b) => {
      const cats = b.categories as string[];
      return cats.some((c: string) => c.toLowerCase().includes(sportFilter)) ||
        (b.left.playerName ?? '').toLowerCase().includes(sportFilter) ||
        (b.right.playerName ?? '').toLowerCase().includes(sportFilter) ||
        b.title.toLowerCase().includes(sportFilter);
    });
  }

  if (categoryFilter) {
    battles = battles.filter((b) => {
      const cats = b.categories as string[];
      return cats.some((c: string) => c.toLowerCase() === categoryFilter);
    });
  }

  const topTrending = (trendingData?.items ?? []).slice(0, 3) as Battle[];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-4">
      {/* Onboarding banner */}
      <OnboardingBanner />

      {/* 🎉 Active Event Banner */}
      <ActiveEventBanner />

      {/* 🏆 Battle of the Day */}
      <BattleOfTheDayBanner />

      {/* ⭐ Card Spotlight */}
      <CardSpotlight />

      {/* ⭐ Featured This Week */}
      <FeaturedThisWeek />

      {/* Hero Banner */}
      <div
        className="relative rounded-2xl overflow-hidden px-6 py-7 text-center"
        style={{
          background: 'linear-gradient(135deg, #0f0721 0%, #12121a 40%, #0a0a0f 100%)',
          border: '1px solid rgba(108, 71, 255, 0.2)',
          boxShadow: 'inset 0 0 60px rgba(108, 71, 255, 0.08)',
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-20 opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #6c47ff, transparent)' }}
        />
        <div className="relative">
          <h1 className="text-2xl font-black text-white mb-1">
            ⚔️ Live{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #6c47ff, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Battles
            </span>
          </h1>
          <p className="text-sm text-[#64748b]">
            Vote for the ultimate sports card. New battles every day.
          </p>
          {/* 🔴 Live battle count */}
          {!isLoading && liveBattleCount > 0 && (
            <div
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse inline-block" />
              🔴 {liveBattleCount} Live Battle{liveBattleCount !== 1 ? 's' : ''} Active
            </div>
          )}
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[#374151] hover:text-[#64748b] transition-colors disabled:opacity-50"
      >
        <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
        {isRefreshing ? 'Refreshing...' : 'Tap to refresh'}
      </button>

      {/* 🎯 Recommendations */}
      <Recommendations />

      {/* 🔥 Trending Now */}
      {topTrending.length > 0 && (
        <div
          className="rounded-xl p-3 space-y-2"
          style={{ background: '#12121a', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1">
              🔥 Trending Now
            </h2>
            <span className="text-[10px] text-[#64748b]">Most votes ending soon</span>
          </div>
          <div className="space-y-1.5">
            {topTrending.map((battle, i) => (
              <TrendingCard key={battle.id} battle={battle} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Sport Filter Tabs — sticky */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide z-20 -mx-4 px-4 pt-1"
        style={{ position: 'sticky', top: 0, background: '#0a0a0f' }}
      >
        {SPORT_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSportFilter(filter.value)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
            style={
              sportFilter === filter.value
                ? {
                    background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
                    color: 'white',
                    boxShadow: '0 0 12px rgba(108, 71, 255, 0.3)',
                  }
                : {
                    background: '#12121a',
                    color: '#64748b',
                    border: '1px solid #1e1e2e',
                  }
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setCategoryFilter(filter.value)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={
              categoryFilter === filter.value
                ? {
                    background: 'rgba(108,71,255,0.2)',
                    color: '#a78bfa',
                    border: '1px solid rgba(108,71,255,0.4)',
                  }
                : {
                    background: '#0a0a0f',
                    color: '#64748b',
                    border: '1px solid #1e1e2e',
                  }
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Main layout: feed + sidebar on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 items-start">
        {/* Feed Content */}
        <div className="space-y-4">
          {isLoading ? (
            [1, 2, 3].map((i) => <BattleCardSkeleton key={i} />)
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <p className="text-[#ef4444] font-semibold">Failed to load battles</p>
              <p className="text-[#64748b] text-sm">Make sure the API is running</p>
            </div>
          ) : battles.length === 0 ? (
            (sportFilter || categoryFilter) ? (
              <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                <span className="text-5xl">⚔️</span>
                <p className="text-[#64748b]">No battles match this filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm text-[#64748b]">No battles yet — be the first!</p>
                {[0, 1, 2].map(i => <PlaceholderBattleCard key={i} index={i} />)}
                <Link
                  href="/create"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', boxShadow: '0 0 20px rgba(108,71,255,0.3)' }}
                >
                  ⚔️ Create the first battle!
                </Link>
              </div>
            )
          ) : (
            battles.map((battle) => {
              const isBotd = botd?.battle?.id === battle.id;
              return (
                <div key={battle.id} className="relative">
                  {isBotd && (
                    <div
                      className="absolute -top-1.5 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black"
                      style={{ background: 'rgba(245,158,11,0.9)', color: '#0a0a0f', boxShadow: '0 0 8px rgba(245,158,11,0.5)' }}
                    >
                      🏆 BATTLE OF THE DAY
                    </div>
                  )}
                  <div style={isBotd ? { border: '2px solid rgba(245,158,11,0.5)', borderRadius: '1rem', boxShadow: '0 0 16px rgba(245,158,11,0.1)' } : {}}>
                    <BattleCard battle={battle} />
                  </div>
                </div>
              );
            })
          )}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-3 text-sm text-[#64748b] hover:text-[#6c47ff] border border-[#1e1e2e] rounded-xl transition-colors disabled:opacity-50 hover:border-[#6c47ff]/30"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more battles'}
            </button>
          )}
        </div>

        {/* Activity Sidebar (large screens only) */}
        <div className="hidden lg:block sticky top-4">
          <ActivitySidebar />
        </div>
      </div>
    </div>
  );
}
