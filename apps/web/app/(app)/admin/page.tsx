'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Trash2, UserX } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { getToken } from '../../../lib/api';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

async function adminReq(path: string, method = 'GET') {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${getToken() ?? ''}` },
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export default function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'reports' | 'battles'>('reports');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminReq('/admin/reports'),
  });

  const removeBattle = useMutation({
    mutationFn: (id: string) => adminReq(`/admin/battles/${id}/remove`, 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  const suspendUser = useMutation({
    mutationFn: (id: string) => adminReq(`/admin/users/${id}/suspend`, 'POST'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield size={20} className="text-[#ef4444]" />
        <h1 className="text-xl font-black text-white">Admin Panel</h1>
      </div>

      <div className="flex gap-2 bg-[#12121a] p-1 rounded-xl border border-[#1e1e2e]">
        {(['reports'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${tab === t ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'text-[#64748b]'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading && <div className="text-[#64748b] text-sm">Loading reports...</div>}
        {!isLoading && (!reports || reports.length === 0) && (
          <div className="text-center py-12 text-[#64748b]">No open reports 🎉</div>
        )}
        {reports?.map((r: { id: string; reason: string; targetType: string; targetId: string; reporterUserId: string; createdAt: string }) => (
          <div key={r.id} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white capitalize">{r.targetType} Report</p>
                <p className="text-xs text-[#64748b] mt-0.5">{r.reason}</p>
                <p className="text-xs text-[#374151] mt-1">Target: {r.targetId}</p>
              </div>
              <span className="text-xs text-[#374151]">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-2">
              {r.targetType === 'battle' && (
                <Button variant="danger" size="sm" onClick={() => removeBattle.mutate(r.targetId)} loading={removeBattle.isPending}>
                  <Trash2 size={13} /> Remove Battle
                </Button>
              )}
              {r.reporterUserId && (
                <Button variant="ghost" size="sm" className="text-[#ef4444]/60 hover:text-[#ef4444]"
                  onClick={() => suspendUser.mutate(r.reporterUserId ?? '')} loading={suspendUser.isPending}>
                  <UserX size={13} /> Suspend User
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
