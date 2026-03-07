'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getToken } from '../../../lib/api';
import { BackButton } from '../../../components/ui/BackButton';
import { showToast } from '../../../components/ui/Toast';
import { FileText, Trash2, Swords, Edit3, CheckCircle } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface BattleDraft {
  id: string;
  userId: string;
  leftAssetId?: string;
  rightAssetId?: string;
  title?: string;
  sport?: string;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

interface DraftCardPreview {
  id: string;
  player_name?: string;
  image_url: string;
  title: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<BattleDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardPreviews, setCardPreviews] = useState<Record<string, DraftCardPreview>>({});
  const [publishing, setPublishing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const token = getToken();

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${BASE}/me/drafts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setDrafts(data.drafts ?? []);
        // Load card previews for any asset IDs
        const assetIds = new Set<string>();
        (data.drafts ?? []).forEach((d: BattleDraft) => {
          if (d.leftAssetId) assetIds.add(d.leftAssetId);
          if (d.rightAssetId) assetIds.add(d.rightAssetId);
        });
        if (assetIds.size > 0) {
          const ids = Array.from(assetIds);
          const qs = ids.map(id => `id=${encodeURIComponent(id)}`).join('&');
          // Try to fetch a bit of info (use cards/search or ignore if API doesn't support bulk)
          Promise.all(ids.map(id =>
            fetch(`${BASE}/cards/search?q=${id}`).then(r => r.json()).catch(() => null)
          )).then(results => {
            const map: Record<string, DraftCardPreview> = {};
            results.forEach((res, i) => {
              if (res?.cards?.[0]) map[ids[i]] = res.cards[0];
            });
            setCardPreviews(map);
          });
          void qs; // suppress unused var
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (draftId: string) => {
    if (!token) return;
    try {
      await fetch(`${BASE}/me/drafts/${draftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      setConfirmDelete(null);
      showToast('Draft deleted', 'success');
    } catch {
      showToast('Failed to delete draft', 'error');
    }
  };

  const handlePublish = async (draft: BattleDraft) => {
    if (!token || !draft.leftAssetId || !draft.rightAssetId) {
      // No asset IDs saved, redirect to create with draft params
      router.push(`/create?draftId=${draft.id}&title=${encodeURIComponent(draft.title ?? '')}&categories=${encodeURIComponent(draft.categories.join(','))}`);
      return;
    }
    setPublishing(draft.id);
    try {
      const res = await fetch(`${BASE}/battles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: draft.title || 'Card Battle',
          leftAssetId: draft.leftAssetId,
          rightAssetId: draft.rightAssetId,
          categories: draft.categories,
          durationSeconds: 86400,
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        // Delete draft after publish
        await fetch(`${BASE}/me/drafts/${draft.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('⚔️ Battle published!', 'success');
        router.push(`/battles/${data.id}`);
      } else {
        showToast(data.error || 'Failed to publish', 'error');
      }
    } catch {
      showToast('Failed to publish battle', 'error');
    }
    setPublishing(null);
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <FileText size={48} className="text-[#374151]" />
        <p className="text-white font-bold text-lg">Sign in to view your drafts</p>
        <Link href="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}>
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackButton />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FileText size={20} className="text-[#6c47ff]" /> My Drafts
          </h1>
          {!loading && (
            <p className="text-xs text-[#64748b] mt-0.5">
              {drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved
            </p>
          )}
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
        >
          <Swords size={13} /> New Battle
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-2xl p-8 text-center border border-dashed border-[#1e1e2e] space-y-4" style={{ background: 'rgba(108,71,255,0.03)' }}>
          <div className="text-5xl">📝</div>
          <div>
            <p className="text-white font-bold text-lg">No drafts yet</p>
            <p className="text-[#64748b] text-sm mt-1">
              Start creating a battle and save it as a draft
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
          >
            <Swords size={16} /> Create Battle
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map(draft => {
            const leftCard = draft.leftAssetId ? cardPreviews[draft.leftAssetId] : null;
            const rightCard = draft.rightAssetId ? cardPreviews[draft.rightAssetId] : null;

            return (
              <div
                key={draft.id}
                className="rounded-xl border border-[#1e1e2e] p-4 space-y-3"
                style={{ background: '#12121a' }}
              >
                {/* Draft header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {draft.title || 'Untitled Draft'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-[#64748b]">Updated {formatDate(draft.updatedAt)}</p>
                      <span className="text-[#374151]">·</span>
                      <p className="text-[10px] text-[#64748b]">{draft.categories.join(', ')}</p>
                    </div>
                  </div>
                  {draft.sport && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(108,71,255,0.1)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.2)' }}>
                      {draft.sport}
                    </span>
                  )}
                </div>

                {/* Card previews */}
                {(leftCard || rightCard) && (
                  <div className="flex gap-3 items-center">
                    {leftCard && (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img src={leftCard.image_url} alt={leftCard.player_name ?? leftCard.title} className="w-10 h-13 object-cover rounded-lg border border-[#1e1e2e]" style={{ height: 52 }} />
                        <p className="text-xs text-white truncate">{leftCard.player_name ?? leftCard.title}</p>
                      </div>
                    )}
                    {leftCard && rightCard && (
                      <span className="text-xs font-black text-[#6c47ff] shrink-0">VS</span>
                    )}
                    {rightCard && (
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <p className="text-xs text-white truncate text-right">{rightCard.player_name ?? rightCard.title}</p>
                        <img src={rightCard.image_url} alt={rightCard.player_name ?? rightCard.title} className="w-10 object-cover rounded-lg border border-[#1e1e2e]" style={{ height: 52 }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {confirmDelete === draft.id ? (
                  <div className="flex gap-2 items-center">
                    <p className="flex-1 text-xs text-[#ef4444]">Delete this draft?</p>
                    <button onClick={() => handleDelete(draft.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#ef4444' }}>Delete</button>
                    <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748b]" style={{ background: '#1e1e2e' }}>Cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href={`/create?draftId=${draft.id}&title=${encodeURIComponent(draft.title ?? '')}&categories=${encodeURIComponent(draft.categories.join(','))}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: 'rgba(108,71,255,0.1)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.25)' }}
                    >
                      <Edit3 size={12} /> Continue Editing
                    </Link>
                    <button
                      onClick={() => handlePublish(draft)}
                      disabled={!!publishing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', color: 'white' }}
                    >
                      {publishing === draft.id ? '…' : <><CheckCircle size={12} /> Publish Now</>}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(draft.id)}
                      className="flex items-center justify-center p-2 rounded-xl transition-all"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
