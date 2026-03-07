'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { getToken } from '../../lib/api';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface Snapshot {
  index: number;
  timestamp: string;
  leftPct: number;
  rightPct: number;
  leftVotes: number;
  rightVotes: number;
  totalVotes: number;
}

interface Moment {
  time: string;
  event: string;
  icon: string;
}

interface ReplayData {
  battle: Record<string, unknown>;
  snapshots: Snapshot[];
  moments: Moment[];
  finalLeft: number;
  finalRight: number;
  totalVotes: number;
}

export function BattleReplayPanel({ battleId }: { battleId: string }) {
  const [data, setData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrubPct, setScrubPct] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`${BASE}/battles/${battleId}/replay`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [battleId]);

  const currentSnapshotIndex = data?.snapshots?.length
    ? Math.min(
        Math.floor((scrubPct / 100) * data.snapshots.length),
        data.snapshots.length - 1
      )
    : 0;
  const currentSnapshot = data?.snapshots?.[currentSnapshotIndex] ?? null;

  const stopPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsPlaying(false);
  }, []);

  const startAutoPlay = useCallback(() => {
    if (!data?.snapshots?.length) return;
    setIsPlaying(true);
    setScrubPct(0);
    setRevealed(false);

    let pct = 0;
    const step = 100 / (5000 / 50); // 5 seconds, 50ms ticks
    intervalRef.current = setInterval(() => {
      pct += step;
      if (pct >= 100) {
        pct = 100;
        setScrubPct(100);
        setRevealed(true);
        stopPlay();
      } else {
        setScrubPct(pct);
      }
    }, 50);
  }, [data, stopPlay]);

  useEffect(() => () => stopPlay(), [stopPlay]);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    stopPlay();
    setScrubPct(Number(e.target.value));
    if (Number(e.target.value) >= 100) setRevealed(true);
  };

  const handleReset = () => {
    stopPlay();
    setScrubPct(0);
    setRevealed(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-[#12121a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-[#64748b] text-sm">
        No replay data available for this battle.
      </div>
    );
  }

  const leftName = (data.battle.lp as string) || 'Left';
  const rightName = (data.battle.rp as string) || 'Right';
  const leftPct = currentSnapshot?.leftPct ?? 50;
  const rightPct = currentSnapshot?.rightPct ?? 50;
  const totalVotes = currentSnapshot?.totalVotes ?? 0;
  const isAtEnd = scrubPct >= 100;
  const winner = data.finalLeft > data.finalRight ? leftName : rightName;

  return (
    <div className="space-y-5">
      {/* Current vote bar */}
      <div className="rounded-2xl border border-[#1e1e2e] p-4 space-y-3" style={{ background: '#12121a' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">📊 Vote Distribution</p>
          <span className="text-xs text-[#64748b]">{totalVotes} votes</span>
        </div>

        <div className="space-y-2">
          {/* Left bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white truncate max-w-[60%]">{leftName}</span>
              <span className="text-sm font-black" style={{ color: '#6c47ff' }}>{leftPct}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: '#1e1e2e' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${leftPct}%`,
                  background: 'linear-gradient(90deg, #6c47ff, #8b5cf6)',
                }}
              />
            </div>
          </div>

          {/* Right bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white truncate max-w-[60%]">{rightName}</span>
              <span className="text-sm font-black" style={{ color: '#f59e0b' }}>{rightPct}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: '#1e1e2e' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${rightPct}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #fb923c)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scrubber */}
      <div className="rounded-2xl border border-[#1e1e2e] p-4 space-y-4" style={{ background: '#12121a' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">⏱ Timeline</p>
          <span className="text-xs text-[#64748b]">
            Snapshot {currentSnapshotIndex + 1} / {data.snapshots.length || 1}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={scrubPct}
          onChange={handleScrub}
          className="w-full accent-[#6c47ff]"
        />

        <div className="flex gap-2">
          <button
            onClick={isPlaying ? stopPlay : startAutoPlay}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: isPlaying ? 'rgba(239,68,68,0.15)' : 'rgba(108,71,255,0.15)',
              color: isPlaying ? '#ef4444' : '#a78bfa',
              border: `1px solid ${isPlaying ? 'rgba(239,68,68,0.3)' : 'rgba(108,71,255,0.3)'}`,
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause' : 'Auto Play'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'rgba(100,116,139,0.15)',
              color: '#94a3b8',
              border: '1px solid rgba(100,116,139,0.3)',
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Key Moments */}
      {data.moments.length > 0 && (
        <div className="rounded-2xl border border-[#1e1e2e] p-4 space-y-3" style={{ background: '#12121a' }}>
          <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">🎬 Key Moments</p>
          <div className="space-y-2">
            {data.moments.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg w-8 text-center flex-shrink-0">{m.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{m.event}</p>
                </div>
                <span className="text-xs text-[#64748b] font-mono flex-shrink-0">{m.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final result reveal */}
      {isAtEnd && revealed && data.totalVotes > 0 && (
        <div
          className="rounded-2xl p-5 text-center space-y-2"
          style={{
            background: 'linear-gradient(135deg, rgba(108,71,255,0.15), rgba(139,92,246,0.08))',
            border: '1px solid rgba(108,71,255,0.3)',
          }}
        >
          <p className="text-3xl">🏆</p>
          <p className="text-lg font-black text-white">{winner} wins!</p>
          <p className="text-sm text-[#94a3b8]">
            {data.finalLeft} vs {data.finalRight} votes · {data.totalVotes} total
          </p>
        </div>
      )}

      {data.totalVotes === 0 && (
        <div className="text-center py-4 text-[#64748b] text-sm">
          No votes recorded yet for this battle.
        </div>
      )}
    </div>
  );
}
