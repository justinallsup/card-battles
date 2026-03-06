'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, GitCompare, Trophy, Share2, Swords, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface CardResult {
  id: string;
  title: string;
  image_url: string;
  player_name: string;
  year: number;
  sport: string;
  estimatedValue?: number;
  trend?: string;
  battlesCount?: number;
  winRate?: number;
  totalVotesReceived?: number;
}

interface SearchResult {
  id: string;
  title: string;
  image_url: string;
  player_name: string;
  year: number;
  sport: string;
}

function TrendChip({ trend }: { trend?: string }) {
  if (trend === 'up') return <span className="text-[#22c55e] font-bold flex items-center gap-1"><TrendingUp size={12} /> Up</span>;
  if (trend === 'down') return <span className="text-[#ef4444] font-bold flex items-center gap-1"><TrendingDown size={12} /> Down</span>;
  return <span className="text-[#64748b] flex items-center gap-1"><Minus size={12} /> Stable</span>;
}

interface CardSlotProps {
  label: 'A' | 'B';
  selectedCard: SearchResult | null;
  onSelect: (card: SearchResult | null) => void;
}

function CardSlot({ label, selectedCard, onSelect }: CardSlotProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ['card-search', query],
    queryFn: async () => {
      if (query.length < 2) return { cards: [] };
      const r = await fetch(`${BASE_URL}/cards/search?q=${encodeURIComponent(query)}`);
      return r.json() as Promise<{ cards: SearchResult[] }>;
    },
    enabled: query.length >= 2,
  });

  const results = data?.cards ?? [];

  if (selectedCard) {
    return (
      <div className="flex-1 bg-[#12121a] rounded-2xl border border-[#1e1e2e] p-3 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[#6c47ff] uppercase">Card {label}</span>
          <button
            onClick={() => onSelect(null)}
            className="w-6 h-6 rounded-full bg-[#1e1e2e] flex items-center justify-center text-[#64748b] hover:text-white"
          >
            <X size={12} />
          </button>
        </div>
        <div className="w-full aspect-[5/7] rounded-xl overflow-hidden bg-[#1e1e2e]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selectedCard.image_url} alt={selectedCard.player_name} className="w-full h-full object-cover" />
        </div>
        <p className="text-xs font-bold text-white text-center truncate">{selectedCard.player_name}</p>
        <p className="text-[10px] text-[#64748b] text-center">{selectedCard.year} · {selectedCard.sport?.toUpperCase()}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#12121a] rounded-2xl border border-[#1e1e2e] p-3 space-y-2">
      <span className="text-xs font-bold text-[#6c47ff] uppercase">Card {label}</span>
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search player..."
          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
        />
      </div>
      {focused && results.length > 0 && (
        <div className="space-y-1">
          {results.slice(0, 4).map(card => (
            <button
              key={card.id}
              onClick={() => { onSelect(card); setQuery(''); }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#6c47ff]/40 transition-all text-left"
            >
              <div className="w-7 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#1e1e2e]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.image_url} alt={card.player_name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{card.player_name}</p>
                <p className="text-[10px] text-[#64748b]">{card.year} · {card.sport?.toUpperCase()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {!query && (
        <div className="w-full aspect-[5/7] rounded-xl bg-[#0a0a0f] border-2 border-dashed border-[#1e1e2e] flex flex-col items-center justify-center gap-2">
          <GitCompare size={22} className="text-[#374151]" />
          <p className="text-[10px] text-[#374151] text-center">Search for a card<br />to compare</p>
        </div>
      )}
    </div>
  );
}

interface CompareMetric {
  label: string;
  aVal: number | string;
  bVal: number | string;
  aDisplay: string;
  bDisplay: string;
  winner: 'a' | 'b' | 'tie';
  higherIsBetter: boolean;
}

function buildMetrics(cardA: CardResult, cardB: CardResult): CompareMetric[] {
  const metrics: CompareMetric[] = [
    {
      label: 'Est. Value (PSA 10)',
      aVal: cardA.estimatedValue ?? 45,
      bVal: cardB.estimatedValue ?? 45,
      aDisplay: `$${(cardA.estimatedValue ?? 45).toLocaleString()}`,
      bDisplay: `$${(cardB.estimatedValue ?? 45).toLocaleString()}`,
      winner: 'tie',
      higherIsBetter: true,
    },
    {
      label: 'Year',
      aVal: cardA.year,
      bVal: cardB.year,
      aDisplay: String(cardA.year),
      bDisplay: String(cardB.year),
      winner: 'tie',
      higherIsBetter: false,
    },
    {
      label: 'Battle Win Rate',
      aVal: cardA.winRate ?? 50,
      bVal: cardB.winRate ?? 50,
      aDisplay: `${cardA.winRate ?? 50}%`,
      bDisplay: `${cardB.winRate ?? 50}%`,
      winner: 'tie',
      higherIsBetter: true,
    },
    {
      label: 'Total Votes',
      aVal: cardA.totalVotesReceived ?? 0,
      bVal: cardB.totalVotesReceived ?? 0,
      aDisplay: (cardA.totalVotesReceived ?? 0).toLocaleString(),
      bDisplay: (cardB.totalVotesReceived ?? 0).toLocaleString(),
      winner: 'tie',
      higherIsBetter: true,
    },
    {
      label: 'Battles Count',
      aVal: cardA.battlesCount ?? 0,
      bVal: cardB.battlesCount ?? 0,
      aDisplay: String(cardA.battlesCount ?? 0),
      bDisplay: String(cardB.battlesCount ?? 0),
      winner: 'tie',
      higherIsBetter: true,
    },
  ];

  // Determine winners
  metrics.forEach(m => {
    const aNum = typeof m.aVal === 'number' ? m.aVal : parseFloat(String(m.aVal));
    const bNum = typeof m.bVal === 'number' ? m.bVal : parseFloat(String(m.bVal));
    if (aNum === bNum) { m.winner = 'tie'; return; }
    const aWins = m.higherIsBetter ? aNum > bNum : aNum < bNum;
    m.winner = aWins ? 'a' : 'b';
  });

  return metrics;
}

function ComparisonTable({ cardA, cardB }: { cardA: CardResult; cardB: CardResult }) {
  const metrics = buildMetrics(cardA, cardB);
  return (
    <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-3 gap-0 border-b border-[#1e1e2e]">
        <div className="p-3 text-[10px] font-bold text-[#64748b] uppercase">Metric</div>
        <div className="p-3 text-[10px] font-bold text-[#a78bfa] text-center uppercase border-l border-[#1e1e2e]">Card A</div>
        <div className="p-3 text-[10px] font-bold text-[#60a5fa] text-center uppercase border-l border-[#1e1e2e]">Card B</div>
      </div>
      {/* Trend row */}
      <div className="grid grid-cols-3 gap-0 border-b border-[#1e1e2e]/60">
        <div className="p-3 text-xs text-[#94a3b8]">Trend</div>
        <div className="p-3 flex items-center justify-center border-l border-[#1e1e2e]/60">
          <TrendChip trend={cardA.trend} />
        </div>
        <div className="p-3 flex items-center justify-center border-l border-[#1e1e2e]/60">
          <TrendChip trend={cardB.trend} />
        </div>
      </div>
      {/* Sport row */}
      <div className="grid grid-cols-3 gap-0 border-b border-[#1e1e2e]/60">
        <div className="p-3 text-xs text-[#94a3b8]">Sport</div>
        <div className="p-3 text-xs text-white text-center border-l border-[#1e1e2e]/60 uppercase">{String(cardA.sport ?? '')}</div>
        <div className="p-3 text-xs text-white text-center border-l border-[#1e1e2e]/60 uppercase">{String(cardB.sport ?? '')}</div>
      </div>
      {/* Metrics */}
      {metrics.map((m, i) => (
        <div key={m.label} className={`grid grid-cols-3 gap-0 ${i < metrics.length - 1 ? 'border-b border-[#1e1e2e]/60' : ''}`}>
          <div className="p-3 text-xs text-[#94a3b8]">{m.label}</div>
          <div className={`p-3 text-xs font-bold text-center border-l border-[#1e1e2e]/60 relative ${m.winner === 'a' ? 'text-[#a78bfa]' : 'text-white'}`}>
            {m.aDisplay}
            {m.winner === 'a' && (
              <span className="absolute top-1 right-1 text-[8px] font-black px-1 py-0.5 rounded bg-[#6c47ff]/30 text-[#a78bfa]">WIN</span>
            )}
          </div>
          <div className={`p-3 text-xs font-bold text-center border-l border-[#1e1e2e]/60 relative ${m.winner === 'b' ? 'text-[#60a5fa]' : 'text-white'}`}>
            {m.bDisplay}
            {m.winner === 'b' && (
              <span className="absolute top-1 right-1 text-[8px] font-black px-1 py-0.5 rounded bg-[#3b82f6]/30 text-[#60a5fa]">WIN</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ComparePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cardA, setCardA] = useState<SearchResult | null>(null);
  const [cardB, setCardB] = useState<SearchResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Pre-select from URL params
  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      // Cards will be selected from compare query
    }
  }, [searchParams]);

  const { data: compareData, isLoading } = useQuery({
    queryKey: ['compare', cardA?.id, cardB?.id],
    queryFn: async () => {
      if (!cardA || !cardB) return null;
      const r = await fetch(`${BASE_URL}/cards/compare?ids=${cardA.id},${cardB.id}`);
      return r.json() as Promise<{ cards: CardResult[] }>;
    },
    enabled: !!(cardA && cardB),
  });

  const enrichedA = compareData?.cards?.find(c => c.id === cardA?.id);
  const enrichedB = compareData?.cards?.find(c => c.id === cardB?.id);

  const handleBattleCreate = () => {
    if (!cardA || !cardB) return;
    router.push(`/create?leftAssetId=${cardA.id}&rightAssetId=${cardB.id}`);
  };

  const handleShare = async () => {
    const url = cardA && cardB
      ? `${window.location.origin}/compare?ids=${cardA.id},${cardB.id}`
      : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">⚖️ Card Comparison</h1>
        <p className="text-xs text-[#64748b] mt-0.5">Compare two cards side-by-side</p>
      </div>

      {/* Card Selectors */}
      <div className="flex gap-3">
        <CardSlot label="A" selectedCard={cardA} onSelect={setCardA} />
        <div className="flex-shrink-0 flex items-center justify-center w-8">
          <div className="text-lg font-black text-[#374151]">VS</div>
        </div>
        <CardSlot label="B" selectedCard={cardB} onSelect={setCardB} />
      </div>

      {/* Compare results */}
      {cardA && cardB && (
        <>
          {isLoading ? (
            <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] p-6 text-center text-[#64748b] text-sm animate-pulse">
              Loading comparison...
            </div>
          ) : enrichedA && enrichedB ? (
            <ComparisonTable cardA={enrichedA} cardB={enrichedB} />
          ) : null}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleBattleCreate}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
                boxShadow: '0 0 20px rgba(108,71,255,0.3)',
              }}
            >
              <Swords size={16} />
              Compare in Battle
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-3 rounded-xl bg-[#12121a] border border-[#1e1e2e] hover:border-[#6c47ff]/40 flex items-center gap-2 text-sm font-semibold text-[#94a3b8] transition-all"
            >
              <Share2 size={16} />
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </>
      )}

      {!cardA && !cardB && (
        <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] p-8 text-center space-y-2">
          <Trophy size={32} className="mx-auto text-[#374151]" />
          <p className="text-sm font-bold text-[#64748b]">Select two cards to compare</p>
          <p className="text-xs text-[#374151]">Search for players in each slot above</p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-[#64748b]">Loading...</div>}>
      <ComparePageInner />
    </Suspense>
  );
}
