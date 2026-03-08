'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Share2, Package, TrendingUp, TrendingDown, RotateCcw, Star, X } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
const FAKE_USERS = ['cardking','slabmaster','rookiehunter','packripper','gradegod','holomaster','prizmpull','refractorking','autochaser','rccollector'];
const REACTIONS = [{ emoji: '🔥', label: 'Fire' },{ emoji: '💎', label: 'Diamond' },{ emoji: '🗑️', label: 'Trash' }];
const RARITY_STYLES: Record<string,{bg:string;border:string;glow:string;label:string}> = {
  rare: { bg: 'from-[#6c47ff]/30 to-[#0a0a0f]', border: 'border-[#6c47ff]/60', glow: 'shadow-[0_0_30px_rgba(108,71,255,0.4)]', label: '💎 Rare Pull' },
  legendary: { bg: 'from-[#f59e0b]/30 to-[#0a0a0f]', border: 'border-[#f59e0b]/60', glow: 'shadow-[0_0_40px_rgba(245,158,11,0.5)]', label: '👑 Legendary Pull' },
  common: { bg: 'from-[#1e293b] to-[#0a0a0f]', border: 'border-[#1e1e2e]', glow: '', label: '🃏 Base Pull' },
};
const PACK_STYLES: Record<string,{gradient:string;emoji:string;badge:string}> = {
  'prizm-blaster': { gradient: 'from-[#6c47ff] to-[#8b5cf6]', emoji: '🎴', badge: 'Most Popular' },
  'chrome-hobby': { gradient: 'from-[#3b82f6] to-[#06b6d4]', emoji: '⚾', badge: 'Baseball Focus' },
  'national-treasures': { gradient: 'from-[#f59e0b] to-[#ef4444]', emoji: '👑', badge: 'Premium Box' },
};

interface Pack { id: string; name: string; price: number; cardsPerPack: number; rarityWeights: { common: number; rare: number; legendary: number }; sport: string; }
interface PulledCard { id: string; title?: string; player_name?: string; image_url?: string; sport?: string; rarity: 'common'|'rare'|'legendary'; estimatedValue: number; isHit: boolean; }
interface PackResult { pack: Pack; cards: PulledCard[]; totalValue: number; hits: PulledCard[]; packValue: number; profit: number; }
interface BreakHistoryItem { packName: string; date: string; totalValue: number; profit: number; hitCount: number; bestPull?: string; }
interface Pull { id: string; cardTitle: string; imageUrl: string; playerName: string; sport: string; pulledBy: string; pulledAgo: string; rarity: 'common'|'rare'|'legendary'; reactions: Record<string,number>; myReactions: Set<string>; }

function loadBreakHistory(): BreakHistoryItem[] {
  try { return JSON.parse(localStorage.getItem('cb_pack_history') || '[]'); } catch { return []; }
}
function saveBreakHistory(item: BreakHistoryItem) {
  try { const h = loadBreakHistory(); h.unshift(item); localStorage.setItem('cb_pack_history', JSON.stringify(h.slice(0, 5))); } catch {}
}
function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
function rarityFromSport(sport: string, index: number): 'common'|'rare'|'legendary' {
  const seed = (index * 13 + sport.charCodeAt(0)) % 10;
  if (seed >= 8) return 'legendary'; if (seed >= 4) return 'rare'; return 'common';
}

