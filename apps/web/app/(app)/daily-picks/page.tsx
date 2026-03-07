'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyPicks as picksApi } from '../../../lib/api';
import { Target, CheckCircle, ChevronLeft, ChevronRight, Flame, Trophy, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../../../hooks/useAuth';
import type { DailyPick } from '@card-battles/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

type VoteResult = {
  leftPercent: number;
  rightPercent: number;
  totalVotes: number;
};

type StreakData = {
  currentStreak: number;
  bestStreak: number;
  totalWins: number;
  totalLosses: number;
  rewards: Array<{
    streak: number;
    label: string;
    reward: string;
    icon: string;
    unlocked: boolean;
  }>;
  nextReward?: {
    streak: number;
    label: string;
    reward: string;
    icon: string;
    unlocked: boolean;
  };
};

// Fetch vote percentages for a pick after voting
async function fetchPickResults(pickId: string): Promise<VoteResult | null> {
  try {
    const res = await fetch(`${BASE_URL}/daily-picks/${pickId}/results`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function ResultBar({ leftPct, rightPct, leftLabel, rightLabel }: {
  leftPct: number;
  rightPct: number;
  leftLabel: string;
  rightLabel: string;
}) {
  const [animLeft, setAnimLeft] = useState(0);
  const [animRight, setAnimRight] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setAnimLeft(leftPct);
      setAnimRight(rightPct);
    }, 100);
    return () => clearTimeout(t);
  }, [leftPct, rightPct]);

  return (
    <div className="space-y-2 px-4 pb-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#64748b] truncate max-w-[35%]">{leftLabel}</span>
        <div className="flex-1 h-3 bg-[#1e1e2e] rounded-full overflow-hidden flex">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${animLeft}%`,
              background: 'linear-gradient(90deg, #6c47ff, #8b5cf6)',
            }}
          />
        </div>
        <span className="text-xs font-black text-white w-10 text-right">{leftPct}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#64748b] truncate max-w-[35%]">{rightLabel}</span>
        <div className="flex-1 h-3 bg-[#1e1e2e] rounded-full overflow-hidden flex">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${animRight}%`,
              background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
            }}
          />
        </div>
        <span className="text-xs font-black text-white w-10 text-right">{rightPct}%</span>
      </div>
    </div>
  );
}

