'use client';
import { useEffect, useState } from 'react';

type PricePoint = { date: string; price: number };
type PriceHistory = {
  cardId: string;
  playerName: string;
  points: PricePoint[];
  high: number;
  low: number;
  current: number;
  changePct: number;
  trend: string;
};

export function PriceHistoryChart({ cardId }: { cardId: string }) {
  const [data, setData] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';
    fetch(`${base}/cards/${cardId}/price-history`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cardId]);

  if (loading) return <div className="h-32 bg-[#12121a] rounded-xl animate-pulse" />;
  if (!data) return null;

  const W = 400, H = 80;
  const prices = data.points.map(p => p.price);
  const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1;
  const pts = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * W;
      const y = H - ((p - min) / range) * H;
      return `${x},${y}`;
    })
    .join(' ');

  const color = data.trend === 'up' ? '#22c55e' : '#ef4444';

  return (
    <div className="bg-[#12121a] rounded-xl p-4 border border-[#1e1e2e]">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-[#94a3b8]">30-Day Price History</span>
        <span
          className={`text-sm font-bold ${
            data.trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {data.trend === 'up' ? '↑' : '↓'} {Math.abs(data.changePct)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id={`grad-${cardId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Fill area under the line */}
        <polygon
          points={`0,${H} ${pts} ${W},${H}`}
          fill={`url(#grad-${cardId})`}
        />
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between text-xs text-[#64748b] mt-2">
        <span>Low: ${data.low.toLocaleString()}</span>
        <span className="font-bold text-white">${data.current.toLocaleString()}</span>
        <span>High: ${data.high.toLocaleString()}</span>
      </div>
      <p className="text-[10px] text-[#475569] mt-1 text-center">
        Simulated data for demo
      </p>
    </div>
  );
}
