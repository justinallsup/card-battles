'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Share2, Package } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

// Demo usernames for simulated pulls
const FAKE_USERS = [
  'cardking', 'slabmaster', 'rookiehunter', 'packripper', 'gradegod',
  'holomaster', 'prizmpull', 'refractorking', 'autochaser', 'rccollector',
];

const REACTIONS = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💎', label: 'Diamond' },
  { emoji: '🗑️', label: 'Trash' },
];

const RARITY_STYLES: Record<string, { bg: string; border: string; glow: string; label: string }> = {
  rare: {
    bg: 'from-[#6c47ff]/30 to-[#0a0a0f]',
    border: 'border-[#6c47ff]/60',
    glow: 'shadow-[0_0_30px_rgba(108,71,255,0.4)]',
    label: '💎 Rare Pull',
  },
  legendary: {
    bg: 'from-[#f59e0b]/30 to-[#0a0a0f]',
    border: 'border-[#f59e0b]/60',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.5)]',
    label: '👑 Legendary Pull',
  },
  common: {
    bg: 'from-[#1e293b] to-[#0a0a0f]',
    border: 'border-[#1e1e2e]',
    glow: '',
    label: '🃏 Base Pull',
  },
};

interface Pull {
  id: string;
  cardTitle: string;
  imageUrl: string;
  playerName: string;
  sport: string;
  pulledBy: string;
  pulledAgo: string;
  rarity: 'common' | 'rare' | 'legendary';
  reactions: Record<string, number>;
  myReactions: Set<string>;
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function rarityFromSport(sport: string, index: number): 'common' | 'rare' | 'legendary' {
  // Deterministic but varied rarity
  const seed = (index * 13 + sport.charCodeAt(0)) % 10;
  if (seed >= 8) return 'legendary';
  if (seed >= 4) return 'rare';
  return 'common';
}

function PullCard({ pull, onReact }: { pull: Pull; onReact: (pullId: string, emoji: string) => void }) {
  const style = RARITY_STYLES[pull.rarity];

  return (
    <div className={`relative rounded-2xl border overflow-hidden bg-gradient-to-b ${style.bg} ${style.border} ${style.glow} transition-shadow duration-300`}>
      {/* Rarity badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          pull.rarity === 'legendary' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40' :
          pull.rarity === 'rare' ? 'bg-[#6c47ff]/20 text-[#a78bfa] border border-[#6c47ff]/40' :
          'bg-[#1e293b] text-[#64748b] border border-[#1e1e2e]'
        }`}>
          {style.label}
        </span>
      </div>

      {/* Card image */}
      <div className="relative pt-12 px-4 pb-2 flex justify-center">
        <div className={`w-40 aspect-[3/4] rounded-xl overflow-hidden border ${style.border} relative`}>
          <img
            src={pull.imageUrl}
            alt={pull.cardTitle}
            className="w-full h-full object-cover"
          />
          {pull.rarity === 'legendary' && (
            <div className="absolute inset-0 bg-gradient-to-t from-[#f59e0b]/20 to-transparent pointer-events-none" />
          )}
          {pull.rarity === 'rare' && (
            <div className="absolute inset-0 bg-gradient-to-t from-[#6c47ff]/20 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Card info */}
      <div className="px-4 pb-1 text-center">
        <h3 className="text-sm font-bold text-[#f1f5f9] line-clamp-2 leading-tight">{pull.cardTitle}</h3>
        <p className="text-xs text-[#64748b] mt-0.5">{pull.playerName} • {pull.sport.toUpperCase()}</p>
      </div>

      {/* Pulled by */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-[#1e1e2e]/50 mt-1">
        <div className="w-6 h-6 rounded-full bg-[#6c47ff]/20 border border-[#6c47ff]/40 flex items-center justify-center text-[10px] text-[#a78bfa] font-bold">
          {pull.pulledBy[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#94a3b8]">
            <span className="font-semibold text-[#f1f5f9]">@{pull.pulledBy}</span> pulled this
          </p>
          <p className="text-[10px] text-[#64748b]">{pull.pulledAgo}</p>
        </div>
        <Sparkles size={12} className="text-[#6c47ff] shrink-0" />
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-1">
        {REACTIONS.map(({ emoji, label }) => {
          const count = pull.reactions[emoji] || 0;
          const reacted = pull.myReactions.has(emoji);
          return (
            <button
              key={emoji}
              onClick={() => onReact(pull.id, emoji)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-90 ${
                reacted
                  ? 'bg-[#6c47ff]/20 border border-[#6c47ff]/40 text-[#a78bfa]'
                  : 'bg-[#12121a] border border-[#1e1e2e] text-[#64748b] hover:border-[#374151]'
              }`}
              title={label}
            >
              <span>{emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}

        <button
          className="ml-auto text-[#64748b] hover:text-[#f1f5f9] transition-colors"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(`Check out this ${pull.rarity} pull on Card Battles! 🎴`);
            }
          }}
          title="Share"
        >
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
}

function SharePullModal({ onClose, onShare }: { onClose: () => void; onShare: (url: string, title: string) => void }) {
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-[#12121a] border border-[#1e1e2e] rounded-t-2xl w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-black text-white">Share Your Pull 🎴</h3>
        <input
          type="url"
          placeholder="Card image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]"
        />
        <input
          type="text"
          placeholder="Card title (e.g. Mahomes 2017 Prizm RC PSA 10)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#1e1e2e] text-[#64748b] text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (title) onShare(imageUrl, title); }}
            disabled={!title}
            className="flex-1 py-3 rounded-xl bg-[#6c47ff] text-white text-sm font-bold disabled:opacity-40"
          >
            Share Pull 🔥
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PullArenaPage() {
  const [pulls, setPulls] = useState<Pull[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    async function loadPulls() {
      try {
        // Fetch card assets from the API feed and simulate pulls
        const res = await fetch(`${BASE_URL}/battles/feed`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('cb_access_token') || ''}` },
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json() as { items: Array<{ id: string; left: { title: string; imageUrl: string; playerName?: string }; right: { title: string; imageUrl: string; playerName?: string }; categories: string[] }> };

        // Create pulls from battle card assets
        const generated: Pull[] = [];
        data.items.forEach((battle, battleIdx) => {
          // Add left and right cards as separate pulls
          [battle.left, battle.right].forEach((card, cardIdx) => {
            const idx = battleIdx * 2 + cardIdx;
            const sport = battle.categories?.[0] || 'unknown';
            const rarity = rarityFromSport(sport, idx);
            const pullDate = new Date(Date.now() - (idx * 7 + Math.random() * 30) * 60 * 1000);

            generated.push({
              id: `${battle.id}-${cardIdx}`,
              cardTitle: card.title,
              imageUrl: card.imageUrl,
              playerName: card.playerName || 'Unknown Player',
              sport: sport,
              pulledBy: FAKE_USERS[idx % FAKE_USERS.length],
              pulledAgo: timeAgo(pullDate),
              rarity,
              reactions: {
                '🔥': Math.floor(Math.random() * 40) + (rarity === 'legendary' ? 20 : 0),
                '💎': Math.floor(Math.random() * 25) + (rarity === 'rare' ? 10 : 0),
                '🗑️': Math.floor(Math.random() * 5),
              },
              myReactions: new Set(),
            });
          });
        });

        // Sort by rarity then time
        generated.sort((a, b) => {
          const rarityOrder = { legendary: 0, rare: 1, common: 2 };
          return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        });

        setPulls(generated.slice(0, 20));
      } catch {
        // Fallback: generate demo pulls
        const demos: Pull[] = Array.from({ length: 8 }, (_, i) => ({
          id: `demo-${i}`,
          cardTitle: ['Mahomes 2017 Prizm RC PSA 10', 'LeBron 2003 Topps Chrome RC', 'Jordan 1986 Fleer PSA 9', 'Ohtani 2018 RC PSA 10'][i % 4],
          imageUrl: `https://placehold.co/400x560/${['6c47ff', 'f59e0b', 'ef4444', '22c55e'][i % 4]}/ffffff?text=Card+${i + 1}`,
          playerName: ['Mahomes', 'LeBron', 'Jordan', 'Ohtani'][i % 4],
          sport: ['nfl', 'nba', 'nba', 'mlb'][i % 4],
          pulledBy: FAKE_USERS[i % FAKE_USERS.length],
          pulledAgo: timeAgo(new Date(Date.now() - i * 8 * 60 * 1000)),
          rarity: (['legendary', 'rare', 'rare', 'common', 'legendary', 'common', 'rare', 'common'][i] as 'common' | 'rare' | 'legendary'),
          reactions: { '🔥': Math.floor(Math.random() * 50), '💎': Math.floor(Math.random() * 30), '🗑️': Math.floor(Math.random() * 5) },
          myReactions: new Set(),
        }));
        setPulls(demos);
      } finally {
        setLoading(false);
      }
    }
    loadPulls();
  }, []);

  const handleReact = (pullId: string, emoji: string) => {
    setPulls((prev) => prev.map((p) => {
      if (p.id !== pullId) return p;
      const newMyReactions = new Set(p.myReactions);
      const alreadyReacted = newMyReactions.has(emoji);
      if (alreadyReacted) {
        newMyReactions.delete(emoji);
        return {
          ...p,
          myReactions: newMyReactions,
          reactions: { ...p.reactions, [emoji]: Math.max(0, (p.reactions[emoji] || 0) - 1) },
        };
      } else {
        newMyReactions.add(emoji);
        return {
          ...p,
          myReactions: newMyReactions,
          reactions: { ...p.reactions, [emoji]: (p.reactions[emoji] || 0) + 1 },
        };
      }
    }));
  };

  const handleShare = (imageUrl: string, title: string) => {
    const rarity = rarityFromSport('nfl', pulls.length);
    const newPull: Pull = {
      id: `user-${Date.now()}`,
      cardTitle: title,
      imageUrl: imageUrl || `https://placehold.co/400x560/6c47ff/ffffff?text=${encodeURIComponent(title.slice(0, 10))}`,
      playerName: title.split(' ')[0],
      sport: 'nfl',
      pulledBy: 'you',
      pulledAgo: 'just now',
      rarity,
      reactions: { '🔥': 0, '💎': 0, '🗑️': 0 },
      myReactions: new Set(),
    };
    setPulls((prev) => [newPull, ...prev]);
    setShowShareModal(false);
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Package size={22} className="text-[#6c47ff]" />
            Pull Arena
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">Share your pack rips with the community</p>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#6c47ff] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#6c47ff]/30 hover:bg-[#7c57ff] transition-colors active:scale-95"
        >
          <Sparkles size={14} />
          Share Pull
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {Object.entries(RARITY_STYLES).map(([key, style]) => (
          <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${style.border} bg-gradient-to-r ${style.bg} shrink-0`}>
            <span className="text-xs font-semibold text-[#94a3b8]">{style.label}</span>
          </div>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748b]">Loading pulls…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pulls.map((pull) => (
            <PullCard key={pull.id} pull={pull} onReact={handleReact} />
          ))}
          {pulls.length === 0 && (
            <div className="text-center py-16 text-[#64748b]">
              <Package size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No pulls yet</p>
              <p className="text-sm">Be the first to share!</p>
            </div>
          )}
        </div>
      )}

      {showShareModal && (
        <SharePullModal
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
        />
      )}
    </div>
  );
}
