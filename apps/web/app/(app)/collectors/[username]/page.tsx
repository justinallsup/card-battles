'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../hooks/useAuth';
import { BackButton } from '../../../../components/ui/BackButton';
import { showToast } from '../../../../components/ui/Toast';
import { Share2, UserPlus, Swords, ExternalLink } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface CollectionCard {
  id: string;
  image_url: string;
  player_name?: string;
  year?: number;
  sport?: string;
  title: string;
}

function estimateValue(card: CollectionCard): string {
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

function estimateValueNum(card: CollectionCard): number {
  const base = card.year ? Math.max(50, (2026 - card.year) * 12) : 75;
  const playerFactor = card.player_name?.toLowerCase().includes('jordan') ? 8
    : card.player_name?.toLowerCase().includes('brady') ? 6
    : card.player_name?.toLowerCase().includes('lebron') ? 7
    : card.player_name?.toLowerCase().includes('mahomes') ? 5
    : 1;
  return base * playerFactor;
}

function formatTotal(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

export default function PublicCollectionPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user } = useAuth();
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/users/${username}/collection`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data) setCards(data.cards ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  const totalValue = cards.reduce((acc, c) => acc + estimateValueNum(c), 0);

  const handleShare = async () => {
    const url = `https://cardbattles.app/collectors/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Collection URL copied! 📋', 'success');
    } catch {
      showToast(`Share: ${url}`, 'info');
    }
  };

  const handleFollow = async () => {
    if (!user) { showToast('Log in to follow collectors', 'info'); return; }
    try {
      const method = following ? 'POST' : 'POST';
      await fetch(`${BASE}/users/${username}/${following ? 'unfollow' : 'follow'}`, {
        method,
        headers: { Authorization: `Bearer ${localStorage.getItem('cb_token')}` },
      });
      setFollowing(!following);
      showToast(following ? `Unfollowed @${username}` : `Following @${username}! 🎉`, 'success');
    } catch {
      showToast('Could not follow user', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <BackButton />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-[3/4] bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <BackButton />
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <span className="text-5xl">🔍</span>
          <h1 className="text-xl font-black text-white">Collector not found</h1>
          <p className="text-[#64748b]">No collector with username @{username}</p>
          <Link href="/feed" className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}>
            Browse Battles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackButton />

      {/* Header */}
      <div className="rounded-2xl border border-[#1e1e2e] p-5 space-y-4" style={{ background: '#12121a' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              📦 @{username}&apos;s Collection
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-[#64748b]">
                <span className="font-bold text-white">{cards.length}</span> cards
              </span>
              <span className="text-[#374151]">·</span>
              <span className="text-sm text-[#64748b]">
                Est. value: <span className="font-bold text-[#22c55e]">{formatTotal(totalValue)}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleFollow}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={following
                ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                : { background: 'rgba(108,71,255,0.1)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.3)' }
              }
            >
              <UserPlus size={13} />
              {following ? 'Following' : 'Follow'}
            </button>
            <Link
              href={`/battles/create?player=${encodeURIComponent(username)}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <Swords size={13} />
              Challenge
            </Link>
          </div>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(108,71,255,0.08)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.2)' }}
        >
          <Share2 size={14} />
          Share this collection
        </button>
      </div>

      {/* Cards grid */}
      {cards.length === 0 ? (
        <div className="rounded-2xl p-8 text-center border border-dashed border-[#1e1e2e] space-y-3" style={{ background: 'rgba(108,71,255,0.03)' }}>
          <div className="text-5xl">🃏</div>
          <p className="text-white font-bold">@{username} hasn&apos;t saved any cards yet</p>
          <p className="text-[#64748b] text-sm">Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cards.map(card => (
            <div
              key={card.id}
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
                <Link
                  href="/feed"
                  className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors mt-auto"
                  style={{ background: 'rgba(108,71,255,0.1)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.3)' }}
                >
                  <ExternalLink size={11} /> View Battles
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
