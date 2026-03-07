'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BackButton } from '../../../components/ui/BackButton';
import { getToken } from '../../../lib/api';
import { showToast } from '../../../components/ui/Toast';
import { PageSpinner } from '../../../components/ui/LoadingSpinner';
import { Swords, Check, X } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface Challenge {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  battleId: string;
  battleTitle: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

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

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending:  { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: '⏳ Pending' },
  accepted: { bg: 'rgba(34,197,94,0.12)',  text: '#22c55e', border: 'rgba(34,197,94,0.3)',  label: '✅ Accepted' },
  declined: { bg: 'rgba(100,116,139,0.1)', text: '#94a3b8', border: 'rgba(100,116,139,0.2)', label: '❌ Declined' },
};

export default function ChallengesPage() {
  const [incoming, setIncoming] = useState<Challenge[]>([]);
  const [outgoing, setOutgoing] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  const token = getToken();

  const load = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/me/challenges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { incoming: Challenge[]; outgoing: Challenge[] };
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = async (challengeId: string, status: 'accepted' | 'declined') => {
    if (!token) return;
    setActionLoading(challengeId);
    try {
      const res = await fetch(`${BASE_URL}/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showToast(status === 'accepted' ? '✅ Challenge accepted!' : 'Challenge declined', status === 'accepted' ? 'success' : 'info');
        await load();
      }
    } catch {}
    setActionLoading(null);
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="text-5xl">⚔️</div>
        <p className="text-white font-bold">Log in to see your challenges</p>
        <Link href="/login" className="px-5 py-2.5 bg-[#6c47ff] text-white text-sm font-bold rounded-xl">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackButton href="/feed" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ef4444] to-[#dc2626] flex items-center justify-center">
          <Swords size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Friend Challenges</h1>
          <p className="text-xs text-[#64748b]">Battle invitations from your crew</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
        {(['incoming', 'outgoing'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 text-sm font-bold transition-all"
            style={activeTab === tab
              ? { background: 'rgba(108,71,255,0.15)', color: '#a78bfa', borderBottom: '2px solid #6c47ff' }
              : { color: '#64748b' }
            }
          >
            {tab === 'incoming' ? `📥 Incoming${incoming.length > 0 ? ` (${incoming.length})` : ''}` : '📤 Outgoing'}
          </button>
        ))}
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <>
          {activeTab === 'incoming' && (
            <div className="space-y-3">
              {incoming.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="text-4xl">📭</div>
                  <p className="text-white font-bold">No incoming challenges</p>
                  <p className="text-[#64748b] text-sm">When friends challenge you, they&apos;ll appear here</p>
                </div>
              ) : (
                incoming.map(ch => (
                  <div
                    key={ch.id}
                    className="rounded-2xl border border-[#1e1e2e] p-4 space-y-3"
                    style={{ background: '#12121a' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#64748b] mb-0.5">From</p>
                        <p className="text-sm font-bold text-[#a78bfa]">@{ch.fromUsername}</p>
                      </div>
                      <span className="text-[10px] text-[#374151]">{formatTimeAgo(ch.createdAt)}</span>
                    </div>

                    <div
                      className="rounded-xl px-3 py-2 text-xs"
                      style={{ background: '#0a0a0f', border: '1px solid #1e1e2e' }}
                    >
                      <span className="text-[#64748b]">Battle: </span>
                      <span className="text-white font-semibold">⚔️ {ch.battleTitle}</span>
                    </div>

                    {ch.message && (
                      <div
                        className="rounded-xl px-3 py-2 text-sm italic"
                        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                      >
                        &ldquo;{ch.message}&rdquo;
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => respond(ch.id, 'accepted')}
                        disabled={actionLoading === ch.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                      >
                        {actionLoading === ch.id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><Check size={14} /> Accept</>
                        )}
                      </button>
                      <button
                        onClick={() => respond(ch.id, 'declined')}
                        disabled={actionLoading === ch.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                        style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' }}
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'outgoing' && (
            <div className="space-y-3">
              {outgoing.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="text-4xl">⚔️</div>
                  <p className="text-white font-bold">No challenges sent yet</p>
                  <p className="text-[#64748b] text-sm">Challenge friends from any battle page!</p>
                  <Link href="/feed" className="inline-block mt-2 px-5 py-2.5 bg-[#6c47ff] text-white text-sm font-bold rounded-xl">
                    Browse Battles
                  </Link>
                </div>
              ) : (
                outgoing.map(ch => {
                  const statusStyle = STATUS_STYLE[ch.status];
                  return (
                    <div
                      key={ch.id}
                      className="rounded-2xl border border-[#1e1e2e] p-4 space-y-3"
                      style={{ background: '#12121a' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#64748b] mb-0.5">Challenged</p>
                          <p className="text-sm font-bold text-[#a78bfa]">@{ch.toUsername}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}
                          >
                            {statusStyle.label}
                          </span>
                          <span className="text-[10px] text-[#374151]">{formatTimeAgo(ch.createdAt)}</span>
                        </div>
                      </div>

                      <div
                        className="rounded-xl px-3 py-2 text-xs"
                        style={{ background: '#0a0a0f', border: '1px solid #1e1e2e' }}
                      >
                        <span className="text-[#64748b]">Battle: </span>
                        <span className="text-white font-semibold">⚔️ {ch.battleTitle}</span>
                      </div>

                      {ch.message && (
                        <p className="text-xs text-[#64748b] italic">&ldquo;{ch.message}&rdquo;</p>
                      )}

                      {ch.status === 'accepted' && (
                        <Link
                          href={`/battles/${ch.battleId}`}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                          style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.3)' }}
                        >
                          ⚔️ Go Vote Together →
                        </Link>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
