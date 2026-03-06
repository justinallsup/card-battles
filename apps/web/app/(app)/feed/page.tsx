'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useFeed } from '../../../hooks/useBattles';
import { BattleCard } from '../../../components/battle/BattleCard';
import { BattleCardSkeleton } from '../../../components/ui/LoadingSpinner';
import { trending as trendingApi, leaderboards as lbApi } from '../../../lib/api';
import { formatNumber } from '../../../lib/utils';
import type { Battle } from '@card-battles/types';

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

export default function FeedPage() {
  const [sportFilter, setSportFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useFeed();

  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: () => trendingApi.get(),
    staleTime: 60_000,
  });

  const allBattles = data?.pages.flatMap((p) => p.items) ?? [];
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

  return (
    <div className="space-y-4">
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
        </div>
      </div>

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

      {/* Sport Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <span className="text-5xl">⚔️</span>
              <p className="text-[#64748b]">
                {sportFilter || categoryFilter
                  ? `No battles match this filter.`
                  : 'No battles yet. Be the first to create one!'}
              </p>
            </div>
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
