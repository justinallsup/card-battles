'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, Grid, List, X, ChevronDown, ChevronUp } from 'lucide-react';
import { BattleCard } from '../../../components/battle/BattleCard';
import { BattleCardSkeleton } from '../../../components/ui/LoadingSpinner';
import type { Battle } from '@card-battles/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

const SPORT_OPTIONS = [
  { value: 'all', label: '🏆 All' },
  { value: 'nfl', label: '🏈 NFL' },
  { value: 'nba', label: '🏀 NBA' },
  { value: 'mlb', label: '⚾ MLB' },
];

const STATUS_OPTIONS = [
  { value: 'live', label: 'Live' },
  { value: 'ended', label: 'Ended' },
  { value: 'all', label: 'All' },
];

const MIN_VOTES_OPTIONS = [
  { value: '0', label: 'Any' },
  { value: '100', label: '100+' },
  { value: '1000', label: '1K+' },
  { value: '5000', label: '5K+' },
];

const SORT_OPTIONS = [
  { value: 'votes', label: 'Most Votes' },
  { value: 'newest', label: 'Newest' },
  { value: 'ending', label: 'Ending Soon' },
];

const TRENDING_SEARCHES = ['Mahomes', 'LeBron', 'Wembanyama', 'Jordan', 'Brady'];

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('recentSearches') || '[]').slice(0, 3);
  } catch {
    return [];
  }
}

