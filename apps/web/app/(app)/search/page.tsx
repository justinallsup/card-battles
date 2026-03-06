'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { BattleCard } from '../../../components/battle/BattleCard';
import { BattleCardSkeleton } from '../../../components/ui/LoadingSpinner';
import type { Battle } from '@card-battles/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

const SPORT_OPTIONS = [
  { value: 'all', label: '🏆 All' },
  { value: 'nfl', label: '🏈 NFL' },
  { value: 'nba', label: '🏀 NBA' },
  { value: 'mlb', label: '⚾ MLB' },
  { value: 'nhl', label: '🏒 NHL' },
  { value: 'soccer', label: '⚽ Soccer' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, sport],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (sport !== 'all') params.set('sport', sport);
      // Use search endpoint if we have filters, otherwise feed
      const endpoint = (debouncedQuery || sport !== 'all')
        ? `${BASE_URL}/battles/search?${params}`
        : `${BASE_URL}/battles/feed?${params}`;
      const r = await fetch(endpoint);
      return r.json();
    },
    enabled: true,
  });

  const battles: Battle[] = data?.items ?? [];

  return (
    <div className="space-y-4">
      {/* Page title */}
      <h1 className="text-xl font-black text-white">Search</h1>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search battles, players, cards..."
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-[#6c47ff] transition-colors"
          autoFocus
        />
      </div>

      {/* Sport filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SPORT_OPTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => setSport(s.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              sport === s.value
                ? 'text-white'
                : 'bg-[#12121a] text-[#64748b] border border-[#1e1e2e] hover:border-[#6c47ff]/50'
            }`}
            style={sport === s.value ? {
              background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
              boxShadow: '0 0 10px rgba(108, 71, 255, 0.3)',
            } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <BattleCardSkeleton key={i} />)}
        </div>
      ) : battles.length === 0 ? (
        <div className="text-center py-16 text-[#64748b]">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {query ? `No results for "${query}"` : 'Search for battles, players, or cards'}
          </p>
          {query && (
            <p className="text-sm mt-1 opacity-70">Try a different search term</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {battles.length > 0 && (
            <p className="text-xs text-[#64748b]">
              {battles.length} battle{battles.length !== 1 ? 's' : ''} found
            </p>
          )}
          {battles.map((battle: Battle) => (
            <BattleCard key={battle.id} battle={battle} />
          ))}
        </div>
      )}
    </div>
  );
}
