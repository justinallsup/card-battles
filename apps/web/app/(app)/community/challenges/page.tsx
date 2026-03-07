'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trophy, Clock, Users, Target, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { getToken } from '../../../../lib/api';
import { showToast } from '../../../../components/ui/Toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface CommChallenge {
  id: string;
  title: string;
  description: string;
  sport: string;
  creatorId: string;
  creatorName: string;
  type: 'prediction' | 'vote_streak' | 'collection';
  target: number;
  participants: number;
  completions: number;
  reward: string;
  endsAt: string;
  createdAt: string;
}

const SPORT_LABELS: Record<string, string> = { nfl: '🏈 NFL', nba: '🏀 NBA', mlb: '⚾ MLB', nhl: '🏒 NHL', soccer: '⚽ Soccer', all: '🌐 All Sports' };
const SPORT_COLORS: Record<string, string> = { nfl: '#ef4444', nba: '#f59e0b', mlb: '#22c55e', nhl: '#3b82f6', soccer: '#8b5cf6', all: '#6c47ff' };
const TYPE_ICONS: Record<string, string> = { prediction: '🔮', vote_streak: '🔥', collection: '🎴' };
const TYPE_LABELS: Record<string, string> = { prediction: 'Prediction', vote_streak: 'Vote Streak', collection: 'Collection' };

function daysLeft(isoDate: string): number {
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 86400000));
}

