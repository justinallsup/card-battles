'use client';
import { cn } from '../../lib/utils';
import { ResultBar } from './ResultBar';
import type { VoteChoice } from '@card-battles/types';
import { Check } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  investment: '📈 Investment',
  coolest: '🔥 Coolest',
  rarity: '💎 Rarest',
  long_term_hold: '📊 Long Hold',
};

interface VoteButtonsProps {
  categories: string[];
  localVotes: Record<string, VoteChoice>;
  localPercents: Record<string, { left: number; right: number }>;
  voting: Record<string, boolean>;
  onVoteLeft: (category: string) => void;
  onVoteRight: (category: string) => void;
}

export function VoteButtons({
  categories,
  localVotes,
  localPercents,
  voting,
  onVoteLeft,
  onVoteRight,
}: VoteButtonsProps) {
  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const voted = localVotes[cat];
        const percents = localPercents[cat];
        const label = CATEGORY_LABELS[cat] ?? cat;
        const isVoting = voting[cat];

        return (
          <div key={cat}>
            <div className="flex gap-2">
              {/* Left vote button */}
              <button
                onClick={() => !voted && !isVoting && onVoteLeft(cat)}
                disabled={!!voted || isVoting}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border',
                  !voted && !isVoting && 'border-[#1e1e2e] text-[#64748b] hover:border-[#6c47ff] hover:text-[#6c47ff] hover:bg-[#6c47ff]/5 active:scale-95',
                  voted === 'left' && 'border-[#6c47ff] bg-[#6c47ff]/15 text-[#6c47ff]',
                  voted === 'right' && 'border-[#1e1e2e] text-[#374151] cursor-default',
                  isVoting && 'opacity-60 cursor-wait',
                )}
              >
                {voted === 'left' ? (
                  <span className="flex items-center justify-center gap-1">
                    <Check size={14} /> Left
                  </span>
                ) : (
                  label
                )}
              </button>

              {/* Right vote button */}
              <button
                onClick={() => !voted && !isVoting && onVoteRight(cat)}
                disabled={!!voted || isVoting}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border',
                  !voted && !isVoting && 'border-[#1e1e2e] text-[#64748b] hover:border-[#6c47ff] hover:text-[#6c47ff] hover:bg-[#6c47ff]/5 active:scale-95',
                  voted === 'right' && 'border-[#6c47ff] bg-[#6c47ff]/15 text-[#6c47ff]',
                  voted === 'left' && 'border-[#1e1e2e] text-[#374151] cursor-default',
                  isVoting && 'opacity-60 cursor-wait',
                )}
              >
                {voted === 'right' ? (
                  <span className="flex items-center justify-center gap-1">
                    <Check size={14} /> Right
                  </span>
                ) : (
                  label
                )}
              </button>
            </div>

            {/* Result bar — only show after voted */}
            {voted && percents && (
              <ResultBar
                leftPercent={percents.left}
                rightPercent={percents.right}
                userChoice={voted}
                category={cat}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
