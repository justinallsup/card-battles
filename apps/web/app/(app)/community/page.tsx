'use client';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Globe, Users, Swords, Zap, Star, MessageSquare, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '../../../components/ui/Toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

type CommunityStats = {
  totalMembers: number;
  totalBattles: number;
  totalVotes: number;
  onlineNow: number;
  newTodayMembers: number;
};

type FeedEvent = {
  type: 'battle_created' | 'milestone' | 'new_member' | 'hot_battle' | 'tournament';
  battleId?: string;
  title?: string;
  username?: string;
  votes?: number;
  text?: string;
  createdAt: string;
};

type Discussion = {
  id: string;
  title: string;
  total_votes_cached: number;
  username: string;
};

type RisingStar = {
  username: string;
  avatar_url: string | null;
  votes_cast: number;
  current_streak: number;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function eventIcon(type: FeedEvent['type']) {
  switch (type) {
    case 'battle_created': return '⚔️';
    case 'milestone': return '🎉';
    case 'new_member': return '👋';
    case 'hot_battle': return '🔥';
    case 'tournament': return '🏆';
    default: return '📣';
  }
}

function eventText(event: FeedEvent) {
  switch (event.type) {
    case 'battle_created':
      return (
        <span>
          New battle: <span className="text-white font-semibold">{event.title}</span>
          {event.username && <span className="text-[#64748b]"> by @{event.username}</span>}
          {event.votes ? <span className="text-[#6c47ff] ml-1">· {event.votes} votes</span> : null}
        </span>
      );
    case 'milestone':
    case 'hot_battle':
    case 'tournament':
      return <span>{event.text}</span>;
    case 'new_member':
      return (
        <span>
          <span className="text-[#22c55e] font-semibold">@{event.username}</span>
          <span className="text-[#94a3b8]"> {event.text}</span>
        </span>
      );
    default:
      return <span>{event.text}</span>;
  }
}

export default function CommunityPage() {
  const [chatModal, setChatModal] = useState<string | null>(null);
  useEffect(() => { document.title = 'Community | Card Battles'; }, []);

  const { data: stats } = useQuery<CommunityStats>({
    queryKey: ['community-stats'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/community/stats`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: feedData, isLoading: feedLoading } = useQuery<{ events: FeedEvent[] }>({
    queryKey: ['community-feed'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/community/feed`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: discData } = useQuery<{ battles: Discussion[] }>({
    queryKey: ['community-discussions'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/community/discussions`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: starsData } = useQuery<{ users: RisingStar[] }>({
    queryKey: ['community-rising-stars'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/community/rising-stars`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 60_000,
  });

  const handleChatRoom = (room: string) => {
    showToast(`${room} coming soon! 🚀`, 'info');
    setChatModal(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Globe size={20} className="text-[#6c47ff]" /> Community
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Connect with fellow collectors worldwide</p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div
          className="rounded-2xl border border-[#1e1e2e] p-4"
          style={{ background: 'linear-gradient(135deg, #12121a 0%, #1a1030 100%)' }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#6c47ff]" />
              <div>
                <p className="text-xs text-[#64748b]">Members</p>
                <p className="text-base font-black text-white">{stats.totalMembers.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Swords size={14} className="text-[#f59e0b]" />
              <div>
                <p className="text-xs text-[#64748b]">Battles</p>
                <p className="text-base font-black text-white">{stats.totalBattles.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#22c55e]" />
              <div>
                <p className="text-xs text-[#64748b]">Total Votes</p>
                <p className="text-base font-black text-white">{stats.totalVotes.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm">●</span>
              <div>
                <p className="text-xs text-[#64748b]">Online Now</p>
                <p className="text-base font-black text-[#22c55e]">{stats.onlineNow}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1e1e2e] flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#6c47ff] bg-[#6c47ff]/10 px-2 py-0.5 rounded-full">
              +{stats.newTodayMembers} new today
            </span>
            <span className="text-[10px] text-[#64748b]">Welcome the newcomers! 👋</span>
          </div>
        </div>
      )}

      {/* Live Feed */}
      <div className="rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
        <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Live Feed</h2>
        </div>
        <div className="divide-y divide-[#1e1e2e]">
          {feedLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-[#1e1e2e] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#1e1e2e] rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-[#1e1e2e] rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))
          ) : feedData?.events.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#64748b] text-sm">No recent activity</div>
          ) : (
            feedData?.events.map((event, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-[#1e1e2e]/30 transition-colors">
                <span className="text-xl flex-shrink-0 mt-0.5">{eventIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#94a3b8] leading-snug">{eventText(event)}</p>
                  <p className="text-[10px] text-[#64748b] mt-0.5">{timeAgo(event.createdAt)}</p>
                </div>
                {event.battleId && (
                  <Link
                    href={`/battles/${event.battleId}`}
                    className="flex-shrink-0 text-[#6c47ff] hover:text-[#a78bfa] transition-colors"
                  >
                    <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Discussions */}
      <div className="rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
        <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
          <MessageSquare size={14} className="text-[#f59e0b]" />
          <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Recent Discussions</h2>
        </div>
        <div className="divide-y divide-[#1e1e2e]">
          {discData?.battles.map((b) => (
            <Link
              key={b.id}
              href={`/battles/${b.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e2e]/30 transition-colors"
            >
              <span className="text-lg">⚔️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                {b.username && (
                  <p className="text-[10px] text-[#64748b]">by @{b.username}</p>
                )}
              </div>
              <span className="text-xs text-[#6c47ff] font-bold flex-shrink-0">
                {(b.total_votes_cached || 0).toLocaleString()} votes
              </span>
            </Link>
          ))}
          {!discData?.battles.length && (
            <div className="px-4 py-6 text-center text-[#64748b] text-sm">No discussions yet</div>
          )}
        </div>
      </div>

      {/* Rising Stars */}
      <div className="rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
        <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
          <Star size={14} className="text-[#f59e0b]" />
          <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Rising Stars</h2>
        </div>
        <div className="divide-y divide-[#1e1e2e]">
          {starsData?.users.map((u, i) => (
            <Link
              key={u.username}
              href={`/profile/${u.username}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e2e]/30 transition-colors"
            >
              <span className="text-lg flex-shrink-0">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
              <div
                className="w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
              >
                {u.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">@{u.username}</p>
                <p className="text-[10px] text-[#64748b]">
                  {u.votes_cast} votes · {u.current_streak > 0 ? `🔥 ${u.current_streak} streak` : 'No streak'}
                </p>
              </div>
            </Link>
          ))}
          {!starsData?.users.length && (
            <div className="px-4 py-6 text-center text-[#64748b] text-sm">No stars yet — be the first!</div>
          )}
        </div>
      </div>

      {/* Sport Chat Rooms */}
      <div className="rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
        <div className="px-4 py-3 border-b border-[#1e1e2e]">
          <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">💬 Sport Chat Rooms</h2>
          <p className="text-[10px] text-[#64748b] mt-0.5">Coming soon — tap to get notified</p>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {[
            { label: 'NFL Chat', icon: '🏈', color: '#059669' },
            { label: 'NBA Chat', icon: '🏀', color: '#d97706' },
            { label: 'MLB Chat', icon: '⚾', color: '#2563eb' },
          ].map((room) => (
            <button
              key={room.label}
              onClick={() => handleChatRoom(room.label)}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border border-[#1e1e2e] hover:border-[#6c47ff]/30 transition-all bg-[#0a0a0f]"
            >
              <span className="text-2xl">{room.icon}</span>
              <p className="text-xs font-bold text-white text-center">{room.label}</p>
              <span className="text-[9px] text-[#64748b] bg-[#1e1e2e] px-2 py-0.5 rounded-full">Soon™</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
