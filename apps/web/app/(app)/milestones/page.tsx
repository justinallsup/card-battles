'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

type MilestoneType = 'first_battle' | 'streak_7' | 'votes_100' | 'rank_up' | 'battle_popular' | 'badge_earned';

interface Milestone {
  id: string;
  text: string;
  type: MilestoneType;
  username: string;
  createdAt: string;
}

const TYPE_COLORS: Record<MilestoneType, { bg: string; text: string; border: string }> = {
  streak_7:      { bg: 'rgba(249,115,22,0.1)', text: '#f97316', border: 'rgba(249,115,22,0.2)' },
  votes_100:     { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
  rank_up:       { bg: 'rgba(168,85,247,0.1)', text: '#a855f7', border: 'rgba(168,85,247,0.2)' },
  battle_popular:{ bg: 'rgba(34,197,94,0.1)',  text: '#22c55e', border: 'rgba(34,197,94,0.2)'  },
  first_battle:  { bg: 'rgba(234,179,8,0.1)',  text: '#eab308', border: 'rgba(234,179,8,0.2)'  },
  badge_earned:  { bg: 'rgba(108,71,255,0.1)', text: '#a78bfa', border: 'rgba(108,71,255,0.2)' },
};

const TYPE_LABELS: Record<MilestoneType, string> = {
  first_battle:   '🎉 First Battle',
  streak_7:       '🔥 Streak',
  votes_100:      '💯 Votes',
  rank_up:        '⬆️ Rank Up',
  battle_popular: '🚀 Popular',
  badge_earned:   '🏅 Badge',
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

function InitialsAvatar({ username, color }: { username: string; color: string }) {
  const initials = username.slice(0, 2).toUpperCase();
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
      style={{ background: color + '30', color }}
    >
      {initials}
    </div>
  );
}

interface MilestoneCardProps {
  milestone: Milestone;
}

function MilestoneCard({ milestone }: MilestoneCardProps) {
  const style = TYPE_COLORS[milestone.type] || TYPE_COLORS.badge_earned;
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border transition-all hover:opacity-90"
      style={{ background: style.bg, borderColor: style.border }}
    >
      <InitialsAvatar username={milestone.username} color={style.text} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium leading-snug">{milestone.text}</p>
        <p className="text-xs mt-1" style={{ color: style.text }}>
          {timeAgo(milestone.createdAt)}
        </p>
      </div>
    </div>
  );
}

const ALL_TYPES = 'all';
type FilterType = 'all' | MilestoneType;

export function MilestonesFeed({ limit }: { limit?: number }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>(ALL_TYPES);

  useEffect(() => {
    fetch(`${BASE_URL}/milestones`)
      .then(r => r.json())
      .then(d => { setMilestones(d.milestones || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? milestones : milestones.filter(m => m.type === filter);
  const displayed = limit ? filtered.slice(0, limit) : filtered;

  if (loading) {
    return <div className="py-6 text-center text-[#64748b] text-sm">Loading milestones…</div>;
  }

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className="px-3 py-1 rounded-full text-xs font-bold transition-all"
          style={filter === 'all'
            ? { background: 'rgba(108,71,255,0.2)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.4)' }
            : { background: '#1e1e2e', color: '#64748b', border: '1px solid #1e1e2e' }
          }
        >
          All
        </button>
        {(Object.entries(TYPE_LABELS) as [MilestoneType, string][]).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className="px-3 py-1 rounded-full text-xs font-bold transition-all"
            style={filter === type
              ? { background: TYPE_COLORS[type].bg, color: TYPE_COLORS[type].text, border: `1px solid ${TYPE_COLORS[type].border}` }
              : { background: '#1e1e2e', color: '#64748b', border: '1px solid #1e1e2e' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {displayed.length === 0 ? (
        <p className="text-center text-[#64748b] py-4 text-sm">No milestones found</p>
      ) : (
        displayed.map(m => <MilestoneCard key={m.id} milestone={m} />)
      )}
    </div>
  );
}

export default function MilestonesPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/community" className="text-[#64748b] hover:text-white transition-colors text-sm">
            ← Back
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">🏅 Community Milestones</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Celebrating achievements across the Card Battles community
          </p>
        </div>

        {/* Feed */}
        <MilestonesFeed />
      </div>
    </div>
  );
}
