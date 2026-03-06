'use client';
import { use, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { users as usersApi, getToken } from '../../../../lib/api';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { Badge } from '../../../../components/ui/Badge';
import { Trophy, Sword, Target, Flame, Star, Zap, Edit2, X, Check, Swords, Settings, UserPlus, UserMinus, Share2, BookMarked, Eye, History } from 'lucide-react';
import Link from 'next/link';
import type { UserStats } from '@card-battles/types';
import { useAuth } from '../../../../hooks/useAuth';

// ── Follow Button ─────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

function FollowButton({ username }: { username: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    fetch(`${BASE_URL}/users/${username}/follow-status`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        setIsFollowing(data.isFollowing ?? false);
        setFollowerCount(data.followerCount ?? 0);
        setFollowingCount(data.followingCount ?? 0);
      })
      .catch(() => {});
  }, [username]);

  const handleToggle = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    // Optimistic update
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    setFollowerCount(prev => newFollowing ? prev + 1 : Math.max(0, prev - 1));
    try {
      const endpoint = newFollowing ? 'follow' : 'unfollow';
      await fetch(`${BASE_URL}/users/${username}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Revert on error
      setIsFollowing(!newFollowing);
      setFollowerCount(prev => newFollowing ? Math.max(0, prev - 1) : prev + 1);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <p className="text-lg font-black text-white">{followerCount}</p>
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest">Followers</p>
        </div>
        <div className="w-px h-8 bg-[#1e1e2e]" />
        <div className="text-center">
          <p className="text-lg font-black text-white">{followingCount}</p>
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest">Following</p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${
          isFollowing
            ? 'border-[#374151] text-[#64748b] hover:border-[#ef4444]/50 hover:text-[#ef4444]'
            : 'border-[#6c47ff] text-[#6c47ff] bg-[#6c47ff]/10 hover:bg-[#6c47ff]/20'
        } disabled:opacity-50`}
      >
        {loading ? (
          <LoadingSpinner className="w-4 h-4" />
        ) : isFollowing ? (
          <><UserMinus size={14} /> Unfollow</>
        ) : (
          <><UserPlus size={14} /> Follow</>
        )}
      </button>
    </div>
  );
}

