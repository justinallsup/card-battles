'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';
import { BackButton } from '../../../components/ui/BackButton';
import { showToast } from '../../../components/ui/Toast';
import { Heart, ShoppingCart, Trash2, DollarSign, TrendingUp } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

type WishlistCard = {
  id: string;
  player_name: string;
  image_url: string;
  title: string;
  year: number;
  sport: string;
  estimatedValue: number;
};

type WishlistData = {
  cards: WishlistCard[];
  total: number;
  totalEstimatedCost: number;
};

function WishlistCardItem({ card, onRemove }: { card: WishlistCard; onRemove: (id: string) => void }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await fetch(`${BASE_URL}/me/wishlist/${card.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      onRemove(card.id);
      showToast('Removed from wishlist', 'success');
    } catch {
      showToast('Failed to remove', 'error');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className="rounded-2xl border border-[#1e1e2e] overflow-hidden"
      style={{ background: '#12121a' }}
    >
      {/* Card image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.player_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1e1e2e]">
            <span className="text-4xl">🃏</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <button
            onClick={handleRemove}
            disabled={removing}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.9)' }}
            title="Remove from wishlist"
          >
            <Trash2 size={12} className="text-white" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
          <p className="text-white text-xs font-bold truncate">{card.player_name}</p>
          <p className="text-[#94a3b8] text-[10px]">{card.year} · {card.sport}</p>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-green-400">
            <DollarSign size={12} />
            <span className="text-sm font-black">${card.estimatedValue.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-[#64748b] font-medium">Est. Value</span>
        </div>

        <Link
          href={`/marketplace?q=${encodeURIComponent(card.player_name)}`}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.3)', color: '#6c47ff' }}
        >
          <ShoppingCart size={12} />
          Find in Market
        </Link>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<WishlistData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchWishlist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/me/wishlist`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {}
    setLoading(false);
  };

  const handleRemove = (cardId: string) => {
    if (!data) return;
    const updated = data.cards.filter(c => c.id !== cardId);
    setData({
      ...data,
      cards: updated,
      total: updated.length,
      totalEstimatedCost: updated.reduce((s, c) => s + c.estimatedValue, 0),
    });
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-[#1e1e2e]" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="text-2xl">💝</span>
            <div>
              <h1 className="text-lg font-black text-white">My Wishlist</h1>
              <p className="text-xs text-[#64748b]">Cards you want to own</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
          </div>
        ) : !data || data.cards.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'rgba(108,71,255,0.1)' }}>
              💝
            </div>
            <div>
              <h2 className="text-xl font-black text-white">No cards on your wishlist yet</h2>
              <p className="text-sm text-[#64748b] mt-2 max-w-xs">
                Add cards from battle pages, player profiles, or the market feed!
              </p>
            </div>
            <Link
              href="/battles"
              className="px-6 py-3 rounded-2xl font-bold text-white text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
            >
              Browse Battles
            </Link>
          </div>
        ) : (
          <>
            {/* Summary banner */}
            <div
              className="rounded-2xl p-4 border border-[#1e1e2e]"
              style={{ background: 'linear-gradient(135deg, rgba(108,71,255,0.1), rgba(139,92,246,0.05))' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(108,71,255,0.2)' }}>
                  💝
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#94a3b8]">{data.total} card{data.total !== 1 ? 's' : ''} wishlisted</p>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp size={14} className="text-green-400" />
                    <span className="text-lg font-black text-white">
                      ${data.totalEstimatedCost.toLocaleString()}
                    </span>
                    <span className="text-xs text-[#64748b]">total estimated cost</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 gap-3">
              {data.cards.map(card => (
                <WishlistCardItem key={card.id} card={card} onRemove={handleRemove} />
              ))}
            </div>

            {/* Browse more */}
            <div className="text-center py-4">
              <Link
                href="/marketplace"
                className="text-sm text-[#6c47ff] hover:underline font-semibold"
              >
                Browse Marketplace to find more cards →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
