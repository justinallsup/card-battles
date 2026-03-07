'use client';
import { useState, useEffect } from 'react';
import { BackButton } from '../../../components/ui/BackButton';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

type Release = {
  id: string;
  name: string;
  sport: string;
  brand: string;
  releaseDate: string;
  type: string;
  description: string;
  msrp: number;
  hobbySRP?: number;
  expectedHits?: string[];
  hype: number;
  notifyCount?: number;
};

const SPORT_EMOJI: Record<string, string> = {
  nfl: '🏈', nba: '🏀', mlb: '⚾', nhl: '🏒', all: '🃏',
};

function HypeMeter({ hype }: { hype: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= hype ? '#f59e0b' : 'none'} stroke={i <= hype ? '#f59e0b' : '#374151'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function Countdown({ releaseDate }: { releaseDate: string }) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(releaseDate).getTime() - Date.now();
      setDays(Math.max(0, Math.ceil(diff / 86400000)));
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [releaseDate]);

  if (days === null) return null;

  const urgency = days <= 7 ? '#ef4444' : days <= 14 ? '#f59e0b' : '#22c55e';

  return (
    <div
      className="flex flex-col items-center justify-center px-3 py-2 rounded-xl border text-center min-w-[60px]"
      style={{ background: urgency + '15', borderColor: urgency + '40' }}
    >
      <span className="text-xl font-black" style={{ color: urgency }}>{days}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: urgency }}>
        {days === 1 ? 'day' : 'days'}
      </span>
    </div>
  );
}

function NotifyButton({ release }: { release: Release }) {
  const [notified, setNotified] = useState(false);
  const [count, setCount] = useState(release.notifyCount || 0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`notify_${release.id}`);
      setNotified(!!stored);
    }
  }, [release.id]);

  const handleNotify = () => {
    if (notified) {
      localStorage.removeItem(`notify_${release.id}`);
      setNotified(false);
      setCount(c => Math.max(0, c - 1));
    } else {
      localStorage.setItem(`notify_${release.id}`, '1');
      setNotified(true);
      setCount(c => c + 1);
    }
  };

  return (
    <button
      onClick={handleNotify}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
      style={{
        background: notified ? 'rgba(108,71,255,0.2)' : 'rgba(108,71,255,0.08)',
        border: `1px solid ${notified ? 'rgba(108,71,255,0.6)' : 'rgba(108,71,255,0.25)'}`,
        color: notified ? '#a78bfa' : '#6c47ff',
      }}
    >
      <span>{notified ? '🔔' : '🔕'}</span>
      <span>{notified ? 'Notified' : 'Notify Me'}</span>
      {count > 0 && (
        <span
          className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black"
          style={{ background: 'rgba(108,71,255,0.3)', color: '#c4b5fd' }}
        >
          {count.toLocaleString()}
        </span>
      )}
    </button>
  );
}

function UpcomingCard({ release }: { release: Release }) {
  const emoji = SPORT_EMOJI[release.sport] || '🃏';
  const releaseStr = new Date(release.releaseDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div
      className="rounded-2xl border border-[#1e1e2e] overflow-hidden"
      style={{ background: '#12121a' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.2)' }}
        >
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <div>
              <h3 className="text-sm font-black text-white leading-tight">{release.name}</h3>
              <p className="text-xs text-[#64748b] mt-0.5">{release.brand} · {release.type}</p>
            </div>
            <Countdown releaseDate={release.releaseDate} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 space-y-3">
        <p className="text-xs text-[#94a3b8] leading-relaxed">{release.description}</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Hype</p>
            <HypeMeter hype={release.hype} />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Release</p>
            <p className="text-xs font-bold text-white">{releaseStr}</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex gap-2">
          <div
            className="flex-1 rounded-xl px-3 py-2 border border-[#1e1e2e]"
            style={{ background: '#0a0a0f' }}
          >
            <p className="text-[9px] text-[#64748b] uppercase tracking-wider">Retail SRP</p>
            <p className="text-sm font-black text-white">${release.msrp}</p>
          </div>
          {release.hobbySRP && release.hobbySRP !== release.msrp && (
            <div
              className="flex-1 rounded-xl px-3 py-2 border border-[#1e1e2e]"
              style={{ background: '#0a0a0f' }}
            >
              <p className="text-[9px] text-[#64748b] uppercase tracking-wider">Hobby Box</p>
              <p className="text-sm font-black text-white">${release.hobbySRP}</p>
            </div>
          )}
        </div>

        {/* Expected hits */}
        {release.expectedHits && release.expectedHits.length > 0 && (
          <div>
            <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1.5">Expected Hits</p>
            <div className="flex flex-wrap gap-1.5">
              {release.expectedHits.map((hit) => (
                <span
                  key={hit}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}
                >
                  ✨ {hit}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <NotifyButton release={release} />
      </div>
    </div>
  );
}

function RecentCard({ release }: { release: Release }) {
  const emoji = SPORT_EMOJI[release.sport] || '🃏';
  const releaseStr = new Date(release.releaseDate).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-[#1e1e2e]"
      style={{ background: '#12121a' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{release.name}</p>
        <p className="text-[10px] text-[#64748b]">{release.brand} · Released {releaseStr}</p>
      </div>
      <div className="flex-shrink-0">
        <HypeMeter hype={release.hype} />
      </div>
    </div>
  );
}

export default function ReleasesPage() {
  const [upcoming, setUpcoming] = useState<Release[]>([]);
  const [recent, setRecent] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Release Calendar | Card Battles';
    fetch(`${BASE}/releases`)
      .then(r => r.json())
      .then((d: { upcoming: Release[]; recent: Release[] }) => {
        // Sort upcoming by releaseDate
        const sorted = [...(d.upcoming || [])].sort(
          (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
        );
        setUpcoming(sorted);
        setRecent(d.recent || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 pb-4">
      <BackButton href="/feed" />

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-white">📅 Dropping Soon</h1>
        <p className="text-sm text-[#64748b]">Set your alerts before they sell out</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-[#12121a] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Upcoming releases */}
          {upcoming.length === 0 ? (
            <div className="text-center py-12 text-[#64748b]">
              <p className="text-4xl mb-2">📅</p>
              <p>No upcoming releases found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((release) => (
                <UpcomingCard key={release.id} release={release} />
              ))}
            </div>
          )}

          {/* Recent releases */}
          {recent.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Recent Releases</h2>
                <div className="flex-1 h-px bg-[#1e1e2e]" />
              </div>
              <div className="space-y-2">
                {recent.map((release) => (
                  <RecentCard key={release.id} release={release} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
