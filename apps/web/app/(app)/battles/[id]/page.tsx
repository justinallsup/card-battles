'use client';
import { use } from 'react';
import { useBattle } from '../../../../hooks/useBattles';
import { BattleCard } from '../../../../components/battle/BattleCard';
import { PageSpinner } from '../../../../components/ui/LoadingSpinner';
import { Share2, Flag } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { battles as battlesApi } from '../../../../lib/api';
import { useState } from 'react';

export default function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: battle, isLoading } = useBattle(id);
  const [reported, setReported] = useState(false);

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
