'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Flag, Users, Sword, BarChart2, Trash2, Ban,
  CheckCircle, Lock, RefreshCw, UserCheck, Zap, Activity,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getToken } from '../../../lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

async function adminFetch(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken() ?? ''}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, bgColor, subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-[#0d0d14] rounded-2xl border border-[#1e1e2e] p-5 flex flex-col gap-3 hover:border-[#2a2a3e] transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-[#475569] uppercase tracking-widest">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgColor}`}>
          <Icon size={15} className={color} />
        </div>
      </div>
      <div>
        <p className="text-4xl font-black text-white tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {subtitle && <p className="text-xs text-[#475569] mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    live:      'bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30',
    active:    'bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30',
    suspended: 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30',
    removed:   'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30',
    ended:     'bg-[#475569]/15 text-[#475569] border-[#475569]/30',
    none:      'bg-[#475569]/15 text-[#475569] border-[#475569]/30',
  };
  const cls = map[status] ?? 'bg-[#475569]/15 text-[#475569] border-[#475569]/30';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${cls}`}>
      {status.toUpperCase()}
    </span>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminFetch('/admin/stats'),
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#64748b]">Platform Overview</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-white transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[#0d0d14] rounded-2xl border border-[#1e1e2e] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Users"
            value={data?.totalUsers ?? 0}
            icon={Users}
            color="text-[#3b82f6]"
            bgColor="bg-[#3b82f6]/15"
            subtitle="Registered accounts"
          />
          <StatCard
            label="Total Battles"
            value={data?.totalBattles ?? 0}
            icon={Sword}
            color="text-[#6c47ff]"
            bgColor="bg-[#6c47ff]/15"
            subtitle="All time"
          />
          <StatCard
            label="Total Votes"
            value={data?.totalVotes ?? 0}
            icon={BarChart2}
            color="text-[#22c55e]"
            bgColor="bg-[#22c55e]/15"
            subtitle="Community engagement"
          />
          <StatCard
            label="Active Now"
            value={data?.activeNow ?? '—'}
            icon={Activity}
            color="text-[#f59e0b]"
            bgColor="bg-[#f59e0b]/15"
            subtitle="Live users (estimated)"
          />
        </div>
      )}

      {/* Quick info panel */}
      <div className="bg-[#0d0d14] border border-[#1e1e2e] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#6c47ff]" />
          <p className="text-sm font-bold text-white">Operations Dashboard</p>
        </div>
        <div className="space-y-2 text-xs text-[#475569]">
          <p>• Use the <span className="text-[#94a3b8]">Battles</span> tab to remove harmful content</p>
          <p>• Use the <span className="text-[#94a3b8]">Users</span> tab to suspend bad actors</p>
          <p>• Use the <span className="text-[#94a3b8]">Reports</span> tab to review flagged content</p>
          <p>• Stats refresh every 30 seconds automatically</p>
        </div>
        <div className="pt-1 border-t border-[#1e1e2e]">
          <p className="text-[11px] text-[#374151]">
            Demo mode — in-memory DB resets on server restart. All actions are live within this session.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Reports Tab ────────────────────────────────────────────────────────────────
function ReportsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminFetch('/admin/reports').catch(() => ({ items: [] })),
  });

  const removeBattle = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/battles/${id}`, 'DELETE'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['admin-battles'] });
    },
  });

  const suspendUser = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/users/${id}/suspend`, 'POST'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const reports: Array<{
    id: string;
    reason: string;
    targetType: string;
    targetId: string;
    reporterUserId: string;
    createdAt: string;
  }> = data?.items ?? [];

  if (isLoading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-[#0d0d14] rounded-2xl border border-[#1e1e2e] animate-pulse" />
      ))}
    </div>
  );

  if (!reports.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-5xl">🎉</div>
        <p className="text-lg font-bold text-white">No open reports</p>
        <p className="text-sm text-[#475569]">The community is behaving. All clear!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#64748b]">{reports.length} open report{reports.length !== 1 ? 's' : ''}</p>
      </div>
      {reports.map((r) => (
        <div key={r.id} className="bg-[#0d0d14] border border-[#ef4444]/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Flag size={12} className="text-[#ef4444]" />
                <p className="text-sm font-bold text-white capitalize">{r.targetType} Report</p>
                <StatusBadge status="live" />
              </div>
              <p className="text-sm text-[#94a3b8]">{r.reason}</p>
              <p className="text-xs text-[#475569] mt-1 font-mono">Target: {r.targetId}</p>
            </div>
            <span className="text-xs text-[#374151] whitespace-nowrap shrink-0">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2 pt-1 border-t border-[#1e1e2e]">
            {r.targetType === 'battle' && (
              <button
                onClick={() => removeBattle.mutate(r.targetId)}
                disabled={removeBattle.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-xs font-semibold disabled:opacity-50 hover:bg-[#ef4444]/20 transition-colors"
              >
                <Trash2 size={12} /> Remove Battle
              </button>
            )}
            {r.reporterUserId && (
              <button
                onClick={() => suspendUser.mutate(r.reporterUserId)}
                disabled={suspendUser.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#374151]/20 border border-[#374151]/40 text-[#64748b] text-xs font-semibold disabled:opacity-50 hover:bg-[#374151]/30 transition-colors"
              >
                <Ban size={12} /> Suspend Reporter
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Battles Tab ────────────────────────────────────────────────────────────────
interface AdminBattle {
  id: string;
  title: string;
  status: string;
  creator: string;
  total_votes_cached: number;
  created_at: string;
  ends_at: string;
}

function BattlesTab() {
  const qc = useQueryClient();
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['admin-battles'],
    queryFn: () => adminFetch('/admin/battles'),
  });

  const removeBattle = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/battles/${id}`, 'DELETE'),
    onSuccess: (_data, id) => {
      setRemoved(prev => new Set([...prev, id]));
      qc.invalidateQueries({ queryKey: ['admin-battles'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const battles: AdminBattle[] = data?.items ?? [];

  if (isLoading) return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-20 bg-[#0d0d14] rounded-2xl border border-[#1e1e2e] animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#64748b]">{battles.length} battles</p>
        <p className="text-xs text-[#374151]">Most recent first</p>
      </div>

      {/* Table header */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_80px_90px_80px] gap-3 px-4 py-2">
        <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest">Title</p>
        <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest text-right">Votes</p>
        <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest text-center">Status</p>
        <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest text-center">Creator</p>
        <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest text-right">Action</p>
      </div>

      {battles.length === 0 && (
        <div className="text-center py-12 text-[#475569]">No battles found</div>
      )}

      {battles.map((b) => {
        const isRemoved = removed.has(b.id) || b.status === 'removed';
        return (
          <div
            key={b.id}
            className={`bg-[#0d0d14] border rounded-2xl p-4 transition-all ${
              isRemoved ? 'border-[#ef4444]/20 opacity-50' : 'border-[#1e1e2e] hover:border-[#2a2a3e]'
            }`}
          >
            {/* Mobile layout */}
            <div className="sm:hidden space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white leading-tight flex-1">{b.title}</p>
                <StatusBadge status={isRemoved ? 'removed' : b.status} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#475569] space-x-2">
                  <span>by <span className="text-[#94a3b8]">{b.creator ?? 'unknown'}</span></span>
                  <span>·</span>
                  <span className="text-[#94a3b8]">{(b.total_votes_cached ?? 0).toLocaleString()} votes</span>
                </div>
                {!isRemoved && b.status === 'live' && (
                  <button
                    onClick={() => removeBattle.mutate(b.id)}
                    disabled={removeBattle.isPending}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-xs font-semibold disabled:opacity-50 hover:bg-[#ef4444]/20 transition-colors"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                )}
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px_90px_80px] gap-3 items-center">
              <div>
                <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                <p className="text-xs text-[#374151] mt-0.5">
                  {new Date(b.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm font-bold text-[#94a3b8] text-right tabular-nums">
                {(b.total_votes_cached ?? 0).toLocaleString()}
              </p>
              <div className="flex justify-center">
                <StatusBadge status={isRemoved ? 'removed' : b.status} />
              </div>
              <p className="text-xs text-[#64748b] text-center truncate">{b.creator ?? '—'}</p>
              <div className="flex justify-end">
                {!isRemoved && b.status === 'live' && (
                  <button
                    onClick={() => removeBattle.mutate(b.id)}
                    disabled={removeBattle.isPending}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-xs font-semibold disabled:opacity-50 hover:bg-[#ef4444]/20 transition-colors"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_mod: boolean;
  status: string;
  pro_status: string;
  created_at: string;
}

function UsersTab() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminFetch('/admin/users'),
  });

  const suspendUser = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/users/${id}/suspend`, 'POST'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const unsuspendUser = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/users/${id}/unsuspend`, 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const makeAdmin = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/users/${id}/make-admin`, 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  // Support both API shapes: { users: [] } and { items: [] }
  const users: AdminUser[] = data?.users ?? data?.items ?? [];

  if (isLoading) return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-20 bg-[#0d0d14] rounded-2xl border border-[#1e1e2e] animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#64748b]">{users.length} users</p>
        <p className="text-xs text-[#374151]">Most recent first</p>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-[#475569]">No users found</div>
      )}

      {users.map((u) => {
        const isSuspended = u.status === 'suspended';
        return (
          <div
            key={u.id}
            className={`bg-[#0d0d14] border rounded-2xl p-4 transition-all ${
              isSuspended ? 'border-[#ef4444]/20 opacity-70' : 'border-[#1e1e2e] hover:border-[#2a2a3e]'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar placeholder */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c47ff] to-[#3b82f6] flex items-center justify-center text-white text-sm font-black shrink-0">
                {u.username[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-bold text-white">{u.username}</p>
                  {u.is_admin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 font-bold">
                      ADMIN
                    </span>
                  )}
                  {u.is_mod && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 font-bold">
                      MOD
                    </span>
                  )}
                  {u.pro_status && u.pro_status !== 'none' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#6c47ff]/15 text-[#6c47ff] border border-[#6c47ff]/30 font-bold">
                      PRO
                    </span>
                  )}
                  <StatusBadge status={u.status ?? 'active'} />
                </div>
                <p className="text-xs text-[#475569]">{u.email}</p>
                <p className="text-xs text-[#374151] mt-0.5">
                  Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-1.5 shrink-0">
                {isSuspended ? (
                  <button
                    onClick={() => unsuspendUser.mutate(u.id)}
                    disabled={unsuspendUser.isPending}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-semibold disabled:opacity-50 hover:bg-[#22c55e]/20 transition-colors"
                  >
                    <CheckCircle size={11} /> Restore
                  </button>
                ) : (
                  !u.is_admin && (
                    <button
                      onClick={() => suspendUser.mutate(u.id)}
                      disabled={suspendUser.isPending}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-xs font-semibold disabled:opacity-50 hover:bg-[#ef4444]/20 transition-colors"
                    >
                      <Ban size={11} /> Suspend
                    </button>
                  )
                )}
                {!u.is_admin && !isSuspended && (
                  <button
                    onClick={() => {
                      if (confirm(`Promote ${u.username} to admin?`)) makeAdmin.mutate(u.id);
                    }}
                    disabled={makeAdmin.isPending}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#6c47ff]/10 border border-[#6c47ff]/30 text-[#6c47ff] text-xs font-semibold disabled:opacity-50 hover:bg-[#6c47ff]/20 transition-colors"
                  >
                    <UserCheck size={11} /> Promote
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────────────
type AdminTab = 'overview' | 'reports' | 'battles' | 'users';

const TABS: { id: AdminTab; label: string; icon: React.ElementType; emoji: string }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2, emoji: '📊' },
  { id: 'reports',  label: 'Reports',  icon: Flag,     emoji: '🚩' },
  { id: 'battles',  label: 'Battles',  icon: Sword,    emoji: '⚔️' },
  { id: 'users',    label: 'Users',    icon: Users,    emoji: '👥' },
];

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>('overview');

  // Redirect if not logged in
  if (!user) {
    router.push('/login');
    return null;
  }

  // Access denied if not admin
  if (!user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-[#ef4444]/15 flex items-center justify-center">
          <Lock size={28} className="text-[#ef4444]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-[#64748b] text-sm max-w-xs">
            This area is restricted to administrators only.
            You need admin privileges to view this page.
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded-xl bg-[#6c47ff]/20 border border-[#6c47ff]/30 text-[#6c47ff] text-sm font-semibold hover:bg-[#6c47ff]/30 transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <div className="w-10 h-10 rounded-xl bg-[#ef4444]/15 flex items-center justify-center">
          <Shield size={20} className="text-[#ef4444]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Admin Dashboard</h1>
          <p className="text-xs text-[#475569]">
            Logged in as <span className="text-[#ef4444] font-bold">{user.username}</span> · Full access
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-xs text-[#22c55e] font-semibold">LIVE</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d0d14] p-1 rounded-2xl border border-[#1e1e2e]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-[#ef4444]/20 text-[#ef4444] shadow-sm'
                  : 'text-[#475569] hover:text-[#94a3b8] hover:bg-[#1e1e2e]/