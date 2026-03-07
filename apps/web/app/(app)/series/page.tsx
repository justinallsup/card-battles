'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getToken } from '../../../lib/api';
import { BackButton } from '../../../components/ui/BackButton';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { showToast } from '../../../components/ui/Toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

type BattleSeries = {
  id: string;
  title: string;
  description: string;
  leftPlayer: string;
  rightPlayer: string;
  frequency: 'weekly' | 'daily';
  totalEpisodes: number;
  currentEpisode: number;
  lastBattleId?: string;
  nextBattleAt: string;
  createdAt: string;
};

function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Starting now!'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setRemaining(`${d}d ${h}h`);
      else if (h > 0) setRemaining(`${h}h ${m}m`);
      else setRemaining(`${m}m`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [targetDate]);
  return remaining;
}

function SeriesCard({ series }: { series: BattleSeries }) {
  const countdown = useCountdown(series.nextBattleAt);
  const token = getToken();

  const subscribe = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE_URL}/series/${series.id}/subscribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        showToast(data.message || 'Subscribed!', 'success');
      } else {
        showToast(data.error || 'Not available', 'info');
      }
    },
    onError: () => showToast('Please log in to subscribe', 'error'),
  });

  const isWeekly = series.frequency === 'weekly';
  const freqColor = isWeekly ? 'bg-[#6c47ff]/20 text-[#6c47ff] border-[#6c47ff]/30' : 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30';
  const progressPct = Math.round((series.currentEpisode / series.totalEpisodes) * 100);

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden hover:border-[#6c47ff]/30 transition-colors">
      {/* Header accent */}
      <div className={`h-1 w-full ${isWeekly ? 'bg-gradient-to-r from-[#6c47ff] to-[#a855f7]' : 'bg-gradient-to-r from-[#f59e0b] to-[#ef4444]'}`} />

      <div className="p-4 space-y-3">
        {/* Title + freq badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-white text-base leading-tight">{series.title}</h3>
          <span className={`flex-shrink-0 text-[10px] font-black px-2 py-1 rounded-full border uppercase tracking-widest ${freqColor}`}>
            {series.frequency}
          </span>
        </div>

        <p className="text-sm text-[#94a3b8] leading-relaxed">{series.description}</p>

        {/* Players */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-white">{series.leftPlayer}</span>
          <span className="text-[#6c47ff] font-black text-xs">VS</span>
          <span className="font-bold text-white">{series.rightPlayer}</span>
        </div>

        {/* Episode progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#64748b]">
              Episode <span className="text-white font-black">{series.currentEpisode}</span>/{series.totalEpisodes}
            </span>
            <span className="text-[#64748b]">{progressPct}% complete</span>
          </div>
          <div className="h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isWeekly ? 'bg-[#6c47ff]' : 'bg-[#f59e0b]'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Next episode countdown */}
        <div className="flex items-center justify-between bg-[#0a0a0f] rounded-xl px-3 py-2">
          <div>
            <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Next Episode In</p>
            <p className="text-sm font-black text-white">{countdown}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Episodes Left</p>
            <p className="text-sm font-black text-white">{series.totalEpisodes - series.currentEpisode}</p>
          </div>
        </div>

        {/* Subscribe button */}
        <button
          onClick={() => subscribe.mutate()}
          disabled={subscribe.isPending}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            isWeekly
              ? 'bg-[#6c47ff]/10 border border-[#6c47ff]/30 text-[#6c47ff] hover:bg-[#6c47ff]/20'
              : 'bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/20'
          } disabled:opacity-50`}
        >
          {subscribe.isPending ? <LoadingSpinner className="w-4 h-4" /> : '🔔 Subscribe to Series'}
        </button>
      </div>
    </div>
  );
}

function EpisodeHistorySection({ series }: { series: BattleSeries }) {
  // Generate simulated episode history
  const episodes = Array.from({ length: Math.min(5, series.currentEpisode) }, (_, i) => {
    const epNum = series.currentEpisode - i;
    const daysAgo = (i + 1) * (series.frequency === 'weekly' ? 7 : 1);
    const date = new Date(Date.now() - daysAgo * 86400000);
    const leftWon = Math.random() > 0.5;
    return {
      epNum,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      leftWon,
      votes: Math.floor(Math.random() * 3000) + 500,
    };
  });

  return (
    <div className="space-y-2">
      {episodes.map((ep) => (
        <div key={ep.epNum} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1e1e2e] flex items-center justify-center">
              <span className="text-xs font-black text-[#6c47ff]">E{ep.epNum}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">{series.title}</p>
              <p className="text-[10px] text-[#64748b]">{ep.date} · {ep.votes.toLocaleString()} votes</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-[#22c55e]">
              {ep.leftWon ? series.leftPlayer : series.rightPlayer} won
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SeriesPage() {
  const { data, isLoading } = useQuery<{ series: BattleSeries[] }>({
    queryKey: ['battle-series'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/series`);
      return res.json();
    },
  });

  const series = data?.series || [];

  useEffect(() => {
    document.title = 'Battle Series | Card Battles';
    return () => { document.title = 'Card Battles ⚔️'; };
  }, []);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-black text-white">📺 Battle Series</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Recurring battles — subscribe to never miss an episode</p>
        </div>
      </div>

      {/* Series list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-64 bg-[#12121a] border border-[#1e1e2e] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : series.length === 0 ? (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">📺</p>
          <p className="text-white font-bold mb-1">No series yet</p>
          <p className="text-sm text-[#64748b]">Check back soon for recurring battle series!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {series.map(s => <SeriesCard key={s.id} series={s} />)}
        </div>
      )}

      {/* Episode History */}
      {series.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-[#64748b] uppercase tracking-widest">Episode History</h2>
          {series.map(s => (
            <div key={s.id} className="space-y-2">
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span className="text-[#6c47ff]">📺</span> {s.title}
              </p>
              <EpisodeHistorySection series={s} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
