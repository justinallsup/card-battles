'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface Player {
  player_name: string;
  sport: string;
  card_count: number | string;
}

const SPORT_EMOJI: Record<string, string> = {
  nfl: '🏈', nba: '🏀', mlb: '⚾', nhl: '🏒', soccer: '⚽',
};

function PlayerShimmer() {
  return (
    <div className="p-3 rounded-xl border border-[#1e1e2e] space-y-2 animate-pulse" style={{ background: '#12121a' }}>
      <div className="h-5 bg-[#1e1e2e] rounded w-3/4" />
      <div className="h-3 bg-[#1e1e2e] rounded w-1/2" />
    </div>
  );
}

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<string>('all');

  useEffect(() => { document.title = 'Players | Card Battles'; }, []);

  useEffect(() => {
    fetch(`${BASE}/players`)
      .then(r => r.json())
      .then(data => { setPlayers(data.players || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const SPORTS = ['all', 'nfl', 'nba', 'mlb'];

  const filtered = players.filter(p => {
    const matchName = !query || p.player_name.toLowerCase().includes(query.toLowerCase());
    const matchSport = sportFilter === 'all' || p.sport === sportFilter;
    return matchName && matchSport;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-white">🏅 Players</h1>
        <p className="text-xs text-[#64748b] mt-0.5">Browse player profiles and card collections</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search players…"
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]"
        />
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {SPORTS.map(s => (
          <button
            key={s}
            onClick={() => setSportFilter(s)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={sportFilter === s
              ? { background: 'rgba(108,71,255,0.2)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.5)' }
              : { background: '#12121a', color: '#64748b', border: '1px solid #1e1e2e' }
            }
          >
            {s === 'all' ? 'All Sports' : `${SPORT_EMOJI[s] || ''} ${s.toUpperCase()}`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <PlayerShimmer key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#64748b]">
          <div className="text-4xl mb-2">🔍</div>
          <p>No players found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(player => (
            <button
              key={player.player_name}
              onClick={() => router.push(`/players/${encodeURIComponent(player.player_name)}`)}
              className="p-3 rounded-xl border border-[#1e1e2e] hover:border-[#6c47ff]/40 transition-all text-left"
              style={{ background: '#12121a' }}
            >
              <div className="text-2xl mb-1">{SPORT_EMOJI[player.sport] || '🃏'}</div>
              <p className="text-sm font-bold text-white truncate">{player.player_name}</p>
              <p className="text-xs text-[#64748b] uppercase">{player.sport}</p>
              <p className="text-[10px] text-[#374151] mt-1">
                {Number(player.card_count)} card{Number(player.card_count) !== 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
