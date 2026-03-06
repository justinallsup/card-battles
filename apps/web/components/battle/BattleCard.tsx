'use client';
import Link from 'next/link';
import Image from 'next/image';
import { formatNumber } from '../../lib/utils';
import { BattleTimer } from './BattleTimer';
import { VoteButtons } from './VoteButtons';
import { useVote } from '../../hooks/useVote';
import type { Battle, VoteChoice } from '@card-battles/types';
import { Badge } from '../ui/Badge';

interface BattleCardProps {
  battle: Battle;
  compact?: boolean;
}

function CardImage({ imageUrl, title, playerName }: { imageUrl: string; title: string; playerName?: string | null }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1e1e2e] border border-[#252535]">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 480px) 45vw, 200px"
          unoptimized
        />
      </div>
      <p className="mt-2 text-xs text-[#94a3b8] leading-tight text-center px-1 line-clamp-2">
        {title}
      </p>
    </div>
  );
}

export function BattleCard({ battle, compact = false }: BattleCardProps) {
  const { localVotes, localPercents, vote, voting } = useVote(
    battle.id,
    battle.myVotes as Record<string, VoteChoice>
  );

  const categories = battle.categories as string[];

  return (
    <article className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          {battle.isSponsored && <Badge variant="sponsored">Sponsored</Badge>}
          <h3 className="text-sm font-bold text-[#f1f5f9] truncate">{battle.title}</h3>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <span className="text-xs text-[#64748b]">{formatNumber(battle.totalVotesCached)} votes</span>
          <BattleTimer endsAt={battle.endsAt} />
        </div>
      </div>

      {/* Cards */}
      <div className="flex items-start gap-2 px-4 py-3">
        <CardImage
          imageUrl={battle.left.imageUrl}
          title={battle.left.title}
          playerName={battle.left.playerName}
        />

        <div className="flex items-center justify-center w-8 flex-shrink-0 mt-8">
          <span className="text-xs font-black text-[#374151] bg-[#0a0a0f] rounded-full w-7 h-7 flex items-center justify-center border border-[#1e1e2e]">
            VS
          </span>
        </div>

        <CardImage
          imageUrl={battle.right.imageUrl}
          title={battle.right.title}
          playerName={battle.right.playerName}
        />
      </div>

      {/* Voting area */}
      <div className="px-4 pb-4">
        {battle.status === 'live' ? (
          <VoteButtons
            categories={categories}
            localVotes={localVotes}
            localPercents={localPercents}
            voting={voting}
            onVoteLeft={(cat) => vote(cat, 'left')}
            onVoteRight={(cat) => vote(cat, 'right')}
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

        {/* Sponsor CTA */}
        {battle.isSponsored && battle.sponsorCta && (
          <a
            href={(battle.sponsorCta as { url: string; label: string }).url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 py-2 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-sm font-semibold hover:bg-[#f59e0b]/15 transition-colors"
          >
            {(battle.sponsorCta as { url: string; label: string }).label} →
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
