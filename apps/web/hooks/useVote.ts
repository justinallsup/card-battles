'use client';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { battles as battlesApi } from '../lib/api';
import type { VoteChoice } from '@card-battles/types';

export function useVote(battleId: string, initialVotes: Record<string, VoteChoice> = {}) {
  const queryClient = useQueryClient();
  const [localVotes, setLocalVotes] = useState<Record<string, VoteChoice>>(initialVotes);
  const [localPercents, setLocalPercents] = useState<Record<string, { left: number; right: number }>>({});
  const [voting, setVoting] = useState<Record<string, boolean>>({});

  const vote = useCallback(async (category: string, choice: VoteChoice) => {
    if (localVotes[category] || voting[category]) return;

    // Optimistic update
    setLocalVotes((prev) => ({ ...prev, [category]: choice }));
    setVoting((prev) => ({ ...prev, [category]: true }));

    try {
      const res = await battlesApi.vote(battleId, category, choice);
      setLocalPercents((prev) => ({
        ...prev,
        [category]: { left: res.leftPercent, right: res.rightPercent },
      }));
      queryClient.invalidateQueries({ queryKey: ['battle', battleId] });
    } catch (err: unknown) {
      const e = err as { status?: number };
      // Rollback on error (unless it's a duplicate — treat as already voted)
      if (e.status !== 409) {
        setLocalVotes((prev) => {
          const next = { ...prev };
          delete next[category];
          return next;
        });
      }
    } finally {
      setVoting((prev) => ({ ...prev, [category]: false }));
    }
  }, [battleId, localVotes, voting, queryClient]);

  return { localVotes, localPercents, vote, voting };
}
