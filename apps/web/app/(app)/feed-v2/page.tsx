'use client';
import { useState, useRef, useEffect } from 'react';
import { useFeed } from '../../../hooks/useBattles';
import { BattleCardV2 } from '../../../components/battle/BattleCardV2';
import { BattleCardSkeleton } from '../../../components/ui/LoadingSpinner';
import type { Battle } from '@card-battles/types';

export default function FeedPageV2() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const allBattles = data?.pages.flatMap((p) => p.items) ?? [];
  const currentBattle = allBattles[currentIndex];

  const handleVoteComplete = () => {
    // Auto-advance to next battle
    if (currentIndex < allBattles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (hasNextPage && !isFetchingNextPage) {
      // Load more battles
      fetchNextPage().then(() => {
        setCurrentIndex(prev => prev + 1);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        <BattleCardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <p className="text-[#ef4444] font-semibold">Failed to load battles</p>
        <p className="text-[#64748b] text-sm">Make sure the API is running</p>
      </div>
    );
  }

  if (!currentBattle) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <span className="text-5xl">⚔️</span>
        <p className="text-[#64748b]">No more battles right now</p>
      </div>
    );
  }

  const progress = Math.min(currentIndex + 1, allBattles.length);
  const total = Math.max(allBattles.length, 10);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Progress Tracker */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#12121a] rounded-xl border border-[#1e1e2e]">
        <span className="text-sm font-bold text-[#94a3b8]">
          🔥 {progress} / {total} BATTLES
        </span>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6c47ff] to-[#a78bfa] transition-all duration-300"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[#64748b] tabular-nums">{Math.round((progress / total) * 100)}%</span>
        </div>
      </div>

      {/* Current Battle */}
      <BattleCardV2
        key={currentBattle.id}
        battle={currentBattle}
        onVoteComplete={handleVoteComplete}
      />

      {/* Navigation Hint */}
      <div className="text-center text-xs text-[#64748b]">
        {currentIndex < allBattles.length - 1 ? (
          <p>Next battle loads automatically after voting</p>
        ) : hasNextPage ? (
          <p>Loading more battles...</p>
        ) : (
          <p>You've reached the end!</p>
        )}
      </div>
    </div>
  );
}
