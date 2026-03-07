'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';
import { BackButton } from '../../../components/ui/BackButton';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface TimelinePoint {
  date: string;
  value: number;
}

interface CardDetail {
  id: string;
  player_name: string;
  image_url: string;
  title: string;
  year: number;
  sport: string;
  estimatedValue: number;
  change: number;
}

interface PortfolioData {
  totalValue: number;
  cardCount: number;
  watchlistCount: number;
  timeline: TimelinePoint[];
  topCard: CardDetail | null;
  cards: CardDetail[];
  change30d: number;
}

function PortfolioChart({ timeline }: { timeline: TimelinePoint[] }) {
  if (!timeline || timeline.length < 2) return null;
  const W = 400, H = 100;
  const values = timeline.map(p => p.value);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  const firstVal = values[0];
  const lastVal = values[values.length - 1];
  const isUp = lastVal >= firstVal;
  const color = isUp ? '#22c55e' : '#ef4444';
  const gradId = 'portfolio-grad';

  // Close path for fill
  const fillPts = [
    `0,${H}`,
    ...values.map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 10) - 5;
      return `${x},${y}`;
    }),
    `${W},${H}`,
  ].join(' ');

  return (
    <div className="rounded-xl overflow-hidden border border-[#1e1e2e]" style={{ background: '#12121a' }}>
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-[#64748b] uppercase tracking-wider font-semibold">30-Day Portfolio Value</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={fillPts} fill={`url(#${gradId})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between px-4 pb-3">
        <span className="text-[10px] text-[#64748b]">{timeline[0]?.date}</span>
        <span className="text-[10px] text-[#64748b]">{timeline[timeline.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function formatVal(v: number) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v}`;
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`${BASE}/me/portfolio`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <span className="text-5xl">💼</span>
        <p className="text-white font-bold text-lg">Sign in to view your portfolio</p>
        <Link href="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}>
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-8">
        <BackButton />
        <div className="h-8 w-48 bg-[#12121a] rounded-xl animate-pulse" />
        <div className="h-32 bg-[#12121a] rounded-xl animate-pulse" />
        <div className="h-28 bg-[#12121a] rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-[#12121a] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isPositive = (data?.change30d ?? 0) >= 0;

  return (
    <div className="space-y-4 pb-8">
      <BackButton />
      <div>
        <h1 className="text-2xl font-black text-white">💼 My Portfolio</h1>
        <p className="text-sm text-[#64748b] mt-1">Estimated collection value</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#1e1e2e] p-4 text-center" style={{ background: '#12121a' }}>
          <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Total Value</p>
          <p className="text-lg font-black text-white">{formatVal(data?.totalValue ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-[#1e1e2e] p-4 text-center" style={{ background: '#12121a' }}>
          <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">30d Change</p>
          <p
            className="text-lg font-black flex items-center justify-center gap-1"
            style={{ color: isPositive ? '#22c55e' : '#ef4444' }}
          >
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {data?.change30d ?? 0}%
          </p>
        </div>
        <div className="rounded-2xl border border-[#1e1e2e] p-4 text-center" style={{ background: '#12121a' }}>
          <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Cards</p>
          <p className="text-lg font-black text-white">{data?.cardCount ?? 0}</p>
        </div>
      </div>

      {/* Chart */}
      {data && data.timeline.length > 0 && <PortfolioChart timeline={data.timeline} />}

      {/* Empty state */}
      {data && data.cardCount === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center rounded-2xl border border-[#1e1e2e]" style={{ background: '#12121a' }}>
          <span className="text-4xl">💼</span>
          <p className="text-white font-bold">No cards in your collection</p>
          <p className="text-[#64748b] text-sm max-w-xs">
            Add cards to your collection to track portfolio value
          </p>
          <Link
            href="/collection"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white mt-2"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
          >
            Browse Collection
          </Link>
        </div>
      )}

      {/* Top card spotlight */}
      {data?.topCard && (
        <div className="rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
          <div className="px-4 py-3 border-b border-[#1e1e2e]">
            <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">⭐ Top Card by Value</p>
          </div>
          <div className="flex gap-4 p-4">
            <img
              src={data.topCard.image_url}
              alt={data.topCard.player_name}
              className="w-20 h-28 object-cover rounded-xl border border-[#1e1e2e]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  `https://placehold.co/80x112/12121a/6c47ff?text=${encodeURIComponent(data.topCard?.player_name ?? '?')}`;
              }}
            />
            <div className="flex-1 space-y-1">
              <p className="text-base font-black text-white">{data.topCard.player_name}</p>
              <p className="text-xs text-[#64748b]">{data.topCard.sport} · {data.topCard.year}</p>
              <p className="text-xl font-black mt-2" style={{ color: '#6c47ff' }}>
                {formatVal(data.topCard.estimatedValue)}
              </p>
              <p
                className="text-xs font-bold"
                style={{ color: (data.topCard.change ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}
              >
                {(data.topCard.change ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(Math.round((data.topCard.change ?? 0) * 100))}% today
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {data && data.cards.length > 0 && (
        <div>
          <h2 className="text-sm font-black text-white mb-3">All Cards</h2>
          <div className="grid grid-cols-2 gap-3">
            {(data.cards as CardDetail[]).map((card) => (
              <div
                key={card.id}
                className="rounded-2xl border border-[#1e1e2e] overflow-hidden"
                style={{ background: '#12121a' }}
              >
                <img
                  src={card.image_url}
                  alt={card.player_name}
                  className="w-full aspect-[3/4] object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      `https://placehold.co/300x400/12121a/6c47ff?text=${encodeURIComponent(card.player_name ?? '?')}`;
                  }}
                />
                <div className="p-3">
                  <p className="text-xs font-bold text-white truncate">{card.player_name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-black" style={{ color: '#6c47ff' }}>{formatVal(card.estimatedValue)}</p>
                    <p
                      className="text-[10px] font-bold"
                      style={{ color: (card.change ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}
                    >
                      {(card.change ?? 0) >= 0 ? '↑' : '↓'}{Math.abs(Math.round((card.change ?? 0) * 100))}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data?.cardCount && (
        <div className="text-center">
          <Link href="/feed" className="text-xs text-[#6c47ff] hover:underline">
            Browse battles to save cards →
          </Link>
        </div>
      )}
    </div>
  );
}
