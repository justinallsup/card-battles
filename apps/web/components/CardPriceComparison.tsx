'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface CardPrice {
  cardId: string;
  playerName: string;
  imageUrl: string;
  year: number;
  psa10: number;
  psa9: number;
  psa8: number;
  raw: number;
  trend: 'up' | 'down';
  changePct: number;
}

interface Props {
  leftCardId?: string;
  rightCardId?: string;
  leftPlayerName?: string;
  rightPlayerName?: string;
}

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

export function CardPriceComparison({ leftCardId, rightCardId, leftPlayerName, rightPlayerName }: Props) {
  const [prices, setPrices] = useState<CardPrice[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ids = [leftCardId, rightCardId].filter(Boolean);
    if (!ids.length) return;
    setLoading(true);
    fetch(`${BASE_URL}/cards/batch-prices?ids=${ids.join(',')}`)
      .then(r => r.json())
      .then(data => {
        if (data.prices) setPrices(data.prices);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [leftCardId, rightCardId]);

  if (dismissed || (!leftCardId && !rightCardId)) return null;

  const left = prices.find(p => p.cardId === leftCardId);
  const right = prices.find(p => p.cardId === rightCardId);

  const compareIds = [leftCardId, rightCardId].filter(Boolean).join(',');

  return (
    <div
      className="fixed bottom-20 right-3 z-50 w-[340px] rounded-xl border border-[#2a2a3e] shadow-2xl overflow-hidden"
      style={{ background: '#12121a' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        style={{ background: '#1a1a2e', borderBottom: collapsed ? 'none' : '1px solid #2a2a3e' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">💰 Price Compare</span>
          {loading && <span className="text-[10px] text-[#94a3b8] animate-pulse">Loading…</span>}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/compare?ids=${compareIds}`}
            onClick={e => e.stopPropagation()}
            className="text-[10px] text-[#6c47ff] hover:underline flex items-center gap-1"
          >
            Full <ExternalLink size={10} />
          </Link>
          {collapsed ? <ChevronUp size={14} className="text-[#94a3b8]" /> : <ChevronDown size={14} className="text-[#94a3b8]" />}
          <button
            onClick={e => { e.stopPropagation(); setDismissed(true); }}
            className="text-[#94a3b8] hover:text-white ml-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-3">
          {loading && !prices.length ? (
            <div className="text-center py-4 text-[#94a3b8] text-xs">Loading prices…</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {/* Left card */}
              <PriceCard data={left} fallbackName={leftPlayerName} side="left" />
              {/* Right card */}
              <PriceCard data={right} fallbackName={rightPlayerName} side="right" />
            </div>
          )}

          {/* Comparison row */}
          {left && right && (
            <div className="mt-3 pt-3 border-t border-[#2a2a3e]">
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">PSA 10 Difference</div>
              <div className="flex items-center gap-2">
                <div className="text-xs font-bold" style={{ color: left.psa10 > right.psa10 ? '#22c55e' : '#94a3b8' }}>
                  {left.playerName?.split(' ').pop()}
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-[#1e1e2e] relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(left.psa10 / (left.psa10 + right.psa10)) * 100}%`,
                      background: 'linear-gradient(90deg,#6c47ff,#8b5cf6)'
                    }}
                  />
                </div>
                <div className="text-xs font-bold" style={{ color: right.psa10 > left.psa10 ? '#22c55e' : '#94a3b8' }}>
                  {right.playerName?.split(' ').pop()}
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-[#94a3b8] mt-1">
                <span>{fmt(left.psa10)}</span>
                <span className="font-bold text-[#f1f5f9]">
                  {left.psa10 > right.psa10
                    ? `+${fmt(left.psa10 - right.psa10)} more`
                    : left.psa10 < right.psa10
                      ? `+${fmt(right.psa10 - left.psa10)} more`
                      : 'Equal'}
                </span>
                <span>{fmt(right.psa10)}</span>
              </div>
            </div>
          )}

          <Link
            href={`/compare?ids=${compareIds}`}
            className="mt-3 flex items-center justify-center gap-1 w-full py-2 rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)' }}
          >
            Open Full Comparison <ExternalLink size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}

function PriceCard({ data, fallbackName, side }: { data?: CardPrice; fallbackName?: string; side: 'left' | 'right' }) {
  const name = data?.playerName ?? fallbackName ?? (side === 'left' ? 'Left Card' : 'Right Card');
  const trendUp = data?.trend === 'up';

  return (
    <div className="rounded-lg p-2.5 border border-[#2a2a3e]" style={{ background: '#0d0d1a' }}>
      {/* Player name + trend */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-bold text-white truncate flex-1">{name.split(' ').pop()}</div>
        {data && (
          <div className={`flex items-center gap-0.5 text-[11px] font-bold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trendUp ? '↑' : '↓'} {Math.abs(data.changePct)}%
          </div>
        )}
      </div>

      {data ? (
        <div className="space-y-1">
          <PriceRow label="PSA 10" value={data.psa10} highlight />
          <PriceRow label="PSA 9" value={data.psa9} />
          <PriceRow label="PSA 8" value={data.psa8} />
          <PriceRow label="Raw" value={data.raw} />
        </div>
      ) : (
        <div className="text-[10px] text-[#94a3b8]">No data</div>
      )}
    </div>
  );
}

function PriceRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-[10px] ${highlight ? 'text-[#a78bfa] font-bold' : 'text-[#94a3b8]'}`}>{label}</span>
      <span className={`text-[10px] font-bold ${highlight ? 'text-white' : 'text-[#cbd5e1]'}`}>{fmt(value)}</span>
    </div>
  );
}
