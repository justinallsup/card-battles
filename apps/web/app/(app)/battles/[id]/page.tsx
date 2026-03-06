'use client';
import { use, useState, useCallback } from 'react';
import { useBattle } from '../../../../hooks/useBattles';
import { useBattleSSE } from '../../../../hooks/useSSE';
import { BattleCard } from '../../../../components/battle/BattleCard';
import { PageSpinner } from '../../../../components/ui/LoadingSpinner';
import { Share2, Flag, Zap } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { battles as battlesApi } from '../../../../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface SSEVoteEvent {
  type: 'vote';
  battleId: string;
  category: string;
  leftPercent: number;
  rightPercent: number;
  totalVotesInCategory: number;
}

export default function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: battle, isLoading } = useBattle(id);
  const [reported, setReported] = useState(false);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const queryClient = useQueryClient();

  // Wire up SSE for real-time vote updates
  const handleSSEUpdate = useCallback((data: unknown) => {
    const event = data as { type?: string };
    if (event.type === 'vote') {
      const voteEvent = data as SSEVoteEvent;
      // Flash live indicator
      setLiveIndicator(true);
      setTimeout(() => setLiveIndicator(false), 800);
      // Invalidate query to refetch fresh vote data
      queryClient.invalidateQueries({ queryKey: ['battle', voteEvent.battleId] });
    }
  }, [queryClient]);

  useBattleSSE(id, handleSSEUpdate);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: battle?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  const handleReport = async () => {
    if (reported) return;
    await battlesApi.report(id, 'inappropriate');
    setReported(true);
  };

  if (isLoading) return <PageSpinner />;
  if (!battle) return <div className="text-center text-[#64748b] py-16">Battle not found</div>;

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      {battle.status === 'live' && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-all ${liveIndicator ? 'bg-[#22c55e] scale-125 shadow-[0_0_6px_#22c55e]' : 'bg-[#22c55e]'} animate-pulse`} />
          <span className="text-xs text-[#22c55e] font-semibold flex items-center gap-1">
            <Zap size={11} />
            Live — votes update in real-time
          </span>
        </div>
      )}

      <BattleCard battle={battle} />

      {/* Action row */}
      <div className="flex gap-3">
        <Button variant="secondary" size="sm" className="flex-1" onClick={handleShare}>
          <Share2 size={14} /> Share
        </Button>
        {battle.sponsorCta && (
          <a
            href={(battle.sponsorCta as { url: string; label: string }).url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-sm font-semibold rounded-lg hover:bg-[#f59e0b]/15 transition-colors"
          >
            Buy this card →
          </a>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReport}
          disabled={reported}
          className="text-[#ef4444]/60 hover:text-[#ef4444]"
        >
          <Flag size={14} />
          {reported ? 'Reported' : 'Report'}
        </Button>
      </div>
    </div>
  );
}
