'use client';
import { use, useState } from 'react';
import { useBattle } from '../../../../hooks/useBattles';
import { BattleCard } from '../../../../components/battle/BattleCard';
import { PageSpinner } from '../../../../components/ui/LoadingSpinner';
import { Flag, Copy, Check } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { battles as battlesApi } from '../../../../lib/api';

export default function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: battle, isLoading } = useBattle(id);
  const [reported, setReported] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (navigator.share) {
        await navigator.share({ title: battle?.title, url });
      }
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
        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(108, 71, 255, 0.1)',
            border: copied ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(108, 71, 255, 0.3)',
            color: copied ? '#22c55e' : '#6c47ff',
          }}
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={14} />
              Share Battle
            </>
          )}
        </button>

        {battle.sponsorCta && (
          <a
            href={(battle.sponsorCta as { url: string; label: string }).url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-sm font-semibold rounded-xl hover:bg-[#f59e0b]/15 transition-colors"
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

      {/* Stats panel */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: '#12121a',
          border: '1px solid #1e1e2e',
        }}
      >
        <h2 className="text-sm font-bold text-[#94a3b8] uppercase tracking-wider">Battle Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-2xl font-black text-white">
              {battle.totalVotesCached?.toLocaleString() ?? '0'}
            </p>
            <p className="text-xs text-[#64748b] mt-0.5">Total Votes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: battle.status === 'live' ? '#22c55e' : '#6c47ff' }}>
              {battle.status === 'live' ? '🟢 Live' : '⚡ Ended'}
            </p>
            <p className="text-xs text-[#64748b] mt-0.5">Status</p>
          </div>
        </div>
      </div>
    </div>
  );
}
