'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, UserCheck, Eye, Star, Swords, Zap } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';
import { showToast } from '../../../components/ui/Toast';
import { BackButton } from '../../../components/ui/BackButton';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface Collector {
  id: string;
  username: string;
  createdAt: string;
  battlesCreated: number;
  votesCast: number;
  battlesWon: number;
  streak: number;
  bio: string;
  sport: string;
  followerCount: number;
}

type FilterTab = 'all' | 'top-voters' | 'top-creators' | 'streaks';

const SPORT_COLORS: Record<string, string> = {
  NFL: '#ef4444',
  NBA: '#f59e0b',
  MLB: '#3b82f6',
  'All Sports': '#6c47ff',
};

function CollectorCard({
  collector,
  onFollow,
  followed,
}: {
  collector: Collector;
  onFollow: (username: string) => void;
  followed: boolean;
}) {
  const sportColor = SPORT_COLORS[collector.sport] || '#6c47ff';

  return (
    <div
      className="rounded-2xl border border-[#1e1e2e] p-4 flex flex-col gap-3"
      style={{ background: '#12121a' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${sportColor}88, ${sportColor}44)`, border: `2px solid ${sportColor}55` }}
          >
            {collector.username[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">@{collector.username}</p>
            <p className="text-[#64748b] text-xs truncate">{collector.bio}</p>
          </div>
        </div>
        <span
          className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: `${sportColor}22`, color: sportColor }}
        >
          {collector.sport}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center bg-[#0a0a0f] rounded-xl py-2 px-1">
          <Swords size={12} className="mx-auto mb-0.5 text-[#6c47ff]" />
          <p className="text-white font-bold text-sm">{collector.battlesCreated}</p>
          <p className="text-[#64748b] text-[9px]">Battles</p>
        </div>
        <div className="text-center bg-[#0a0a0f] rounded-xl py-2 px-1">
          <Star size={12} className="mx-auto mb-0.5 text-[#f59e0b]" />
          <p className="text-white font-bold text-sm">{collector.votesCast}</p>
          <p className="text-[#64748b] text-[9px]">Votes</p>
        </div>
        <div className="text-center bg-[#0a0a0f] rounded-xl py-2 px-1">
          <Zap size={12} className="mx-auto mb-0.5 text-[#22c55e]" />
          <p className="text-white font-bold text-sm">{collector.streak}</p>
          <p className="text-[#64748b] text-[9px]">Streak</p>
        </div>
      </div>

      {/* Follower count */}
      <p className="text-[#64748b] text-xs">
        <span className="text-white font-semibold">{collector.followerCount}</span> followers
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onFollow(collector.username)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
          style={followed
            ? { background: 'rgba(108,71,255,0.15)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.4)' }
            : { background: '#6c47ff', color: 'white' }
          }
        >
          {followed ? <UserCheck size={13} /> : <UserPlus size={13} />}
          {followed ? 'Following' : 'Follow'}
        </button>
        <Link
          href={`/profile/${collector.username}`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#64748b] border border-[#1e1e2e] hover:text-white transition-colors"
        >
          <Eye size={13} />
          View
        </Link>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; username: string }[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/users/discover`)
      .then(r => r.json())
      .then((d: { users: Collector[] }) => { setCollectors(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      fetch(`${BASE}/users/search?q=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then((d: { users: { id: string; username: string }[] }) => setSearchResults(d.users || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleFollow = useCallback(async (username: string) => {
    if (!user) { showToast('Login to follow collectors', 'error'); return; }
    const col = collectors.find(c => c.username === username);
    if (!col) return;
    const alreadyFollowing = followedIds.has(col.id);
    const endpoint = alreadyFollowing ? 'unfollow' : 'follow';
    try {
      await fetch(`${BASE}/users/${username}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setFollowedIds(prev => {
        const next = new Set(prev);
        if (alreadyFollowing) next.delete(col.id); else next.add(col.id);
        return next;
      });
      showToast(alreadyFollowing ? `Unfollowed @${username}` : `Following @${username}!`, 'success');
    } catch {
      showToast('Failed to update follow status', 'error');
    }
  }, [user, collectors, followedIds]);

  const filteredCollectors = (() => {
    let list = [...collectors];
    switch (activeTab) {
      case 'top-voters':   list.sort((a, b) => b.votesCast - a.votesCast); break;
      case 'top-creators': list.sort((a, b) => b.battlesCreated - a.battlesCreated); break;
      case 'streaks':      list.sort((a, b) => b.streak - a.streak); break;
    }
    return list;
  })();

  const suggested = collectors.slice(0, 3);
  const mainList = filteredCollectors.slice(3);

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'top-voters', label: '🗳️ Top Voters' },
    { key: 'top-creators', label: '⚔️ Top Creators' },
    { key: 'streaks', label: '🔥 Streaks' },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-[#1e1e2e]"
        style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-black text-white">🔍 Discover Collectors</h1>
            <p className="text-xs text-[#64748b]">Find and follow other card enthusiasts</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            placeholder="Search collectors by username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#64748b] border border-[#1e1e2e] focus:outline-none focus:border-[#6c47ff]"
            style={{ background: '#12121a' }}
          />
          {searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-[#1e1e2e] overflow-hidden z-10"
              style={{ background: '#12121a' }}
            >
              {searchResults.map(u => (
                <Link
                  key={u.id}
                  href={`/profile/${u.username}`}
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#1e1e2e] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#6c47ff]/30 flex items-center justify-center text-xs font-bold text-[#6c47ff]">
                    {u.username[0].toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium">@{u.username}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Suggested for You */}
        {!loading && suggested.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-3">
              ✨ Suggested for You
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {suggested.map(c => (
                <CollectorCard
                  key={c.id}
                  collector={c}
                  onFollow={handleFollow}
                  followed={followedIds.has(c.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={activeTab === tab.key
                ? { background: '#6c47ff', color: 'white' }
                : { background: '#1e1e2e', color: '#64748b' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Collectors Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-[#1e1e2e] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {(activeTab === 'all' ? mainList : filteredCollectors).map(c => (
              <CollectorCard
                key={c.id}
                collector={c}
                onFollow={handleFollow}
                followed={followedIds.has(c.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
