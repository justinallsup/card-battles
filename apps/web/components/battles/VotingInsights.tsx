'use client';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getToken } from '../../lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface VotingInsightsData {
  myVotes: { category: string; choice: string }[];
  alignmentPct: number;
  votesToday: number;
  hasVoted: boolean;
}

export function VotingInsights({
  battleId,
  leftName,
  rightName,
}: {
  battleId: string;
  leftName: string;
  rightName: string;
}) {
  const [data, setData] = useState<VotingInsightsData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (data || loading) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/battles/${battleId}/my-insights`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await res.json() as { insights: null } | VotingInsightsData;
      if ('hasVoted' in d) setData(d);
    } catch {}
    setLoading(false);
  };

  // Auto-load and open when user has voted
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId]);

  const token = getToken();
  if (!token) return null;
  if (!data?.hasVoted) return null;

  const streak = data.votesToday >= 5 ? '🔥' : '';
  const alignColor = data.alignmentPct >= 70 ? '#22c55e' : data.alignmentPct >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
      <button
        onClick={() => { setOpen(o => !o); load(); }}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1e1e2e]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <h3 className="text-sm font-bold text-white">Your Voting Insights</h3>
          {data.votesToday > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              {data.votesToday} today {streak}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className="text-[#64748b] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1e1e2e] pt-3 space-y-3">
          {loading && (
            <div className="flex justify-center py-2">
              <div className="w-4 h-4 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Your votes summary */}
          {data.myVotes.length > 0 && (
            <div>
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-semibold mb-2">Your Votes</p>
              <div className="flex flex-wrap gap-1.5">
                {data.myVotes.map(v => (
                  <span
                    key={v.category}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                    style={{
                      background: v.choice === 'left' ? 'rgba(108,71,255,0.12)' : 'rgba(236,72,153,0.12)',
                      color: v.choice === 'left' ? '#a78bfa' : '#f472b6',
                      border: `1px solid ${v.choice === 'left' ? 'rgba(108,71,255,0.3)' : 'rgba(236,72,153,0.3)'}`,
                    }}
                  >
                    {v.category}: {v.choice === 'left' ? leftName : rightName}
                    {' '}{v.choice === 'left' ? '◀' : '▶'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Alignment */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: 'rgba(30,30,46,0.6)', border: '1px solid #1e1e2e' }}
          >
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: alignColor }}>
                {data.alignmentPct}% alignment
              </p>
              <p className="text-[11px] text-[#64748b]">
                You agreed with {data.alignmentPct}% of voters on this battle
              </p>
            </div>
            {/* Mini bar */}
            <div className="w-16 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${data.alignmentPct}%`, background: alignColor }}
              />
            </div>
          </div>

          {/* Votes today + streak */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: 'rgba(30,30,46,0.6)', border: '1px solid #1e1e2e' }}
          >
            <div className="text-2xl">{streak || '🗳️'}</div>
            <div>
              <p className="text-sm font-bold text-white">
                {data.votesToday} vote{data.votesToday !== 1 ? 's' : ''} today
              </p>
              <p className="text-[11px] text-[#64748b]">
                {data.votesToday >= 10
                  ? 'Voting machine! Keep it up 🔥'
                  : data.votesToday >= 5
                  ? 'On a hot streak!'
                  : 'Keep voting to build your streak!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