function saveRecentSearch(q: string) {
  if (typeof window === 'undefined' || !q.trim()) return;
  try {
    const existing = getRecentSearches();
    const updated = [q, ...existing.filter(s => s !== q)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function BattleListItem({ battle }: { battle: Battle }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1e1e2e]/60 last:border-0">
      <div className="flex gap-2 flex-shrink-0">
        <div className="w-8 h-11 rounded-lg overflow-hidden bg-[#1e1e2e]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={battle.left.imageUrl} alt={battle.left.playerName ?? ''} className="w-full h-full object-cover" />
        </div>
        <div className="w-8 h-11 rounded-lg overflow-hidden bg-[#1e1e2e]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={battle.right.imageUrl} alt={battle.right.playerName ?? ''} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{battle.title}</p>
        <p className="text-xs text-[#64748b] mt-0.5">
          {(battle.totalVotesCached ?? 0).toLocaleString()} votes
          {battle.isSponsored && <span className="ml-1.5 text-[10px] text-[#f59e0b] font-bold">SPONSORED</span>}
        </p>
      </div>
      <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold ${
        battle.status === 'live' ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'bg-[#374151]/30 text-[#64748b]'
      }`}>
        {battle.status?.toUpperCase()}
      </span>
    </div>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [sport, setSport] = useState('all');
  const [status, setStatus] = useState('live');
  const [minVotes, setMinVotes] = useState('0');
  const [sortBy, setSortBy] = useState('votes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) saveRecentSearch(query);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, [inputFocused]);

  const { data, isLoading } = useQuery({
    queryKey: ['search-advanced', debouncedQuery, sport, status, minVotes, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (sport !== 'all') params.set('sport', sport);
      params.set('status', status);
      if (minVotes !== '0') params.set('minVotes', minVotes);
      params.set('sort', sortBy);
      const r = await fetch(`${BASE_URL}/battles/search/advanced?${params}`);
      return r.json();
    },
  });

  const battles: Battle[] = data?.items ?? [];
  const hasActiveFilters = sport !== 'all' || status !== 'live' || minVotes !== '0' || sortBy !== 'votes';
  const showSuggestions = inputFocused && !debouncedQuery;

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    setInputFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-white">🔍 Search</h1>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none z-10" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setTimeout(() => setInputFocused(false), 200)}
          placeholder="Search battles, players, cards..."
          aria-label="Search"
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-[#6c47ff] transition-colors"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
          >
            <X size={14} />
          </button>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-[#12121a] border border-[#1e1e2e] rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">🔥 Trending</p>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING_SEARCHES.map(term => (
                    <button
                      key={term}
                      onClick={() => handleSuggestionClick(term)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#6c47ff]/10 text-[#a78bfa] border border-[#6c47ff]/25 hover:bg-[#6c47ff]/20 transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              {recentSearches.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">📅 Recent</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map(term => (
                      <button
                        key={term}
                        onClick={() => handleSuggestionClick(term)}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#12121a] text-[#94a3b8] border border-[#1e1e2e] hover:border-[#6c47ff]/30 transition-all"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sport filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {SPORT_OPTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => setSport(s.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              sport === s.value ? 'text-white' : 'bg-[#12121a] text-[#64748b] border border-[#1e1e2e] hover:border-[#6c47ff]/50'
            }`}
            style={sport === s.value ? {
              background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
              boxShadow: '0 0 10px rgba(108,71,255,0.3)',
            } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              hasActiveFilters
                ? 'bg-[#6c47ff]/15 border border-[#6c47ff]/40 text-[#a78bfa]'
                : 'bg-[#12121a] border border-[#1e1e2e] text-[#64748b] hover:border-[#6c47ff]/30'
            }`}
          >
            <SlidersHorizontal size={12} />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#6c47ff]" />}
            {filtersOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* View toggle */}
          <div className="flex gap-1 bg-[#12121a] border border-[#1e1e2e] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#6c47ff]/20 text-[#a78bfa]' : 'text-[#374151]'}`}
              aria-label="Grid view"
            >
              <Grid size={13} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#6c47ff]/20 text-[#a78bfa]' : 'text-[#374151]'}`}
              aria-label="List view"
            >
              <List size={13} />
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 space-y-4">
            {/* Status */}
            <div>
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">Status</p>
              <div className="flex gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      status === opt.value
                        ? 'bg-[#6c47ff]/20 text-[#a78bfa] border border-[#6c47ff]/40'
                        : 'bg-[#0a0a0f] text-[#64748b] border border-[#1e1e2e] hover:border-[#6c47ff]/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min votes */}
            <div>
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">Min Votes</p>
              <div className="flex gap-1.5 flex-wrap">
                {MIN_VOTES_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMinVotes(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      minVotes === opt.value
                        ? 'bg-[#6c47ff]/20 text-[#a78bfa] border border-[#6c47ff]/40'
                        : 'bg-[#0a0a0f] text-[#64748b] border border-[#1e1e2e] hover:border-[#6c47ff]/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">Sort By</p>
              <div className="flex gap-1.5 flex-wrap">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      sortBy === opt.value
                        ? 'bg-[#6c47ff]/20 text-[#a78bfa] border border-[#6c47ff]/40'
                        : 'bg-[#0a0a0f] text-[#64748b] border border-[#1e1e2e] hover:border-[#6c47ff]/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => { setSport('all'); setStatus('live'); setMinVotes('0'); setSortBy('votes'); }}
                className="text-xs text-[#ef4444] hover:text-[#fca5a5] transition-colors flex items-center gap-1"
              >
                <X size={11} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <BattleCardSkeleton key={i} />)}
        </div>
      ) : battles.length === 0 ? (
        <div className="text-center py-16 text-[#64748b]">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {debouncedQuery ? `No results for "${debouncedQuery}"` : 'Search for battles, players, or cards'}
          </p>
          {debouncedQuery && (
            <p className="text-sm mt-1 opacity-70">Try a different search term or adjust filters</p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs text-[#64748b]">
            {battles.length} battle{battles.length !== 1 ? 's' : ''} found
          </p>
          {viewMode === 'grid' ? (
            <div className="space-y-4 pt-2">
              {battles.map((battle: Battle) => (
                <BattleCard key={battle.id} battle={battle} />
              ))}
            </div>
          ) : (
            <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] px-3 mt-1">
              {battles.map((battle: Battle) => (
                <BattleListItem key={battle.id} battle={battle} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="h-10 bg-[#12121a] rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <BattleCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
