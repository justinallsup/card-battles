'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

interface Mover {
  playerName: string;
  sport: string;
  imageUrl: string;
  totalVotes: number;
  recentVotes: number;
  estimatedValue: number;
  changePct: number;
  trend: 'up' | 'down';
}

interface MoversData {
  gainers: Mover[];
  losers: Mover[];
  mostActive: Mover[];
  updatedAt: string;
}

type TabKey = 'gainers' | 'losers' | 'mostActive';

const SPORT_LABELS: Record<string, string> = { nfl: '🏈', nba: '🏀', mlb: '⚾', nhl: '🏒', soccer: '⚽' };
const SPORT_COLORS: Record<string, string> = { nfl: '#ef4444', nba: '#f59e0b', mlb: '#22c55e', nhl: '#3b82f6', soccer: '#6c47ff' };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function MoverCard({ mover, showChange = true, showActive = false }: { mover: Mover; showChange?: boolean; showActive?: boolean }) {
  const isUp = mover.trend === 'up';
  const changeColor = isUp ? '#22c55e' : '#ef4444';
  const changeBg = isUp ? '#22c55e15' : '#ef444415';

  return (
    <Link href={`/players/${encodeURIComponent(mover.playerName)}`} className="block">
      <div
        className="flex items-center gap-3 p-3 rounded-2xl border border-[#1e1e2e] transition-all active:scale-95"
        style={{ background: '#12121a' }}
      >
        {/* Card image */}
        <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#1e1e2e] relative">
          {mover.imageUrl && (
            <img
              src={mover.imageUrl}
              alt={mover.playerName}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          {!mover.imageUrl && (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {SPORT_LABELS[mover.sport] || '🃏'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{mover.playerName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: SPORT_COLORS[mover.sport] || '#6c47ff', color: 'white' }}
            >
              {SPORT_LABELS[mover.sport] || '🃏'} {mover.sport?.toUpperCase()}
            </span>
            <span className="text-[#64748b] text-[10px]">${mover.estimatedValue.toLocaleString()} PSA 10</span>
          </div>
          {showActive && (
            <p className="text-[#94a3b8] text-xs mt-0.5">
              <span className="text-[#6c47ff] font-bold">{mover.recentVotes}</span> votes in 24h
            </p>
          )}
        </div>

        {/* Change */}
        {showChange && (
          <div
            className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: changeBg }}
          >
            {isUp ? <TrendingUp size={14} color={changeColor} /> : <TrendingDown size={14} color={changeColor} />}
            <span className="text-xs font-black" style={{ color: changeColor }}>
              {isUp ? '+' : ''}{mover.changePct}%
            </span>
          </div>
        )}
        {showActive && (
          <div className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl bg-[#6c47ff15]">
            <Zap size={14} color="#6c47ff" />
            <span className="text-xs font-black text-[#6c47ff]">{mover.totalVotes}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'gainers', label: 'Gainers', icon: '📈' },
  { key: 'losers', label: 'Losers', icon: '📉' },
  { key: 'mostActive', label: 'Most Active', icon: '⚡' },
];

export default function MarketMoversPage() {
  const [tab, setTab] = useState<TabKey>('gainers');

  useEffect(() => { document.title = '📊 Market Movers | Card Battles'; }, []);

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery<MoversData>({
    queryKey: ['market-movers'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/market/movers`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const items = data ? data[tab] : [];
  const updatedAt = data?.updatedAt ? timeAgo(data.updatedAt) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            📊 Market Movers
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            {updatedAt ? `Updated ${updatedAt}` : 'Card value momentum'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl border border-[#1e1e2e] text-[#64748b] hover:text-white transition-colors"
          style={{ background: '#12121a' }}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t.key ? 'text-white' : 'text-[#64748b] border border-[#1e1e2e]'
            }`}
            style={tab === t.key ? { background: 'linear-gradient(135deg, #6c47ff 0%, #9b7aff 100%)' } : { background: '#12121a' }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      {tab !== 'mostActive' && (
        <div className="flex items-center gap-4 text-xs text-[#64748b]">
          <span className="flex items-center gap-1"><TrendingUp size={12} className="text-[#22c55e]" /> Gaining momentum</span>
          <span className="flex items-center gap-1"><TrendingDown size={12} className="text-[#ef4444]" /> Losing momentum</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-[#12121a] animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-10 text-[#64748b]">
          <p className="text-2xl mb-2">📉</p>
          <p>Failed to load market data</p>
          <button onClick={() => refetch()} className="mt-3 px-4 py-2 rounded-xl bg-[#6c47ff] text-white text-sm font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Movers list */}
      {!isLoading && !error && (
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="text-center py-10 text-[#64748b]">
              <p className="text-2xl mb-2">📊</p>
              <p>No data available yet — cast some votes!</p>
            </div>
          )}
          {items.map((mover, i) => (
            <div key={`${mover.playerName}-${i}`} className="flex items-center gap-2">
              <span className="text-[#64748b] text-sm font-bold w-5 text-center">{i + 1}</span>
              <div className="flex-1">
                <MoverCard mover={mover} showChange={tab !== 'mostActive'} showActive={tab === 'mostActive'} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back to market */}
      <div className="text-center pt-2">
        <a href="/market" className="text-[#6c47ff] text-sm font-semibold hover:underline">
          ← Back to Market
        </a>
      </div>
    </div>
  );
}
