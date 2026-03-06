'use client';
import { use, useState, useRef, KeyboardEvent } from 'react';
import { useBattle } from '../../../../hooks/useBattles';
import { useComments, usePostComment, useLikeComment } from '../../../../hooks/useComments';
import { useAuth } from '../../../../hooks/useAuth';
import { BattleCard } from '../../../../components/battle/BattleCard';
import { PageSpinner } from '../../../../components/ui/LoadingSpinner';
import { Flag, Copy, Check, Heart, Send } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { battles as battlesApi } from '../../../../lib/api';

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

export default function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: battle, isLoading } = useBattle(id);
  const { data: commentsData } = useComments(id);
  const { mutateAsync: postComment, isPending: isPosting } = usePostComment(id);
  const { mutate: likeComment } = useLikeComment(id);
  const { user } = useAuth();

  const [reported, setReported] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [optimisticComments, setOptimisticComments] = useState<{ id: string; username: string; text: string; createdAt: string; likes: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (navigator.share) {
        await navigator.share({ title: battle?.title, url });
      }
    }
  };

  const handleReport = async () => {
    if (reported) return;
    await battlesApi.report(id, 'inappropriate');
    setReported(true);
  };

  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text || isPosting) return;
    const tempId = `temp-${Date.now()}`;
    const tempComment = { id: tempId, username: user?.username ?? 'you', text, createdAt: new Date().toISOString(), likes: 0 };
    setOptimisticComments((prev) => [tempComment, ...prev]);
    setCommentText('');
    try {
      await postComment(text);
      setOptimisticComments((prev) => prev.filter((c) => c.id !== tempId));
    } catch {
      setOptimisticComments((prev) => prev.filter((c) => c.id !== tempId));
      setCommentText(text);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (isLoading) return <PageSpinner />;
  if (!battle) return <div className="text-center text-[#64748b] py-16">Battle not found</div>;

  const allComments = [...optimisticComments, ...(commentsData?.comments ?? [])];
  const commentCount = (commentsData?.total ?? 0) + optimisticComments.length;

  return (
    <div className="space-y-4">
      <BattleCard battle={battle} />

      {/* Action row */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(108, 71, 255, 0.1)',
            border: copied ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(108, 71, 255, 0.3)',
            color: copied ? '#22c55e' : '#6c47ff',
          }}
        >
          {copied ? (
            <><Check size={14} />Copied!</>
          ) : (
            <><Copy size={14} />Share Battle</>
          )}
        </button>

        {battle.sponsorCta && (
          <a
            href={(battle.sponsorCta as { url: string; label: string }).url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-sm font-semibold rounded-xl hover:bg-[#f59e0b]/15 transition-colors"
          >
            Buy this card →
          </a>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReport}
          disabled={reported}
          className="text-[#ef4444]/60 hover:text-[#ef4444]"
        >
          <Flag size={14} />
          {reported ? 'Reported' : 'Report'}
        </Button>
      </div>

      {/* Stats panel */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
      >
        <h2 className="text-sm font-bold text-[#94a3b8] uppercase tracking-wider">Battle Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-2xl font-black text-white">
              {battle.totalVotesCached?.toLocaleString() ?? '0'}
            </p>
            <p className="text-xs text-[#64748b] mt-0.5">Total Votes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: battle.status === 'live' ? '#22c55e' : '#6c47ff' }}>
              {battle.status === 'live' ? '🟢 Live' : '⚡ Ended'}
            </p>
            <p className="text-xs text-[#64748b] mt-0.5">Status</p>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
          <span className="text-base">💬</span>
          <h2 className="text-sm font-bold text-white">
            Comments ({commentCount})
          </h2>
        </div>

        {/* Comment List */}
        <div className="divide-y divide-[#1e1e2e]">
          {allComments.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#64748b] text-sm">
              No comments yet. Be the first!
            </div>
          ) : (
            allComments.map((comment) => (
              <div key={comment.id} className="px-4 py-3 flex gap-3">
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}
                >
                  {comment.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[#6c47ff]">{comment.username}</span>
                    <span className="text-xs text-[#374151]">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#e2e8f0] break-words">{comment.text}</p>
                </div>
                {/* Like button */}
                {'id' in comment && !comment.id.startsWith('temp-') && (
                  <button
                    onClick={() => likeComment(comment.id)}
                    className="flex-shrink-0 flex flex-col items-center gap-0.5 text-[#374151] hover:text-[#ef4444] transition-colors"
                  >
                    <Heart size={13} />
                    {comment.likes > 0 && (
                      <span className="text-[10px] font-semibold">{comment.likes}</span>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        {user ? (
          <div className="px-4 py-3 border-t border-[#1e1e2e] flex gap-2 items-center">
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}
            >
              {user.username[0]?.toUpperCase()}
            </div>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value.slice(0, 280))}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#6c47ff]/50 pr-16"
              />
              <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-[#374151]">
                {commentText.length}/280
              </div>
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isPosting}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6c47ff] disabled:text-[#374151] hover:text-[#a78bfa] transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-[#1e1e2e] text-center text-xs text-[#64748b]">
            <a href="/login" className="text-[#6c47ff] hover:underline">Log in</a> to leave a comment
          </div>
        )}
      </div>
    </div>
  );
}
