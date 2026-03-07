'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';
import Link from 'next/link';
import { Trash2, BookMarked, ExternalLink, Share2, Globe, Lock } from 'lucide-react';
import { BackButton } from '../../../components/ui/BackButton';
import { showToast } from '../../../components/ui/Toast';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface CollectedCard {
  id: string;
  image_url: string;
  player_name?: string;
  year?: number;
  sport?: string;
  title: string;
  source?: string;
}

function estimateValue(card: CollectedCard): string {
  // Simple deterministic estimate based on card properties
  const base = card.year ? Math.max(50, (2026 - card.year) * 12) : 75;
  const playerFactor = card.player_name?.toLowerCase().includes('jordan') ? 8
    : card.player_name?.toLowerCase().includes('brady') ? 6
    : card.player_name?.toLowerCase().includes('lebron') ? 7
    : card.player_name?.toLowerCase().includes('mahomes') ? 5
    : 1;
  const val = base * playerFactor;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val}`;
}

function CardTile({ card, onRemove }: { card: CollectedCard; onRemove: () => void }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await fetch(`${BASE}/cards/${card.id}/save`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      onRemove();
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-[#1e1e2e] overflow-hidden flex flex-col transition-all hover:border-[#6c47ff]/30"
      style={{ background: '#12121a' }}
    >
      {/* Card Image */}
      <div className="relative aspect-[3/4] bg-[#0a0a0f] overflow-hidden">
        <img
          src={card.image_url}
          alt={card.player_name ?? card.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              `https://placehold.co/300x400/12121a/6c47ff?text=${encodeURIComponent(card.player_name ?? '?')}`;
          }}
        />
        {card.sport && (
          <span
            className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(10,10,15,0.85)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.3)' }}
          >
            {card.sport}
          </span>
        )}
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          Est. {estimateValue(card)}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <p className="text-sm font-bold text-white truncate">{card.player_name ?? card.title}</p>
          {card.year && <p className="text-[11px] text-[#64748b]">{card.year} · PSA 10 Est.</p>}
        </div>
        <div className="flex gap-1.5 mt-auto">
          <Link
            href={`/feed`}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
            style={{ background: 'rgba(108,71,255,0.1)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.3)' }}
          >
            <ExternalLink size={11} /> Battles
          </Link>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CollectedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cb_collection_public') !== 'false';
    }
    return true;
  });

  const handleTogglePublic = () => {
    const next = !isPublic;
    setIsPublic(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cb_collection_public', String(next));
    }
    showToast(next ? '🌐 Collection is now public' : '🔒 Collection is now private', 'success');
  };

  const handleShareCollection = async () => {
    const url = `https://cardbattles.app/collectors/${user?.username ?? 'me'}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Collection URL copied! 📋', 'success');
    } catch {
      showToast(`Share: ${url}`, 'info');
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${BASE}/me/collection`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => setCards(data.cards ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <BookMarked size={48} className="text-[#374151]" />
        <p className="text-white font-bold text-lg">Sign in to view your collection</p>
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
            <BookMarked size={20} className="text-[#6c47ff]" /> My Collection
          </h1>
          {cards.length > 0 && (
            <p className="text-xs text-[#64748b] mt-0.5">{cards.length} card{cards.length !== 1 ? 's' : ''} saved</p>
          )}
        </div>
        <Link
          href="/feed"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(108,71,255,0.1)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.3)' }}
        >
          + Add Cards
        </Link>
      </div>

      {/* Share & Visibility Controls */}
      {cards.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={handleShareCollection}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(108,71,255,0.08)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.2)' }}
          >
            <Share2 size={14} />
            Share Collection
          </button>
          <button
            onClick={handleTogglePublic}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={isPublic
              ? { background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }
              : { background: 'rgba(100,116,139,0.08)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }
            }
          >
            {isPublic ? <Globe size={14} /> : <Lock size={14} />}
            {isPublic ? 'Public' : 'Private'}
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-[3/4] bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center border border-dashed border-[#1e1e2e] space-y-4"
          style={{ background: 'rgba(108,71,255,0.03)' }}
        >
          <div className="text-5xl">🃏</div>
          <div>
            <p className="text-white font-bold text-lg">Your collection is empty</p>
            <p className="text-[#64748b] text-sm mt-1">
              Save cards from battles to build your collection
            </p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1e1e2e] text-left space-y-2 max-w-xs mx-auto">
            <p className="text-xs font-bold text-[#94a3b8]">💡 How to save cards</p>
            <p className="text-xs text-[#64748b]">
              Open any battle, then tap the <strong className="text-white">💾 Save Card</strong> button under each card to add it to your collection.
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cards.map(card => (
            <CardTile
              key={card.id}
              card={card}
              onRemove={() => setCards(prev => prev.filter(c => c.id !== card.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
