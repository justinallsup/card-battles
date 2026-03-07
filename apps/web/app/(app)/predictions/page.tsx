'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';
import { BackButton } from '../../../components/ui/BackButton';
import { Clock, TrendingUp, ExternalLink } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

type Prediction = {
  id: string;
  userId: string;
  battleId: string;
  predictedWinner: 'left' | 'right';
  predictedMargin: number;
  correct?: boolean;
  createdAt: string;
};

type PredictionsData = {
  predictions: Prediction[];
  total: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  return (
    <div
      className="rounded-2xl border border-[#1e1e2e] p-4 space-y-3"
      style={{ background: '#12121a' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#64748b] font-mono mb-1">Battle #{prediction.battleId.slice(0, 8)}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3 py-1 rounded-full text-sm font-bold border"
              style={prediction.predictedWinner === 'left'
                ? { background: 'rgba(108,71,255,0.1)', borderColor: 'rgba(108,71,255,0.3)', color: '#6c47ff' }
                : { background: 'rgba(236,72,153,0.1)', borderColor: 'rgba(236,72,153,0.3)', color: '#ec4899' }
              }
            >
              🔮 Predicted {prediction.predictedWinner === 'left' ? '◀ Left' : 'Right ▶'} wins
            </span>
            <span className="text-xs text-[#94a3b8]">by ~{prediction.predictedMargin}%</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
          >
            <Clock size={10} />
            Pending
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[#64748b]">
        <span>{formatDate(prediction.createdAt)}</span>
        <Link
          href={`/battles/${prediction.battleId}`}
          className="flex items-center gap-1 text-[#6c47ff] hover:underline font-semibold"
        >
          View Battle
          <ExternalLink size={10} />
        </Link>
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch(`${BASE_URL}/me/predictions`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const resolved = data?.predictions.filter(p => p.correct !== undefined) ?? [];
  const correct = resolved.filter(p => p.correct).length;
  const accuracy = resolved.length > 0 ? Math.round(correct / resolved.length * 100) : null;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-[#1e1e2e]" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔮</span>
            <div>
              <h1 className="text-lg font-black text-white">My Predictions</h1>
              <p className="text-xs text-[#64748b]">Battle outcome forecasts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
          </div>
        ) : !data || data.total === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'rgba(108,71,255,0.1)' }}>
              🔮
            </div>
            <div>
              <h2 className="text-xl font-black text-white">No predictions yet</h2>
              <p className="text-sm text-[#64748b] mt-2 max-w-xs">
                Make predictions on active battles to forecast who will win!
              </p>
            </div>
            <Link
              href="/leaderboards"
              className="px-6 py-3 rounded-2xl font-bold text-white text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
            >
              Browse Battles
            </Link>
          </div>
        ) : (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl p-3 text-center border border-[#1e1e2e]"
                style={{ background: '#12121a' }}
              >
                <p className="text-2xl font-black text-white">{data.total}</p>
                <p className="text-[10px] text-[#64748b] uppercase tracking-widest mt-1">Total</p>
              </div>
              <div
                className="rounded-2xl p-3 text-center border border-[#1e1e2e]"
                style={{ background: '#12121a' }}
              >
                <p className="text-2xl font-black text-[#22c55e]">{correct}</p>
                <p className="text-[10px] text-[#64748b] uppercase tracking-widest mt-1">Correct</p>
              </div>
              <div
                className="rounded-2xl p-3 text-center border border-[#1e1e2e]"
                style={{ background: '#12121a' }}
              >
                {accuracy !== null ? (
                  <>
                    <p className="text-2xl font-black text-[#6c47ff]">{accuracy}%</p>
                    <p className="text-[10px] text-[#64748b] uppercase tracking-widest mt-1">Accuracy</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-black text-[#64748b]">—</p>
                    <p className="text-[10px] text-[#64748b] uppercase tracking-widest mt-1">Accuracy</p>
                  </>
                )}
              </div>
            </div>

            {/* Accuracy notice */}
            {accuracy === null && (
              <div
                className="rounded-xl p-3 text-center border border-[#f59e0b]/20"
                style={{ background: 'rgba(245,158,11,0.05)' }}
              >
                <p className="text-xs text-[#f59e0b]">
                  <Clock size={12} className="inline mr-1" />
                  All predictions are pending — battles are still live!
                </p>
              </div>
            )}

            {/* Predictions list */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#6c47ff]" />
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Your Predictions</h2>
              </div>
              {data.predictions.map(pred => (
                <PredictionCard key={pred.id} prediction={pred} />
              ))}
            </div>

            {/* CTA */}
            <div className="text-center py-4">
              <Link
                href="/leaderboards"
                className="text-sm text-[#6c47ff] hover:underline font-semibold"
              >
                Browse more battles to predict →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
