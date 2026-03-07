'use client';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface VintageData {
  cardId: string;
  playerName: string;
  year: number;
  age: number;
  era: string;
  eraRange: string;
  eraDescription: string;
  agePremium: number;
  estimatedValueWithAge: number;
  milestones: { age: number; label: string; reached: boolean }[];
  nextMilestone: number | null;
  yearsToNextMilestone: number | null;
}

const ERA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Pre-War':  { bg: 'rgba(245,158,11,0.15)',  text: '#f59e0b', border: 'rgba(245,158,11,0.4)' },
  'Vintage':  { bg: 'rgba(168,85,247,0.15)',  text: '#a855f7', border: 'rgba(168,85,247,0.4)' },
  'Junk Wax': { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.4)' },
  'Modern':   { bg: 'rgba(34,197,94,0.15)',   text: '#22c55e', border: 'rgba(34,197,94,0.4)' },
  'Current':  { bg: 'rgba(108,71,255,0.15)',  text: '#a78bfa', border: 'rgba(108,71,255,0.4)' },
};

const MILESTONE_EMOJI: Record<string, string> = {
  'Silver Anniversary': '🥈',
  'Golden Anniversary': '🥇',
  'Diamond Anniversary': '💎',
  'Centenarian': '🏛️',
};

function VintageCard({ cardId, label }: { cardId: string; label: string }) {
  const [data, setData] = useState<VintageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/cards/${cardId}/vintage`)
      .then(r => r.json())
      .then((d: VintageData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cardId]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-4">
      <div className="w-4 h-4 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const eraStyle = ERA_COLORS[data.era] || ERA_COLORS['Current'];
  const reachedMilestones = data.milestones.filter(m => m.reached);

  return (
    <div className="flex-1 min-w-0 space-y-2">
      <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest truncate">{label}</p>

      {/* Era Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[11px] font-black px-2 py-0.5 rounded-full"
          style={{ background: eraStyle.bg, color: eraStyle.text, border: `1px solid ${eraStyle.border}` }}
        >
          {data.era}
        </span>
        <span className="text-[10px] text-[#64748b]">{data.eraRange}</span>
      </div>

      {/* Age */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-white">{data.age}</span>
        <span className="text-xs text-[#64748b]">yrs old</span>
        <span className="text-[11px] font-bold ml-1" style={{ color: '#a78bfa' }}>
          {data.agePremium}× premium
        </span>
      </div>

      {/* Est. value */}
      <p className="text-xs text-[#64748b]">
        Est. value: <span className="text-white font-bold">
          ${data.estimatedValueWithAge >= 1000
            ? `${(data.estimatedValueWithAge / 1000).toFixed(1)}k`
            : data.estimatedValueWithAge}
        </span>
      </p>

      {/* Milestones reached */}
      {reachedMilestones.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {reachedMilestones.map(m => (
            <span
              key={m.label}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
              title={m.label}
            >
              {MILESTONE_EMOJI[m.label]} {m.label}
            </span>
          ))}
        </div>
      )}

      {/* Next milestone */}
      {data.yearsToNextMilestone !== null && (
        <p className="text-[10px] text-[#64748b]">
          Next milestone in <span className="text-white font-bold">{data.yearsToNextMilestone}y</span>
        </p>
      )}

      {/* Era description */}
      <p className="text-[10px] text-[#374151] italic">{data.eraDescription}</p>
    </div>
  );
}

export function VintageInfoSection({
  leftCardId, rightCardId,
  leftLabel, rightLabel,
}: {
  leftCardId: string; rightCardId: string;
  leftLabel: string; rightLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1e1e2e]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🕰️</span>
          <h3 className="text-sm font-bold text-white">Vintage Info</h3>
          <span className="text-[10px] text-[#64748b]">Card age & era analysis</span>
        </div>
        <ChevronDown
          size={16}
          className="text-[#64748b] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1e1e2e] pt-3">
          <div className="flex gap-4">
            <VintageCard cardId={leftCardId} label={leftLabel} />
            <div className="w-px bg-[#1e1e2e]" />
            <VintageCard cardId={rightCardId} label={rightLabel} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Standalone vintage card for player profile pages */
export function VintageProfileCard({ cardId }: { cardId: string }) {
  const [data, setData] = useState<VintageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/cards/${cardId}/vintage`)
      .then(r => r.json())
      .then((d: VintageData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cardId]);

  if (loading) return (
    <div className="rounded-xl border border-[#1e1e2e] p-4 text-center" style={{ background: '#12121a' }}>
      <div className="w-5 h-5 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );

  if (!data) return null;

  const eraStyle = ERA_COLORS[data.era] || ERA_COLORS['Current'];
  const reachedMilestones = data.milestones.filter(m => m.reached);

  return (
    <div className="rounded-xl border border-[#1e1e2e] p-4 space-y-3" style={{ background: '#12121a' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🕰️</span>
          <h3 className="text-sm font-bold text-white">Vintage Info</h3>
        </div>
        <span
          className="text-[11px] font-black px-2 py-0.5 rounded-full"
          style={{ background: eraStyle.bg, color: eraStyle.text, border: `1px solid ${eraStyle.border}` }}
        >
          {data.era}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e]">
          <p className="text-2xl font-black text-white">{data.age}</p>
          <p className="text-[10px] text-[#64748b]">Years Old</p>
        </div>
        <div className="bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e]">
          <p className="text-2xl font-black" style={{ color: '#a78bfa' }}>{data.agePremium}×</p>
          <p className="text-[10px] text-[#64748b]">Age Premium</p>
        </div>
      </div>

      <p className="text-xs text-[#64748b]">{data.eraDescription}</p>

      {reachedMilestones.length > 0 && (
        <div>
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-semibold mb-1.5">Milestones</p>
          <div className="flex flex-wrap gap-1.5">
            {reachedMilestones.map(m => (
              <span
                key={m.label}
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                {MILESTONE_EMOJI[m.label]} {m.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.yearsToNextMilestone !== null && (
        <p className="text-xs text-[#64748b]">
          Next milestone: <span className="text-white font-bold">{data.yearsToNextMilestone} years</span> away
        </p>
      )}
    </div>
  );
}
