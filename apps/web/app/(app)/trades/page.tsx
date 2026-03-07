'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';
import { BackButton } from '../../../components/ui/BackButton';
import { X, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface TradeProposal {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  offeredCardIds: string[];
  requestedCardIds: string[];
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
}

function StatusBadge({ status }: { status: TradeProposal['status'] }) {
  const map = {
    pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <Clock size={12} />, label: 'Pending' },
    accepted:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: <CheckCircle size={12} />, label: 'Accepted' },
    declined:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <XCircle size={12} />, label: 'Declined' },
    cancelled: { color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: <X size={12} />, label: 'Cancelled' },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ color: s.color, background: s.bg }}
    >
      {s.icon} {s.label}
    </span>
  );
}

function CardThumbnailGrid({ cardIds, label }: { cardIds: string[]; label: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">{label}</p>
      <div className="flex gap-1 flex-wrap">
        {cardIds.map((id, i) => (
          <div
            key={i}
            className="w-10 h-14 rounded-lg border border-[#1e1e2e] bg-[#1e1e2e] flex items-center justify-center"
            title={`Card ${id.slice(0,8)}`}
          >
            <span className="text-[8px] text-[#64748b] font-mono">{id.slice(0,4)}</span>
          </div>
        ))}
        {cardIds.length === 0 && (
          <span className="text-xs text-[#64748b] italic">none</span>
        )}
      </div>
    </div>
  );
}

function TradeCard({
  trade,
  myId,
  onUpdate,
}: {
  trade: TradeProposal;
  myId: string;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const isIncoming = trade.toUserId === myId;

  const respond = async (status: 'accepted' | 'declined' | 'cancelled') => {
    setLoading(true);
    try {
      await fetch(`${BASE}/trades/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status }),
      });
      onUpdate();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border border-[#1e1e2e] p-4 space-y-3"
      style={{ background: '#12121a' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-white">
            {isIncoming ? `From @${trade.fromUsername}` : `To @${trade.toUsername}`}
          </p>
          <p className="text-xs text-[#64748b]">
            {new Date(trade.createdAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={trade.status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CardThumbnailGrid
          cardIds={trade.offeredCardIds}
          label={isIncoming ? 'They offer' : 'You offer'}
        />
        <CardThumbnailGrid
          cardIds={trade.requestedCardIds}
          label={isIncoming ? 'They want' : 'You want'}
        />
      </div>

      {trade.message && (
        <p className="text-xs text-[#94a3b8] bg-[#0a0a0f] rounded-xl px-3 py-2 border border-[#1e1e2e] italic">
          &ldquo;{trade.message}&rdquo;
        </p>
      )}

      {isIncoming && trade.status === 'pending' && (
        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={() => respond('accepted')}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            ✓ Accept
          </button>
          <button
            disabled={loading}
            onClick={() => respond('declined')}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            ✗ Decline
          </button>
        </div>
      )}
      {!isIncoming && trade.status === 'pending' && (
        <button
          disabled={loading}
          onClick={() => respond('cancelled')}
          className="w-full py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' }}
        >
          Cancel Trade
        </button>
      )}
    </div>
  );
}

function ProposeModal({
  myId,
  onClose,
  onProposed,
}: {
  myId: string;
  onClose: () => void;
  onProposed: () => void;
}) {
  const [toUserId, setToUserId] = useState('');
  const [offeredIds, setOfferedIds] = useState('');
  const [requestedIds, setRequestedIds] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const offeredCardIds = offeredIds.split(',').map(s => s.trim()).filter(Boolean);
    const requestedCardIds = requestedIds.split(',').map(s => s.trim()).filter(Boolean);
    if (!toUserId || !offeredCardIds.length || !requestedCardIds.length) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await fetch(`${BASE}/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ toUserId, offeredCardIds, requestedCardIds, message }),
      });
      onProposed();
      onClose();
    } catch {
      setError('Failed to propose trade.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-[#1e1e2e] overflow-hidden"
        style={{ background: '#12121a' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <RefreshCw size={16} className="text-[#6c47ff]" /> Propose a Trade
          </h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div
            className="rounded-xl px-3 py-2 text-xs text-[#f59e0b] border"
            style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}
          >
            🎮 Trades are simulated in demo mode
          </div>

          <div>
            <label className="text-xs font-bold text-[#94a3b8] mb-1 block">Recipient User ID *</label>
            <input
              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#6c47ff] transition-colors"
              placeholder="User ID to trade with"
              value={toUserId}
              onChange={e => setToUserId(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#94a3b8] mb-1 block">Card IDs you&apos;re offering (comma-separated) *</label>
            <input
              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#6c47ff] transition-colors"
              placeholder="card-id-1, card-id-2"
              value={offeredIds}
              onChange={e => setOfferedIds(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#94a3b8] mb-1 block">Card IDs you want (comma-separated) *</label>
            <input
              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#6c47ff] transition-colors"
              placeholder="card-id-3, card-id-4"
              value={requestedIds}
              onChange={e => setRequestedIds(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#94a3b8] mb-1 block">Message (optional)</label>
            <textarea
              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#6c47ff] transition-colors resize-none"
              placeholder="Add a message..."
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
          >
            {loading ? 'Sending…' : '🔄 Send Trade Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TradesPage() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeProposal[]>([]);
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchTrades = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/trades`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json() as { trades: TradeProposal[] };
      setTrades(data.trades || []);
    } catch {
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { document.title = 'Trades | Card Battles'; }, []);
  useEffect(() => { fetchTrades(); }, [user]);

  const myId = user?.id || '';
  const incoming = trades.filter(t => t.toUserId === myId);
  const outgoing = trades.filter(t => t.fromUserId === myId);
  const displayed = tab === 'incoming' ? incoming : outgoing;

  return (
    <div className="space-y-4 pb-8">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">🔄 Trade Proposals</h1>
          <p className="text-sm text-[#64748b] mt-1">Trade cards with other collectors</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
        >
          + Propose
        </button>
      </div>

      <div
        className="rounded-xl px-3 py-2 text-xs text-[#f59e0b] border"
        style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}
      >
        🎮 Trades are simulated in demo mode
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
        <button
          onClick={() => setTab('incoming')}
          className="flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={tab === 'incoming'
            ? { background: 'rgba(108,71,255,0.15)', color: '#a78bfa', borderBottom: '2px solid #6c47ff' }
            : { color: '#64748b' }
          }
        >
          📥 Incoming
          {incoming.filter(t => t.status === 'pending').length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black" style={{ background: '#ef4444', color: '#fff' }}>
              {incoming.filter(t => t.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('outgoing')}
          className="flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={tab === 'outgoing'
            ? { background: 'rgba(108,71,255,0.15)', color: '#a78bfa', borderBottom: '2px solid #6c47ff' }
            : { color: '#64748b' }
          }
        >
          📤 Outgoing
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-36 rounded-2xl bg-[#12121a] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <span className="text-4xl">🔄</span>
          <p className="text-white font-bold">No {tab} trades</p>
          <p className="text-[#64748b] text-sm">
            {tab === 'incoming' ? 'No one has sent you a trade yet.' : 'You haven\'t proposed any trades.'}
          </p>
          {tab === 'outgoing' && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
            >
              Propose a Trade
            </button>
          )}
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="space-y-3">
          {displayed.map(trade => (
            <TradeCard key={trade.id} trade={trade} myId={myId} onUpdate={fetchTrades} />
          ))}
        </div>
      )}

      {showModal && (
        <ProposeModal
          myId={myId}
          onClose={() => setShowModal(false)}
          onProposed={fetchTrades}
        />
      )}
    </div>
  );
}
