'use client';
import { useQuery } from '@tanstack/react-query';
import { battles as battlesApi, leaderboards as lbApi } from '../../../lib/api';
import { formatTimeLeft } from '../../../lib/utils';
import type { Battle } from '@card-battles/types';

type ActivityItem = {
  id: string;
  icon: string;
  text: string;
  timestamp: string;
  type: 'vote' | 'battle' | 'leaderboard' | 'milestone';
};

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

const DEMO_VOTE_ACTIONS = [
  'voted on', 'just voted on', 'cast their vote on',
  'sided with left on', 'picked right on',
];

function generateActivityFromData(
  battles: Battle[],
  leaderboard: { items: { rank: number; username: string; score: number }[] } | undefined,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  // Generate vote activity from recent battles
  const demoVoters = ['cardking', 'slabmaster', 'rookiehunter', 'packripper', 'gradegod', 'hobiber', 'slabjockey'];
  battles.forEach((battle, i) => {
    // Simulate vote events
    const voter = demoVoters[i % demoVoters.length];
    const action = DEMO_VOTE_ACTIONS[i % DEMO_VOTE_ACTIONS.length];
    const minutesAgo = (i + 1) * 8;
    items.push({
      id: `vote-${battle.id}`,
      icon: '🗳️',
      text: `${voter} ${action} **${battle.title}**`,
      timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
      type: 'vote',
    });

    // Battle created event
    items.push({
      id: `battle-${battle.id}`,
      icon: '⚔️',
      text: `${battle.createdByUsername ?? 'someone'} created a new battle: **${battle.title}**`,
      timestamp: battle.startsAt ?? new Date(Date.now() - (i + 1) * 3600_000).toISOString(),
      type: 'battle',
    });

    // Milestone events for high-vote battles
    if ((battle.totalVotesCached ?? 0) >= 1000) {
      items.push({
        id: `milestone-${battle.id}`,
        icon: '🔥',
        text: `**${battle.title}** just hit ${(battle.totalVotesCached! >= 10000 ? '10,000' : '1,000')} votes!`,
        timestamp: new Date(Date.now() - (i + 3) * 3600_000).toISOString(),
        type: 'milestone',
      });
    }
  });

  // Leaderboard events
  if (leaderboard?.items) {
    leaderboard.items.slice(0, 3).forEach((entry, i) => {
      items.push({
        id: `lb-${entry.username}-${i}`,
        icon: '🏆',
        text: `${entry.username} reached #${entry.rank} on the leaderboard`,
        timestamp: new Date(Date.now() - (i + 1) * 7200_000).toISOString(),
        type: 'leaderboard',
      });
    });
  }

  // Sort by timestamp descending
  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30);
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const parts = item.text.split(/\*\*(.*?)\*\*/g);
  return (
    <div className="flex gap-3 py-3 px-4 border-b border-[#1e1e2e] last:border-0 hover:bg-[#0f0f17] transition-colors">
      <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#cbd5e1] leading-snug">
          {parts.map((part, i) =>
            i % 2 === 1 ? (
              <span key={i} className="font-bold text-white">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
        <p className="text-xs text-[#374151] mt-0.5">{formatTimeAgo(item.timestamp)}</p>
      </div>
      <span
        className="flex-shrink-0 self-start mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{
          background: item.type === 'vote' ? 'rgba(108,71,255,0.12)' :
            item.type === 'milestone' ? 'rgba(239,68,68,0.12)' :
            item.type === 'leaderboard' ? 'rgba(245,158,11,0.12)' :
            'rgba(34,197,94,0.12)',
          color: item.type === 'vote' ? '#8b5cf6' :
            item.type === 'milestone' ? '#ef4444' :
            item.type === 'leaderboard' ? '#f59e0b' :
            '#22c55e',
        }}
      >
        {item.type}
      </span>
    </div>
  );
}

export default function ActivityPage() {
  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => battlesApi.feed(),
    staleTime: 60_000,
  });

  const { data: lbData } = useQuery({
    queryKey: ['activity-leaderboard'],
    queryFn: () => lbApi.get('creators', 'week'),
    staleTime: 60_000,
  });

  const battles = feedData?.items ?? [];
  const activity = generateActivityFromData(battles as Battle[], lbData);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden px-6 py-7 text-center"
        style={{
          background: 'linear-gradient(135deg, #0f0721 0%, #12121a 40%, #0a0a0f 100%)',
          border: '1px solid rgba(108, 71, 255, 0.2)',
          boxShadow: 'inset 0 0 60px rgba(108, 71, 255, 0.08)',
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-20 opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #6c47ff, transparent)' }}
        />
        <div className="relative">
          <h1 className="text-2xl font-black text-white mb-1">
            📡 Activity{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #6c47ff, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Feed
            </span>
          </h1>
          <p className="text-sm text-[#64748b]">What&apos;s happening in Card Battles right now</p>
        </div>
      </div>

      {/* Activity stream */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
      >
        <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
          <span className="text-sm font-bold text-[#94a3b8] uppercase tracking-wider">Live Activity</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-xs text-[#22c55e] font-semibold">Live</span>
          </span>
        </div>

        {feedLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-3 px-4 border-b border-[#1e1e2e]">
                <div className="w-7 h-7 bg-[#1e1e2e] rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#1e1e2e] rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-[#1e1e2e] rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="py-12 text-center text-[#64748b]">No activity yet</div>
        ) : (
          activity.map((item) => <ActivityRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
