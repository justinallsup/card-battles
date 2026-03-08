'use client';
import { useState, useEffect } from 'react';
import { formatNumber } from '../../lib/utils';
import { BattleTimer } from './BattleTimer';
import { useVote } from '../../hooks/useVote';
import type { Battle, VoteChoice } from '@card-battles/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

// Category display config
const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  coolest: { emoji: '🔥', label: 'COOLEST CARD', color: '#f97316' },
  investment: { emoji: '💰', label: 'BETTER INVESTMENT', color: '#10b981' },
  rarity: { emoji: '💎', label: 'RAREST CARD', color: '#a78bfa' },
  goat: { emoji: '🐐', label: 'GOAT DEBATE', color: '#fbbf24' },
  rookie: { emoji: '🚀', label: 'ROOKIE WAR', color: '#60a5fa' },
};

interface BattleCardV2Props {
  battle: Battle;
  onVoteComplete?: () => void; // Callback for auto-advance
}

function CardImage({ 
  imageUrl, 
  title, 
  playerName, 
  isSelected, 
  isOpponent,
  onClick,
  disabled
}: { 
  imageUrl: string; 
  title: string; 
  playerName?: string | null; 
  isSelected?: boolean;
  isOpponent?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const imgSrc = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${API_BASE.replace('/api/v1', '')}${imageUrl}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 min-w-0 transition-all duration-300 ${
        !disabled ? 'cursor-pointer active:scale-95' : 'cursor-default'
      } ${isSelected ? 'scale-105' : ''} ${isOpponent ? 'opacity-60' : ''}`}
      style={{
        filter: isSelected ? 'drop-shadow(0 0 20px rgba(108, 71, 255, 0.6))' : 'none',
      }}
    >
      <div
        className={`relative rounded-xl overflow-hidden border transition-all duration-300 ${
          isSelected ? 'border-[#6c47ff] ring-2 ring-[#6c47ff]/50' : 'border-[#252535]'
        } ${!disabled && !isSelected ? 'hover:border-[#6c47ff]/40' : ''}`}
        style={{ aspectRatio: '3/4' }}
      >
        <img 
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Player name overlay */}
        {playerName && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 py-2">
            <p className="text-white text-xs font-bold text-center truncate drop-shadow-lg">
              {playerName}
            </p>
          </div>
        )}

        {/* Selection glow effect */}
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#6c47ff]/20 to-transparent pointer-events-none animate-pulse" />
        )}
      </div>
      <p className="mt-1.5 text-xs text-[#94a3b8] leading-tight text-center px-1 line-clamp-2">
        {title}
      </p>
    </button>
  );
}

function VsDivider() {
  return (
    <div className="flex items-center justify-center w-10 flex-shrink-0 self-center">
      <span
        className="text-xs font-black text-white bg-gradient-to-br from-[#6c47ff] to-[#8b5cf6] rounded-full w-9 h-9 flex items-center justify-center border border-[#6c47ff]/50 shadow-lg"
      >
        VS
      </span>
    </div>
  );
}

function ResultBar({ leftPercent, rightPercent, userChoice }: { leftPercent: number; rightPercent: number; userChoice: 'left' | 'right' }) {
  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <div className="flex-1 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${userChoice === 'left' ? 'bg-[#6c47ff]' : 'bg-[#64748b]'}`}
            style={{ width: `${leftPercent}%` }}
          />
        </div>
        <span className={`font-bold tabular-nums ${userChoice === 'left' ? 'text-[#6c47ff]' : 'text-[#64748b]'}`}>
          {leftPercent}%
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className="flex-1 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${userChoice === 'right' ? 'bg-[#6c47ff]' : 'bg-[#64748b]'}`}
            style={{ width: `${rightPercent}%` }}
          />
        </div>
        <span className={`font-bold tabular-nums ${userChoice === 'right' ? 'text-[#6c47ff]' : 'text-[#64748b]'}`}>
          {rightPercent}%
        </span>
      </div>
      <p className="text-center text-[10px] text-[#64748b] mt-2">
        {leftPercent > rightPercent ? '👑 Leading' : rightPercent > leftPercent ? '👑 Leading' : 'Tied'}
      </p>
    </div>
  );
}

export function BattleCardV2({ battle, onVoteComplete }: BattleCardV2Props) {
  // Pick the first category as the primary one (backward compatible)
  const categories = (battle.categories as string[] | undefined) || ['investment'];
  const primaryCategory = categories[0];
  const categoryInfo = CATEGORY_CONFIG[primaryCategory] || { emoji: '⚔️', label: primaryCategory.toUpperCase(), color: '#6c47ff' };

  const { localVotes, localPercents, vote, voting } = useVote(
    battle.id,
    battle.myVotes as Record<string, VoteChoice>
  );

  const [userVote, setUserVote] = useState<'left' | 'right' | null>(
    localVotes[primaryCategory] || null
  );
  const [showResults, setShowResults] = useState(!!localVotes[primaryCategory]);

  const handleVote = async (choice: 'left' | 'right') => {
    if (userVote || voting[primaryCategory]) return;

    setUserVote(choice);
    await vote(primaryCategory, choice);
    
    // Show results immediately
    setTimeout(() => {
      setShowResults(true);
      
      // Auto-advance after 1 second
      setTimeout(() => {
        onVoteComplete?.();
      }, 1000);
    }, 300);
  };

  const votePercents = localPercents[primaryCategory] || { left: 50, right: 50 };

  return (
    <article className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] overflow-hidden">
      {/* Category Header */}
      <div 
        className="px-4 py-3 border-b border-[#1e1e2e]"
        style={{ background: `linear-gradient(135deg, ${categoryInfo.color}15, transparent)` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{categoryInfo.emoji}</span>
            <h3 
              className="text-sm font-black tracking-wider"
              style={{ color: categoryInfo.color }}
            >
              {categoryInfo.label}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#64748b]">
            <span>{formatNumber(battle.totalVotesCached)} votes</span>
            <BattleTimer endsAt={battle.endsAt} />
          </div>
        </div>
        <p className="text-xs text-[#94a3b8] mt-1 line-clamp-1">{battle.title}</p>
      </div>

      {/* Cards */}
      <div className="flex items-start gap-1 px-4 py-4">
        <CardImage
          imageUrl={battle.left.imageUrl}
          title={battle.left.title}
          playerName={battle.left.playerName}
          isSelected={userVote === 'left'}
          isOpponent={userVote === 'right'}
          onClick={() => handleVote('left')}
          disabled={!!userVote || voting[primaryCategory]}
        />

        <VsDivider />

        <CardImage
          imageUrl={battle.right.imageUrl}
          title={battle.right.title}
          playerName={battle.right.playerName}
          isSelected={userVote === 'right'}
          isOpponent={userVote === 'left'}
          onClick={() => handleVote('right')}
          disabled={!!userVote || voting[primaryCategory]}
        />
      </div>

      {/* Results */}
      {showResults && userVote && (
        <div className="px-4 pb-4">
          <ResultBar
            leftPercent={votePercents.left}
            rightPercent={votePercents.right}
            userChoice={userVote}
          />
        </div>
      )}

      {/* Tap hint */}
      {!userVote && (
        <p className="text-center text-[10px] text-[#6c47ff]/50 pb-3">
          Tap a card to vote
        </p>
      )}
    </article>
  );
}
