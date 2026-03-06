'use client';
import { useState } from 'react';
import { useFeed } from '../../../hooks/useBattles';
import { BattleCard } from '../../../components/battle/BattleCard';
import { BattleCardSkeleton } from '../../../components/ui/LoadingSpinner';

const SPORT_FILTERS = [
  { label: 'All', value: '' },
  { label: '🏈 NFL', value: 'nfl' },
  { label: '🏀 NBA', value: 'nba' },
  { label: '⚾ MLB', value: 'mlb' },
];

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState('');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useFeed();

  const allBattles = data?.pages.flatMap((p) => p.items) ?? [];
  const battles = activeFilter
    ? allBattles.filter((b) => {
        const cats = b.categories as string[];
        return cats.some((c: string) => c.toLowerCase().includes(activeFilter));
      })
    : allBattles;

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
        {/* Background glow */}
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

      {/* Sport Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SPORT_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
            style={
              activeFilter === filter.value
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

      {/* Content */}
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
            {activeFilter ? `No ${activeFilter.toUpperCase()} battles yet.` : 'No battles yet. Be the first to create one!'}
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
  );
}
