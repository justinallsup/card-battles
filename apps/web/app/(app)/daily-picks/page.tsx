'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyPicks as picksApi } from '../../../lib/api';
import { Target, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function DailyPicksPage() {
  const qc = useQueryClient();
  const { data: picks, isLoading } = useQuery({
    queryKey: ['daily-picks'],
    queryFn: () => picksApi.current(),
  });

  const enterMutation = useMutation({
    mutationFn: ({ id, choice }: { id: string; choice: 'left' | 'right' }) =>
      picksApi.enter(id, choice),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-picks'] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Target size={20} className="text-[#22c55e]" /> Daily Picks
        </h1>
        {[1,2,3].map(i => <div key={i} className="h-40 bg-[#12121a] rounded-2xl border border-[#1e1e2e] animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Target size={20} className="text-[#22c55e]" /> Daily Picks
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Pick a side. Come back tomorrow for results.</p>
      </div>

      {(!picks || picks.length === 0) && (
        <div className="text-center py-16 text-[#64748b]">No picks today yet. Check back soon!</div>
      )}

      {picks?.map((pick) => {
        const voted = pick.myEntry;
        const ended = new Date(pick.endsAt) < new Date();

        return (
          <div key={pick.id} className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <h3 className="text-sm font-bold text-white">{pick.title}</h3>
              {ended && <span className="text-xs text-[#64748b]">Ended</span>}
            </div>

            <div className="flex gap-2 p-3">
              {(['left', 'right'] as const).map((side) => {
                const asset = pick[side];
                const isVoted = voted === side;
                return (
                  <button
                    key={side}
                    onClick={() => !voted && !ended && enterMutation.mutate({ id: pick.id, choice: side })}
                    disabled={!!voted || ended}
                    className={`flex-1 rounded-xl border-2 overflow-hidden transition-all active:scale-95
                      ${isVoted ? 'border-[#22c55e]' : voted ? 'border-[#1e1e2e] opacity-50' : 'border-[#1e1e2e] hover:border-[#22c55e]/50'}`}
                  >
                    <div className="relative aspect-[3/4] bg-[#1e1e2e]">
                      <Image src={asset.imageUrl} alt={asset.title} fill className="object-cover" unoptimized />
                      {isVoted && (
                        <div className="absolute inset-0 bg-[#22c55e]/20 flex items-center justify-center">
                          <CheckCircle size={32} className="text-[#22c55e]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center text-[#94a3b8] px-2 py-2 line-clamp-2">{asset.title}</p>
                  </button>
                );
              })}
            </div>

            {pick.result && (
              <div className="px-4 pb-3 text-center">
                <span className="text-xs text-[#22c55e] font-semibold">
                  Result: {(pick.result as { winner?: string }).winner ?? 'pending'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