function PackSelector({ packs, selected, onSelect }: { packs: Pack[]; selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-black text-[#64748b] uppercase tracking-widest">Choose Your Pack</h2>
      <div className="space-y-2">
        {packs.map(pack => {
          const style = PACK_STYLES[pack.id] || { gradient: 'from-[#1e293b] to-[#0a0a0f]', emoji: '📦', badge: '' };
          const isSelected = selected === pack.id;
          return (
            <button key={pack.id} onClick={() => onSelect(pack.id)}
              className={`w-full rounded-2xl border p-3.5 text-left transition-all ${isSelected ? 'border-[#6c47ff]/60 shadow-[0_0_20px_rgba(108,71,255,0.2)]' : 'border-[#1e1e2e] hover:border-[#374151]'}`}
              style={{ background: isSelected ? 'rgba(108,71,255,0.08)' : '#12121a' }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-xl shrink-0`}>{style.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-white">{pack.name}</p>
                    {style.badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#6c47ff]/20 text-[#a78bfa] border border-[#6c47ff]/30 font-bold">{style.badge}</span>}
                  </div>
                  <p className="text-xs text-[#64748b] mt-0.5">{pack.cardsPerPack} cards · {(pack.rarityWeights.legendary * 100).toFixed(0)}% legendary</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-white">${pack.price}</p>
                  {isSelected && <div className="w-4 h-4 rounded-full bg-[#6c47ff] flex items-center justify-center ml-auto mt-1"><Star size={8} className="text-white" /></div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CardReveal({ card, index }: { card: PulledCard; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [showHit, setShowHit] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setFlipped(true);
      if (card.isHit) {
        setTimeout(() => setShowHit(true), 300);
        setTimeout(() => setShowHit(false), 2500);
      }
    }, index * 120 + 300);
    return () => clearTimeout(t);
  }, [index, card.isHit]);
  const rc = card.rarity === 'legendary' ? '#f59e0b' : card.rarity === 'rare' ? '#6c47ff' : '#374151';
  return (
    <div className="relative flex-shrink-0" style={{ width: 64, height: 90 }}>
      {showHit && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="text-xs font-black text-[#f59e0b] animate-bounce bg-[#f59e0b]/20 px-1.5 py-0.5 rounded-full border border-[#f59e0b]/50 whitespace-nowrap">HIT! 🔥</div>
        </div>
      )}
      {flipped ? (
        <div className="w-full h-full relative rounded-xl overflow-hidden border-2" style={{ borderColor: rc + '80', boxShadow: card.rarity !== 'common' ? `0 0 8px ${rc}60` : 'none' }}>
          <img src={card.image_url || 'https://placehold.co/64x90/1e1e2e/374151?text=Card'} alt={card.player_name || 'Card'} className="w-full h-full object-cover" />
          {card.rarity !== 'common' && <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to top, ${rc}30, transparent)` }} />}
          <div className="absolute bottom-0 left-0 right-0 px-1 pb-0.5 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-[5px] font-bold text-white leading-tight truncate">{card.player_name || 'Card'}</p>
            <p className="text-[4px] text-[#94a3b8]">${card.estimatedValue}</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#6c47ff] to-[#1e1e2e] border border-[#6c47ff]/30 flex items-center justify-center">
          <span className="text-lg opacity-40">⚔️</span>
        </div>
      )}
    </div>
  );
}

function PackResultSummary({ result, onReset }: { result: PackResult; onReset: () => void }) {
  const isProfit = result.profit >= 0;
  const bestPull = [...result.cards].sort((a, b) => b.estimatedValue - a.estimatedValue)[0];
  return (
    <div className="space-y-3 rounded-2xl border border-[#1e1e2e] p-4 bg-[#12121a]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">Pack Summary 📊</h3>
        <button onClick={onReset} className="flex items-center gap-1 text-xs text-[#64748b] hover:text-white transition-colors">
          <RotateCcw size={11} /> Open Another
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0a0a0f] rounded-xl p-2.5 border border-[#1e1e2e] text-center">
          <p className="text-base font-black text-white">${result.totalValue.toLocaleString()}</p>
          <p className="text-[9px] text-[#64748b] mt-0.5">Total Value</p>
        </div>
        <div className={`bg-[#0a0a0f] rounded-xl p-2.5 border text-center ${isProfit ? 'border-[#22c55e]/30' : 'border-[#ef4444]/30'}`}>
          <div className="flex items-center justify-center gap-0.5">
            {isProfit ? <TrendingUp size={12} className="text-[#22c55e]" /> : <TrendingDown size={12} className="text-[#ef4444]" />}
            <p className={`text-base font-black ${isProfit ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {isProfit ? '+' : '-'}${Math.abs(result.profit).toLocaleString()}
            </p>
          </div>
          <p className="text-[9px] text-[#64748b] mt-0.5">P&amp;L</p>
        </div>
        <div className="bg-[#0a0a0f] rounded-xl p-2.5 border border-[#f59e0b]/30 text-center">
          <p className="text-base font-black text-[#f59e0b]">{result.hits.length}</p>
          <p className="text-[9px] text-[#64748b] mt-0.5">Hits 👑</p>
        </div>
      </div>
      {bestPull && (
        <div className="flex items-center gap-3 bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e]">
          <img src={bestPull.image_url || 'https://placehold.co/60x84/1e1e2e/374151?text=Card'} alt="best" className="w-9 h-12 object-cover rounded-lg border border-[#1e1e2e]" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#64748b]">🏆 Best Pull</p>
            <p className="text-xs font-black text-white truncate">{bestPull.player_name || 'Unknown'}</p>
            <p className="text-xs text-[#22c55e] font-bold">${bestPull.estimatedValue.toLocaleString()}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${bestPull.rarity === 'legendary' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30' : bestPull.rarity === 'rare' ? 'bg-[#6c47ff]/20 text-[#a78bfa] border border-[#6c47ff]/30' : 'bg-[#1e293b] text-[#64748b] border border-[#374151]'}`}>
            {bestPull.rarity}
          </span>
        </div>
      )}
    </div>
  );
}

