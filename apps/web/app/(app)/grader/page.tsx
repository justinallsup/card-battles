'use client';
import { useState, useRef } from 'react';
import { Search, Loader2, Award, RefreshCw } from 'lucide-react';
import { getToken } from '../../../lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface CardSearchResult {
  id: string;
  title: string;
  image_url: string;
  player_name: string;
  year: number;
  sport: string;
}

interface GradeResult {
  cardId: string;
  grade: number;
  label: string;
  turnaroundDays: number;
  estimatedValue: number;
  submittedAt: string;
  completedAt: string;
  certNumber: number;
  note: string;
}

function gradeColor(grade: number): string {
  if (grade >= 9) return '#22c55e';
  if (grade >= 8) return '#3b82f6';
  if (grade >= 7) return '#f59e0b';
  return '#ef4444';
}

function gradeGlow(grade: number): string {
  if (grade >= 9) return 'rgba(34,197,94,0.4)';
  if (grade >= 8) return 'rgba(59,130,246,0.4)';
  if (grade >= 7) return 'rgba(245,158,11,0.4)';
  return 'rgba(239,68,68,0.4)';
}

function gradeBg(grade: number): string {
  if (grade >= 9) return 'rgba(34,197,94,0.1)';
  if (grade >= 8) return 'rgba(59,130,246,0.1)';
  if (grade >= 7) return 'rgba(245,158,11,0.1)';
  return 'rgba(239,68,68,0.1)';
}

function gradeBorder(grade: number): string {
  if (grade >= 9) return 'rgba(34,197,94,0.3)';
  if (grade >= 8) return 'rgba(59,130,246,0.3)';
  if (grade >= 7) return 'rgba(245,158,11,0.3)';
  return 'rgba(239,68,68,0.3)';
}

