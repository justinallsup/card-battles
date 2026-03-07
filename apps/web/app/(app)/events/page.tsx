'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '../../../components/ui/BackButton';
import { showToast } from '../../../components/ui/Toast';
import { getToken } from '../../../lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

type SeasonalEvent = {
  id: string;
  title: string;
  description: string;
  theme: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'live' | 'ended';
  prize: string;
  participantCount: number;
  battles: string[];
  bannerColor: string;
  emoji: string;
};

function formatTimeLeft(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m left`;
}

function formatTimeUntil(startDate: string): string {
  const diff = new Date(startDate).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `Starts in ${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return `Starts in ${hours}h ${mins}m`;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function StatusBadge({ status }: { status: SeasonalEvent['status'] }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
        LIVE
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
        UPCOMING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#374151]/30 text-[#64748b] border border-[#374151]/30">
      <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
      ENDED
    </span>
  );
}

function EventCard({ event, onJoin }: { event: SeasonalEvent; onJoin: (id: string) => void }) {
  const isLive = event.status === 'live';
  const isUpcoming = event.status === 'upcoming';
  const isEnded = event.status === 'ended';

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all"
      style={{
        background: '#12121a',
        borderColor: isLive ? event.bannerColor + '60' : '#1e1e2e',
        boxShadow: isLive ? `0 0 20px ${event.bannerColor}20` : 'none',
      }}
    >
      {/* Banner header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${event.bannerColor}25, ${event.bannerColor}10)`,
          borderBottom: `1px solid ${event.bannerColor}30`,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{event.emoji}</span>
          <div>
            <h3 className="text-base font-black text-white leading-tight">{event.title}</h3>
            <p className="text-[11px] mt-0.5" style={{ color: event.bannerColor }}>
              {isLive ? formatTimeLeft(event.endDate) : isUpcoming ? formatTimeUntil(event.startDate) : 'Event ended'}
            </p>
          </div>
        </div>
        <StatusBadge status={event.status} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-[#94a3b8] leading-relaxed">{event.description}</p>

        <div className="flex items-center gap-4 text-xs text-[#64748b]">
          <span className="flex items-center gap-1.5">
            <span className="text-base">🎯</span>
            <span>{event.theme}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e]">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest">Prize</p>
            <p className="text-xs font-bold text-white mt-0.5">🏆 {event.prize}</p>
          </div>
          <div className="flex-1 bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e]">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest">Participants</p>
            <p className="text-xs font-bold text-white mt-0.5">👥 {formatNumber(event.participantCount)}</p>
          </div>
        </div>

        {isEnded && (
          <div className="bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e]">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-2">🏅 Event Complete</p>
            <p className="text-xs text-[#94a3b8]">
              {formatNumber(event.participantCount)} collectors participated. The winner earned: <span className="text-[#fbbf24] font-bold">{event.prize}</span>
            </p>
          </div>
        )}

        {(isLive || isUpcoming) && (
          <button
            onClick={() => onJoin(event.id)}
            className="w-full py-3 rounded-xl font-black text-sm transition-all active:scale-95"
            style={{
              background: isLive
                ? `linear-gradient(135deg, ${event.bannerColor}, ${event.bannerColor}cc)`
                : 'rgba(108,71,255,0.15)',
              color: isLive ? '#000' : '#a78bfa',
              border: isLive ? 'none' : '1px solid rgba(108,71,255,0.3)',
            }}
          >
            {isLive ? `🎮 Join ${event.title}` : `🔔 Register for ${event.title}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/events`)
      .then(r => r.json())
      .then(data => {
        setEvents(data.events ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleJoin = async (eventId: string) => {
    const token = getToken();
    if (!token) {
      showToast('Log in to join events!', 'info');
      router.push('/login');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not join event', 'error');
        return;
      }
      showToast(data.message || 'Joined!', 'success');
      // Update participant count locally
      setEvents(prev =>
        prev.map(e => e.id === eventId ? { ...e, participantCount: e.participantCount + 1 } : e)
      );
    } catch {
      showToast('Failed to join event', 'error');
    }
  };

  const liveEvents = events.filter(e => e.status === 'live');
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const endedEvents = events.filter(e => e.status === 'ended');

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-xl font-black text-white">🎉 Events</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Limited-Time Battles</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-[#1e1e2e] bg-[#12121a] overflow-hidden animate-pulse">
              <div className="h-16 bg-[#1e1e2e]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[#1e1e2e] rounded w-3/4" />
                <div className="h-3 bg-[#1e1e2e] rounded w-full" />
                <div className="h-3 bg-[#1e1e2e] rounded w-2/3" />
                <div className="h-12 bg-[#1e1e2e] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live Events */}
          {liveEvents.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">
                🔴 Live Now
              </p>
              <div className="space-y-4">
                {liveEvents.map(event => (
                  <EventCard key={event.id} event={event} onJoin={handleJoin} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">
                📅 Coming Soon
              </p>
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} onJoin={handleJoin} />
                ))}
              </div>
            </div>
          )}

          {/* Ended Events */}
          {endedEvents.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">
                🏺 Past Events
              </p>
              <div className="space-y-4">
                {endedEvents.map(event => (
                  <EventCard key={event.id} event={event} onJoin={handleJoin} />
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-white font-bold">No events yet</p>
              <p className="text-[#64748b] text-sm mt-1">Check back soon for limited-time battles!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
