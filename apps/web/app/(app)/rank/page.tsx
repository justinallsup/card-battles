'use client';
import { useState, useEffect } from 'react';
import { getToken } from '../../../lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface RankTier { name: string; minPoints: number; icon: string; color: string; perks: string; }
interface RankData {
  points: number;
  currentRank: RankTier;
  nextRank?: RankTier;
  progress: number;
  pointsToNext: number;
  ranks: RankTier[];
  breakdown: { votes: number; battlesCreated: number; battlesWon: number };
}

function SkeletonRank() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-36 bg-[#12121a] rounded-2xl border border-[#1e1e2e]" />
      <div className="h-24 bg-[#12121a] rounded-2xl border border-[#1e1e2e]" />
      <div className="h-48 bg-[#12121a] rounded-2xl border border-[#1e1e2e]" />
    </div>
  );
}

export default function RankPage() {
  const [data, setData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { setError('Log in to see your rank'); setLoading(false); return; }
    fetch(`${BASE_URL}/me/rank`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d as RankData); })
      .catch(() => setError('Failed to load rank'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-5 pb-4"><div className="h-7 bg-[#12121a] rounded w-48 animate-pulse" /><SkeletonRank /></div>;
  if (error) return <div className="flex flex-col items-center justify-center py-20 gap-3"><p className="text-4xl">🏆</p><p className="text-white font-bold">{error}</p></div>;
  if (!data) return null;

  const { points, currentRank, nextRank, progress, pointsToNext, ranks, breakdown } = data;

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">🏆 Your Rank</h1>
        <p className="text-sm text-[#64748b] mt-0.5">Earn points by voting, creating, and winning battles</p>
      </div>

      {/* Current Rank Card */}
      <div className="rounded-2xl border p-5 space-y-4"
        style={{ background: `${currentRank.color}15`, borderColor: `${currentRank.color}40`, boxShadow: `0 0 24px ${currentRank.color}20` }}
      >
        <div className="flex items-center gap-4">
          <div className="text-5xl leading-none">{currentRank.icon}</div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: currentRank.color }}>Current Rank</p>
            <h2 className="text-2xl font-black text-white">{currentRank.name}</h2>
            <p className="text-sm text-[#94a3b8] mt-0.5">{currentRank.perks}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-black text-white">{points.toLocaleString()}</p>
            <p className="text-xs text-[#64748b]">total pts</p>
          </div>
        </div>

        {/* XP Progress bar */}
        {nextRank && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold" style={{ color: currentRank.color }}>{currentRank.name}</span>
              <span className="text-[#64748b]">{pointsToNext} pts to {nextRank.name} {nextRank.icon}</span>
              <span className="font-bold" style={{ color: nextRank.color }}>{nextRank.name}</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#1e1e2e] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, progress)}%`, background: `linear-gradient(90deg, ${currentRank.color}, ${nextRank.color})` }} />
            </div>
            <p className="text-[10px] text-[#64748b] text-right">{progress}% progress</p>
          </div>
        )}
        {!nextRank && (
          <div className="text-center py-2">
            <p className="text-sm font-black text-[#f59e0b]">👑 Maximum rank achieved!</p>
          </div>
        )}
      </div>

      {/* Point Breakdown */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#12121a] p-4 space-y-3">
        <h3 className="text-sm font-black text-white">Point Breakdown</h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🗳️</span>
              <div>
                <p className="text-sm font-semibold text-[#f1f5f9]">Votes Cast</p>
                <p className="text-[10px] text-[#64748b]">1 pt per vote</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white">{breakdown.votes}</p>
              <p className="text-[10px] text-[#22c55e]">+{breakdown.votes} pts</p>
            </div>
          </div>
          <div className="h-px bg-[#1e1e2e]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚔️</span>
              <div>
                <p className="text-sm font-semibold text-[#f1f5f9]">Battles Created</p>
                <p className="text-[10px] text-[#64748b]">5 pts per battle</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white">{breakdown.battlesCreated}</p>
              <p className="text-[10px] text-[#22c55e]">+{breakdown.battlesCreated * 5} pts</p>
            </div>
          </div>
          <div className="h-px bg-[#1e1e2e]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🏆</span>
              <div>
                <p className="text-sm font-semibold text-[#f1f5f9]">Battles Won</p>
                <p className="text-[10px] text-[#64748b]">3 pts per win</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white">{breakdown.battlesWon}</p>
              <p className="text-[10px] text-[#22c55e]">+{breakdown.battlesWon * 3} pts</p>
            </div>
          </div>
          <div className="h-px bg-[#6c47ff]/30" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-white">Total Points</p>
            <p className="text-sm font-black" style={{ color: currentRank.color }}>{points.toLocaleString()} pts</p>
          </div>
        </div>
      </div>

      {/* Rank Ladder */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#12121a] p-4 space-y-3">
        <h3 className="text-sm font-black text-white">Rank Ladder</h3>
        <div className="space-y-2">
          {[...ranks].reverse().map((rank, i) => {
            const isCurrent = rank.name === currentRank.name;
            const isAchieved = points >= rank.minPoints;
            return (
              <div key={rank.name}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${isCurrent ? 'border-opacity-50' : isAchieved ? 'border-[#1e1e2e]' : 'border-[#1e1e2e] opacity-50'}`}
                style={isCurrent ? { borderColor: rank.color + '60', background: rank.color + '10', boxShadow: `0 0 10px ${rank.color}20` } : { background: '#0a0a0f' }}
              >
                <span className="text-2xl leading-none">{rank.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black" style={{ color: isCurrent ? rank.color : isAchieved ? '#94a3b8' : '#374151' }}>{rank.name}</p>
                    {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white font-black">YOU</span>}
                  </div>
                  <p className="text-[10px] text-[#64748b]">{rank.perks}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold" style={{ color: isAchieved ? rank.color : '#374151' }}>{rank.minPoints.toLocaleString()} pts</p>
                  {isAchieved && !isCurrent && <p className="text-[9px] text-[#22c55e]">✓ Achieved</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How to earn */}
      <div className="rounded-2xl border border-[#1e1e2e] bg-[#12121a] p-4 space-y-3">
        <h3 className="text-sm font-black text-white">How to Earn Points</h3>
        <div className="space-y-2">
          {[
            { icon: '🗳️', action: 'Vote on battles', pts: '+1 pt', desc: 'Every vote counts' },
            { icon: '⚔️', action: 'Create a battle', pts: '+5 pts', desc: 'Share your matchups' },
            { icon: '🏆', action: 'Win a battle', pts: '+3 pts', desc: 'Most votes on your card' },
          ].map(item => (
            <div key={item.action} className="flex items-center gap-3 bg-[#0a0a0f] rounded-xl px-3 py-2.5">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{item.action}</p>
                <p className="text-[10px] text-[#64748b]">{item.desc}</p>
              </div>
              <span className="text-sm font-black text-[#22c55e] shrink-0">{item.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
