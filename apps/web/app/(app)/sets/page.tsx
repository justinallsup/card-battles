'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type CardSet = {
  id: string;
  name: string;
  year: string;
  description: string;
  cardCount: number;
  avgValue: number;
  sport: string;
  imageColor: string;
};

const SPORT_LABELS: Record<string, string> = {
  all: '🌐 All Sports',
  nfl: '🏈 NFL',
  nba: '🏀 NBA',
  mlb: '⚾ MLB',
};

const SPORT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'nfl', label: '🏈 NFL' },
  { value: 'nba', label: '🏀 NBA' },
  { value: 'mlb', label: '⚾ MLB' },
];

export default function SetsPage() {
  const [sets, setSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/v1/card-sets')
      .then(r => r.json())
      .then(d => setSets(d.sets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? sets
    : sets.filter(s => s.sport === filter || s.sport === 'all');

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white">🃏 Card Sets</h1>
        <p className="text-[#64748b] text-sm mt-0.5">Browse iconic card collections</p>
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {SPORT_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={filter === f.value
              ? { background: 'linear-gradient(135deg, #6c47ff, #a78bfa)', color: '#fff' }
              : { background: '#1e1e2e', color: '#94a3b8' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-44 rounded-2xl animate-pulse" style={{ background: '#1e1e2e' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🃏</div>
          <p className="text-white font-bold">No sets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(set => (
            <Link
              key={set.id}
              href={`/search?q=${encodeURIComponent(set.name)}`}
              className="relative rounded-2xl overflow-hidden transition-transform active:scale-95"
              style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
            >
              {/* Color accent bar */}
              <div
                className="h-1.5 w-full"
                style={{ background: `#${set.imageColor}` }}
              />

              {/* Large color icon area */}
              <div
                className="flex items-center justify-center h-16"
                style={{ background: `#${set.imageColor}18` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black"
                  style={{
                    background: `#${set.imageColor}33`,
                    border: `1px solid #${set.imageColor}55`,
                    color: `#${set.imageColor}`,
                  }}
                >
                  {set.name.charAt(0)}
                </div>
              </div>

              <div className="p-3">
                <p className="text-white font-black text-sm leading-tight">{set.name}</p>
                <p className="text-[#64748b] text-[10px] mt-0.5">{set.year}</p>
                <p className="text-[#94a3b8] text-[10px] mt-1.5 leading-snug line-clamp-2">{set.description}</p>

                <div className="flex justify-between items-center mt-3 pt-2.5" style={{ borderTop: '1px solid #1e1e2e' }}>
                  <div className="text-center">
                    <p className="text-white font-black text-sm">{set.cardCount}</p>
                    <p className="text-[#64748b] text-[9px]">Cards</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-sm" style={{ color: `#${set.imageColor}` }}>
                      ${set.avgValue >= 1000 ? `${(set.avgValue / 1000).toFixed(1)}k` : set.avgValue}
                    </p>
                    <p className="text-[#64748b] text-[9px]">Avg Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#a78bfa] text-[9px] font-semibold uppercase">
                      {SPORT_LABELS[set.sport]?.replace(/^.+ /, '') || set.sport.toUpperCase()}
                    </p>
                    <p className="text-[#64748b] text-[9px]">Sport</p>
                  </div>
                </div>
              </div>

              {/* Tap to browse indicator */}
              <div
                className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: `#${set.imageColor}22`, color: `#${set.imageColor}` }}
              >
                Browse →
              </div>
            </Link>
          ))}
        </div>
      )}

      <div
        className="mt-6 p-4 rounded-2xl text-center"
        style={{ background: 'rgba(108,71,255,0.06)', border: '1px solid rgba(108,71,255,0.15)' }}
      >
        <p className="text-[#a78bfa] font-bold text-sm">📦 More sets coming soon</p>
        <p className="text-[#64748b] text-xs mt-1">Donruss, Select, Leaf, Stadium Club &amp; more</p>
      </div>
    </div>
  );
}
