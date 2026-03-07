'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { showToast } from '../../../components/ui/Toast';
import { BackButton } from '../../../components/ui/BackButton';
import { Zap, Trophy, Clock } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface BlitzBattle {
  id: string;
  leftAssetId: string;
  rightAssetId: string;
  leftPlayer: string;
  rightPlayer: string;
  leftImage: string;
  rightImage: string;
  leftVotes: number;
  rightVotes: number;
  endsAt: string;
  status: 'live' | 'ended';
  winner?: 'left' | 'right';
  createdAt: string;
}

function formatCountdown(endsAt: string): string {
  const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function BlitzPage() {
  const { user } = useAuth();
  const [live, setLive] = useState<BlitzBattle | null>(null);
  const [battles, setBattles] = useState<BlitzBattle[]>([]);
  const [countdown, setCountdown] = useState('05:00');
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<'left' | 'right' | null>(null);
  const [voting, setVoting] = useState(false);
  const [nextIn, setNextIn] = useState<number | null>(null);

  const fetchBlitz = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/blitz`);
      const data = await res.json();
      setLive(data.live);
      setBattles(data.battles || []);
      setVoted(null);
      setNextIn(null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlitz();
  }, [fetchBlitz]);

  // Countdown ticker
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      const diff = new Date(live.endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('00:00');
        // Show "Next Blitz" countdown
        setNextIn(30);
        clearInterval(timer);
        // Refresh after 30s
        setTimeout(() => fetchBlitz(), 30000);
      } else {
        setCountdown(formatCountdown(live.endsAt));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [live, fetchBlitz]);

  // Next blitz countdown
  useEffect(() => {
    if (nextIn === null) return;
    if (nextIn <= 0) { fetchBlitz(); return; }
    const t = setTimeout(() => setNextIn(n => (n ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [nextIn, fetchBlitz]);

  async function vote(choice: 'left' | 'right') {
    if (!live || voted || voting) return;
    if (!user) { showToast('Sign in to vote in Blitz!', 'error'); return; }
    setVoting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cb_token') : null;
      const res = await fetch(`${BASE_URL}/blitz/${live.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ choice }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Vote failed', 'error'); return; }
      setVoted(choice);
      setLive(data.battle);
      showToast(`⚡ Voted for ${choice === 'left' ? live.leftPlayer : live.rightPlayer}!`, 'success');
    } catch {
      showToast('Vote failed', 'error');
    } finally {
      setVoting(false);
    }
  }

  const isEnded = live?.status === 'ended' || (live && new Date(live.endsAt) < new Date());
  const totalVotes = (live?.leftVotes ?? 0) + (live?.rightVotes ?? 0);
  const leftPct = totalVotes ? Math.round((live?.leftVotes ?? 0) / totalVotes * 100) : 50;
  const rightPct = 100 - leftPct;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-3 border-b border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" fill="currentColor" />
            <h1 className="text-xl font-black text-white">Blitz Battles</h1>
            {!isEnded && live && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white animate-pulse"
                style={{ background: '#ef4444' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-[#94a3b8]">
            <Zap size={40} className="mx-auto mb-3 text-yellow-400 animate-pulse" />
            <p>Loading Blitz Battle…</p>
          </div>
        ) : !live ? (
          <div className="text-center py-16 text-[#94a3b8]">
            <Clock size={40} className="mx-auto mb-3" />
            <p className="font-bold text-white">No live blitz right now</p>
            <p className="text-sm mt-1">Check back soon!</p>
            <button onClick={fetchBlitz} className="mt-4 px-6 py-2 rounded-lg text-sm font-bold text-white"
              style={{ background: '#6c47ff' }}>Refresh</button>
          </div>
        ) : isEnded ? (
          /* Battle Ended */
          <div className="rounded-2xl border border-[#2a2a3e] overflow-hidden" style={{ background: '#12121a' }}>
            <div className="py-6 text-center">
              <Trophy size={40} className="mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-black text-white mb-1">Battle Ended!</div>
              <div className="text-sm text-[#94a3b8] mb-4">
                Winner: <span className="font-bold text-white">
                  {live.winner === 'left' ? live.leftPlayer : live.rightPlayer}
                </span>
              </div>
              {nextIn !== null && (
                <div className="text-sm text-[#6c47ff] font-bold">
                  ⚡ Next Blitz in {nextIn}s…
                </div>
              )}
              <button onClick={fetchBlitz} className="mt-4 px-6 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: '#6c47ff' }}>
                Next Battle →
              </button>
            </div>
          </div>
        ) : (
          /* Live Battle */
          <>
            {/* Countdown */}
            <div className="text-center">
              <div className="text-5xl font-black tabular-nums text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {countdown}
              </div>
              <div className="text-xs text-[#94a3b8] uppercase tracking-widest mt-1">Time Remaining</div>
            </div>

            {/* Cards side by side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left */}
              <button
                disabled={!!voted || voting}
                onClick={() => vote('left')}
                className={`relative rounded-2xl overflow-hidden aspect-[3/4] border-2 transition-all duration-200 active:scale-95 ${
                  voted === 'left' ? 'border-[#6c47ff] ring-2 ring-[#6c47ff]/40' :
                  voted === 'right' ? 'border-[#2a2a3e] opacity-60' :
                  'border-[#2a2a3e] hover:border-[#6c47ff]'
                }`}
              >
                <img src={live.leftImage} alt={live.leftPlayer} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 50%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-sm font-black text-white leading-tight">{live.leftPlayer}</div>
                  {voted && (
                    <div className="text-xs font-bold text-[#a78bfa] mt-1">{live.leftVotes} votes</div>
                  )}
                </div>
                {voted === 'left' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#6c47ff] flex items-center justify-center text-white text-xs font-bold">✓</div>
                )}
                {!voted && !voting && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: '#6c47ff' }}>Vote!</div>
                  </div>
                )}
              </button>

              {/* Right */}
              <button
                disabled={!!voted || voting}
                onClick={() => vote('right')}
                className={`relative rounded-2xl overflow-hidden aspect-[3/4] border-2 transition-all duration-200 active:scale-95 ${
                  voted === 'right' ? 'border-[#ef4444] ring-2 ring-[#ef4444]/40' :
                  voted === 'left' ? 'border-[#2a2a3e] opacity-60' :
                  'border-[#2a2a3e] hover:border-[#ef4444]'
                }`}
              >
                <img src={live.rightImage} alt={live.rightPlayer} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 50%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="text-sm font-black text-white leading-tight">{live.rightPlayer}</div>
                  {voted && (
                    <div className="text-xs font-bold text-red-400 mt-1">{live.rightVotes} votes</div>
                  )}
                </div>
                {voted === 'right' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#ef4444] flex items-center justify-center text-white text-xs font-bold">✓</div>
                )}
              </button>
            </div>

            {/* VS divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#2a2a3e]" />
              <span className="text-sm font-black text-[#94a3b8]">VS</span>
              <div className="flex-1 h-px bg-[#2a2a3e]" />
            </div>

            {/* Vote bars (show after voting) */}
            {voted && (
              <div className="rounded-xl p-4 border border-[#2a2a3e]" style={{ background: '#12121a' }}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-[#a78bfa]">{live.leftPlayer.split(' ').pop()} {leftPct}%</span>
                  <span className="text-[#94a3b8]">{totalVotes} votes</span>
                  <span className="text-red-400">{rightPct}% {live.rightPlayer.split(' ').pop()}</span>
                </div>
                <div className="h-4 rounded-full overflow-hidden bg-[#1e1e2e] flex">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{ width: `${leftPct}%`, background: 'linear-gradient(90deg,#6c47ff,#8b5cf6)' }}
                  />
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{ width: `${rightPct}%`, background: 'linear-gradient(90deg,#ef4444,#f97316)' }}
                  />
                </div>
              </div>
            )}

            {/* Tap to vote CTA */}
            {!voted && (
              <div className="text-center text-sm text-[#94a3b8]">
                ⚡ <strong className="text-white">Tap a card</strong> to cast your vote!
              </div>
            )}
          </>
        )}

        {/* Recent blitz results */}
        {battles.filter(b => b.status === 'ended').length > 0 && (
          <div className="rounded-xl border border-[#2a2a3e] overflow-hidden" style={{ background: '#12121a' }}>
            <div className="px-4 py-3 border-b border-[#2a2a3e]">
              <h2 className="text-sm font-bold text-[#94a3b8] uppercase tracking-wider">Recent Results</h2>
            </div>
            <div className="divide-y divide-[#1e1e2e]">
              {battles.filter(b => b.status === 'ended').slice(-4).reverse().map(b => (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        {b.winner === 'left' ? b.leftPlayer : b.rightPlayer}
                      </div>
                      <div className="text-[10px] text-[#94a3b8]">
                        def. {b.winner === 'left' ? b.rightPlayer : b.leftPlayer}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#94a3b8]">
                    {b.leftVotes + b.rightVotes} votes
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