function StreakSection({ streak, token }: { streak: number; token: string | null }) {
  const { data: streakData } = useQuery<StreakData>({
    queryKey: ['me-streak'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/me/streak`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!token,
    staleTime: 60_000,
  });

  const currentStreak = streakData?.currentStreak ?? streak;
  const nextReward = streakData?.nextReward;
  const rewards = streakData?.rewards ?? [
    { streak: 3, label: '3-Day Streak', reward: 'Bronze Badge', icon: '🥉', unlocked: false },
    { streak: 7, label: '7-Day Streak', reward: 'Silver Badge', icon: '🥈', unlocked: false },
    { streak: 14, label: '14-Day Streak', reward: 'Gold Badge', icon: '🥇', unlocked: false },
    { streak: 30, label: '30-Day Streak', reward: '1 Month Pro Free', icon: '💎', unlocked: false },
  ];

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
    >
      {/* Streak Counter */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Flame size={20} className="text-[#f59e0b]" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }} />
          <span className="text-2xl font-black text-white">{currentStreak}</span>
        </div>
        <div className="flex-1">
          {currentStreak === 0 ? (
            <>
              <p className="text-sm font-bold text-white">Start your streak today!</p>
              <p className="text-xs text-[#94a3b8]">Pick correctly to begin 🎯</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-white">
                🔥 {currentStreak}-day streak!
              </p>
              {streakData?.bestStreak && streakData.bestStreak > currentStreak && (
                <p className="text-xs text-[#64748b]">Best: {streakData.bestStreak} days</p>
              )}
            </>
          )}
        </div>
        {streakData?.totalWins !== undefined && (
          <div className="text-right">
            <p className="text-xs text-[#64748b]">Record</p>
            <p className="text-sm font-bold text-white">
              <span className="text-[#22c55e]">{streakData.totalWins}W</span>
              {' / '}
              <span className="text-[#ef4444]">{streakData.totalLosses}L</span>
            </p>
          </div>
        )}
      </div>

      {/* Progress to next reward */}
      {nextReward && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#94a3b8]">Next reward</span>
            <span className="text-[10px] font-bold text-[#f59e0b]">
              {nextReward.streak - currentStreak} more day{nextReward.streak - currentStreak !== 1 ? 's' : ''} to {nextReward.icon} {nextReward.reward}
            </span>
          </div>
          <div className="h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (currentStreak / nextReward.streak) * 100)}%`,
                background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-[#64748b]">{currentStreak} days</span>
            <span className="text-[9px] text-[#64748b]">{nextReward.streak} days</span>
          </div>
        </div>
      )}

      {/* Milestone chips */}
      <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
        {rewards.map((r) => (
          <div
            key={r.streak}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={r.unlocked
              ? { background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b' }
              : { background: 'rgba(30,30,46,0.6)', borderColor: '#1e1e2e', color: '#374151' }
            }
          >
            <span>{r.icon}</span>
            <span>{r.streak}d</span>
            {r.unlocked && <span>✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DailyPicksPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [liveResults, setLiveResults] = useState<Record<string, VoteResult>>({});
  const [showExplainer, setShowExplainer] = useState(false);

  // Show explainer tooltip for first-timers
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('cb_dailypicks_seen')) {
      setShowExplainer(true);
    }
  }, []);

  const dismissExplainer = () => {
    if (typeof window !== 'undefined') localStorage.setItem('cb_dailypicks_seen', 'true');
    setShowExplainer(false);
  };

  const { data: picks, isLoading } = useQuery({
    queryKey: ['daily-picks'],
    queryFn: (): Promise<DailyPick[]> => picksApi.current(),
  });

  // Fetch user stats for streak
  const { data: statsData } = useQuery({
    queryKey: ['my-stats'],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`${BASE_URL}/users/${user.username}/stats`);
      if (!res.ok) return null;
      return res.json() as Promise<{ current_streak?: number; votes_cast?: number }>;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const enterMutation = useMutation({
    mutationFn: ({ id, choice }: { id: string; choice: 'left' | 'right' }) =>
      picksApi.enter(id, choice),
    onSuccess: async (_, vars) => {
      qc.invalidateQueries({ queryKey: ['daily-picks'] });
      qc.invalidateQueries({ queryKey: ['me-streak'] });
      // Fetch live results after voting
      const results = await fetchPickResults(vars.id);
      if (results) {
        setLiveResults(prev => ({ ...prev, [vars.id]: results }));
      }
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Target size={20} className="text-[#22c55e]" /> Daily Picks
        </h1>
        <div className="h-96 bg-[#12121a] rounded-2xl border border-[#1e1e2e] animate-pulse" />
      </div>
    );
  }

  const allPicks = picks ?? [];
  const totalPicks = allPicks.length;
  const currentPick = allPicks[currentIdx] as DailyPick | undefined;
  const streak = statsData?.current_streak ?? 0;
  const votedCount = allPicks.filter(p => p.myEntry != null).length;

  const goNext = () => setCurrentIdx(i => Math.min(i + 1, totalPicks - 1));
  const goPrev = () => setCurrentIdx(i => Math.max(i - 1, 0));

  // Get auth token from localStorage
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('cb_access_token') : null;

  return (
    <div className="space-y-4">
      {/* First-time explainer tooltip */}
      {showExplainer && (
        <div
          className="relative rounded-2xl border border-[#22c55e]/30 p-4"
          style={{ background: 'rgba(34,197,94,0.06)' }}
        >
          <button
            onClick={dismissExplainer}
            className="absolute top-3 right-3 text-[#64748b] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">📅</span>
            <div>
              <p className="text-sm font-bold text-white">Welcome to Daily Picks!</p>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Each day we drop 3 fresh card matchups. Pick a side, build your streak, and climb the leaderboard.
                Results are revealed the next day!
              </p>
              <button
                onClick={dismissExplainer}
                className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
              >
                Got it, let&apos;s go →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Target size={20} className="text-[#22c55e]" /> Daily Picks
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Pick a side. Come back tomorrow for results.</p>
      </div>

      {/* Streak Section — enhanced with rewards */}
      {user && (
        <StreakSection streak={streak} token={authToken} />
      )}

      {(!allPicks || totalPicks === 0) && (
        <div className="text-center py-16 text-[#64748b]">
          <div className="text-5xl mb-4">🎯</div>
          <p className="font-semibold text-white">No picks today yet</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}

      {currentPick && (
        <>
          {/* Progress indicator */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#64748b]">
              Pick {currentIdx + 1} of {totalPicks}
            </span>
            <div className="flex items-center gap-1.5">
              {allPicks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className="w-6 h-1.5 rounded-full transition-all"
                  style={{
                    background: i === currentIdx
                      ? '#6c47ff'
                      : allPicks[i]?.myEntry
                      ? '#22c55e'
                      : '#1e1e2e',
                  }}
                />
              ))}
            </div>
            {votedCount > 0 && (
              <span className="text-[10px] text-[#22c55e] font-bold">
                {votedCount}/{totalPicks} voted
              </span>
            )}
          </div>

          {/* Carousel Card */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: '#12121a', borderColor: '#1e1e2e' }}
          >
            <div className="px-4 pt-4 pb-2 flex items-start justify-between">
              <h3 className="text-sm font-bold text-white flex-1">{currentPick.title}</h3>
              {new Date(currentPick.endsAt) < new Date() && (
                <span className="text-[10px] text-[#64748b] ml-2 flex-shrink-0">Ended</span>
              )}
            </div>

            {/* Card Images */}
            <div className="flex gap-3 px-3 pb-3">
              {(['left', 'right'] as const).map((side) => {
                const asset = currentPick[side];
                const isVoted = currentPick.myEntry === side;
                const ended = new Date(currentPick.endsAt) < new Date();

                return (
                  <button
                    key={side}
                    onClick={() =>
                      !currentPick.myEntry && !ended &&
                      enterMutation.mutate({ id: currentPick.id, choice: side })
                    }
                    disabled={!!currentPick.myEntry || ended || enterMutation.isPending}
                    className="flex-1 rounded-xl overflow-hidden transition-all active:scale-95"
                    style={{
                      border: isVoted
                        ? '2px solid #22c55e'
                        : currentPick.myEntry
                        ? '2px solid #1e1e2e'
                        : '2px solid #1e1e2e',
                      opacity: currentPick.myEntry && !isVoted ? 0.55 : 1,
                    }}
                  >
                    <div className="relative aspect-[3/4] bg-[#1e1e2e]">
                      <Image
                        src={asset.imageUrl}
                        alt={asset.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {isVoted && (
                        <div className="absolute inset-0 bg-[#22c55e]/20 flex items-center justify-center">
                          <CheckCircle size={40} className="text-[#22c55e] drop-shadow-lg" />
                        </div>
                      )}
                      {!currentPick.myEntry && !ended && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs font-bold text-center">Tap to pick</p>
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-2 bg-[#0a0a0f]">
                      <p className="text-xs text-center font-semibold text-[#94a3b8] line-clamp-2">
                        {asset.playerName || asset.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live results after voting */}
            {currentPick.myEntry && (
              <>
                {liveResults[currentPick.id] ? (
                  <ResultBar
                    leftPct={liveResults[currentPick.id].leftPercent}
                    rightPct={liveResults[currentPick.id].rightPercent}
                    leftLabel={currentPick.left.playerName || currentPick.left.title}
                    rightLabel={currentPick.right.playerName || currentPick.right.title}
                  />
                ) : (
                  <div className="px-4 pb-4 text-center">
                    <div className="flex items-center justify-center gap-2 py-2 rounded-xl"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <CheckCircle size={14} className="text-[#22c55e]" />
                      <span className="text-xs font-bold text-[#22c55e]">
                        Picked {currentPick.myEntry === 'left'
                          ? (currentPick.left.playerName || 'Left')
                          : (currentPick.right.playerName || 'Right')}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {currentPick.result && (
              <div className="px-4 pb-3 text-center border-t border-[#1e1e2e] pt-3">
                <span className="text-xs text-[#22c55e] font-bold flex items-center justify-center gap-1">
                  <Trophy size={12} />
                  Result: {(currentPick.result as { winner?: string }).winner ?? 'pending'}
                </span>
              </div>
            )}
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={goPrev}
              disabled={currentIdx === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1e1e2e] text-sm font-semibold transition-all disabled:opacity-30 hover:border-[#6c47ff]/30 hover:text-[#6c47ff] text-[#64748b]"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={goNext}
              disabled={currentIdx === totalPicks - 1}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1e1e2e] text-sm font-semibold transition-all disabled:opacity-30 hover:border-[#6c47ff]/30 hover:text-[#6c47ff] text-[#64748b]"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* Previous picks results section */}
      <div
        className="rounded-xl border border-[#1e1e2e] overflow-hidden"
        style={{ background: '#12121a' }}
      >
        <div className="px-4 py-3 border-b border-[#1e1e2e]">
          <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
            📊 Yesterday&apos;s Results
          </h2>
        </div>
        <div className="px-4 py-4">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748b]">Yesterday&apos;s picks</span>
                <span className="text-sm font-bold text-white">2/3 correct</span>
              </div>
              <div className="flex gap-1">
                {[true, true, false].map((correct, i) => (
                  <div
                    key={i}
                    className="flex-1 h-2 rounded-full"
                    style={{ background: correct ? '#22c55e' : '#ef4444' }}
                  />
                ))}
              </div>
              <p className="text-xs text-[#64748b]">
                You got <span className="text-white font-bold">2 out of 3</span> picks right yesterday.{' '}
                {streak > 1 && <span className="text-[#f59e0b]">Keep the streak alive! 🔥</span>}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#64748b] text-center py-2">
              <a href="/login" className="text-[#6c47ff] hover:underline">Log in</a> to track your pick history
            </p>
          )}
        </div>
      </div>

      {/* Quick picks overview (all picks at bottom) */}
      {totalPicks > 1 && (
        <div
          className="rounded-xl border border-[#1e1e2e] overflow-hidden"
          style={{ background: '#12121a' }}
        >
          <div className="px-4 py-3 border-b border-[#1e1e2e]">
            <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
              All Today&apos;s Picks
            </h2>
          </div>
          <div className="divide-y divide-[#1e1e2e]">
            {allPicks.map((pick, i) => (
              <button
                key={pick.id}
                onClick={() => setCurrentIdx(i)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e2e]/30 transition-colors text-left"
              >
                <div className="flex gap-1">
                  <div className="w-7 h-9 rounded overflow-hidden border border-[#1e1e2e]">
                    <Image src={pick.left.imageUrl} alt="" width={28} height={36} className="object-cover" unoptimized />
                  </div>
                  <div className="w-7 h-9 rounded overflow-hidden border border-[#1e1e2e]">
                    <Image src={pick.right.imageUrl} alt="" width={28} height={36} className="object-cover" unoptimized />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{pick.title}</p>
                  <p className="text-[10px] text-[#64748b] mt-0.5">
                    {pick.myEntry
                      ? `✅ Voted: ${pick.myEntry === 'left' ? (pick.left.playerName || 'Left') : (pick.right.playerName || 'Right')}`
                      : 'Not voted yet'}
                  </p>
                </div>
                {i === currentIdx && (
                  <span className="text-[10px] font-bold text-[#6c47ff]">Viewing</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

type VoteResult = {
  leftPercent: number;
  rightPercent: number;
  totalVotes: number;
};

// Fetch vote percentages for a pick after voting
async function fetchPickResults(pickId: string): Promise<VoteResult | null> {
  try {
    const res = await fetch(`${BASE_URL}/daily-picks/${pickId}/results`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function ResultBar({ leftPct, rightPct, leftLabel, rightLabel }: {
  leftPct: number;
  rightPct: number;
  leftLabel: string;
  rightLabel: string;
}) {
  const [animLeft, setAnimLeft] = useState(0);
  const [animRight, setAnimRight] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setAnimLeft(leftPct);
      setAnimRight(rightPct);
    }, 100);
    return () => clearTimeout(t);
  }, [leftPct, rightPct]);

  return (
    <div className="space-y-2 px-4 pb-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#64748b] truncate max-w-[35%]">{leftLabel}</span>
        <div className="flex-1 h-3 bg-[#1e1e2e] rounded-full overflow-hidden flex">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${animLeft}%`,
              background: 'linear-gradient(90deg, #6c47ff, #8b5cf6)',
            }}
          />
        </div>
        <span className="text-xs font-black text-white w-10 text-right">{leftPct}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#64748b] truncate max-w-[35%]">{rightLabel}</span>
        <div className="flex-1 h-3 bg-[#1e1e2e] rounded-full overflow-hidden flex">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${animRight}%`,
              background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
            }}
          />
        </div>
        <span className="text-xs font-black text-white w-10 text-right">{rightPct}%</span>
      </div>
    </div>
  );
}

export default function DailyPicksPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [liveResults, setLiveResults] = useState<Record<string, VoteResult>>({});
  const [showExplainer, setShowExplainer] = useState(false);

  // Show explainer tooltip for first-timers
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('cb_dailypicks_seen')) {
      setShowExplainer(true);
    }
  }, []);

  const dismissExplainer = () => {
    if (typeof window !== 'undefined') localStorage.setItem('cb_dailypicks_seen', 'true');
    setShowExplainer(false);
  };

  const { data: picks, isLoading } = useQuery({
    queryKey: ['daily-picks'],
    queryFn: (): Promise<DailyPick[]> => picksApi.current(),
  });

  // Fetch user stats for streak
  const { data: statsData } = useQuery({
    queryKey: ['my-stats'],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`${BASE_URL}/users/${user.username}/stats`);
      if (!res.ok) return null;
      return res.json() as Promise<{ current_streak?: number; votes_cast?: number }>;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const enterMutation = useMutation({
    mutationFn: ({ id, choice }: { id: string; choice: 'left' | 'right' }) =>
      picksApi.enter(id, choice),
    onSuccess: async (_, vars) => {
      qc.invalidateQueries({ queryKey: ['daily-picks'] });
      // Fetch live results after voting
      const results = await fetchPickResults(vars.id);
      if (results) {
        setLiveResults(prev => ({ ...prev, [vars.id]: results }));
      }
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Target size={20} className="text-[#22c55e]" /> Daily Picks
        </h1>
        <div className="h-96 bg-[#12121a] rounded-2xl border border-[#1e1e2e] animate-pulse" />
      </div>
    );
  }

  const allPicks = picks ?? [];
  const totalPicks = allPicks.length;
  const currentPick = allPicks[currentIdx] as DailyPick | undefined;
  const streak = statsData?.current_streak ?? 0;
  const votedCount = allPicks.filter(p => p.myEntry != null).length;

  const goNext = () => setCurrentIdx(i => Math.min(i + 1, totalPicks - 1));
  const goPrev = () => setCurrentIdx(i => Math.max(i - 1, 0));

  return (
    <div className="space-y-4">
      {/* First-time explainer tooltip */}
      {showExplainer && (
        <div
          className="relative rounded-2xl border border-[#22c55e]/30 p-4"
          style={{ background: 'rgba(34,197,94,0.06)' }}
        >
          <button
            onClick={dismissExplainer}
            className="absolute top-3 right-3 text-[#64748b] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">📅</span>
            <div>
              <p className="text-sm font-bold text-white">Welcome to Daily Picks!</p>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Each day we drop 3 fresh card matchups. Pick a side, build your streak, and climb the leaderboard.
                Results are revealed the next day!
              </p>
              <button
                onClick={dismissExplainer}
                className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
              >
                Got it, let&apos;s go →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Target size={20} className="text-[#22c55e]" /> Daily Picks
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Pick a side. Come back tomorrow for results.</p>
      </div>

      {/* Streak Banner */}
      {user && streak > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <Flame size={18} className="text-[#f59e0b] flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">
              You&apos;re on a 🔥 {streak}-pick streak!
            </p>
            <p className="text-xs text-[#64748b]">Keep it going — vote on today&apos;s picks</p>
          </div>
        </div>
      )}

      {(!allPicks || totalPicks === 0) && (
        <div className="text-center py-16 text-[#64748b]">
          <div className="text-5xl mb-4">🎯</div>
          <p className="font-semibold text-white">No picks today yet</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}

      {currentPick && (
        <>
          {/* Progress indicator */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#64748b]">
              Pick {currentIdx + 1} of {totalPicks}
            </span>
            <div className="flex items-center gap-1.5">
              {allPicks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className="w-6 h-1.5 rounded-full transition-all"
                  style={{
                    background: i === currentIdx
                      ? '#6c47ff'
                      : allPicks[i]?.myEntry
                      ? '#22c55e'
                      : '#1e1e2e',
                  }}
                />
              ))}
            </div>
            {votedCount > 0 && (
              <span className="text-[10px] text-[#22c55e] font-bold">
                {votedCount}/{totalPicks} voted
              </span>
            )}
          </div>

          {/* Carousel Card */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: '#12121a', borderColor: '#1e1e2e' }}
          >
            <div className="px-4 pt-4 pb-2 flex items-start justify-between">
              <h3 className="text-sm font-bold text-white flex-1">{currentPick.title}</h3>
              {new Date(currentPick.endsAt) < new Date() && (
                <span className="text-[10px] text-[#64748b] ml-2 flex-shrink-0">Ended</span>
              )}
            </div>

            {/* Card Images */}
            <div className="flex gap-3 px-3 pb-3">
              {(['left', 'right'] as const).map((side) => {
                const asset = currentPick[side];
                const isVoted = currentPick.myEntry === side;
                const ended = new Date(currentPick.endsAt) < new Date();

                return (
                  <button
                    key={side}
                    onClick={() =>
                      !currentPick.myEntry && !ended &&
                      enterMutation.mutate({ id: currentPick.id, choice: side })
                    }
                    disabled={!!currentPick.myEntry || ended || enterMutation.isPending}
                    className="flex-1 rounded-xl overflow-hidden transition-all active:scale-95"
                    style={{
                      border: isVoted
                        ? '2px solid #22c55e'
                        : currentPick.myEntry
                        ? '2px solid #1e1e2e'
                        : '2px solid #1e1e2e',
                      opacity: currentPick.myEntry && !isVoted ? 0.55 : 1,
                    }}
                  >
                    <div className="relative aspect-[3/4] bg-[#1e1e2e]">
                      <Image
                        src={asset.imageUrl}
                        alt={asset.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {isVoted && (
                        <div className="absolute inset-0 bg-[#22c55e]/20 flex items-center justify-center">
                          <CheckCircle size={40} className="text-[#22c55e] drop-shadow-lg" />
                        </div>
                      )}
                      {!currentPick.myEntry && !ended && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs font-bold text-center">Tap to pick</p>
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-2 bg-[#0a0a0f]">
                      <p className="text-xs text-center font-semibold text-[#94a3b8] line-clamp-2">
                        {asset.playerName || asset.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live results after voting */}
            {currentPick.myEntry && (
              <>
                {liveResults[currentPick.id] ? (
                  <ResultBar
                    leftPct={liveResults[currentPick.id].leftPercent}
                    rightPct={liveResults[currentPick.id].rightPercent}
                    leftLabel={currentPick.left.playerName || currentPick.left.title}
                    rightLabel={currentPick.right.playerName || currentPick.right.title}
                  />
                ) : (
                  <div className="px-4 pb-4 text-center">
                    <div className="flex items-center justify-center gap-2 py-2 rounded-xl"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <CheckCircle size={14} className="text-[#22c55e]" />
                      <span className="text-xs font-bold text-[#22c55e]">
                        Picked {currentPick.myEntry === 'left'
                          ? (currentPick.left.playerName || 'Left')
                          : (currentPick.right.playerName || 'Right')}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {currentPick.result && (
              <div className="px-4 pb-3 text-center border-t border-[#1e1e2e] pt-3">
                <span className="text-xs text-[#22c55e] font-bold flex items-center justify-center gap-1">
                  <Trophy size={12} />
                  Result: {(currentPick.result as { winner?: string }).winner ?? 'pending'}
                </span>
              </div>
            )}
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={goPrev}
              disabled={currentIdx === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1e1e2e] text-sm font-semibold transition-all disabled:opacity-30 hover:border-[#6c47ff]/30 hover:text-[#6c47ff] text-[#64748b]"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={goNext}
              disabled={currentIdx === totalPicks - 1}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1e1e2e] text-sm font-semibold transition-all disabled:opacity-30 hover:border-[#6c47ff]/30 hover:text-[#6c47ff] text-[#64748b]"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* Previous picks results section */}
      <div
        className="rounded-xl border border-[#1e1e2e] overflow-hidden"
        style={{ background: '#12121a' }}
      >
        <div className="px-4 py-3 border-b border-[#1e1e2e]">
          <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
            📊 Yesterday&apos;s Results
          </h2>
        </div>
        <div className="px-4 py-4">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748b]">Yesterday&apos;s picks</span>
                <span className="text-sm font-bold text-white">2/3 correct</span>
              </div>
              <div className="flex gap-1">
                {[true, true, false].map((correct, i) => (
                  <div
                    key={i}
                    className="flex-1 h-2 rounded-full"
                    style={{ background: correct ? '#22c55e' : '#ef4444' }}
                  />
                ))}
              </div>
              <p className="text-xs text-[#64748b]">
                You got <span className="text-white font-bold">2 out of 3</span> picks right yesterday.{' '}
                {streak > 1 && <span className="text-[#f59e0b]">Keep the streak alive! 🔥</span>}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#64748b] text-center py-2">
              <a href="/login" className="text-[#6c47ff] hover:underline">Log in</a> to track your pick history
            </p>
          )}
        </div>
      </div>

      {/* Quick picks overview (all picks at bottom) */}
      {totalPicks > 1 && (
        <div
          className="rounded-xl border border-[#1e1e2e] overflow-hidden"
          style={{ background: '#12121a' }}
        >
          <div className="px-4 py-3 border-b border-[#1e1e2e]">
            <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
              All Today&apos;s Picks
            </h2>
          </div>
          <div className="divide-y divide-[#1e1e2e]">
            {allPicks.map((pick, i) => (
              <button
                key={pick.id}
                onClick={() => setCurrentIdx(i)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e2e]/30 transition-colors text-left"
              >
                <div className="flex gap-1">
                  <div className="w-7 h-9 rounded overflow-hidden border border-[#1e1e2e]">
                    <Image src={pick.left.imageUrl} alt="" width={28} height={36} className="object-cover" unoptimized />
                  </div>
                  <div className="w-7 h-9 rounded overflow-hidden border border-[#1e1e2e]">
                    <Image src={pick.right.imageUrl} alt="" width={28} height={36} className="object-cover" unoptimized />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{pick.title}</p>
                  <p className="text-[10px] text-[#64748b] mt-0.5">
                    {pick.myEntry
                      ? `✅ Voted: ${pick.myEntry === 'left' ? (pick.left.playerName || 'Left') : (pick.right.playerName || 'Right')}`
                      : 'Not voted yet'}
                  </p>
                </div>
                {i === currentIdx && (
                  <span className="text-[10px] font-bold text-[#6c47ff]">Viewing</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
