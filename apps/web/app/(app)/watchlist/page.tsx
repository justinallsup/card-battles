'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';
import Link from 'next/link';
import { Eye, Trash2, Swords } from 'lucide-react';
import { BackButton } from '../../../components/ui/BackButton';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3333/api/v1');

interface WatchedBattle {
  id: string;
  title: string;
  li?: string;
  lp?: string;
  ri?: string;
  rp?: string;
  status: string;
  total_votes_cached?: number;
  ends_at?: string;
}

function WatchlistItem({ battle, onRemove }: { battle: WatchedBattle; onRemove: () => void }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await fetch(`${BASE}/battles/${battle.id}/watch`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      onRemove();
    } catch {
      setRemoving(false);
    }
  };

  const isLive = battle.status === 'live';

  return (
    <div
      className="rounded-xl border border-[#1e1e2e] p-3 flex gap-3 items-center transition-all hover:border-[#6c47ff]/20"
      style={{ background: '#12121a' }}
    >
      {/* Card thumbnails */}
      <Link href={`/battles/${battle.id}`} className="flex items-center gap-1 flex-shrink-0">
        <div className="w-10 h-13 rounded-lg overflow-hidden border border-[#252535]" style={{ height: '52px' }}>
          {battle.li ? (
            <img src={battle.li} alt={battle.lp ?? 'left'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#1e1e2e] flex items-center justify-center text-[#374151]">
              <Swords size={12} />
            </div>
          )}
        </div>
        <span className="text-[#374151] text-xs font-bold mx-0.5">⚔</span>
        <div className="w-10 rounded-lg overflow-hidden border border-[#252535]" style={{ height: '52px' }}>
          {battle.ri ? (
            <img src={battle.ri} alt={battle.rp ?? 'right'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#1e1e2e] flex items-center justify-center text-[#374151]">
              <Swords size={12} />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/battles/${battle.id}`}>
          <p className="text-sm font-bold text-white truncate hover:text-[#a78bfa] transition-colors">{battle.title}</p>
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[10px] font-semibold"
            style={{ color: isLive ? '#22c55e' : '#64748b' }}
          >
            {isLive ? '🟢 Live' : '⚡ Ended'}
          </span>
          {battle.total_votes_cached != null && (
            <span className="text-[10px] text-[#374151]">
              · {battle.total_votes_cached.toLocaleString()} votes
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/battles/${battle.id}`}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: 'rgba(108,71,255,0.1)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.3)' }}
        >
          <Eye size={12} /> View
        </Link>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          title="Remove from watchlist"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const { user } = useAuth();
  const [battles, setBattles] = useState<WatchedBattle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${BASE}/me/watchlist`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => setBattles(data.battles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <Eye size={48} className="text-[#374151]" />
        <p className="text-white font-bold text-lg">Sign in to view your watchlist</p>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackButton />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Eye size={20} className="text-[#6c47ff]" /> Watchlist
          </h1>
          {battles.length > 0 && (
            <p className="text-xs text-[#64748b] mt-0.5">{battles.length} battle{battles.length !== 1 ? 's' : ''} watched</p>
          )}
        </div>
        <Link
          href="/feed"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(108,71,255,0.1)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.3)' }}
        >
          + Find Battles
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />
          ))}
        </div>
      ) : battles.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center border border-dashed border-[#1e1e2e] space-y-4"
          style={{ background: 'rgba(108,71,255,0.03)' }}
        >
          <div className="text-5xl">🔖</div>
          <div>
            <p className="text-white font-bold text-lg">Your watchlist is empty</p>
            <p className="text-[#64748b] text-sm mt-1">
              Watch battles to keep track of the ones you care about
            </p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1e1e2e] text-left space-y-2 max-w-xs mx-auto">
            <p className="text-xs font-bold text-[#94a3b8]">💡 How to watch battles</p>
            <p className="text-xs text-[#64748b]">
              Open any battle and tap the <strong className="text-white">🔖 Watch</strong> button to add it to your watchlist.
            </p>
          </div>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
          >
            Browse Battles →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Live battles first */}
          {battles.filter(b => b.status === 'live').length > 0 && (
            <div className="mb-1">
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">🟢 Live</p>
              {battles.filter(b => b.status === 'live').map(battle => (
                <div key={battle.id} className="mb-2">
                  <WatchlistItem
                    battle={battle}
                    onRemove={() => setBattles(prev => prev.filter(b => b.id !== battle.id))}
                  />
                </div>
              ))}
            </div>
          )}
          {battles.filter(b => b.status !== 'live').length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">⚡ Ended</p>
              {battles.filter(b => b.status !== 'live').map(battle => (
                <div key={battle.id} className="mb-2">
                  <WatchlistItem
                    battle={battle}
                    onRemove={() => setBattles(prev => prev.filter(b => b.id !== battle.id))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