// ── Avatar util ────────────────────────────────────────────────────────────────
function hashUsername(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const GRADIENTS = [
  'from-[#6c47ff] to-[#a855f7]',
  'from-[#ef4444] to-[#f97316]',
  'from-[#3b82f6] to-[#06b6d4]',
  'from-[#22c55e] to-[#10b981]',
  'from-[#f59e0b] to-[#eab308]',
  'from-[#ec4899] to-[#f43f5e]',
  'from-[#8b5cf6] to-[#3b82f6]',
  'from-[#14b8a6] to-[#22c55e]',
];

function AvatarInitials({ username, size = 'lg' }: { username: string; size?: 'sm' | 'md' | 'lg' }) {
  const gradient = GRADIENTS[hashUsername(username) % GRADIENTS.length];
  const initials = username.slice(0, 2).toUpperCase();
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'md' ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-white flex-shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
}

// ── Badge definitions ──────────────────────────────────────────────────────────
interface Stats {
  battlesWon: number;
  battlesCreated: number;
  votesCast: number;
  currentStreak: number;
  bestStreak: number;
  dailyPickWins: number;
  dailyPickLosses: number;
}

interface UserProfile {
  proStatus?: string;
  isAdmin?: boolean;
  username: string;
  bio?: string;
  createdAt?: string;
}

const BADGE_DEFS = [
  // Combat badges
  { id: 'first_blood',     label: 'First Blood',      icon: '⚔️',  color: 'border-red-500/40 bg-red-500/10 text-red-400',     desc: 'Won your first battle',         threshold: (s: Stats) => s.battlesWon >= 1 },
  { id: 'warrior',         label: 'Warrior',           icon: '🛡️',  color: 'border-orange-500/40 bg-orange-500/10 text-orange-400', desc: 'Won 10 battles',            threshold: (s: Stats) => s.battlesWon >= 10 },
  { id: 'champion',        label: 'Champion',          icon: '🏆',  color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', desc: 'Won 25 battles',            threshold: (s: Stats) => s.battlesWon >= 25 },
  { id: 'legend',          label: 'Legend',            icon: '👑',  color: 'border-purple-500/40 bg-purple-500/10 text-purple-400', desc: 'Won 50 battles',            threshold: (s: Stats) => s.battlesWon >= 50 },
  { id: 'goat',            label: 'GOAT',              icon: '🐐',  color: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300', desc: 'Won 100 battles',           threshold: (s: Stats) => s.battlesWon >= 100 },
  // Voting badges
  { id: 'voter',           label: 'Voter',             icon: '🗳️',  color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',   desc: 'Cast 10 votes',                threshold: (s: Stats) => s.votesCast >= 10 },
  { id: 'centurion',       label: 'Centurion',         icon: '💯',  color: 'border-blue-400/40 bg-blue-400/10 text-blue-300',   desc: 'Cast 100 votes',               threshold: (s: Stats) => s.votesCast >= 100 },
  { id: 'oracle',          label: 'Oracle',            icon: '🔮',  color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400', desc: 'Cast 500 votes',            threshold: (s: Stats) => s.votesCast >= 500 },
  // Streak badges
  { id: 'hot_streak',      label: 'Hot Streak',        icon: '🔥',  color: 'border-orange-500/40 bg-orange-500/10 text-orange-400', desc: '5-win streak',             threshold: (s: Stats) => s.bestStreak >= 5 },
  { id: 'on_fire',         label: 'On Fire',           icon: '🌋',  color: 'border-red-500/40 bg-red-500/10 text-red-400',      desc: '10-win streak',                threshold: (s: Stats) => s.bestStreak >= 10 },
  // Creator badges
  { id: 'creator',         label: 'Creator',           icon: '✨',  color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',   desc: 'Created 5 battles',            threshold: (s: Stats) => s.battlesCreated >= 5 },
  { id: 'battle_hardened', label: 'Battle Hardened',   icon: '⚡',  color: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',   desc: 'Created 20 battles',           threshold: (s: Stats) => s.battlesCreated >= 20 },
  // Daily picks badges
  { id: 'daily_grinder',   label: 'Daily Grinder',     icon: '📅',  color: 'border-green-500/40 bg-green-500/10 text-green-400', desc: 'Entered 30 daily picks',      threshold: (s: Stats) => (s.dailyPickWins || 0) + (s.dailyPickLosses || 0) >= 30 },
  { id: 'picker',          label: 'Picker',            icon: '🎯',  color: 'border-green-400/40 bg-green-400/10 text-green-300', desc: 'Won 10 daily picks',          threshold: (s: Stats) => (s.dailyPickWins || 0) >= 10 },
  // Special
  { id: 'early_adopter',   label: 'Early Adopter',     icon: '🚀',  color: 'border-purple-500/40 bg-purple-500/10 text-purple-400', desc: 'Joined in the early days', threshold: (_s: Stats) => true },
  { id: 'pro',             label: 'Pro Member',        icon: '💎',  color: 'border-yellow-300/40 bg-yellow-300/10 text-yellow-200', desc: 'Card Battles Pro subscriber', threshold: (_s: Stats, user?: UserProfile) => user?.proStatus === 'pro' },
];

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-[#12121a] rounded-xl border border-[#1e1e2e] p-3 flex flex-col gap-1.5">
      <Icon size={16} className={color} />
      <p className="text-lg font-black text-white leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-[#64748b]">{label}</p>
    </div>
  );
}

// ── Battle row ────────────────────────────────────────────────────────────────
interface BattleRow {
  id: string;
  title: string;
  limg?: string;
  lplayer?: string;
  rimg?: string;
  rplayer?: string;
  total_votes_cached?: number;
  created_at?: string;
}

function UserBattleCard({ battle }: { battle: BattleRow }) {
  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-3 flex items-center gap-3">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {battle.limg && (
          <img src={battle.limg} alt={battle.lplayer ?? 'left'} className="w-9 h-12 object-cover rounded-md flex-shrink-0" />
        )}
        <Swords size={14} className="text-[#6c47ff] flex-shrink-0" />
        {battle.rimg && (
          <img src={battle.rimg} alt={battle.rplayer ?? 'right'} className="w-9 h-12 object-cover rounded-md flex-shrink-0" />
        )}
        <div className="ml-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate leading-tight">{battle.title}</p>
          <p className="text-[10px] text-[#64748b] mt-0.5">
            {battle.total_votes_cached?.toLocaleString() ?? 0} votes
            {battle.created_at && ` · ${new Date(battle.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Edit bio modal ─────────────────────────────────────────────────────────────
function EditBioModal({ currentBio, onClose }: { currentBio: string; onClose: () => void }) {
  const [bio, setBio] = useState(currentBio);
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => usersApi.updateMe({ bio }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-white">Edit Profile</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-white transition-colors"><X size={18}/></button>
        </div>
        <div>
          <label className="text-xs text-[#64748b] mb-1.5 block">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Tell the world about your card collection..."
            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#374151] resize-none focus:outline-none focus:border-[#6c47ff]"
          />
          <p className="text-[10px] text-[#374151] mt-1 text-right">{bio.length}/200</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#1e1e2e] text-[#64748b] text-sm font-semibold">Cancel</button>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-[#6c47ff] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? <LoadingSpinner className="w-4 h-4" /> : <><Check size={14}/> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user: me } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user', username],
    queryFn: () => usersApi.profile(username),
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats', username],
    queryFn: () => usersApi.stats(username),
    enabled: !!user,
  });

  const { data: battlesData } = useQuery({
    queryKey: ['user-battles', username],
    queryFn: () => usersApi.battles(username),
    enabled: !!user,
  });

  if (loadingUser) {
    return (
      <div className="space-y-4">
        <div className="h-28 bg-[#12121a] rounded-2xl border border-[#1e1e2e] animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!user) return <div className="text-center py-16 text-[#64748b]">User not found</div>;

  const s = stats as Stats | undefined;
  const isOwnProfile = me?.username === username;

  const earnedBadges = s ? BADGE_DEFS.filter(b => b.threshold(s, user as UserProfile | undefined)) : [];
  const lockedBadges = s ? BADGE_DEFS.filter(b => !b.threshold(s, user as UserProfile | undefined)) : BADGE_DEFS;

  const userBattles = (battlesData?.items ?? []) as BattleRow[];

  return (
    <div className="space-y-5 pb-2">
      {/* Profile header */}
      <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] p-5">
        <div className="flex items-start gap-4">
          <AvatarInitials username={user.username} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-white">{user.username}</h1>
              {(user as { proStatus?: string }).proStatus && (user as { proStatus?: string }).proStatus !== 'none' && (
                <Badge variant="accent">⭐ PRO</Badge>
              )}
              {(user as { isAdmin?: boolean }).isAdmin && <Badge variant="danger">Admin</Badge>}
            </div>
            <p className="text-xs text-[#374151] mt-1">
              Member since {(() => {
                const d = new Date((user as { createdAt?: string }).createdAt ?? '');
                return `Member since ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
              })()}
            </p>
            {user.bio ? (
              <p className="text-sm text-[#94a3b8] mt-2 leading-relaxed">{user.bio}</p>
            ) : isOwnProfile ? (
              <p className="text-sm text-[#374151] italic mt-2">No bio yet — tell the world about your cards!</p>
            ) : null}
          </div>
        </div>
        {isOwnProfile && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="flex-1 py-2 rounded-xl border border-[#1e1e2e] text-[#64748b] text-sm font-semibold flex items-center justify-center gap-2 hover:border-[#6c47ff] hover:text-[#6c47ff] transition-colors"
            >
              <Edit2 size={13}/> Edit Profile
            </button>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`https://cardbattles.app/profile/${username}`);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                } catch {}
              }}
              className="w-10 h-10 rounded-xl border border-[#1e1e2e] flex items-center justify-center transition-colors"
              style={shareCopied ? { borderColor: 'rgba(34,197,94,0.4)', color: '#22c55e' } : { color: '#64748b' }}
              title="Share profile"
            >
              {shareCopied ? <Check size={15} /> : <Share2 size={15} />}
            </button>
            <Link
              href="/settings"
              className="w-10 h-10 rounded-xl border border-[#1e1e2e] text-[#64748b] flex items-center justify-center hover:border-[#6c47ff] hover:text-[#6c47ff] transition-colors"
            >
              <Settings size={15} />
            </Link>
          </div>
        )}
        {/* Share button for other users' profiles */}
        {!isOwnProfile && (
          <div className="mt-3">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`https://cardbattles.app/profile/${username}`);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                } catch {}
              }}
              className="w-full py-2 rounded-xl border border-[#1e1e2e] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              style={shareCopied ? { borderColor: 'rgba(34,197,94,0.4)', color: '#22c55e' } : { color: '#64748b' }}
            >
              {shareCopied ? <><Check size={12} /> Profile link copied!</> : <><Share2 size={12} /> Share Profile</>}
            </button>
          </div>
        )}
        {/* Follow section for other users' profiles */}
        {!isOwnProfile && (
          <div className="mt-4">
            <FollowButton username={username} />
          </div>
        )}
      </div>

      {/* Stats grid */}
      {s && (
        <div>
          <h2 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-3">Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Battles Won"     value={s.battlesWon}      icon={Trophy} color="text-[#f59e0b]" />
            <StatCard label="Battles Created" value={s.battlesCreated}  icon={Sword}  color="text-[#6c47ff]" />
            <StatCard label="Votes Cast"      value={s.votesCast}       icon={Target} color="text-[#3b82f6]" />
            <StatCard label="Current Streak"  value={`${s.currentStreak} 🔥`} icon={Flame} color="text-[#ef4444]" />
            <StatCard label="Best Streak"     value={s.bestStreak}      icon={Zap}    color="text-[#22c55e]" />
            <StatCard label="Daily Wins"      value={s.dailyPickWins ?? 0} icon={Star} color="text-[#a855f7]" />
          </div>
        </div>
      )}

      {/* Badges */}
      <div>
        <h2 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-3">
          Badges {earnedBadges.length > 0 && <span className="text-[#6c47ff]">· {earnedBadges.length}/{BADGE_DEFS.length}</span>}
        </h2>

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {earnedBadges.map((badge, idx) => {
              const isNew = idx < 2 && earnedBadges.length > 0; // first 2 earned badges get "NEW" if recently earned
              return (
                <div
                  key={badge.id}
                  className={`border rounded-xl p-3 flex items-center gap-3 relative overflow-hidden ${badge.color}`}
                  style={{ boxShadow: '0 0 12px rgba(108,71,255,0.1)' }}
                >
                  {isNew && idx === 0 && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-black bg-[#6c47ff] text-white px-1 py-0.5 rounded uppercase tracking-wide">
                      NEW
                    </span>
                  )}
                  <span className="text-2xl leading-none flex-shrink-0">{badge.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{badge.label}</p>
                    <p className="text-[10px] text-[#94a3b8]">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {earnedBadges.length === 0 && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 text-center mb-3">
            <p className="text-2xl mb-2">🏅</p>
            <p className="text-sm text-[#64748b]">No badges earned yet — keep battling!</p>
          </div>
        )}

        {/* Locked badges */}
        {lockedBadges.length > 0 && (
          <div>
            <p className="text-xs text-[#374151] mb-2 font-semibold">Locked ({lockedBadges.length})</p>
            <div className="grid grid-cols-2 gap-2">
              {lockedBadges.map((badge) => {
                // Compute "X more to go" hint
                let hint = '';
                if (s) {
                  if (badge.id === 'warrior') hint = `${10 - s.battlesWon} more wins`;
                  else if (badge.id === 'champion') hint = `${25 - s.battlesWon} more wins`;
                  else if (badge.id === 'legend') hint = `${50 - s.battlesWon} more wins`;
                  else if (badge.id === 'goat') hint = `${100 - s.battlesWon} more wins`;
                  else if (badge.id === 'voter') hint = `${10 - s.votesCast} more votes`;
                  else if (badge.id === 'centurion') hint = `${100 - s.votesCast} more votes`;
                  else if (badge.id === 'oracle') hint = `${500 - s.votesCast} more votes`;
                  else if (badge.id === 'hot_streak') hint = `${5 - s.bestStreak} more streak`;
                  else if (badge.id === 'on_fire') hint = `${10 - s.bestStreak} more streak`;
                  else if (badge.id === 'creator') hint = `${5 - s.battlesCreated} more battles`;
                  else if (badge.id === 'battle_hardened') hint = `${20 - s.battlesCreated} more battles`;
                  else if (badge.id === 'daily_grinder') hint = `${30 - (s.dailyPickWins || 0) - (s.dailyPickLosses || 0)} more entries`;
                  else if (badge.id === 'picker') hint = `${10 - (s.dailyPickWins || 0)} more wins`;
                  else if (badge.id === 'pro') hint = 'Upgrade to Pro';
                }
                return (
                  <div
                    key={badge.id}
                    className="border border-[#1e1e2e] bg-[#12121a] rounded-xl p-3 flex items-center gap-2.5 opacity-50 grayscale"
                  >
                    <span className="text-xl leading-none flex-shrink-0 relative">
                      {badge.icon}
                      <span className="absolute -bottom-0.5 -right-0.5 text-[8px]">🔒</span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#64748b] truncate">{badge.label}</p>
                      {hint && <p className="text-[9px] text-[#374151] truncate">{hint}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent battles */}
      {userBattles.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-3">
            Recent Battles <span className="text-[#6c47ff]">· {userBattles.length}</span>
          </h2>
          <div className="space-y-2">
            {userBattles.map(b => (
              <UserBattleCard key={b.id} battle={b} />
            ))}
          </div>
        </div>
      )}

      {/* My Content: Collection + Watchlist (own profile only) */}
      {isOwnProfile && (
        <div>
          <h2 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-3">My Content</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/collection"
              className="bg-[#12121a] rounded-xl border border-[#1e1e2e] p-4 flex flex-col gap-2 hover:border-[#6c47ff]/30 transition-colors"
            >
              <BookMarked size={20} className="text-[#6c47ff]" />
              <p className="text-sm font-bold text-white">Collection</p>
              <p className="text-[10px] text-[#64748b]">Your saved cards</p>
            </Link>
            <Link
              href="/watchlist"
              className="bg-[#12121a] rounded-xl border border-[#1e1e2e] p-4 flex flex-col gap-2 hover:border-[#6c47ff]/30 transition-colors"
            >
              <Eye size={20} className="text-[#6c47ff]" />
              <p className="text-sm font-bold text-white">Watchlist</p>
              <p className="text-[10px] text-[#64748b]">Battles you&apos;re watching</p>
            </Link>
          </div>
          {/* Vote history link */}
          <Link
            href="/history"
            className="mt-3 flex items-center gap-3 bg-[#12121a] rounded-xl border border-[#1e1e2e] p-4 hover:border-[#6c47ff]/30 transition-colors"
          >
            <History size={20} className="text-[#6c47ff]" />
            <div>
              <p className="text-sm font-bold text-white">Vote History</p>
              <p className="text-[10px] text-[#64748b]">All battles you&apos;ve voted on</p>
            </div>
            <svg className="ml-auto w-4 h-4 text-[#374151]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <EditBioModal
          currentBio={user.bio ?? ''}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
