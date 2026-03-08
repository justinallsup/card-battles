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
  leftPlayerName?: string;
  rightPlayerName?: string;
}

export function VoteButtons({
  categories,
  localVotes,
  localPercents,
  voting,
  onVoteLeft,
  onVoteRight,
  leftPlayerName = 'Left card',
  rightPlayerName = 'Right card',
}: VoteButtonsProps) {
  // Safety check: ensure categories is always an array
  const safeCategories = categories || ['investment', 'coolest', 'rarity'];
  
  return (
    <div className="space-y-2" role="group" aria-label="Vote categories">
      {safeCategories.map((cat) => {
        const voted = localVotes[cat];
        const percents = localPercents[cat];
        const label = CATEGORY_LABELS[cat] ?? cat;
        const isVoting = voting[cat];
        const catName = cat.replace(/_/g, ' ');

        return (
          <div key={cat}>
            <p className="sr-only">{label} category</p>
            <div className="flex gap-2">
              {/* Left vote button */}
              <button
                onClick={() => !voted && !isVoting && onVoteLeft(cat)}
                disabled={!!voted || isVoting}
                aria-label={voted === 'left'
                  ? `Your vote: ${leftPlayerName} wins ${catName}`
                  : `Vote ${leftPlayerName} for ${catName}`
                }
                aria-pressed={voted === 'left'}
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
                    <Check size={14} aria-hidden="true" /> Left
                  </span>
                ) : (
                  label
                )}
              </button>

              {/* Right vote button */}
              <button
                onClick={() => !voted && !isVoting && onVoteRight(cat)}
                disabled={!!voted || isVoting}
                aria-label={voted === 'right'
                  ? `Your vote: ${rightPlayerName} wins ${catName}`
                  : `Vote ${rightPlayerName} for ${catName}`
                }
                aria-pressed={voted === 'right'}
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
                    <Check size={14} aria-hidden="true" /> Right
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
