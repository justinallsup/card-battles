'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatNumber } from '../../lib/utils';
import { BattleTimer } from './BattleTimer';
import { VoteButtons } from './VoteButtons';
import { useVote } from '../../hooks/useVote';
import type { Battle, VoteChoice } from '@card-battles/types';
import { Badge } from '../ui/Badge';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface BattleCardProps {
  battle: Battle;
  compact?: boolean;
}

function CardImage({ imageUrl, title, playerName, onVoted, midValue }: { imageUrl: string; title: string; playerName?: string | null; onVoted?: boolean; midValue?: number | null }) {
  // Convert relative URLs to absolute
  const imgSrc = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${API_BASE.replace('/api/v1', '')}${imageUrl}`;

  return (
    <div className="flex-1 min-w-0">
      <div
        className={`relative rounded-xl overflow-hidden border transition-all duration-300 group-hover:border-[#6c47ff]/40 ${onVoted ? 'animate-vote-pulse' : ''}`}
        style={{ aspectRatio: '3/4', borderColor: '#252535' }}
      >
        <img 
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {midValue && (
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-[#6c47ff] rounded-lg text-white text-sm font-black shadow-lg z-10">
            ${midValue.toLocaleString()}
          </div>
        )}
        {/* Player name overlay */}
        {playerName && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 py-2">
            <p className="text-white text-xs font-bold text-center truncate drop-shadow-lg">
              {playerName}
            </p>
          </div>
        )}
        {/* Price tag */}
        {midValue != null && (
          <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
            <span className="text-[#f59e0b] text-[10px] font-black">💰 ${midValue >= 1000 ? `${(midValue/1000).toFixed(1)}k` : midValue}</span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-[#94a3b8] leading-tight text-center px-1 line-clamp-2">
        {title}
      </p>
    </div>
  );
}

function VsDivider() {
  return (
    <div className="flex items-center justify-center w-10 flex-shrink-0 self-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6c47ff] to-[#a78bfa] animate-pulse opacity-30 blur-sm" />
        <span
          className="relative text-xs font-black text-white bg-gradient-to-br from-[#6c47ff] to-[#8b5cf6] rounded-full w-9 h-9 flex items-center justify-center border border-[#6c47ff]/50 shadow-lg"
          style={{ boxShadow: '0 0 12px rgba(108, 71, 255, 0.4)' }}
        >
          VS
        </span>
      </div>
    </div>
  );
}

function SwipeHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-1 text-[#6c47ff]/60 text-[10px] font-medium mt-1 justify-center animate-swipe-hint pointer-events-none select-none">
      <ChevronRight size={12} />
      <span>swipe to vote</span>
      <ChevronRight size={12} />
    </div>
  );
}

export function BattleCard({ battle, compact = false }: BattleCardProps) {
  const { localVotes, localPercents, vote, voting } = useVote(
    battle.id,
    battle.myVotes as Record<string, VoteChoice>
  );
  const [justVoted, setJustVoted] = useState<'left' | 'right' | null>(null);
  const [valuations, setValuations] = useState<{ left: { mid: number; trend: string } | null; right: { mid: number; trend: string } | null } | null>(null);
  const isFirstRender = useRef(true);

  const categories = battle.categories as string[];
  const isHot = (battle.totalVotesCached ?? 0) > 5000;

  useEffect(() => {
    fetch(`/api/v1/battles/${battle.id}/valuations`)
      .then(r => r.json())
      .then(data => setValuations(data))
      .catch(() => {});
  }, [battle.id]);

  const handleVote = async (category: string, side: 'left' | 'right') => {
    setJustVoted(side);
    await vote(category, side);
    setTimeout(() => setJustVoted(null), 400);
  };

  const showSwipeHint = isFirstRender.current;
  if (isFirstRender.current) isFirstRender.current = false;

  return (
    <article
      className="group bg-[#12121a] rounded-2xl border border-[#1e1e2e] overflow-hidden transition-all duration-300 hover:border-[#6c47ff]/50"
      style={{
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px rgba(108, 71, 255, 0.3), 0 4px 24px rgba(108, 71, 255, 0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          {battle.isSponsored && (
            <span className="text-[10px] font-black text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              🏷️ SPONSORED
            </span>
          )}
          {isHot && (
            <span className="text-xs font-black text-[#f97316] bg-[#f97316]/10 border border-[#f97316]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              🔥 HOT
            </span>
          )}
          <h3 className="text-sm font-bold text-[#f1f5f9] truncate">{battle.title}</h3>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <span className="text-xs text-[#64748b]">{formatNumber(battle.totalVotesCached)} votes</span>
          <BattleTimer endsAt={battle.endsAt} />
        </div>
      </div>

      {/* Cards */}
      <div className="flex items-start gap-1 px-4 py-3">
        <CardImage
          imageUrl={battle.left.imageUrl}
          title={battle.left.title}
          playerName={battle.left.playerName}
          onVoted={justVoted === 'left'}
          midValue={valuations?.left?.mid ?? null}
        />

        <VsDivider />

        <CardImage
          imageUrl={battle.right.imageUrl}
          title={battle.right.title}
          playerName={battle.right.playerName}
          onVoted={justVoted === 'right'}
          midValue={valuations?.right?.mid ?? null}
        />
      </div>

      {/* Swipe hint — only on first card, fades out */}
      {showSwipeHint && <SwipeHint />}

      {/* Voting area */}
      <div className="px-4 pb-4">
        {battle.status === 'live' ? (
          <VoteButtons
            categories={categories}
            localVotes={localVotes}
            localPercents={localPercents}
            voting={voting}
            onVoteLeft={(cat) => handleVote(cat, 'left')}
            onVoteRight={(cat) => handleVote(cat, 'right')}
            leftPlayerName={battle.left.playerName ?? 'Left card'}
            rightPlayerName={battle.right.playerName ?? 'Right card'}
          />
        ) : (
          <div className="text-center py-3">
            <Badge variant="default">Battle Ended</Badge>
            {battle.result && (
              <p className="text-xs text-[#64748b] mt-1">
                Winner: {(battle.result as { overall?: { winner?: string } }).overall?.winner ?? 'draw'}
              </p>
            )}
          </div>
        )}

        {/* Sponsor CTA — full-width banner */}
        {battle.isSponsored && battle.sponsorCta && (
          <a
            href={(battle.sponsorCta as { url: string; label: string }).url}
            onClick={() => { import("../../lib/analytics").then(m => m.trackSponsorClick(battle.id, (battle.sponsorCta as { url: string; label: string }).url)); }}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0a0a0f', boxShadow: '0 2px 12px rgba(245,158,11,0.3)' }}
          >
            <span>🏷️</span>
            <span>{(battle.sponsorCta as { url: string; label: string }).label}</span>
            <span>→</span>
          </a>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e1e2e]">
          <Link
            href={`/battles/${battle.id}`}
            className="text-xs text-[#64748b] hover:text-[#6c47ff] transition-colors"
          >
            View details →
          </Link>
          {battle.createdByUsername && (
            <span className="text-xs text-[#374151]">by {battle.createdByUsername}</span>
          )}
        </div>
      </div>
    </article>
  );
}
