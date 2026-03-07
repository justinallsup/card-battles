'use client';
import { useState } from 'react';
import { X, Swords, Send } from 'lucide-react';
import { getToken } from '../../lib/api';
import { showToast } from '../ui/Toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

export function ChallengeFriendButton({
  battleId,
  battleTitle,
}: {
  battleId: string;
  battleTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [toUsername, setToUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const token = getToken();
  if (!token) return null;

  const handleSubmit = async () => {
    if (!toUsername.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUsername: toUsername.trim(), battleId, message: message.trim() }),
      });
      if (res.status === 404) {
        showToast('User not found', 'error');
      } else if (res.ok) {
        showToast(`⚔️ Challenge sent to @${toUsername.trim()}!`, 'success');
        setOpen(false);
        setToUsername('');
        setMessage('');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast((err as { error?: string }).error || 'Failed to send challenge', 'error');
      }
    } catch {
      showToast('Failed to send challenge', 'error');
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex-1"
        style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#f87171',
        }}
      >
        <Swords size={14} />
        Challenge a Friend
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#1e1e2e] overflow-hidden"
            style={{ background: '#12121a', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
              <div className="flex items-center gap-2">
                <Swords size={15} className="text-[#ef4444]" />
                <h3 className="text-sm font-bold text-white">Challenge a Friend</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-[#64748b] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Battle title */}
              <div
                className="rounded-xl px-3 py-2 text-xs text-[#94a3b8]"
                style={{ background: '#0a0a0f', border: '1px solid #1e1e2e' }}
              >
                ⚔️ <span className="font-semibold text-white">{battleTitle}</span>
              </div>

              {/* Username */}
              <div>
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-1.5">
                  Challenge @username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-sm">@</span>
                  <input
                    type="text"
                    value={toUsername}
                    onChange={e => setToUsername(e.target.value)}
                    placeholder="username"
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    Trash talk (optional)
                  </label>
                  <span className="text-[10px] text-[#374151]">{message.length}/140</span>
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 140))}
                  placeholder="Think you know better? Prove it! 😤"
                  rows={3}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!toUsername.trim() || loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  boxShadow: '0 0 16px rgba(239,68,68,0.3)',
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    Send Challenge!
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
