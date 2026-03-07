'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getToken } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';

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

type SetCard = {
  id: string;
  player_name: string;
  year: string;
  sport: string;
  image_url: string;
  cardNumber: string;
  parallel: string;
  printRun: number | null;
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

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

type SortMode = 'cardNumber' | 'owned';

function SetChecklist({ set, onClose }: { set: CardSet; onClose: () => void }) {
  const { user } = useAuth();
  const [cards, setCards] = useState<SetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>('cardNumber');
  const [toggling, setToggling] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsRes, ownedRes] = await Promise.all([
        fetch(`${BASE_URL}/card-sets/${set.id}/cards`),
        user
          ? fetch(`${BASE_URL}/me/set-completion/${set.id}`, {
              headers: { Authorization: `Bearer ${getToken()}` },
            })
          : Promise.resolve(null),
      ]);
      const cardsData = await cardsRes.json() as { cards: SetCard[] };
      setCards(cardsData.cards || []);
      if (ownedRes) {
        const ownedData = await ownedRes.json() as { ownedCardIds: string[] };
        setOwnedIds(new Set(ownedData.ownedCardIds || []));
      }
    } catch {}
    setLoading(false);
  }, [set.id, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleOwned = async (cardId: string) => {
    if (!user) return;
    setToggling(cardId);
    try {
      await fetch(`${BASE_URL}/me/set-completion/${set.id}/${cardId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setOwnedIds(prev => new Set([...prev, cardId]));
    } catch {}
    setToggling(null);
  };

  const sorted = [...cards].sort((a, b) => {
    if (sortMode === 'owned') {
      const aOwned = ownedIds.has(a.id) ? 0 : 1;
      const bOwned = ownedIds.has(b.id) ? 0 : 1;
      if (aOwned !== bOwned) return aOwned - bOwned;
    }
    return a.cardNumber.localeCompare(b.cardNumber);
  });

  const owned = ownedIds.size;
  const total = cards.length;
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
  const complete = owned === total && total > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={onClose}>
      <div
        className="flex-1 overflow-y-auto mt-16 mx-4 mb-4 rounded-2xl border border-[#1e1e2e]"
        style={{ background: '#12121a' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 border-b border-[#1e1e2e]" style={{ background: '#12121a' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-black text-white">{set.name}</h2>
              <p className="text-xs text-[#64748b]">{set.year}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center text-[#64748b] hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {complete ? '🏆 Set Complete!' : `${owned}/${total} cards owned (${pct}%)`}
              </span>
              {complete && (
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }}
                >
                  ✓ COMPLETE
                </span>
              )}
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-[#1e1e2e]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: complete ? '#22c55e' : `#${set.imageColor}` }}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex gap-2 mt-3">
            {(['cardNumber', 'owned'] as SortMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={sortMode === mode
                  ? { background: `#${set.imageColor}22`, color: `#${set.imageColor}`, border: `1px solid #${set.imageColor}44` }
                  : { background: '#1e1e2e', color: '#64748b', border: '1px solid transparent' }
                }
              >
                {mode === 'cardNumber' ? '# Card Number' : '✓ Owned First'}
              </button>
            ))}
          </div>
        </div>

        {/* Card grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 p-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: '#1e1e2e' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {sorted.map(card => {
              const isOwned = ownedIds.has(card.id);
              const isToggling = toggling === card.id;
              return (
                <div
                  key={card.id}
                  className="relative rounded-xl overflow-hidden border transition-all"
                  style={{
                    background: '#0a0a0f',
                    borderColor: isOwned ? `#${set.imageColor}44` : '#1e1e2e',
                    boxShadow: isOwned ? `0 0 10px #${set.imageColor}22` : 'none',
                  }}
                >
                  {/* Card image */}
                  <div className="relative aspect-[3/4] bg-[#1e1e2e]">
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.player_name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-2xl font-black"
                        style={{ color: `#${set.imageColor}` }}
                      >
                        {card.player_name?.charAt(0) || '?'}
                      </div>
                    )}
                    {/* Owned overlay */}
                    {isOwned && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                          style={{ background: `#${set.imageColor}cc` }}
                        >
                          ✓
                        </div>
                      </div>
                    )}
                    {/* Card number badge */}
                    <div
                      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#94a3b8' }}
                    >
                      #{card.cardNumber}
                    </div>
                    {/* Print run */}
                    {card.printRun && (
                      <div
                        className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black"
                        style={{ background: `#${set.imageColor}cc`, color: '#fff' }}
                      >
                        /{card.printRun}
                      </div>
                    )}
                  </div>

                  {/* Card info */}
                  <div className="p-2 space-y-1.5">
                    <p className="text-xs font-bold text-white leading-tight truncate">{card.player_name}</p>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: `#${set.imageColor}22`, color: `#${set.imageColor}` }}
                      >
                        {card.parallel}
                      </span>
                      <span className="text-[9px] text-[#64748b]">
                        {SPORT_LABELS[card.sport]?.replace(/^.+ /, '') || card.sport?.toUpperCase()}
                      </span>
                    </div>
                    {user && !isOwned && (
                      <button
                        onClick={() => toggleOwned(card.id)}
                        disabled={isToggling}
                        className="w-full py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                        style={{ background: `#${set.imageColor}22`, color: `#${set.imageColor}`, border: `1px solid #${set.imageColor}33` }}
                      >
                        {isToggling ? '…' : '+ Mark as Owned'}
                      </button>
                    )}
                    {isOwned && (
                      <div
                        className="w-full py-1 rounded-lg text-[10px] font-bold text-center"
                        style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                      >
                        ✓ Owned
                      </div>
                    )}
                    {!user && (
                      <Link
                        href="/login"
                        className="w-full py-1 rounded-lg text-[10px] font-bold text-center block"
                        style={{ background: '#1e1e2e', color: '#64748b' }}
                      >
                        Log in to track
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetsPage() {
  const [sets, setSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedSet, setSelectedSet] = useState<CardSet | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/card-sets`)
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
        <p className="text-[#64748b] text-sm mt-0.5">Browse iconic card collections &amp; track your owned cards</p>
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
            <button
              key={set.id}
              onClick={() => setSelectedSet(set)}
              className="relative rounded-2xl overflow-hidden transition-transform active:scale-95 text-left w-full"
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
                Track →
              </div>
            </button>
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

      {/* Set checklist modal */}
      {selectedSet && (
        <SetChecklist set={selectedSet} onClose={() => setSelectedSet(null)} />
      )}
    </div>
  );
}
