'use client';
import { useFeed } from '../../../hooks/useBattles';
import { BattleCard } from '../../../components/battle/BattleCard';
import { BattleCardSkeleton, PageSpinner } from '../../../components/ui/LoadingSpinner';
import { Swords } from 'lucide-react';

export default function FeedPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useFeed();

  const battles = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          <Swords size={20} className="text-[#6c47ff]" /> Live Battles
        </h1>
        {[1, 2, 3].map((i) => <BattleCardSkeleton key={i} />)}
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

  if (battles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <Swords size={40} className="text-[#374151]" />
        <p className="text-[#64748b]">No battles yet. Be the first to create one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-black text-white flex items-center gap-2">
        <Swords size={20} className="text-[#6c47ff]" /> Live Battles
      </h1>

      {battles.map((battle) => (
        <BattleCard key={battle.id} battle={battle} />
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full py-3 text-sm text-[#64748b] hover:text-[#6c47ff] border border-[#1e1e2e] rounded-xl transition-colors disabled:opacity-50"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load more battles'}
        </button>
      )}
    </div>
  );
}
