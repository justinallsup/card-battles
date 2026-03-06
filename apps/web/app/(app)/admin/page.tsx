'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Flag, Users, Sword, BarChart2, Trash2, Ban, CheckCircle, Zap } from 'lucide-react';
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
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

// ── Stats card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-[#12121a] rounded-xl border border-[#1e1e2e] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">{label}</p>
        <Icon size={16} className={color} />
      </div>
      <p className="text-3xl font-black text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

// ── Overview tab ───────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminFetch('/admin/stats'),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Users"    value={data?.totalUsers ?? 0}    icon={Users}    color="text-[#3b82f6]" />
        <StatCard label="Total Battles"  value={data?.totalBattles ?? 0}  icon={Sword}    color="text-[#6c47ff]" />
        <StatCard label="Total Votes"    value={data?.totalVotes ?? 0}    icon={BarChart2} color="text-[#22c55e]" />
        <StatCard label="Active Battles" value={data?.activeBattles ?? 0} icon={CheckCircle} color="text-[#f59e0b]" />
      </div>
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
        <p className="text-sm font-bold text-white mb-1">Demo Mode</p>
        <p className="text-xs text-[#64748b]">This admin panel runs in demo mode. All actions take effect on the in-memory database and reset on server restart.</p>
      </div>
    </div>
  );
}

