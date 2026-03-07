'use client';
import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Trash2, Search, Eye } from 'lucide-react';
import { BackButton } from '../../../components/ui/BackButton';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { getToken } from '../../../lib/api';
import { showToast } from '../../../components/ui/Toast';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface WatchedPlayer {
  playerName: string;
  mid: number;
  trend: string;
  reason: string;
  addedAt: string;
}

const SUGGESTED = [
  'Patrick Mahomes',
  'Tom Brady',
  'LeBron James',
  'Michael Jordan',
  'Caitlin Clark',
  'Victor Wembanyama',
  'Kobe Bryant',
];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-[#22c55e]" aria-label="Trending up" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-[#ef4444]" aria-label="Trending down" />;
  return <Minus size={14} className="text-[#94a3b8]" aria-label="Stable" />;
}

function TrendBadge({ trend }: { trend: string }) {
  const styles: Record<string, { bg: string; text: string; label: string; arrow: string }> = {
    up:     { bg: 'rgba(34,197,94,0.12)',  text: '#22c55e', label: 'Rising',  arrow: '↑' },
    down:   { bg: 'rgba(239,68,68,0.12)',  text: '#ef4444', label: 'Falling', arrow: '↓' },
    stable: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', label: 'Stable',  arrow: '→' },
  };
  const s = styles[trend] ?? styles.stable;
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {s.arrow} {s.label}
    </span>
  );
}

export default function InvestmentWatchPage() {
  const [players, setPlayers] = useState<WatchedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const token = getToken();

  const fetchWatchlist = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${BASE_URL}/me/investment-watch`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlayers(data.players ?? []);
    } catch {
      showToast('Failed to load watchlist', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWatchlist(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addPlayer = async (name: string) => {
    if (!name.trim() || !token) return;
    setAdding(true);
    try {
      await fetch(`${BASE_URL}/me/investment-watch/${encodeURIComponent(name.trim())}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuery('');
      showToast(`Added ${name.trim()} to watchlist`, 'success');
      await fetchWatchlist();
    } catch {
      showToast('Failed to add player', 'error');
    } finally {
      setAdding(false);
    }
  };

  const removePlayer = async (name: string) => {
    if (!token) return;
    try {
      await fetch(`${BASE_URL}/me/investment-watch/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlayers(prev => prev.filter(p => p.playerName !== name));
      showToast(`Removed ${name}`, 'success');
    } catch {
      showToast('Failed to remove', 'error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) addPlayer(query.trim());
  };

  if (!token) {
    return (
      <div className="space-y-5 pb-4">
        <BackButton />
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-10 text-center space-y-3">
          <p className="text-4xl">🔐</p>
          <p className="text-white font-bold">Sign in to use Investment Watchlist</p>
          <Link href="/login" className="inline-block px-4 py-2 bg-[#6c47ff] text-white text-sm font-bold rounded-xl">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <BackButton />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
          <TrendingUp size={20} className="text-[#22c55e]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">📈 Investment Watchlist</h1>
          <p className="text-xs text-[#64748b]">Track card values for your favorite players</p>
        </div>
      </div>

      {/* Add player */}
      <form onSubmit={handleSubmit} className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4 space-y-3">
        <p className="text-xs font-black text-[#64748b] uppercase tracking-widest">Watch a Player</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#374151]" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Player name (e.g. LeBron James)"
              aria-label="Player name to watch"
              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || adding}
            aria-label="Add player to watchlist"
            className="px-4 py-2.5 rounded-xl bg-[#6c47ff] text-white text-sm font-bold disabled:opacity-40 transition-all hover:bg-[#5a38e0]"
          >
            {adding ? '...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Player list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      ) : players.length === 0 ? (
        <div className="space-y-4">
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 text-center space-y-3">
            <p className="text-4xl">📊</p>
            <p className="text-white font-bold text-lg">No players watched yet</p>
            <p className="text-[#64748b] text-sm">Add players above to track their card values</p>
          </div>

          {/* Suggested */}
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4">
            <p className="text-xs font-black text-[#64748b] uppercase tracking-widest mb-3">Suggested Players</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map(name => (
                <button
                  key={name}
                  onClick={() => addPlayer(name)}
                  aria-label={`Add ${name} to watchlist`}
                  className="px-3 py-1.5 rounded-xl border border-[#1e1e2e] bg-[#0a0a0f] text-xs font-semibold text-[#94a3b8] hover:border-[#6c47ff]/40 hover:text-white transition-all"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#64748b]">{players.length} player{players.length !== 1 ? 's' : ''} watched</p>
          {players.map(player => (
            <div key={player.playerName} className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4 space-y-3">
              {/* Player header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white">{player.playerName}</p>
                    <TrendBadge trend={player.trend} />
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-1">{player.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black text-white">
                    ${player.mid >= 1000
                      ? `${(player.mid / 1000).toFixed(player.mid >= 10000 ? 0 : 1)}K`
                      : player.mid
                    }
                  </p>
                  <p className="text-[10px] text-[#64748b]">est. PSA 10</p>
                </div>
              </div>

              {/* Trend indicator */}
              <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                <TrendIcon trend={player.trend} />
                <span>
                  {player.trend === 'up' ? 'Rising demand' : player.trend === 'down' ? 'Declining' : 'Stable market'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-[#1e1e2e]">
                <Link
                  href={`/players/${encodeURIComponent(player.playerName)}`}
                  aria-label={`View battles for ${player.playerName}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#1e1e2e] text-xs font-semibold text-[#94a3b8] hover:text-white hover:border-[#374151] transition-colors"
                >
                  <Eye size={12} />
                  View Battles
                </Link>
                <button
                  onClick={() => removePlayer(player.playerName)}
                  aria-label={`Remove ${player.playerName} from watchlist`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#1e1e2e] text-xs font-semibold text-[#ef4444]/70 hover:text-[#ef4444] hover:border-[#ef4444]/30 transition-colors"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Suggest more */}
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4">
            <p className="text-xs font-black text-[#64748b] uppercase tracking-widest mb-3">Add More</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.filter(n => !players.some(p => p.playerName === n)).map(name => (
                <button
                  key={name}
                  onClick={() => addPlayer(name)}
                  aria-label={`Add ${name} to watchlist`}
                  className="px-3 py-1.5 rounded-xl border border-[#1e1e2e] bg-[#0a0a0f] text-xs font-semibold text-[#94a3b8] hover:border-[#6c47ff]/40 hover:text-white transition-all"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
