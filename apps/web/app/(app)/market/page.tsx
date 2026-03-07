'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Filter, ArrowUpDown } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface MarketItem {
  cardId: string;
  title: string;
  playerName: string;
  year: number;
  sport: string;
  imageUrl: string;
  currentPrice: number;
  change: number;
  changePct: number;
  trend: 'up' | 'down' | 'stable';
  volume: number;
  lastSale: string;
}

interface TopMover {
  playerName: string;
  change: number;
  price: number;
}

type SportFilter = 'all' | 'nfl' | 'nba' | 'mlb';
type SortMode = 'gainers' | 'losers' | 'active';

const SPORT_TABS: { value: SportFilter; label: string }[] = [
  { value: 'all', label: '🏆 All' },
  { value: 'nfl', label: '🏈 NFL' },
  { value: 'nba', label: '🏀 NBA' },
  { value: 'mlb', label: '⚾ MLB' },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'gainers', label: 'Biggest Gainers' },
  { value: 'losers', label: 'Biggest Losers' },
  { value: 'active', label: 'Most Active' },
];

function TrendIcon({ trend, size = 14 }: { trend: string; size?: number }) {
  if (trend === 'up') return <TrendingUp size={size} className="text-[#22c55e]" />;
  if (trend === 'down') return <TrendingDown size={size} className="text-[#ef4444]" />;
  return <Minus size={size} className="text-[#64748b]" />;
}

function ChangeLabel({ change, changePct }: { change: number; changePct: number }) {
  const color = change > 0 ? 'text-[#22c55e]' : change < 0 ? 'text-[#ef4444]' : 'text-[#64748b]';
  const sign = change > 0 ? '+' : '';
  return (
    <span className={`${color} text-xs font-bold tabular-nums`}>
      {sign}${Math.abs(change)} ({sign}{changePct}%)
    </span>
  );
}

function TopMoverChip({ mover, isGainer }: { mover: TopMover; isGainer: boolean }) {
  const color = isGainer ? 'text-[#22c55e]' : 'text-[#ef4444]';
  const bg = isGainer ? 'bg-[#22c55e]/10 border-[#22c55e]/25' : 'bg-[#ef4444]/10 border-[#ef4444]/25';
  const sign = isGainer ? '+' : '';
  return (
    <div className={`flex-shrink-0 px-3 py-2 rounded-xl border ${bg} min-w-[130px]`}>
      <p className="text-xs font-bold text-white truncate">{mover.playerName.split(' ').pop()}</p>
      <p className="text-[10px] text-[#64748b]">${mover.price.toLocaleString()}</p>
      <p className={`text-xs font-black ${color}`}>{sign}{mover.change}%</p>
    </div>
  );
}

function MarketRow({ item }: { item: MarketItem }) {
  const priceColor = item.trend === 'up' ? 'text-[#22c55e]' : item.trend === 'down' ? 'text-[#ef4444]' : 'text-[#94a3b8]';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1e1e2e]/60 last:border-0">
      {/* Card image */}
      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#1e1e2e]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt={item.playerName} className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{item.playerName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-[#64748b]">{item.year}</span>
          <span className="text-[10px] text-[#374151]">·</span>
          <span className="text-[10px] text-[#64748b] uppercase">{item.sport}</span>
          <span className="text-[10px] text-[#374151]">·</span>
          <span className="text-[10px] text-[#64748b]">Vol {item.volume}</span>
        </div>
      </div>

      {/* Price + change */}
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1.5 justify-end">
          <TrendIcon trend={item.trend} size={12} />
          <p className={`text-sm font-black ${priceColor}`}>${item.currentPrice.toLocaleString()}</p>
        </div>
        <ChangeLabel change={item.change} changePct={item.changePct} />
      </div>
    </div>
  );
}

export default function MarketPage() {
  const [sport, setSport] = useState<SportFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('gainers');
  const [updatedMins, setUpdatedMins] = useState(0);

  const { data: feedData, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['market-feed'],
    queryFn: async () => {
      const r = await fetch(`${BASE_URL}/market/feed`);
      return r.json() as Promise<{ items: MarketItem[]; updatedAt: string }>;
    },
    refetchInterval: 60000,
  });

  const { data: moversData } = useQuery({
    queryKey: ['market-top-movers'],
    queryFn: async () => {
      const r = await fetch(`${BASE_URL}/market/top-movers`);
      return r.json() as Promise<{ gainers: TopMover[]; losers: TopMover[] }>;
    },
  });

  useEffect(() => { document.title = 'Market | Card Battles'; }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const diffMs = Date.now() - dataUpdatedAt;
      setUpdatedMins(Math.floor(diffMs / 60000));
    }, 30000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  // Filter + sort items
  const allItems = feedData?.items ?? [];
  const filtered = sport === 'all' ? allItems : allItems.filter(i => i.sport?.toLowerCase() === sport);
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'gainers') return b.changePct - a.changePct;
    if (sortMode === 'losers') return a.changePct - b.changePct;
    return b.volume - a.volume;
  });

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">📈 Card Market</h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            {updatedMins === 0 ? 'Updated just now' : `Updated ${updatedMins} min${updatedMins !== 1 ? 's' : ''} ago`}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="w-9 h-9 rounded-xl bg-[#12121a] border border-[#1e1e2e] flex items-center justify-center text-[#64748b] hover:text-white hover:border-[#6c47ff]/50 transition-all"
          aria-label="Refresh market data"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Top Movers */}
      {moversData && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">🔥 Top Movers</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {moversData.gainers.map(g => (
              <TopMoverChip key={g.playerName} mover={g} isGainer={true} />
            ))}
            <div className="flex-shrink-0 w-px bg-[#1e1e2e] mx-1" />
            {moversData.losers.map(l => (
              <TopMoverChip key={l.playerName} mover={l} isGainer={false} />
            ))}
          </div>
        </div>
      )}

      {/* Sport filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {SPORT_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setSport(tab.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              sport === tab.value ? 'text-white' : 'bg-[#12121a] text-[#64748b] border border-[#1e1e2e] hover:border-[#6c47ff]/50'
            }`}
            style={sport === tab.value ? {
              background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
              boxShadow: '0 0 10px rgba(108,71,255,0.3)',
            } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort options */}
      <div className="flex gap-1.5 flex-wrap">
        <div className="flex items-center gap-1 text-[#64748b]">
          <ArrowUpDown size={12} />
          <span className="text-xs">Sort:</span>
        </div>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortMode(opt.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              sortMode === opt.value
                ? 'bg-[#6c47ff]/20 text-[#a78bfa] border border-[#6c47ff]/40'
                : 'bg-[#12121a] text-[#64748b] border border-[#1e1e2e] hover:border-[#6c47ff]/30'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Market list */}
      <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] px-4 py-2">
        {sorted.length === 0 ? (
          <div className="py-10 text-center text-[#64748b] text-sm">
            <Filter size={28} className="mx-auto mb-2 opacity-30" />
            <p>No cards found for this filter</p>
          </div>
        ) : (
          sorted.map(item => <MarketRow key={item.cardId} item={item} />)
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[10px] text-[#374151] px-4 pb-2">
        ⚠️ Prices are simulated estimates for demo purposes only. Not financial advice.
      </p>
    </div>
  );
}
