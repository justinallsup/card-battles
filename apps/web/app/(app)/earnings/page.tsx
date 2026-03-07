'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';
import { BackButton } from '../../../components/ui/BackButton';
import { DollarSign, TrendingUp, Zap, Star, BarChart2, AlertCircle } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

type EarningEntry = {
  battleId: string;
  title: string;
  votes: number;
  earned: number;
  createdAt: string;
};

type MonthlyData = {
  month: string;
  earned: number;
  votes: number;
};

type EarningsData = {
  totalEarned: number;
  totalVotes: number;
  battleCount: number;
  earnings: EarningEntry[];
  monthly: MonthlyData[];
  payoutThreshold: number;
  pendingPayout: number;
  currency: string;
  note: string;
};

// Simple SVG bar chart component
function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  const maxEarned = Math.max(...data.map(d => d.earned), 0.01);
  const chartH = 120;
  const barW = 30;
  const gap = 12;
  const totalW = data.length * (barW + gap) - gap + 40;

  return (
    <div className="overflow-x-auto">
      <svg width={totalW} height={chartH + 30} className="min-w-full">
        {data.map((d, i) => {
          const barH = Math.max((d.earned / maxEarned) * chartH, 2);
          const x = i * (barW + gap) + 20;
          const y = chartH - barH;
          const isLast = i === data.length - 1;
          return (
            <g key={d.month}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                fill={isLast ? 'url(#barGradLast)' : 'url(#barGrad)'}
              />
              {/* Value label */}
              {d.earned > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#94a3b8"
                >
                  ${d.earned.toFixed(2)}
                </text>
              )}
              {/* Month label */}
              <text
                x={x + barW / 2}
                y={chartH + 16}
                textAnchor="middle"
                fontSize={9}
                fill="#64748b"
              >
                {d.month}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6c47ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6c47ff" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="barGradLast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EarningsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch(`${BASE_URL}/me/earnings`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-[#1e1e2e]" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="text-2xl">💵</span>
            <div>
              <h1 className="text-lg font-black text-white">Creator Earnings</h1>
              <p className="text-xs text-[#64748b]">Revenue from your battles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center py-16 text-[#64748b]">Failed to load earnings</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl p-4 border border-[#1e1e2e] text-center"
                style={{ background: '#12121a' }}
              >
                <div className="flex justify-center mb-2">
                  <DollarSign size={18} className="text-green-400" />
                </div>
                <p className="text-2xl font-black text-white">${data.totalEarned.toFixed(2)}</p>
                <p className="text-[10px] text-[#64748b] uppercase tracking-widest mt-1">Total Earned</p>
              </div>
              <div
                className="rounded-2xl p-4 border border-[#1e1e2e] text-center"
                style={{ background: '#12121a' }}
              >
                <div className="flex justify-center mb-2">
                  <TrendingUp size={18} className="text-[#6c47ff]" />
                </div>
                <p className="text-2xl font-black text-white">{data.totalVotes.toLocaleString()}</p>
                <p className="text-[10px] text-[#64748b] uppercase tracking-widest mt-1">Total Votes</p>
              </div>
              <div
                className="rounded-2xl p-4 border border-[#1e1e2e] text-center"
                style={{ background: '#12121a' }}
              >
                <div className="flex justify-center mb-2">
                  <BarChart2 size={18} className="text-[#f59e0b]" />
                </div>
                <p className="text-2xl font-black text-white">{data.battleCount}</p>
                <p className="text-[10px] text-[#64748b] uppercase tracking-widest mt-1">Battles</p>
              </div>
            </div>

            {/* Payout threshold notice */}
            <div
              className="rounded-2xl p-4 border flex items-start gap-3"
              style={{
                background: data.totalEarned >= data.payoutThreshold
                  ? 'rgba(34,197,94,0.05)'
                  : 'rgba(245,158,11,0.05)',
                borderColor: data.totalEarned >= data.payoutThreshold
                  ? 'rgba(34,197,94,0.2)'
                  : 'rgba(245,158,11,0.2)',
              }}
            >
              <AlertCircle size={16} className={data.totalEarned >= data.payoutThreshold ? 'text-green-400 mt-0.5 flex-shrink-0' : 'text-[#f59e0b] mt-0.5 flex-shrink-0'} />
              <div>
                {data.totalEarned >= data.payoutThreshold ? (
                  <>
                    <p className="text-sm font-bold text-green-400">Payout Ready! 🎉</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      You&apos;ve reached the ${data.payoutThreshold.toFixed(2)} minimum payout threshold.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-[#f59e0b]">Payout Threshold: ${data.payoutThreshold.toFixed(2)} minimum</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      ${(data.payoutThreshold - data.totalEarned).toFixed(2)} more needed to unlock payout.
                      Pending: ${data.pendingPayout.toFixed(2)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Monthly chart */}
            <div className="rounded-2xl border border-[#1e1e2e] p-4 space-y-3" style={{ background: '#12121a' }}>
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-[#6c47ff]" />
                <h2 className="text-sm font-black text-white">Monthly Earnings (Last 6 Months)</h2>
              </div>
              <MonthlyBarChart data={data.monthly} />
            </div>

            {/* Pro upsell */}
            <div
              className="rounded-2xl p-4 border flex items-center justify-between gap-3"
              style={{ background: 'linear-gradient(135deg, rgba(108,71,255,0.1), rgba(139,92,246,0.05))', borderColor: 'rgba(108,71,255,0.3)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(108,71,255,0.2)' }}>
                  <Zap size={18} className="text-[#6c47ff]" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Pro creators earn 2x CPM</p>
                  <p className="text-xs text-[#94a3b8]">Earn $1.00 per 1,000 votes instead of $0.50</p>
                </div>
              </div>
              <Link
                href="/pro"
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', color: 'white' }}
              >
                <Star size={12} />
                Upgrade
              </Link>
            </div>

            {/* Battle breakdown table */}
            {data.earnings.length > 0 && (
              <div className="rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
                <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
                  <DollarSign size={16} className="text-green-400" />
                  <h2 className="text-sm font-black text-white">Battle Breakdown</h2>
                </div>
                <div className="divide-y divide-[#1e1e2e]">
                  {data.earnings.map(entry => (
                    <div key={entry.battleId} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{entry.title || `Battle #${entry.battleId.slice(0, 8)}`}</p>
                        <p className="text-xs text-[#64748b] mt-0.5">
                          {entry.votes.toLocaleString()} votes · {formatDate(entry.createdAt)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-green-400">${entry.earned.toFixed(2)}</p>
                        <p className="text-[10px] text-[#64748b]">earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No battles state */}
            {data.earnings.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[#64748b] text-sm">
                  No battles created yet.{' '}
                  <Link href="/create" className="text-[#6c47ff] hover:underline font-semibold">
                    Create your first battle →
                  </Link>
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <div
              className="rounded-xl p-3 border border-[#1e1e2e]"
              style={{ background: 'rgba(100,116,139,0.05)' }}
            >
              <p className="text-xs text-[#64748b] text-center">
                ℹ️ {data.note}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
