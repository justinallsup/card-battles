'use client';
import { useState, useEffect } from 'react';
import { Swords, Plus, X, Search, Trophy, ChevronRight } from 'lucide-react';
import { getToken } from '../../../lib/api';
import { showToast } from '../../../components/ui/Toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface RoundInfo { round: number; category: string; leftVotes: number; rightVotes: number; winner?: 'left' | 'right'; }
interface CardAsset { id: string; title: string; image_url: string; player_name?: string; sport?: string; }
interface MultiRoundBattle {
  id: string; leftAssetId: string; rightAssetId: string; title: string;
  rounds: RoundInfo[]; currentRound: number; leftWins: number; rightWins: number;
  status: 'live' | 'complete'; winner?: 'left' | 'right'; createdAt: string;
  leftCard?: CardAsset; rightCard?: CardAsset;
}

const CATEGORY_LABELS: Record<string,string> = { investment: '📈 Investment', coolest: '🔥 Coolest', rarity: '💎 Rarity' };

function ScoreBadge({ leftWins, rightWins, status }: { leftWins: number; rightWins: number; status: string }) {
  const leading = leftWins > rightWins ? 'Left' : rightWins > leftWins ? 'Right' : 'Tied';
  const color = status === 'complete' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' : 'bg-[#6c47ff]/20 text-[#a78bfa] border-[#6c47ff]/30';
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${color}`}>
      {status === 'complete' ? `${leading} wins series!` : `${leading} leads ${leftWins}-${rightWins}`}
    </span>
  );
}

function RoundIndicator({ rounds, currentRound, status }: { rounds: RoundInfo[]; currentRound: number; status: string }) {
  return (
    <div className="flex gap-2">
      {rounds.map(r => {
        const isActive = r.round === currentRound && status === 'live';
        const isDone = r.winner !== undefined;
        const winColor = r.winner === 'left' ? '#3b82f6' : r.winner === 'right' ? '#ef4444' : '#22c55e';
        return (
          <div key={r.round} className="flex-1">
            <div className={`h-1.5 rounded-full transition-all ${isActive ? 'animate-pulse' : ''}`}
              style={{ background: isDone ? winColor : isActive ? '#6c47ff' : '#1e1e2e' }} />
            <p className="text-[9px] text-center mt-1" style={{ color: isActive ? '#a78bfa' : '#374151' }}>
              {CATEGORY_LABELS[r.category]?.split(' ')[1] || r.category}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function BattleCard({ battle, onVote, onAdvance }: { battle: MultiRoundBattle; onVote: (id: string, choice: 'left'|'right') => void; onAdvance: (id: string) => void }) {
  const currentRound = battle.rounds[battle.currentRound - 1];
  const totalVotes = (currentRound?.leftVotes || 0) + (currentRound?.rightVotes || 0);
  const leftPct = totalVotes > 0 ? Math.round((currentRound.leftVotes / totalVotes) * 100) : 50;
  const rightPct = 100 - leftPct;

  const leftImg = battle.leftCard?.image_url || `https://placehold.co/80x112/6c47ff/ffffff?text=L`;
  const rightImg = battle.rightCard?.image_url || `https://placehold.co/80x112/8b5cf6/ffffff?text=R`;

  return (
    <div className={`rounded-2xl border bg-[#12121a] overflow-hidden transition-all ${battle.status === 'complete' ? 'border-[#f59e0b]/30' : 'border-[#1e1e2e]'}`}
      style={{ boxShadow: battle.status === 'complete' ? '0 0 16px rgba(245,158,11,0.15)' : 'none' }}
    >
      {/* Title row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="text-sm font-black text-white truncate flex-1">{battle.title}</h3>
        {battle.status === 'complete' ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 font-black shrink-0 ml-2">SERIES DONE</span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 font-black shrink-0 ml-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse inline-block" />LIVE
          </span>
        )}
      </div>

      {/* Cards and scores */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <img src={leftImg} alt={battle.leftCard?.player_name || 'Left'} className="w-14 h-20 object-cover rounded-lg border border-[#1e1e2e]" />
          <p className="text-[10px] font-bold text-[#f1f5f9] text-center truncate w-full">{battle.leftCard?.player_name || 'Card A'}</p>
          <p className="text-xs font-black text-[#3b82f6]">{leftPct}%</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-2xl font-black text-[#6c47ff]">{battle.leftWins}</div>
          <Swords size={16} className="text-[#64748b]" />
          <div className="text-2xl font-black text-[#ef4444]">{battle.rightWins}</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <img src={rightImg} alt={battle.rightCard?.player_name || 'Right'} className="w-14 h-20 object-cover rounded-lg border border-[#1e1e2e]" />
          <p className="text-[10px] font-bold text-[#f1f5f9] text-center truncate w-full">{battle.rightCard?.player_name || 'Card B'}</p>
          <p className="text-xs font-black text-[#ef4444]">{rightPct}%</p>
        </div>
      </div>

      {/* Round indicators */}
      <div className="px-4 pb-3">
        <RoundIndicator rounds={battle.rounds} currentRound={battle.currentRound} status={battle.status} />
      </div>

      {/* Score badge */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <ScoreBadge leftWins={battle.leftWins} rightWins={battle.rightWins} status={battle.status} />
        {currentRound && (
          <p className="text-[10px] text-[#64748b]">
            Round {battle.currentRound}: {CATEGORY_LABELS[currentRound.category] || currentRound.category}
          </p>
        )}
      </div>

      {/* Vote bar */}
      {battle.status === 'live' && currentRound && (
        <div className="px-4 pb-2">
          <div className="h-1.5 rounded-full bg-[#1e1e2e] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#3b82f6] to-[#6c47ff] rounded-full transition-all duration-500" style={{ width: `${leftPct}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-[#64748b] mt-1">
            <span>{currentRound.leftVotes} votes</span><span>{currentRound.rightVotes} votes</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {battle.status === 'live' && (
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={() => onVote(battle.id, 'left')}
            className="flex-1 py-2.5 rounded-xl border border-[#3b82f6]/50 text-[#3b82f6] text-xs font-black hover:bg-[#3b82f6]/10 transition-all active:scale-95">
            Vote Left 👈
          </button>
          <button onClick={() => onAdvance(battle.id)}
            className="px-3 py-2.5 rounded-xl border border-[#374151] text-[#64748b] text-xs font-bold hover:border-[#6c47ff] hover:text-[#6c47ff] transition-all"
            title="Advance round">
            <ChevronRight size={14} />
          </button>
          <button onClick={() => onVote(battle.id, 'right')}
            className="flex-1 py-2.5 rounded-xl border border-[#ef4444]/50 text-[#ef4444] text-xs font-black hover:bg-[#ef4444]/10 transition-all active:scale-95">
            Vote Right 👉
          </button>
        </div>
      )}

      {battle.status === 'complete' && (
        <div className="px-4 pb-4 text-center">
          <p className="text-sm font-black text-[#f59e0b]">
            🏆 {battle.winner === 'left' ? (battle.leftCard?.player_name || 'Left') : (battle.rightCard?.player_name || 'Right')} wins the series!
          </p>
          <p className="text-xs text-[#64748b] mt-0.5">Final: {battle.leftWins}-{battle.rightWins}</p>
        </div>
      )}
    </div>
  );
}

function CreateBattleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (b: MultiRoundBattle) => void }) {
  const [title, setTitle] = useState('');
  const [leftQuery, setLeftQuery] = useState('');
  const [rightQuery, setRightQuery] = useState('');
  const [leftResults, setLeftResults] = useState<CardAsset[]>([]);
  const [rightResults, setRightResults] = useState<CardAsset[]>([]);
  const [leftCard, setLeftCard] = useState<CardAsset | null>(null);
  const [rightCard, setRightCard] = useState<CardAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const searchCards = async (q: string, side: 'left'|'right') => {
    if (!q.trim()) { if (side === 'left') setLeftResults([]); else setRightResults([]); return; }
    try {
      const res = await fetch(`${BASE_URL}/cards/search?q=${encodeURIComponent(q)}&limit=5`, { headers: { Authorization: `Bearer ${getToken() || ''}` } });
      const data = await res.json() as { cards?: CardAsset[]; results?: CardAsset[] };
      const results = data.cards || data.results || [];
      if (side === 'left') setLeftResults(results); else setRightResults(results);
    } catch { if (side === 'left') setLeftResults([]); else setRightResults([]); }
  };

  const handleSubmit = async () => {
    if (!leftCard || !rightCard) { showToast('Select both cards', 'error'); return; }
    const token = getToken();
    if (!token) { showToast('Log in first', 'info'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/multi-battles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leftAssetId: leftCard.id, rightAssetId: rightCard.id, title: title || `${leftCard.player_name || leftCard.title} vs ${rightCard.player_name || rightCard.title}` }),
      });
      if (!res.ok) throw new Error('Failed');
      const battle = await res.json() as MultiRoundBattle;
      showToast('Best of 3 battle created!', 'success');
      onCreated(battle);
    } catch { showToast('Failed to create battle', 'error'); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-t-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">Create Best of 3 ⚔️</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <input type="text" placeholder="Battle title (optional)" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]" />

        {/* Card search — Left */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#64748b] uppercase tracking-widest">Left Card</label>
          {leftCard ? (
            <div className="flex items-center gap-3 bg-[#0a0a0f] rounded-xl p-2.5 border border-[#6c47ff]/40">
              <img src={leftCard.image_url} alt={leftCard.player_name || ''} className="w-10 h-14 object-cover rounded-lg" />
              <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{leftCard.player_name || leftCard.title}</p></div>
              <button onClick={() => { setLeftCard(null); setLeftQuery(''); }} className="text-[#64748b] hover:text-white"><X size={14} /></button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#374151]" />
                <input type="text" placeholder="Search cards…" value={leftQuery}
                  onChange={e => { setLeftQuery(e.target.value); searchCards(e.target.value, 'left'); }}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]" />
              </div>
              {leftResults.map(card => (
                <button key={card.id} onClick={() => { setLeftCard(card); setLeftResults([]); }}
                  className="w-full flex items-center gap-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 hover:border-[#6c47ff]/40 transition-all text-left">
                  <img src={card.image_url} alt="" className="w-7 h-10 object-cover rounded" />
                  <span className="text-xs font-semibold text-white truncate">{card.player_name || card.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Card search — Right */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[#64748b] uppercase tracking-widest">Right Card</label>
          {rightCard ? (
            <div className="flex items-center gap-3 bg-[#0a0a0f] rounded-xl p-2.5 border border-[#ef4444]/40">
              <img src={rightCard.image_url} alt={rightCard.player_name || ''} className="w-10 h-14 object-cover rounded-lg" />
              <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{rightCard.player_name || rightCard.title}</p></div>
              <button onClick={() => { setRightCard(null); setRightQuery(''); }} className="text-[#64748b] hover:text-white"><X size={14} /></button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#374151]" />
                <input type="text" placeholder="Search cards…" value={rightQuery}
                  onChange={e => { setRightQuery(e.target.value); searchCards(e.target.value, 'right'); }}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]" />
              </div>
              {rightResults.map(card => (
                <button key={card.id} onClick={() => { setRightCard(card); setRightResults([]); }}
                  className="w-full flex items-center gap-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 hover:border-[#ef4444]/40 transition-all text-left">
                  <img src={card.image_url} alt="" className="w-7 h-10 object-cover rounded" />
                  <span className="text-xs font-semibold text-white truncate">{card.player_name || card.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-[10px] text-[#64748b] text-center">3 rounds: Investment · Coolest · Rarity</p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#1e1e2e] text-[#64748b] text-sm font-semibold">Cancel</button>
          <button onClick={handleSubmit} disabled={!leftCard || !rightCard || submitting}
            className="flex-1 py-3 rounded-xl bg-[#6c47ff] text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>⚔️ Create Series</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MultiBattlesPage() {
  const [battles, setBattles] = useState<MultiRoundBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadBattles = async () => {
    try {
      const res = await fetch(`${BASE_URL}/multi-battles`, { headers: { Authorization: `Bearer ${getToken() || ''}` } });
      const data = await res.json() as { battles: MultiRoundBattle[] };
      setBattles(data.battles || []);
    } catch { setBattles([]); } finally { setLoading(false); }
  };

  useEffect(() => { loadBattles(); }, []);

  const handleVote = async (id: string, choice: 'left'|'right') => {
    const token = getToken();
    if (!token) { showToast('Log in to vote', 'info'); return; }
    try {
      const res = await fetch(`${BASE_URL}/multi-battles/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ choice }),
      });
      const updated = await res.json() as MultiRoundBattle;
      setBattles(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
      showToast(`Voted ${choice}! 🗳️`, 'success');
    } catch { showToast('Vote failed', 'error'); }
  };

  const handleAdvance = async (id: string) => {
    const token = getToken();
    if (!token) { showToast('Log in first', 'info'); return; }
    try {
      const res = await fetch(`${BASE_URL}/multi-battles/${id}/advance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = await res.json() as MultiRoundBattle;
      setBattles(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
      showToast(updated.status === 'complete' ? '🏆 Series complete!' : `Round ${updated.currentRound} starts!`, 'success');
    } catch { showToast('Failed to advance round', 'error'); }
  };

  const handleCreated = (battle: MultiRoundBattle) => {
    setBattles(prev => [battle, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Swords size={22} className="text-[#6c47ff]" />Best of 3 Battles</h1>
          <p className="text-sm text-[#64748b] mt-0.5">3-round card battle series</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#6c47ff] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#6c47ff]/30 hover:bg-[#7c57ff] transition-colors active:scale-95">
          <Plus size={14} /> Create Series
        </button>
      </div>

      {/* Round Legend */}
      <div className="flex gap-2 text-xs">
        {[{ cat: 'investment', icon: '📈', label: 'R1: Investment' },{ cat: 'coolest', icon: '🔥', label: 'R2: Coolest' },{ cat: 'rarity', icon: '💎', label: 'R3: Rarity' }].map(r => (
          <div key={r.cat} className="flex-1 bg-[#12121a] border border-[#1e1e2e] rounded-xl p-2 text-center">
            <div className="text-base">{r.icon}</div>
            <p className="text-[9px] text-[#64748b] mt-0.5 font-bold">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Battle List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-[#1e1e2e] bg-[#12121a] p-4 animate-pulse">
              <div className="h-4 bg-[#1e1e2e] rounded w-2/3 mb-3" />
              <div className="flex gap-3"><div className="w-14 h-20 bg-[#1e1e2e] rounded-lg" /><div className="flex-1 space-y-2"><div className="h-3 bg-[#1e1e2e] rounded" /><div className="h-3 bg-[#1e1e2e] rounded w-2/3" /></div><div className="w-14 h-20 bg-[#1e1e2e] rounded-lg" /></div>
            </div>
          ))}
        </div>
      ) : battles.length === 0 ? (
        <div className="text-center py-16">
          <Swords size={40} className="mx-auto mb-3 text-[#374151]" />
          <p className="text-white font-bold">No series yet</p>
          <p className="text-sm text-[#64748b] mt-1">Create the first Best of 3 battle!</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-4 px-6 py-2.5 rounded-xl bg-[#6c47ff] text-white text-sm font-bold">
            <Plus size={14} className="inline mr-1.5" />Create Series
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {battles.map(battle => (
            <BattleCard key={battle.id} battle={battle} onVote={handleVote} onAdvance={handleAdvance} />
          ))}
        </div>
      )}

      {showCreate && <CreateBattleModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}
