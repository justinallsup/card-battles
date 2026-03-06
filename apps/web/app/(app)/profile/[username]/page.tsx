'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { users as usersApi } from '../../../../lib/api';
import { Avatar } from '../../../../components/ui/Avatar';
import { Badge } from '../../../../components/ui/Badge';
import { Swords, Trophy, Flame, TrendingUp } from 'lucide-react';
import { formatNumber } from '../../../../lib/utils';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-[#12121a] rounded-xl border border-[#1e1e2e] p-3 flex flex-col gap-1">
      <Icon size={16} className={color} />
      <p className="text-lg font-black text-white">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <p className="text-xs text-[#64748b]">{label}</p>
    </div>
  );
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['user', username],
    queryFn: () => usersApi.profile(username),
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats', username],
    queryFn: () => usersApi.stats(username),
    enabled: !!user,
  });

  if (loadingUser) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-[#12121a] rounded-2xl border border-[#1e1e2e] animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!user) return <div className="text-center py-16 text-[#64748b]">User not found</div>;

  const record = stats ? `${stats.battlesWon}W — ${stats.battlesLost}L` : '—';

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] p-5 flex items-center gap-4">
        <Avatar username={user.username} avatarUrl={user.avatarUrl} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-white">{user.username}</h1>
            {user.proStatus !== 'none' && <Badge variant="accent">PRO</Badge>}
            {user.isAdmin && <Badge variant="danger">Admin</Badge>}
          </div>
          {user.bio && <p className="text-sm text-[#64748b] mt-1 line-clamp-2">{user.bio}</p>}
          <p className="text-xs text-[#374151] mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Votes Cast" value={stats.votesCast} icon={Swords} color="text-[#6c47ff]" />
          <StatCard label="Battles Created" value={stats.battlesCreated} icon={Swords} color="text-[#6c47ff]" />
          <StatCard label="Record" value={record} icon={Trophy} color="text-[#f59e0b]" />
          <StatCard label="Current Streak" value={`${stats.currentStreak} 🔥`} icon={Flame} color="text-[#ef4444]" />
          <StatCard label="Best Streak" value={stats.bestStreak} icon={TrendingUp} color="text-[#22c55e]" />
          <StatCard label="Pick Wins" value={stats.dailyPickWins} icon={Target} color="text-[#22c55e]" />
        </div>
      )}
    </div>
  );
}

function Target({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