export default function GraderPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CardSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q || q.length < 2) { setResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${BASE_URL}/cards/search?q=${encodeURIComponent(q)}`);
        const data = await res.json() as { cards: CardSearchResult[] };
        setResults(data.cards || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectCard = (card: CardSearchResult) => {
    setSelectedCard(card);
    setResults([]);
    setQuery('');
    setGradeResult(null);
    setRevealed(false);
  };

  const handleGrade = async () => {
    if (!selectedCard) return;
    const token = getToken();
    if (!token) {
      setError('You must be logged in to submit a card for grading');
      return;
    }
    setGrading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/cards/${selectedCard.id}/grade`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json() as { error: string };
        setError(data.error || 'Failed to grade card');
        return;
      }
      const data = await res.json() as GradeResult;
      setGradeResult(data);
      // Animate reveal after a short delay
      setTimeout(() => setRevealed(true), 500);
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setGrading(false);
    }
  };

  const handleReset = () => {
    setSelectedCard(null);
    setGradeResult(null);
    setRevealed(false);
    setQuery('');
    setResults([]);
    setError('');
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl mb-2">🏅</div>
        <h1 className="text-2xl font-black text-white">Card Grader</h1>
        <p className="text-sm text-[#94a3b8]">
          Professional card grading evaluates condition on a 1–10 scale.
          Submit your card and get an instant simulated PSA-style grade with estimated value.
        </p>
      </div>

      {/* Demo notice */}
      <div
        className="rounded-xl px-4 py-3 text-xs text-center"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
      >
        ⚠️ This is a simulated grader for demo purposes. Real grading requires physical card submission.
      </div>

      {/* Card search */}
      {!gradeResult && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a card (e.g. Mahomes, LeBron…)"
              className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]"
            />
            {searching && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c47ff] animate-spin" />
            )}
          </div>

          {results.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-[#1e1e2e]" style={{ background: '#12121a' }}>
              {results.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleSelectCard(card)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e2e] transition-colors border-b border-[#0a0a0f] last:border-0 text-left"
                >
                  <img
                    src={card.image_url}
                    alt={card.title}
                    className="w-10 h-14 object-cover rounded-lg border border-[#252535] flex-shrink-0"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{card.player_name || card.title}</p>
                    <p className="text-xs text-[#64748b]">{card.year} · {card.sport?.toUpperCase()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected card preview */}
          {selectedCard && !gradeResult && (
            <div
              className="rounded-xl p-4 border flex gap-4 items-center"
              style={{ background: '#12121a', borderColor: 'rgba(108,71,255,0.3)' }}
            >
              <img
                src={selectedCard.image_url}
                alt={selectedCard.title}
                className="w-16 h-22 object-cover rounded-xl border border-[#252535] flex-shrink-0"
                style={{ height: '88px' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{selectedCard.player_name || selectedCard.title}</p>
                <p className="text-xs text-[#64748b] mt-0.5">{selectedCard.year} · {selectedCard.sport?.toUpperCase()}</p>
                <p className="text-xs text-[#64748b] mt-0.5 truncate">{selectedCard.title}</p>
              </div>
            </div>
          )}

          {selectedCard && !gradeResult && (
            <button
              onClick={handleGrade}
              disabled={grading}
              className="w-full py-4 rounded-xl font-black text-base text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
                boxShadow: '0 4px 20px rgba(108,71,255,0.4)',
              }}
            >
              {grading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Grading…
                </>
              ) : (
                <>
                  <Award size={18} />
                  Submit for Grading
                </>
              )}
            </button>
          )}

          {error && (
            <p className="text-sm text-[#ef4444] text-center">{error}</p>
          )}

          {!selectedCard && !results.length && !query && (
            <div className="text-center py-8 space-y-2">
              <p className="text-[#64748b] text-sm">Search above to find a card to grade</p>
              <p className="text-[#374151] text-xs">Tip: Try searching for "Mahomes", "LeBron", or "Ohtani"</p>
            </div>
          )}
        </div>
      )}

      {/* Grade result */}
      {gradeResult && (
        <div
          className="rounded-2xl overflow-hidden border transition-all duration-500"
          style={{
            background: gradeBg(gradeResult.grade),
            borderColor: gradeBorder(gradeResult.grade),
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Grade number — big reveal */}
          <div className="text-center py-8 px-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-4">PSA Simulated Grade</p>
            <div
              className="inline-flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 mb-4"
              style={{
                borderColor: gradeColor(gradeResult.grade),
                background: gradeBg(gradeResult.grade),
                boxShadow: `0 0 40px ${gradeGlow(gradeResult.grade)}, 0 0 80px ${gradeGlow(gradeResult.grade)}`,
              }}
            >
              <span
                className="text-5xl font-black leading-none"
                style={{ color: gradeColor(gradeResult.grade) }}
              >
                {gradeResult.grade}
              </span>
            </div>
            <p
              className="text-xl font-black mb-1"
              style={{ color: gradeColor(gradeResult.grade) }}
            >
              {gradeResult.label}
            </p>
          </div>

          {/* Details */}
          <div className="px-6 pb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0a0a0f]/50 rounded-xl p-3 text-center">
                <p className="text-xs text-[#64748b] mb-1">Estimated Value</p>
                <p className="text-lg font-black text-white">${gradeResult.estimatedValue.toLocaleString()}</p>
              </div>
              <div className="bg-[#0a0a0f]/50 rounded-xl p-3 text-center">
                <p className="text-xs text-[#64748b] mb-1">Cert Number</p>
                <p className="text-lg font-black text-white font-mono">#{gradeResult.certNumber}</p>
              </div>
              <div className="bg-[#0a0a0f]/50 rounded-xl p-3 text-center">
                <p className="text-xs text-[#64748b] mb-1">Submitted</p>
                <p className="text-sm font-bold text-white">
                  {new Date(gradeResult.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-[#0a0a0f]/50 rounded-xl p-3 text-center">
                <p className="text-xs text-[#64748b] mb-1">Turnaround</p>
                <p className="text-sm font-bold text-white">{gradeResult.turnaroundDays} days</p>
              </div>
            </div>

            <div
              className="rounded-xl px-3 py-2 text-xs text-center"
              style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b' }}
            >
              {gradeResult.note}
            </div>
          </div>
        </div>
      )}

      {/* Grade Another button */}
      {gradeResult && (
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: 'rgba(108,71,255,0.1)',
            border: '1px solid rgba(108,71,255,0.3)',
            color: '#a78bfa',
          }}
        >
          <RefreshCw size={15} />
          Grade Another Card
        </button>
      )}
    </div>
  );
}
