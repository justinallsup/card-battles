'use client';
import { useState, useEffect } from 'react';
import type { Battle } from '@card-battles/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface SoldComp {
  grade: number;
  price: number;
  platform: string;
  soldAt: string;
  certNumber: string;
  url: string;
}

interface CompsData {
  cardId: string;
  playerName: string;
  year: number;
  comps: SoldComp[];
  avgPsa10: number;
  highSale: number;
  lowSale: number;
  totalSales: number;
  note: string;
}

function GradeBadge({ grade }: { grade: number }) {
  const colors: Record<number, { bg: string; text: string }> = {
    10: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
    9: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
    8: { bg: 'rgba(234,179,8,0.15)', text: '#eab308' },
    7: { bg: 'rgba(249,115,22,0.15)', text: '#f97316' },
  };
  const style = colors[grade] || { bg: 'rgba(100,116,139,0.15)', text: '#64748b' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black"
      style={{ background: style.bg, color: style.text }}
    >
      PSA {grade}
    </span>
  );
}

function CompsTable({ comps }: { comps: SoldComp[] }) {
  if (comps.length === 0) {
    return (
      <div className="py-8 text-center text-[#64748b] text-sm">
        No sales found for this grade
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e1e2e]">
            <th className="text-left py-2 px-3 text-[#64748b] font-semibold text-xs">Grade</th>
            <th className="text-left py-2 px-3 text-[#64748b] font-semibold text-xs">Price</th>
            <th className="text-left py-2 px-3 text-[#64748b] font-semibold text-xs">Platform</th>
            <th className="text-left py-2 px-3 text-[#64748b] font-semibold text-xs">Date</th>
            <th className="text-left py-2 px-3 text-[#64748b] font-semibold text-xs">Cert #</th>
          </tr>
        </thead>
        <tbody>
          {comps.map((comp, i) => (
            <tr
              key={i}
              className="border-b border-[#1e1e2e] hover:bg-[#1e1e2e]/40 transition-colors"
            >
              <td className="py-2.5 px-3">
                <GradeBadge grade={comp.grade} />
              </td>
              <td className="py-2.5 px-3 font-bold text-white">
                ${comp.price.toLocaleString()}
              </td>
              <td className="py-2.5 px-3 text-[#94a3b8]">{comp.platform}</td>
              <td className="py-2.5 px-3 text-[#64748b]">{comp.soldAt}</td>
              <td className="py-2.5 px-3 text-[#64748b] font-mono text-xs">{comp.certNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardComps({ cardId }: { cardId: string }) {
  const [data, setData] = useState<CompsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<'all' | 10 | 9 | 8>('all');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${BASE_URL}/cards/${cardId}/sold-comps`)
      .then(r => r.json())
      .then((d: CompsData) => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load sales data'); setLoading(false); });
  }, [cardId]);

  if (loading) {
    return (
      <div className="py-8 text-center text-[#64748b] text-sm">
        Loading sales data…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="py-8 text-center text-[#ef4444] text-sm">
        {error || 'No data available'}
      </div>
    );
  }

  const filtered = gradeFilter === 'all' ? data.comps : data.comps.filter(c => c.grade === gradeFilter);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
          <p className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wide">Avg PSA 10</p>
          <p className="text-xl font-black text-[#22c55e]">${data.avgPsa10.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-3 border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
          <p className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wide">High Sale</p>
          <p className="text-xl font-black text-white">${data.highSale.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-3 border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
          <p className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wide">Low Sale</p>
          <p className="text-xl font-black text-white">${data.lowSale.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-3 border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
          <p className="text-[10px] text-[#64748b] font-semibold uppercase tracking-wide"># Sales</p>
          <p className="text-xl font-black text-white">{data.totalSales}</p>
        </div>
      </div>

      {/* Grade filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 10, 9, 8] as const).map(g => (
          <button
            key={g}
            onClick={() => setGradeFilter(g)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={gradeFilter === g
              ? { background: 'rgba(108,71,255,0.2)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.4)' }
              : { background: '#1e1e2e', color: '#64748b', border: '1px solid #1e1e2e' }
            }
          >
            {g === 'all' ? 'All Grades' : `PSA ${g}`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#0a0a0f' }}>
        <CompsTable comps={filtered} />
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-[#64748b] text-center italic">
        ⚠️ {data.note}
      </p>
    </div>
  );
}

interface SoldCompsPanelProps {
  battle: Battle;
}

export function SoldCompsPanel({ battle }: SoldCompsPanelProps) {
  const [activeCard, setActiveCard] = useState<'left' | 'right'>('left');

  const leftId = (battle.left as unknown as Record<string, string>).id || '';
  const rightId = (battle.right as unknown as Record<string, string>).id || '';
  const leftName = battle.left.playerName ?? 'Left Card';
  const rightName = battle.right.playerName ?? 'Right Card';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔨</span>
        <h3 className="text-base font-black text-white">Sold Comps</h3>
      </div>
      <p className="text-xs text-[#64748b]">
        Recent comparable sales to help you understand market value.
      </p>

      {/* Card selector */}
      <div className="flex rounded-xl overflow-hidden border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
        <button
          onClick={() => setActiveCard('left')}
          className="flex-1 py-2 text-sm font-bold transition-all"
          style={activeCard === 'left'
            ? { background: 'rgba(108,71,255,0.15)', color: '#a78bfa', borderBottom: '2px solid #6c47ff' }
            : { color: '#64748b' }
          }
        >
          {leftName}
        </button>
        <button
          onClick={() => setActiveCard('right')}
          className="flex-1 py-2 text-sm font-bold transition-all"
          style={activeCard === 'right'
            ? { background: 'rgba(108,71,255,0.15)', color: '#a78bfa', borderBottom: '2px solid #6c47ff' }
            : { color: '#64748b' }
          }
        >
          {rightName}
        </button>
      </div>

      {/* Card comps content */}
      {activeCard === 'left' && leftId && <CardComps cardId={leftId} />}
      {activeCard === 'right' && rightId && <CardComps cardId={rightId} />}
      {activeCard === 'left' && !leftId && (
        <p className="text-center text-[#64748b] py-4 text-sm">Card ID not available</p>
      )}
      {activeCard === 'right' && !rightId && (
        <p className="text-center text-[#64748b] py-4 text-sm">Card ID not available</p>
      )}
    </div>
  );
}
