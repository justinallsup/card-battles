'use client';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { users as usersApi } from '../../../../lib/api';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { Badge } from '../../../../components/ui/Badge';
import { Trophy, Sword, Target, Flame, Star, Crown, Zap, Edit2, X, Check, Swords } from 'lucide-react';
import type { UserStats } from '@card-battles/types';
import { useAuth } from '../../../../hooks/useAuth';

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

const BADGE_DEFS = [
  { id: 'first_blood',     label: 'First Blood',      icon: '⚔️', desc: 'Won first battle',       color: 'border-red-500/40 bg-red-500/10',    threshold: (s: Stats) => s.battlesWon >= 1 },
  { id: 'hot_streak',      label: 'Hot Streak',        icon: '🔥', desc: '5+ win streak',           color: 'border-orange-500/40 bg-orange-500/10', threshold: (s: Stats) => s.bestStreak >= 5 },
  { id: 'centurion',       label: 'Centurion',          icon: '💯', desc: '100+ votes cast',         color: 'border-blue-500/40 bg-blue-500/10',   threshold: (s: Stats) => s.votesCast >= 100 },
  { id: 'battle_hardened', label: 'Battle Hardened',   icon: '🛡️', desc: '10+ battles created',     color: 'border-purple-500/40 bg-purple-500/10', threshold: (s: Stats) => s.battlesCreated >= 10 },
  { id: 'goat',            label: 'GOAT',               icon: '🐐', desc: '25+ battles won',         color: 'border-yellow-500/40 bg-yellow-500/10', threshold: (s: Stats) => s.battlesWon >= 25 },
  { id: 'daily_grinder',   label: 'Daily Grinder',     icon: '📅', desc: '30+ daily pick entries',  color: 'border-green-500/40 bg-green-500/10',  threshold: (s: Stats) => s.dailyPickWins + s.dailyPickLosses >= 30 },
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

  const earnedBadges = s ? BADGE_DEFS.filter(b => b.threshold(s)) : [];

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
              Member since {new Date((user as { createdAt?: string }).createdAt ?? '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            {user.bio ? (
              <p className="text-sm text-[#94a3b8] mt-2 leading-relaxed">{user.bio}</p>
            ) : isOwnProfile ? (
              <p className="text-sm text-[#374151] italic mt-2">No bio yet — tell the world about your cards!</p>
            ) : null}
          </div>
        </div>
        {isOwnProfile && (
          <button
            onClick={() => setShowEdit(true)}
            className="mt-4 w-full py-2 rounded-xl border border-[#1e1e2e] text-[#64748b] text-sm font-semibold flex items-center justify-center gap-2 hover:border-[#6c47ff] hover:text-[#6c47ff] transition-colors"
          >
            <Edit2 size={13}/> Edit Profile
          </button>
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
          Badges {earnedBadges.length > 0 && <span className="text-[#6c47ff]">· {earnedBadges.length}</span>}
        </h2>
        {earnedBadges.length === 0 ? (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 text-center">
            <p className="text-2xl mb-2">🏅</p>
            <p className="text-sm text-[#64748b]">No badges earned yet — keep battling!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {earnedBadges.map(badge => (
              <div key={badge.id} className={`border rounded-xl p-3 flex items-center gap-3 ${badge.color}`}>
                <span className="text-2xl leading-none">{badge.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white">{badge.label}</p>
                  <p className="text-[10px] text-[#64748b]">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {s && BADGE_DEFS.filter(b => !b.threshold(s)).length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-[#374151] mb-2">Locked badges</p>
            <div className="flex flex-wrap gap-2">
              {BADGE_DEFS.filter(b => !b.threshold(s)).map(badge => (
                <div key={badge.id} className="border border-[#1e1e2e] bg-[#12121a] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 opacity-40">
                  <span className="text-sm">{badge.icon}</span>
                  <span className="text-xs text-[#64748b]">{badge.label}</span>
                </div>
              ))}
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
