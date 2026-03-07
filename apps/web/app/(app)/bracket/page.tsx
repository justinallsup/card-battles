'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, X, Shuffle, Trophy, ChevronRight, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';
import { showToast } from '../../../components/ui/Toast';
import { BackButton } from '../../../components/ui/BackButton';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface CardItem {
  id: string;
  player_name: string;
  title: string;
  year: number;
  sport?: string;
  image_url?: string;
}

type Step = 1 | 2 | 3;
type Duration = '5min' | '1hour' | '1day';
type Category = 'investment' | 'coolest' | 'rarity' | 'all';

const RANDOM_PLAYERS = [
  'Patrick Mahomes', 'LeBron James', 'Tom Brady', 'Michael Jordan',
  'Shohei Ohtani', 'Victor Wembanyama', 'Josh Allen', 'Luka Doncic',
];

function BracketVisualization({ players }: { players: CardItem[] }) {
  // Pad to 8 with empty slots
  const slots: (CardItem | null)[] = [...players];
  while (slots.length < 8) slots.push(null);

  // Round 1 matchups (4 pairs)
  const r1 = [
    [slots[0], slots[1]],
    [slots[2], slots[3]],
    [slots[4], slots[5]],
    [slots[6], slots[7]],
  ] as [CardItem | null, CardItem | null][];

  // Semi matchups (2 pairs) — winners TBD
  const r2 = [
    ['Winner 1', 'Winner 2'],
    ['Winner 3', 'Winner 4'],
  ];

  // Final
  const final = ['Semi 1 Winner', 'Semi 2 Winner'];

  const SlotBox = ({ label, empty }: { label: string; empty?: boolean }) => (
    <div
      className="rounded-lg px-3 py-2 text-xs font-bold border truncate max-w-[110px]"
      style={empty
        ? { background: '#0a0a0f', borderColor: '#1e1e2e', color: '#374151' }
        : { background: '#1e1e2e', borderColor: '#374151', color: '#e2e8f0' }
      }
    >
      {label}
    </div>
  );

  return (
    <div
      className="rounded-2xl border border-[#1e1e2e] p-4 overflow-x-auto"
      style={{ background: '#12121a' }}
    >
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Trophy size={16} className="text-[#f59e0b]" />
        Bracket Preview
      </h3>
      <div className="flex items-center gap-3 min-w-max">
        {/* Round 1 */}
        <div className="flex flex-col gap-3">
          <p className="text-[9px] text-[#64748b] uppercase tracking-wider text-center mb-1">Round 1</p>
          {r1.map(([a, b], i) => (
            <div key={i} className="flex flex-col gap-1.5 mb-2">
              <SlotBox label={a?.player_name || 'TBD'} empty={!a} />
              <div className="flex items-center gap-1 pl-2">
                <div className="w-3 h-px bg-[#374151]" />
                <span className="text-[9px] text-[#374151]">vs</span>
                <div className="w-3 h-px bg-[#374151]" />
              </div>
              <SlotBox label={b?.player_name || 'TBD'} empty={!b} />
            </div>
          ))}
        </div>

        {/* Arrow */}
        <ChevronRight size={18} className="text-[#374151] shrink-0" />

        {/* Semi-finals */}
        <div className="flex flex-col gap-3">
          <p className="text-[9px] text-[#64748b] uppercase tracking-wider text-center mb-1">Semis</p>
          {r2.map(([a, b], i) => (
            <div key={i} className="flex flex-col gap-1.5 mb-8">
              <SlotBox label={a} empty />
              <div className="flex items-center gap-1 pl-2">
                <div className="w-3 h-px bg-[#374151]" />
                <span className="text-[9px] text-[#374151]">vs</span>
                <div className="w-3 h-px bg-[#374151]" />
              </div>
              <SlotBox label={b} empty />
            </div>
          ))}
        </div>

        {/* Arrow */}
        <ChevronRight size={18} className="text-[#374151] shrink-0" />

        {/* Final */}
        <div className="flex flex-col gap-3">
          <p className="text-[9px] text-[#64748b] uppercase tracking-wider text-center mb-1">Final</p>
          <div className="flex flex-col gap-1.5">
            <SlotBox label={final[0]} empty />
            <div className="flex items-center gap-1 pl-2">
              <div className="w-3 h-px bg-[#374151]" />
              <span className="text-[9px] text-[#374151]">vs</span>
              <div className="w-3 h-px bg-[#374151]" />
            </div>
            <SlotBox label={final[1]} empty />
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={18} className="text-[#374151] shrink-0" />

        {/* Champion */}
        <div className="flex flex-col items-center">
          <p className="text-[9px] text-[#64748b] uppercase tracking-wider text-center mb-1">Champion</p>
          <div
            className="rounded-xl px-3 py-3 text-center border-2"
            style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.4)' }}
          >
            <Trophy size={20} className="text-[#f59e0b] mx-auto mb-1" />
            <p className="text-[10px] font-bold text-[#f59e0b]">🏆 TBD</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BracketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [selectedCards, setSelectedCards] = useState<CardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CardItem[]>([]);
  const [tournamentName, setTournamentName] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [duration, setDuration] = useState<Duration>('1day');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      fetch(`${BASE}/cards/search?q=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then((d: { cards: CardItem[] }) => setSearchResults(d.cards || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addCard = useCallback((card: CardItem) => {
    if (selectedCards.length >= 8) { showToast('Max 8 players per bracket', 'error'); return; }
    if (selectedCards.find(c => c.id === card.id)) { showToast('Already added', 'error'); return; }
    setSelectedCards(prev => [...prev, card]);
    setSearchQuery('');
    setSearchResults([]);
  }, [selectedCards]);

  const removeCard = useCallback((id: string) => {
    setSelectedCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const fillRandom = useCallback(async () => {
    const names = RANDOM_PLAYERS.slice(0, 8 - selectedCards.length);
    for (const name of names) {
      try {
        const r = await fetch(`${BASE}/cards/search?q=${encodeURIComponent(name)}`);
        const d = await r.json() as { cards: CardItem[] };
        const card = d.cards[0];
        if (card && !selectedCards.find(c => c.id === card.id)) {
          setSelectedCards(prev => [...prev, card]);
        }
      } catch { /* skip */ }
    }
  }, [selectedCards]);

  const createTournament = async () => {
    if (!user) { showToast('Login to create tournaments', 'error'); return; }
    if (selectedCards.length < 2) { showToast('Add at least 2 players', 'error'); return; }
    if (!tournamentName.trim()) { showToast('Add a tournament name', 'error'); return; }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          name: tournamentName,
          sport: category,
          cardIds: selectedCards.map(c => c.id),
          duration,
        }),
      });
      const data = await res.json() as { id: string };
      if (res.ok && data.id) {
        setCreatedId(data.id);
        showToast('Tournament created! 🏆', 'success');
      } else {
        showToast('Failed to create tournament', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setCreating(false);
    }
  };

  const shareBracket = () => {
    const url = createdId
      ? `${window.location.origin}/tournaments/${createdId}`
      : window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Link copied!', 'success');
  };

  const CATEGORIES: { key: Category; label: string }[] = [
    { key: 'investment', label: '💰 Investment' },
    { key: 'coolest', label: '😎 Coolest' },
    { key: 'rarity', label: '💎 Rarity' },
    { key: 'all', label: '⚡ All' },
  ];

  const DURATIONS: { key: Duration; label: string }[] = [
    { key: '5min', label: '5 min' },
    { key: '1hour', label: '1 hour' },
    { key: '1day', label: '1 day' },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-[#1e1e2e]"
        style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-black text-white">🏆 Create a Bracket</h1>
            <p className="text-xs text-[#64748b]">Build your custom card tournament</p>
          </div>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => { if (s < step || (s === 2 && selectedCards.length >= 2)) setStep(s as Step); }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={step === s
                  ? { background: '#6c47ff', color: 'white' }
                  : step > s
                    ? { background: 'rgba(108,71,255,0.3)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.4)' }
                    : { background: '#1e1e2e', color: '#64748b' }
                }
              >
                {s}
              </button>
              {s < 3 && <div className="flex-1 h-px w-8" style={{ background: step > s ? '#6c47ff55' : '#1e1e2e' }} />}
            </div>
          ))}
          <span className="text-xs text-[#64748b] ml-1">
            {step === 1 ? 'Pick Players' : step === 2 ? 'Configure' : 'View Bracket'}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* ── STEP 1: Pick players ── */}
        {step === 1 && (
          <>
            {/* Search */}
            <div
              className="rounded-2xl border border-[#1e1e2e] p-4"
              style={{ background: '#12121a' }}
            >
              <h2 className="text-sm font-bold text-white mb-3">
                Search & Add Players
                <span className="ml-2 text-[#64748b] font-normal">({selectedCards.length}/8)</span>
              </h2>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for a card (e.g. Mahomes, LeBron)"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#64748b] border border-[#1e1e2e] focus:outline-none focus:border-[#6c47ff]"
                  style={{ background: '#0a0a0f' }}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map(card => (
                    <button
                      key={card.id}
                      onClick={() => addCard(card)}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[#1e1e2e] transition-colors border border-transparent hover:border-[#374151]"
                    >
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{card.player_name}</p>
                        <p className="text-[#64748b] text-xs">{card.title} · {card.year}</p>
                      </div>
                      <span className="text-[#6c47ff] text-xs font-bold">+ Add</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={fillRandom}
                disabled={selectedCards.length >= 8}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-[#64748b] border border-[#1e1e2e] hover:border-[#374151] hover:text-white transition-all disabled:opacity-40"
              >
                <Shuffle size={15} />
                Fill with Random Cards
              </button>
            </div>

            {/* Selected players list */}
            {selectedCards.length > 0 && (
              <div
                className="rounded-2xl border border-[#1e1e2e] p-4"
                style={{ background: '#12121a' }}
              >
                <h2 className="text-sm font-bold text-white mb-3">Selected Players</h2>
                <div className="space-y-2">
                  {selectedCards.map((card, i) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-3 rounded-xl p-2.5 border border-[#1e1e2e]"
                      style={{ background: '#0a0a0f' }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: '#6c47ff33', color: '#6c47ff' }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate">{card.player_name}</p>
                        <p className="text-[#64748b] text-xs truncate">{card.title} · {card.year}</p>
                      </div>
                      <button
                        onClick={() => removeCard(card.id)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#64748b] hover:text-[#ef4444] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={selectedCards.length < 2}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm transition-all disabled:opacity-40"
              style={{ background: selectedCards.length >= 2 ? '#6c47ff' : '#1e1e2e' }}
            >
              Continue to Configure →
            </button>
          </>
        )}

        {/* ── STEP 2: Configure ── */}
        {step === 2 && (
          <>
            <div
              className="rounded-2xl border border-[#1e1e2e] p-4 space-y-4"
              style={{ background: '#12121a' }}
            >
              <h2 className="text-sm font-bold text-white">Configure Tournament</h2>

              {/* Name */}
              <div>
                <label className="text-xs text-[#64748b] font-semibold mb-1.5 block">Tournament Name</label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={e => setTournamentName(e.target.value)}
                  placeholder="e.g. NFL Legends Championship"
                  maxLength={60}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-[#64748b] border border-[#1e1e2e] focus:outline-none focus:border-[#6c47ff]"
                  style={{ background: '#0a0a0f' }}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-[#64748b] font-semibold mb-1.5 block">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className="py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={category === c.key
                        ? { background: '#6c47ff', color: 'white' }
                        : { background: '#0a0a0f', color: '#64748b', border: '1px solid #1e1e2e' }
                      }
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs text-[#64748b] font-semibold mb-1.5 block">Duration per Round</label>
                <div className="flex gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d.key}
                      onClick={() => setDuration(d.key)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={duration === d.key
                        ? { background: '#6c47ff', color: 'white' }
                        : { background: '#0a0a0f', color: '#64748b', border: '1px solid #1e1e2e' }
                      }
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-[#64748b] border border-[#1e1e2e]"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!tournamentName.trim()}
                className="flex-1 py-3 rounded-2xl text-white font-black text-sm transition-all disabled:opacity-40"
                style={{ background: tournamentName.trim() ? '#6c47ff' : '#1e1e2e' }}
              >
                Preview Bracket →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: View Bracket ── */}
        {step === 3 && (
          <>
            {/* Summary */}
            <div
              className="rounded-2xl border border-[#1e1e2e] p-4"
              style={{ background: '#12121a' }}
            >
              <h2 className="text-base font-black text-white mb-1">{tournamentName}</h2>
              <div className="flex items-center gap-3 text-xs text-[#64748b]">
                <span className="capitalize">{category}</span>
                <span>·</span>
                <span>{duration === '5min' ? '5 min' : duration === '1hour' ? '1 hour' : '1 day'}/round</span>
                <span>·</span>
                <span>{selectedCards.length} players</span>
              </div>
            </div>

            {/* Bracket visualization */}
            <BracketVisualization players={selectedCards} />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-2xl text-sm font-bold text-[#64748b] border border-[#1e1e2e]"
              >
                ← Edit
              </button>
              <button
                onClick={createTournament}
                disabled={creating || !!createdId}
                className="flex-1 py-3 rounded-2xl text-white font-black text-sm transition-all disabled:opacity-60"
                style={{ background: createdId ? 'rgba(34,197,94,0.3)' : '#6c47ff' }}
              >
                {creating ? 'Creating…' : createdId ? '✅ Created!' : '🏆 Create Tournament'}
              </button>
            </div>

            {/* Share */}
            <button
              onClick={shareBracket}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-[#64748b] border border-[#1e1e2e] hover:border-[#374151] hover:text-white transition-all"
            >
              {copied ? <Check size={15} className="text-[#22c55e]" /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Share Bracket'}
            </button>

            {createdId && (
              <button
                onClick={() => router.push(`/tournaments/${createdId}`)}
                className="w-full py-3 rounded-2xl text-sm font-bold text-[#6c47ff] border border-[rgba(108,71,255,0.4)] hover:bg-[rgba(108,71,255,0.1)] transition-all"
              >
                View Tournament →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