// ── Reports tab ────────────────────────────────────────────────────────────────
function ReportsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminFetch('/admin/reports').catch(() => ({ items: [] })),
  });

  const removeBattle = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/battles/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  const suspendUser = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/users/${id}/suspend`, 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  const reports = data?.items ?? [];

  if (isLoading) return <div className="text-[#64748b] text-sm py-8 text-center">Loading reports...</div>;

  if (!reports.length) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl mb-3">🎉</p>
        <p className="text-[#64748b] font-semibold">No open reports</p>
        <p className="text-xs text-[#374151] mt-1">All clear!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r: { id: string; reason: string; targetType: string; targetId: string; reporterUserId: string; createdAt: string }) => (
        <div key={r.id} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flag size={12} className="text-[#ef4444]" />
                <p className="text-sm font-bold text-white capitalize">{r.targetType} Report</p>
              </div>
              <p className="text-xs text-[#64748b] mt-1">{r.reason}</p>
              <p className="text-xs text-[#374151] mt-0.5">Target: {r.targetId}</p>
            </div>
            <span className="text-xs text-[#374151] whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2">
            {r.targetType === 'battle' && (
              <button
                onClick={() => removeBattle.mutate(r.targetId)}
                disabled={removeBattle.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-xs font-semibold disabled:opacity-50"
              >
                <Trash2 size={12} /> Remove Battle
              </button>
            )}
            {r.reporterUserId && (
              <button
                onClick={() => suspendUser.mutate(r.reporterUserId)}
                disabled={suspendUser.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#374151]/20 border border-[#374151]/40 text-[#64748b] text-xs font-semibold disabled:opacity-50"
              >
                <Ban size={12} /> Suspend User
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Battles tab ────────────────────────────────────────────────────────────────
interface AdminBattle {
  id: string;
  title: string;
  status: string;
  creator: string;
  total_votes_cached: number;
  created_at: string;
}

function BattlesTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-battles'],
    queryFn: () => adminFetch('/admin/battles'),
  });

  const endBattle = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/battles/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-battles'] }),
  });

  const battles: AdminBattle[] = data?.items ?? [];

  if (isLoading) return <div className="text-[#64748b] text-sm py-8 text-center">Loading battles...</div>;

  return (
    <div className="space-y-2">
      {battles.length === 0 && (
        <div className="text-center py-12 text-[#64748b]">No battles found</div>
      )}
      {battles.map((b) => (
        <div key={b.id} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{b.title}</p>
              <p className="text-xs text-[#64748b] mt-0.5">
                by {b.creator ?? 'unknown'} · {(b.total_votes_cached ?? 0).toLocaleString()} votes
              </p>
              <p className="text-xs mt-0.5">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  b.status === 'live' ? 'bg-[#22c55e]/15 text-[#22c55e]' :
                  b.status === 'removed' ? 'bg-[#ef4444]/15 text-[#ef4444]' :
                  'bg-[#374151]/20 text-[#64748b]'
                }`}>{b.status}</span>
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {b.status === 'live' && (
                <button
                  onClick={() => endBattle.mutate(b.id)}
                  disabled={endBattle.isPending}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-xs font-semibold disabled:opacity-50"
                >
                  <Trash2 size={11} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users: AdminUser[] = data?.items ?? [];

  if (isLoading) return <div className="text-[#64748b] text-sm py-8 text-center">Loading users...</div>;

  return (
    <div className="space-y-2">
      {users.length === 0 && (
        <div className="text-center py-12 text-[#64748b]">No users found</div>
      )}
      {users.map((u) => (
        <div key={u.id} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-white">{u.username}</p>
                {u.is_admin && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/15 text-[#ef4444] font-bold">ADMIN</span>
                )}
                {u.pro_status && u.pro_status !== 'none' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6c47ff]/15 text-[#6c47ff] font-bold">PRO</span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  u.status === 'suspended' ? 'bg-[#ef4444]/15 text-[#ef4444]' : 'bg-[#22c55e]/15 text-[#22c55e]'
                }`}>{u.status ?? 'active'}</span>
              </div>
              <p className="text-xs text-[#374151] mt-0.5">{u.email}</p>
              <p className="text-xs text-[#374151]">
                Joined {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {u.status !== 'suspended' && (
              <button
                onClick={() => suspendUser.mutate(u.id)}
                disabled={suspendUser.isPending}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-xs font-semibold disabled:opacity-50 shrink-0"
              >
                <Ban size={11} /> Suspend
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main admin page ────────────────────────────────────────────────────────────
// ── Bulk Create tab ────────────────────────────────────────────────────────────
interface BulkMatchup {
  leftPlayer: string;
  rightPlayer: string;
}

interface BulkPreviewRow {
  original: string;
  leftPlayer: string;
  rightPlayer: string;
  valid: boolean;
}

interface BulkResult {
  success: boolean;
  battleId?: string;
  title?: string;
  error?: string;
}

function parseBulkInput(text: string): BulkPreviewRow[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const vsParts = line.toLowerCase().split(' vs ');
      if (vsParts.length >= 2) {
        const leftPlayer = vsParts[0].trim();
        const rightPlayer = vsParts.slice(1).join(' vs ').trim();
        return {
          original: line,
          leftPlayer,
          rightPlayer,
          valid: leftPlayer.length > 0 && rightPlayer.length > 0,
        };
      }
      return { original: line, leftPlayer: '', rightPlayer: '', valid: false };
    });
}

function BulkCreateTab() {
  const [inputText, setInputText] = useState(`Patrick Mahomes vs Tom Brady\nLeBron James vs Michael Jordan\nShohei Ohtani vs Mike Trout`);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const preview = parseBulkInput(inputText);
  const validRows = preview.filter(r => r.valid);

  const handleCreateAll = async () => {
    if (!validRows.length) return;
    setIsCreating(true);
    try {
      const matchups: BulkMatchup[] = validRows.map(r => ({
        leftPlayer: r.leftPlayer,
        rightPlayer: r.rightPlayer,
      }));
      const res = await fetch(`${BASE_URL}/admin/bulk-create-battles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken() ?? ''}`,
        },
        body: JSON.stringify({ matchups }),
      });
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      console.error('Bulk create error', err);
    } finally {
      setIsCreating(false);
    }
  };

  const successCount = results?.filter(r => r.success).length ?? 0;
  const failCount = results?.filter(r => !r.success).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
        <p className="text-sm font-bold text-white mb-1">Bulk Battle Creator</p>
        <p className="text-xs text-[#64748b] mb-3">Paste matchups below, one per line using &quot;Player A vs Player B&quot; format.</p>
        <textarea
          value={inputText}
          onChange={e => { setInputText(e.target.value); setResults(null); }}
          rows={6}
          placeholder={'Patrick Mahomes vs Tom Brady\nLeBron James vs Michael Jordan\nShohei Ohtani vs Mike Trout'}
          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-3 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors resize-none font-mono"
        />
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest">Preview</p>
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-0 border-b border-[#1e1e2e] px-3 py-2">
              <span className="text-[10px] font-bold text-[#64748b] uppercase">Left Card</span>
              <span className="text-[10px] font-bold text-[#374151] uppercase px-2">VS</span>
              <span className="text-[10px] font-bold text-[#64748b] uppercase">Right Card</span>
              <span className="text-[10px] font-bold text-[#64748b] uppercase px-2">Status</span>
            </div>
            {preview.map((row, i) => (
              <div key={i} className={`grid grid-cols-[1fr_auto_1fr_auto] gap-0 px-3 py-2 border-b border-[#1e1e2e]/60 last:border-0 ${!row.valid ? 'opacity-40' : ''}`}>
                <span className="text-xs text-white capitalize truncate">{row.leftPlayer || '—'}</span>
                <span className="text-[10px] text-[#374151] px-2 self-center">⚔️</span>
                <span className="text-xs text-white capitalize truncate">{row.rightPlayer || '—'}</span>
                <span className={`text-sm px-2 self-center ${row.valid ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {row.valid ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#64748b]">{validRows.length} valid matchup{validRows.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Create button */}
      <button
        onClick={handleCreateAll}
        disabled={validRows.length === 0 || isCreating}
        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          boxShadow: validRows.length > 0 ? '0 0 15px rgba(239,68,68,0.3)' : 'none',
        }}
      >
        <Zap size={15} />
        {isCreating ? 'Creating...' : `Create All (${validRows.length})`}
      </button>

      {/* Results summary */}
      {results && (
        <div className="space-y-2">
          <div className={`p-4 rounded-xl border ${successCount > 0 ? 'bg-[#22c55e]/10 border-[#22c55e]/30' : 'bg-[#ef4444]/10 border-[#ef4444]/30'}`}>
            <p className="text-sm font-bold text-white mb-1">
              ✅ {successCount} created · ❌ {failCount} failed
            </p>
          </div>
          <div className="space-y-1">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${r.success ? 'bg-[#22c55e]/5 border border-[#22c55e]/20' : 'bg-[#ef4444]/5 border border-[#ef4444]/20'}`}>
                <span>{r.success ? '✓' : '✗'}</span>
                <span className="text-white flex-1 truncate">{r.success ? r.title : r.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type AdminTab = 'overview' | 'reports' | 'battles' | 'users' | 'bulk';

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'reports',  label: 'Reports',  icon: Flag },
  { id: 'battles',  label: 'Battles',  icon: Sword },
  { id: 'users',    label: 'Users',    icon: Users },
  { id: 'bulk',     label: 'Bulk',     icon: Zap },
];

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>('overview');

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#ef4444]/15 flex items-center justify-center">
          <Shield size={18} className="text-[#ef4444]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Admin Panel</h1>
          <p className="text-xs text-[#64748b]">Manage content, users, and battles</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#12121a] p-1 rounded-xl border border-[#1e1e2e] overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all flex-1 ${
                tab === t.id
                  ? 'bg-[#ef4444]/20 text-[#ef4444]'
                  : 'text-[#64748b] hover:text-[#94a3b8]'
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab />}
      {tab === 'reports'  && <ReportsTab />}
      {tab === 'battles'  && <BattlesTab />}
      {tab === 'users'    && <UsersTab />}
      {tab === 'bulk'     && <BulkCreateTab />}
    </div>
  );
}