function ChallengeCard({ challenge, joined, onJoin }: { challenge: CommChallenge; joined: boolean; onJoin: (id: string) => void }) {
  const progressPct = challenge.participants > 0
    ? Math.min(100, Math.round((challenge.completions / challenge.participants) * 100))
    : 0;
  const days = daysLeft(challenge.endsAt);
  const sportColor = SPORT_COLORS[challenge.sport] || '#6c47ff';

  return (
    <div
      className="rounded-2xl border border-[#1e1e2e] p-4 space-y-3"
      style={{ background: '#12121a' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${sportColor}20`, border: `1px solid ${sportColor}40` }}
        >
          {TYPE_ICONS[challenge.type] || '🎯'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: sportColor, color: 'white' }}
            >
              {SPORT_LABELS[challenge.sport] || challenge.sport}
            </span>
            <span className="text-[10px] text-[#64748b] bg-[#1e1e2e] px-1.5 py-0.5 rounded-full">
              {TYPE_LABELS[challenge.type]}
            </span>
          </div>
          <h3 className="text-white font-bold text-sm mt-1 leading-tight">{challenge.title}</h3>
          <p className="text-[#64748b] text-xs mt-0.5">{challenge.description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-white font-black text-sm">{challenge.participants.toLocaleString()}</p>
          <p className="text-[#64748b] text-[10px]">Participants</p>
        </div>
        <div className="text-center">
          <p className="text-white font-black text-sm">{challenge.target}</p>
          <p className="text-[#64748b] text-[10px]">Target</p>
        </div>
        <div className="text-center">
          <p className={`font-black text-sm ${days === 0 ? 'text-[#ef4444]' : days <= 2 ? 'text-[#f59e0b]' : 'text-white'}`}>
            {days}d
          </p>
          <p className="text-[#64748b] text-[10px]">Left</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-[#64748b]">
          <span>{challenge.completions} completions</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${sportColor}, ${sportColor}aa)` }}
          />
        </div>
      </div>

      {/* Reward + action */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Trophy size={12} className="text-[#f59e0b]" />
          <span className="text-xs text-[#f59e0b] font-semibold">{challenge.reward}</span>
        </div>
        {joined ? (
          <div className="flex items-center gap-1 text-[#22c55e] text-sm font-bold">
            <CheckCircle size={14} />
            <span>Joined</span>
          </div>
        ) : (
          <button
            onClick={() => onJoin(challenge.id)}
            className="px-4 py-1.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6c47ff 0%, #9b7aff 100%)' }}
          >
            Join Challenge
          </button>
        )}
      </div>

      {/* Creator */}
      <p className="text-[10px] text-[#64748b]">Created by <span className="text-[#94a3b8]">@{challenge.creatorName}</span></p>
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', sport: 'all', type: 'vote_streak' as CommChallenge['type'],
    target: 10, reward: '', daysUntilEnd: 7,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      showToast('Title and description are required', 'error');
      return;
    }
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/community/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      showToast('🎯 Challenge created!', 'success');
      onCreated();
      onClose();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create challenge', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-lg rounded-2xl border border-[#1e1e2e] p-5 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: '#0a0a0f' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">🎯 Create Challenge</h2>
          <button onClick={onClose} className="p-2 text-[#64748b] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#94a3b8] mb-1.5 block">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. NFL MVP Prediction"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#12121a] border border-[#1e1e2e] focus:border-[#6c47ff] outline-none"
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#94a3b8] mb-1.5 block">Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What do participants need to do?"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#12121a] border border-[#1e1e2e] focus:border-[#6c47ff] outline-none resize-none"
              rows={3}
              maxLength={300}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#94a3b8] mb-1.5 block">Sport</label>
              <select
                value={form.sport}
                onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#12121a] border border-[#1e1e2e] focus:border-[#6c47ff] outline-none"
              >
                {Object.entries(SPORT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#94a3b8] mb-1.5 block">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as CommChallenge['type'] }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#12121a] border border-[#1e1e2e] focus:border-[#6c47ff] outline-none"
              >
                <option value="vote_streak">🔥 Vote Streak</option>
                <option value="prediction">🔮 Prediction</option>
                <option value="collection">🎴 Collection</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#94a3b8] mb-1.5 block">Target Count</label>
              <input
                type="number"
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: parseInt(e.target.value) || 10 }))}
                min={1} max={100}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#12121a] border border-[#1e1e2e] focus:border-[#6c47ff] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#94a3b8] mb-1.5 block">Duration (days)</label>
              <input
                type="number"
                value={form.daysUntilEnd}
                onChange={e => setForm(f => ({ ...f, daysUntilEnd: parseInt(e.target.value) || 7 }))}
                min={1} max={30}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#12121a] border border-[#1e1e2e] focus:border-[#6c47ff] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#94a3b8] mb-1.5 block">Reward Badge</label>
            <input
              value={form.reward}
              onChange={e => setForm(f => ({ ...f, reward: e.target.value }))}
              placeholder="🏅 Challenge Badge"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#12121a] border border-[#1e1e2e] focus:border-[#6c47ff] outline-none"
              maxLength={60}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-black text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6c47ff 0%, #9b7aff 100%)' }}
          >
            {loading ? 'Creating...' : '🎯 Create Challenge'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CommunityChallengePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'active' | 'mine'>('active');
  const [showCreate, setShowCreate] = useState(false);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = '🎯 Community Challenges | Card Battles';
    try {
      const saved = localStorage.getItem('joined-challenges');
      if (saved) setJoinedIds(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const { data, isLoading, refetch } = useQuery<{ challenges: CommChallenge[]; total: number }>({
    queryKey: ['community-challenges'],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/community/challenges`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 30_000,
  });

  const handleJoin = async (id: string) => {
    if (!user) {
      showToast('Sign in to join challenges', 'info');
      return;
    }
    if (joinedIds.has(id)) return;
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/community/challenges/${id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const newJoined = new Set([...joinedIds, id]);
      setJoinedIds(newJoined);
      localStorage.setItem('joined-challenges', JSON.stringify([...newJoined]));
      showToast('🎯 Challenge joined!', 'success');
      refetch();
    } catch {
      showToast('Failed to join challenge', 'error');
    }
  };

  const allChallenges = data?.challenges ?? [];
  const myChallenges = allChallenges.filter(c => joinedIds.has(c.id) || c.creatorId === user?.id);

  const displayChallenges = tab === 'mine' ? myChallenges : allChallenges;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            🎯 Community Challenges
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            {data?.total ?? 0} active challenges
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6c47ff 0%, #9b7aff 100%)' }}
          >
            <Plus size={16} />
            Create
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'active' as const, label: '🔥 Active' },
          { key: 'mine' as const, label: '⚔️ My Challenges' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t.key ? 'text-white' : 'text-[#64748b] border border-[#1e1e2e]'
            }`}
            style={tab === t.key ? { background: 'linear-gradient(135deg, #6c47ff 0%, #9b7aff 100%)' } : { background: '#12121a' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-[#12121a] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && displayChallenges.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-white font-bold">
            {tab === 'mine' ? "You haven't joined any challenges yet" : 'No challenges available'}
          </p>
          <p className="text-[#64748b] text-sm mt-1">
            {tab === 'mine' ? 'Browse active challenges and join one!' : 'Be the first to create a challenge!'}
          </p>
          {user && tab === 'active' && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-6 py-3 rounded-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6c47ff 0%, #9b7aff 100%)' }}
            >
              Create First Challenge
            </button>
          )}
        </div>
      )}

      {/* Challenges list */}
      <div className="space-y-4">
        {displayChallenges.map(challenge => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            joined={joinedIds.has(challenge.id)}
            onJoin={handleJoin}
          />
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}

      {/* Back link */}
      <div className="text-center pt-2">
        <a href="/community" className="text-[#6c47ff] text-sm font-semibold hover:underline">
          ← Back to Community
        </a>
      </div>
    </div>
  );
}
