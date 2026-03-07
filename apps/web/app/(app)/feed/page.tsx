'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useFeed } from '../../../hooks/useBattles';
import { BattleCard } from '../../../components/battle/BattleCard';
import { BattleCardSkeleton } from '../../../components/ui/LoadingSpinner';
import { trending as trendingApi, getToken } from '../../../lib/api';
import { formatNumber } from '../../../lib/utils';
import { RefreshCw, X } from 'lucide-react';
import type { Battle } from '@card-battles/types';

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

export default function FeedPage() {
  const [sportFilter, setSportFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useFeed();

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

      {/* ⭐ Card Spotlight */}
      <CardSpotlight />

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
            battles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))
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