function BreakHistory({ refreshKey }: { refreshKey: number }) {
  const [history, setHistory] = useState<BreakHistoryItem[]>([]);
  useEffect(() => { setHistory(loadBreakHistory()); }, [refreshKey]);
  if (history.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-black text-[#64748b] uppercase tracking-widest">📼 Pack Break History</h2>
      <div className="space-y-2">
        {history.map((item, i) => {
          const isProfit = item.profit >= 0;
          return (
            <div key={i} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#6c47ff]/10 border border-[#6c47ff]/20 flex items-center justify-center text-base shrink-0">📦</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{item.packName}</p>
                <p className="text-[10px] text-[#64748b]">{item.date} · {item.hitCount} hit{item.hitCount !== 1 ? 's' : ''}</p>
                {item.bestPull && <p className="text-[10px] text-[#94a3b8] truncate">Best: {item.bestPull}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-black text-white">${item.totalValue.toLocaleString()}</p>
                <p className={`text-[10px] font-bold ${isProfit ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {isProfit ? '+' : '-'}${Math.abs(item.profit).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PullCard({ pull, onReact }: { pull: Pull; onReact: (pullId: string, emoji: string) => void }) {
  const style = RARITY_STYLES[pull.rarity];
  return (
    <div className={`relative rounded-2xl border overflow-hidden bg-gradient-to-b ${style.bg} ${style.border} ${style.glow} transition-shadow duration-300`}>
      <div className="absolute top-3 left-3 z-10">
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${pull.rarity === 'legendary' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40' : pull.rarity === 'rare' ? 'bg-[#6c47ff]/20 text-[#a78bfa] border border-[#6c47ff]/40' : 'bg-[#1e293b] text-[#64748b] border border-[#1e1e2e]'}`}>
          {style.label}
        </span>
      </div>
      <div className="relative pt-12 px-4 pb-2 flex justify-center">
        <div className={`w-40 aspect-[3/4] rounded-xl overflow-hidden border ${style.border} relative`}>
          <img src={pull.imageUrl} alt={pull.cardTitle} className="w-full h-full object-cover" />
          {pull.rarity === 'legendary' && <div className="absolute inset-0 bg-gradient-to-t from-[#f59e0b]/20 to-transparent pointer-events-none" />}
          {pull.rarity === 'rare' && <div className="absolute inset-0 bg-gradient-to-t from-[#6c47ff]/20 to-transparent pointer-events-none" />}
        </div>
      </div>
      <div className="px-4 pb-1 text-center">
        <h3 className="text-sm font-bold text-[#f1f5f9] line-clamp-2 leading-tight">{pull.cardTitle}</h3>
        <p className="text-xs text-[#64748b] mt-0.5">{pull.playerName} · {pull.sport.toUpperCase()}</p>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-[#1e1e2e]/50 mt-1">
        <div className="w-6 h-6 rounded-full bg-[#6c47ff]/20 border border-[#6c47ff]/40 flex items-center justify-center text-[10px] text-[#a78bfa] font-bold">
          {pull.pulledBy[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#94a3b8]"><span className="font-semibold text-[#f1f5f9]">@{pull.pulledBy}</span> pulled this</p>
          <p className="text-[10px] text-[#64748b]">{pull.pulledAgo}</p>
        </div>
        <Sparkles size={12} className="text-[#6c47ff] shrink-0" />
      </div>
      <div className="flex items-center gap-2 px-4 pb-3 pt-1">
        {REACTIONS.map(({ emoji, label }) => {
          const count = pull.reactions[emoji] || 0;
          const reacted = pull.myReactions.has(emoji);
          return (
            <button key={emoji} onClick={() => onReact(pull.id, emoji)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-90 ${reacted ? 'bg-[#6c47ff]/20 border border-[#6c47ff]/40 text-[#a78bfa]' : 'bg-[#12121a] border border-[#1e1e2e] text-[#64748b] hover:border-[#374151]'}`}
              title={label}
            ><span>{emoji}</span>{count > 0 && <span>{count}</span>}</button>
          );
        })}
        <button className="ml-auto text-[#64748b] hover:text-[#f1f5f9] transition-colors"
          onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(`Check out this ${pull.rarity} pull on Card Battles! 🎴`); }}
          title="Share"><Share2 size={14} /></button>
      </div>
    </div>
  );
}

export default function PullArenaPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState('prizm-blaster');
  const [packResult, setPackResult] = useState<PackResult | null>(null);
  const [opening, setOpening] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [pulls, setPulls] = useState<Pull[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    fetch(`${BASE_URL}/packs`).then(r => r.json()).then(d => setPacks(d.packs || [])).catch(() => setPacks([
      { id: 'prizm-blaster', name: 'Prizm Blaster Box', price: 89, cardsPerPack: 20, rarityWeights: { common: 0.7, rare: 0.2, legendary: 0.1 }, sport: 'all' },
      { id: 'chrome-hobby', name: 'Chrome Hobby Box', price: 120, cardsPerPack: 18, rarityWeights: { common: 0.6, rare: 0.25, legendary: 0.15 }, sport: 'mlb' },
      { id: 'national-treasures', name: 'National Treasures', price: 999, cardsPerPack: 4, rarityWeights: { common: 0.1, rare: 0.4, legendary: 0.5 }, sport: 'all' },
    ]));
  }, []);

  useEffect(() => {
    async function loadPulls() {
      try {
        const res = await fetch(`${BASE_URL}/battles/feed`, { headers: { Authorization: `Bearer ${localStorage.getItem('cb_access_token') || ''}` } });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json() as { items: Array<{ id: string; left: { title: string; imageUrl: string; playerName?: string }; right: { title: string; imageUrl: string; playerName?: string }; categories: string[] }> };
        const generated: Pull[] = [];
        data.items.forEach((battle, battleIdx) => {
          [battle.left, battle.right].forEach((card, cardIdx) => {
            const idx = battleIdx * 2 + cardIdx;
            const sport = battle.categories?.[0] || 'unknown';
            const rarity = rarityFromSport(sport, idx);
            const pullDate = new Date(Date.now() - (idx * 7 + Math.random() * 30) * 60 * 1000);
            generated.push({
              id: `${battle.id}-${cardIdx}`, cardTitle: card.title, imageUrl: card.imageUrl,
              playerName: card.playerName || 'Unknown Player', sport, pulledBy: FAKE_USERS[idx % FAKE_USERS.length],
              pulledAgo: timeAgo(pullDate), rarity,
              reactions: { '🔥': Math.floor(Math.random() * 40) + (rarity === 'legendary' ? 20 : 0), '💎': Math.floor(Math.random() * 25) + (rarity === 'rare' ? 10 : 0), '🗑️': Math.floor(Math.random() * 5) },
              myReactions: new Set(),
            });
          });
        });
        generated.sort((a, b) => ({ legendary: 0, rare: 1, common: 2 }[a.rarity] - { legendary: 0, rare: 1, common: 2 }[b.rarity]));
        setPulls(generated.slice(0, 20));
      } catch {
        const demos: Pull[] = Array.from({ length: 8 }, (_, i) => ({
          id: `demo-${i}`,
          cardTitle: ['Mahomes 2017 Prizm RC PSA 10','LeBron 2003 Topps Chrome RC','Jordan 1986 Fleer PSA 9','Ohtani 2018 RC PSA 10'][i % 4],
          imageUrl: `https://placehold.co/400x560/${['6c47ff','f59e0b','ef4444','22c55e'][i % 4]}/ffffff?text=Card+${i + 1}`,
          playerName: ['Mahomes','LeBron','Jordan','Ohtani'][i % 4],
          sport: ['nfl','nba','nba','mlb'][i % 4],
          pulledBy: FAKE_USERS[i % FAKE_USERS.length],
          pulledAgo: timeAgo(new Date(Date.now() - i * 8 * 60 * 1000)),
          rarity: (['legendary','rare','rare','common','legendary','common','rare','common'] as const)[i],
          reactions: { '🔥': Math.floor(Math.random() * 50), '💎': Math.floor(Math.random() * 30), '🗑️': Math.floor(Math.random() * 5) },
          myReactions: new Set<string>(),
        }));
        setPulls(demos);
      } finally { setFeedLoading(false); }
    }
    loadPulls();
  }, []);

  const handleOpenPack = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('cb_access_token') : '';
    if (!token) { alert('Please log in to open packs'); return; }
    setOpening(true); setPackResult(null);
    try {
      const res = await fetch(`${BASE_URL}/packs/${selectedPackId}/open`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json() as PackResult;
      setPackResult(result);
      const bestPull = [...result.cards].sort((a, b) => b.estimatedValue - a.estimatedValue)[0];
      saveBreakHistory({ packName: result.pack.name, date: new Date().toLocaleDateString(), totalValue: result.totalValue, profit: result.profit, hitCount: result.hits.length, bestPull: bestPull?.player_name });
      setHistoryKey(k => k + 1);
    } catch (e) { console.error(e); }
    setOpening(false);
  };

  const handleReact = (pullId: string, emoji: string) => {
    setPulls(prev => prev.map(p => {
      if (p.id !== pullId) return p;
      const newMy = new Set(p.myReactions);
      if (newMy.has(emoji)) { newMy.delete(emoji); return { ...p, myReactions: newMy, reactions: { ...p.reactions, [emoji]: Math.max(0, (p.reactions[emoji] || 0) - 1) } }; }
      else { newMy.add(emoji); return { ...p, myReactions: newMy, reactions: { ...p.reactions, [emoji]: (p.reactions[emoji] || 0) + 1 } }; }
    }));
  };

  const handleShare = (url: string, title: string) => {
    const rarity = rarityFromSport('nfl', pulls.length);
    setPulls(prev => [{
      id: `user-${Date.now()}`, cardTitle: title,
      imageUrl: url || `https://placehold.co/400x560/6c47ff/ffffff?text=Card`,
      playerName: title.split(' ')[0], sport: 'nfl', pulledBy: 'you', pulledAgo: 'just now',
      rarity, reactions: { '🔥': 0, '💎': 0, '🗑️': 0 }, myReactions: new Set<string>(),
    }, ...prev]);
    setShowShareModal(false); setShareTitle(''); setShareUrl('');
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Package size={22} className="text-[#6c47ff]" />Pull Arena</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Open packs &amp; share your rips</p>
        </div>
        <button onClick={() => setShowShareModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#6c47ff] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#6c47ff]/30 hover:bg-[#7c57ff] transition-colors active:scale-95">
          <Sparkles size={12} /> Share Pull
        </button>
      </div>

      {/* Pack Opener */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#12121a] p-4 space-y-4">
        <h2 className="text-sm font-black text-white flex items-center gap-2">📦 Open a Pack</h2>
        {packs.length === 0 ? (
          <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-16 bg-[#1e1e2e] rounded-2xl animate-pulse"/>)}</div>
        ) : (
          <PackSelector packs={packs} selected={selectedPackId} onSelect={setSelectedPackId} />
        )}
        <button onClick={handleOpenPack} disabled={opening || packs.length === 0}
          className="w-full py-3.5 rounded-xl font-black text-white text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', boxShadow: '0 4px 20px rgba(108,71,255,0.4)' }}
        >
          {opening ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Opening…</>
          ) : (
            <>🎴 Open Pack — ${packs.find(p => p.id === selectedPackId)?.price || 89}</>
          )}
        </button>

        {/* Card Grid Reveal */}
        {packResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#64748b]">
              <span>{packResult.cards.length} cards revealed</span>
              <span>{packResult.hits.length > 0 ? `🔥 ${packResult.hits.length} HIT${packResult.hits.length > 1 ? 'S' : ''}!` : 'No hits this time'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {packResult.cards.map((card, i) => (
                <CardReveal key={card.id || i} card={card} index={i} />
              ))}
            </div>
            <PackResultSummary result={packResult} onReset={() => setPackResult(null)} />
          </div>
        )}
      </div>

      {/* Break History */}
      <BreakHistory refreshKey={historyKey} />

      {/* Rarity Legend */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {Object.entries(RARITY_STYLES).map(([key, style]) => (
          <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${style.border} bg-gradient-to-r ${style.bg} shrink-0`}>
            <span className="text-xs font-semibold text-[#94a3b8]">{style.label}</span>
          </div>
        ))}
      </div>

      {/* Community Feed Header */}
      <div>
        <h2 className="text-sm font-black text-white mb-3">🔥 Community Pulls</h2>
        {feedLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#64748b]">Loading pulls…</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pulls.map(pull => <PullCard key={pull.id} pull={pull} onReact={handleReact} />)}
            {pulls.length === 0 && (
              <div className="text-center py-16 text-[#64748b]">
                <Package size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold">No pulls yet</p>
                <p className="text-sm">Be the first to share!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowShareModal(false)}>
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-t-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Share Your Pull 🎴</h3>
              <button onClick={() => setShowShareModal(false)} className="text-[#64748b] hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <input type="url" placeholder="Card image URL" value={shareUrl} onChange={e => setShareUrl(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]" />
            <input type="text" placeholder="Card title (e.g. Mahomes 2017 Prizm RC PSA 10)" value={shareTitle} onChange={e => setShareTitle(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]" />
            <div className="flex gap-3">
              <button onClick={() => setShowShareModal(false)} className="flex-1 py-3 rounded-xl border border-[#1e1e2e] text-[#64748b] text-sm font-semibold">Cancel</button>
              <button onClick={() => { if (shareTitle) handleShare(shareUrl, shareTitle); }} disabled={!shareTitle}
                className="flex-1 py-3 rounded-xl bg-[#6c47ff] text-white text-sm font-bold disabled:opacity-40">Share Pull 🔥</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
