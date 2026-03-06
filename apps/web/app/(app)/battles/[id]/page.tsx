'use client';
import { use, useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { useBattle } from '../../../../hooks/useBattles';
import { useComments, usePostComment, useLikeComment } from '../../../../hooks/useComments';
import { useAuth } from '../../../../hooks/useAuth';
import { BattleCard } from '../../../../components/battle/BattleCard';
import { PageSpinner } from '../../../../components/ui/LoadingSpinner';
import { Flag, Copy, Check, Heart, Send, Share2, Twitter, X, ExternalLink, Download } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { battles as battlesApi } from '../../../../lib/api';
import Link from 'next/link';
import type { Battle } from '@card-battles/types';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Share Modal ────────────────────────────────────────────────────────────────
function ShareModal({ battle, onClose }: { battle: Battle; onClose: () => void }) {
  const shareUrl = `https://cardbattles.app/battles/${battle.id}`;
  const ogImageUrl = `http://localhost:3333/api/v1/share/${battle.id}/og`;
  const [copied, setCopied] = useState(false);
  const [copiedImg, setCopiedImg] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyImgUrl = async () => {
    try {
      await navigator.clipboard.writeText(ogImageUrl);
      setCopiedImg(true);
      setTimeout(() => setCopiedImg(false), 2000);
    } catch {}
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(ogImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `battle-${battle.id}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `I voted on "${battle.title}" on Card Battles!`
  )}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[#1e1e2e] overflow-hidden"
        style={{ background: '#12121a', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <Share2 size={15} className="text-[#6c47ff]" />
            <h3 className="text-sm font-bold text-white">Share Battle</h3>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* OG Image Preview */}
        <div className="px-4 pt-3">
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-semibold mb-2">Battle Card</p>
          <div className="rounded-xl overflow-hidden border border-[#1e1e2e] bg-[#0a0a0f] relative" style={{ aspectRatio: '1200/630' }}>
            <img
              src={ogImageUrl}
              alt="Battle card preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border border-[#1e1e2e] text-[#64748b] hover:border-[#6c47ff] hover:text-[#6c47ff] transition-colors"
            >
              <Download size={12} /> Download Card
            </button>
            <button
              onClick={handleCopyImgUrl}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border border-[#1e1e2e] transition-colors"
              style={{ color: copiedImg ? '#22c55e' : '#64748b', borderColor: copiedImg ? 'rgba(34,197,94,0.4)' : undefined }}
            >
              {copiedImg ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy URL</>}
            </button>
          </div>
        </div>

        {/* URL */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5">
            <span className="flex-1 text-xs text-[#64748b] truncate font-mono">{shareUrl}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg transition-all"
              style={{
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(108,71,255,0.15)',
                color: copied ? '#22c55e' : '#6c47ff',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(108,71,255,0.3)'}`,
              }}
            >
              {copied ? (
                <span className="flex items-center gap-1"><Check size={11} /> Copied!</span>
              ) : (
                <span className="flex items-center gap-1"><Copy size={11} /> Copy</span>
              )}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="px-4 pb-4 space-y-2">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#1e1e2e] hover:border-[#1da1f2]/40 hover:bg-[#1da1f2]/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1da1f2]/10 flex items-center justify-center">
              <Twitter size={15} className="text-[#1da1f2]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Share on Twitter / X</p>
              <p className="text-xs text-[#64748b]">Post this battle to your followers</p>
            </div>
            <ExternalLink size={12} className="text-[#374151] group-hover:text-[#1da1f2] transition-colors" />
          </a>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={async () => {
                try { await (navigator as Navigator).share({ title: battle.title, url: shareUrl }); } catch {}
                onClose();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#1e1e2e] hover:border-[#6c47ff]/40 hover:bg-[#6c47ff]/5 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-[#6c47ff]/10 flex items-center justify-center">
                <Share2 size={15} className="text-[#6c47ff]" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">More options…</p>
                <p className="text-xs text-[#64748b]">Share via your device</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Animated progress bars ─────────────────────────────────────────────────────
function BarFill({ pct, winner }: { pct: number; winner: boolean }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div
      className="h-full rounded-full transition-all duration-700 ease-out"
      style={{
        width: `${width}%`,
        background: winner ? 'linear-gradient(90deg,#6c47ff,#8b5cf6)' : '#374151',
      }}
    />
  );
}

function VoteDistribution({ battle }: { battle: Battle }) {
  if (!battle.result?.byCategory) return null;
  const entries = Object.entries(battle.result.byCategory);
  if (!entries.length) return null;

  return (
    <div className="rounded-xl p-4 space-y-3 border border-[#1e1e2e]" style={{ background: '#12121a' }}>
      <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Vote Distribution</h3>
      <div className="flex justify-between text-[10px] text-[#64748b] mb-1">
        <span className="truncate max-w-[45%]">← {battle.left.playerName ?? battle.left.title}</span>
        <span className="truncate max-w-[45%] text-right">{battle.right.playerName ?? battle.right.title} →</span>
      </div>
      {entries.map(([cat, data]) => (
        <div key={cat}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#6c47ff]">{cat}</span>
            {data.winner !== 'draw' && (
              <span className="text-[10px] text-[#64748b]">
                Winner: <span className="text-white font-semibold">
                  {data.winner === 'left' ? (battle.left.playerName ?? 'Left') : (battle.right.playerName ?? 'Right')}
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
              <BarFill pct={data.leftPercent} winner={data.winner === 'left'} />
            </div>
            <span className="text-[10px] font-black text-white w-8 text-center">{data.leftPercent}%</span>
            <span className="text-[10px] text-[#374151]">vs</span>
            <span className="text-[10px] font-black text-white w-8 text-center">{data.rightPercent}%</span>
            <div className="flex-1 h-2 bg-[#1e1e2e] rounded-full overflow-hidden flex justify-end">
              <BarFill pct={data.rightPercent} winner={data.winner === 'right'} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Countdown ──────────────────────────────────────────────────────────────────
function BattleCountdown({ endsAt }: { endsAt: string }) {
  const getLeft = useCallback(() => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      diff,
    };
  }, [endsAt]);

  const [tl, setTl] = useState(getLeft);
  useEffect(() => { const id = setInterval(() => setTl(getLeft()), 1000); return () => clearInterval(id); }, [getLeft]);

  if (!tl) return <span className="text-xs text-[#64748b]">⏱ Ended</span>;
  const isUrgent = tl.diff < 3600000;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-semibold ${isUrgent ? 'text-[#ef4444]' : 'text-[#64748b]'}`}>Ends in</span>
      <span className="text-sm font-black tabular-nums" style={{ color: isUrgent ? '#ef4444' : '#a78bfa' }}>
        {tl.d > 0 ? `${tl.d}d ` : ''}{pad(tl.h)}:{pad(tl.m)}:{pad(tl.s)}
      </span>
    </div>
  );
}

// ── Mini battle card ───────────────────────────────────────────────────────────
function MiniBattleCard({ battle }: { battle: Battle }) {
  return (
    <Link
      href={`/battles/${battle.id}`}
      className="flex gap-3 p-3 rounded-xl border border-[#1e1e2e] hover:border-[#6c47ff]/40 hover:-translate-y-0.5 transition-all group"
      style={{ background: '#0a0a0f' }}
    >
      <div className="flex gap-1 shrink-0">
        <div className="w-8 h-10 rounded-lg overflow-hidden border border-[#252535]">
          <img src={battle.left.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="w-8 h-10 rounded-lg overflow-hidden border border-[#252535]">
          <img src={battle.right.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-white truncate group-hover:text-[#a78bfa] transition-colors">{battle.title}</p>
        <p className="text-[10px] text-[#64748b] mt-0.5">{battle.totalVotesCached?.toLocaleString() ?? 0} votes</p>
        <p className="text-[10px] capitalize" style={{ color: battle.status === 'live' ? '#22c55e' : '#64748b' }}>
          {battle.status === 'live' ? '🟢 Live' : '⚡ Ended'}
        </p>
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: battle, isLoading } = useBattle(id);
  const { data: commentsData } = useComments(id);
  const { mutateAsync: postComment, isPending: isPosting } = usePostComment(id);
  const { mutate: likeComment } = useLikeComment(id);
  const { user } = useAuth();

  const [reported, setReported] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [optimisticComments, setOptimisticComments] = useState<{ id: string; username: string; text: string; createdAt: string; likes: number }[]>([]);
  const [moreBattles, setMoreBattles] = useState<Battle[]>([]);
  const [valuations, setValuations] = useState<{
    left: { low: number; mid: number; high: number; trend: string } | null;
    right: { low: number; mid: number; high: number; trend: string } | null;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load "more battles"
  useEffect(() => {
    battlesApi.feed({ cursor: undefined }).then((res) => {
      setMoreBattles(res.items.filter((b) => b.id !== id).slice(0, 3));
    }).catch(() => {});
  }, [id]);

  // Load valuations
  useEffect(() => {
    fetch(`/api/v1/battles/${id}/valuations`)
      .then(r => r.json())
      .then(data => setValuations(data))
      .catch(() => {});
  }, [id]);

  const handleReport = async () => {
    if (reported) return;
    await battlesApi.report(id, 'inappropriate');
    setReported(true);
  };

  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text || isPosting) return;
    const tempId = `temp-${Date.now()}`;
    const temp = { id: tempId, username: user?.username ?? 'you', text, createdAt: new Date().toISOString(), likes: 0 };
    setOptimisticComments((prev) => [temp, ...prev]);
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); }
  };

  if (isLoading) return <PageSpinner />;
  if (!battle) return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="text-5xl">⚔️</div>
      <p className="text-white font-bold text-lg">Battle not found</p>
      <p className="text-[#64748b] text-sm">This battle may have ended or doesn&apos;t exist.</p>
      <Link href="/feed" className="px-4 py-2 bg-[#6c47ff] text-white text-sm font-bold rounded-xl hover:bg-[#5a38e0] transition-colors">
        Back to Feed
      </Link>
    </div>
  );

  const trendArrow = (trend: string) => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };
  const trendColor = (trend: string) => {
    if (trend === 'up') return '#22c55e';
    if (trend === 'down') return '#ef4444';
    return '#94a3b8';
  };

  const allComments = [...optimisticComments, ...(commentsData?.comments ?? [])];
  const commentCount = (commentsData?.total ?? 0) + optimisticComments.length;
  const shareUrl = `https://cardbattles.app/battles/${battle.id}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I voted on "${battle.title}" on Card Battles!`)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="space-y-4">
      {/* Sponsor banner */}
      {battle.isSponsored && battle.sponsorCta && (
        <a
          href={(battle.sponsorCta as { url: string; label: string }).url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#f59e0b] uppercase tracking-widest">🏷️ Sponsored</span>
          </div>
          <span className="text-xs font-bold text-[#f59e0b]">
            {(battle.sponsorCta as { url: string; label: string }).label} →
          </span>
        </a>
      )}

      <BattleCard battle={battle} />

      {/* Card Valuations */}
      {valuations && (valuations.left || valuations.right) && (
        <div className="rounded-xl p-4 border border-[#1e1e2e] space-y-3" style={{ background: '#12121a' }}>
          <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">💰 Market Valuations (PSA 10 Est.)</h3>
          <div className="flex gap-3">
            {valuations.left && (
              <div className="flex-1 bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e]">
                <p className="text-[10px] text-[#64748b] mb-1 truncate">{battle.left.playerName ?? battle.left.title}</p>
                <p className="text-base font-black text-white">${valuations.left.mid >= 1000 ? `${(valuations.left.mid/1000).toFixed(1)}k` : valuations.left.mid}</p>
                <p className="text-[10px] text-[#64748b]">${valuations.left.low} – ${valuations.left.high >= 1000 ? `${(valuations.left.high/1000).toFixed(1)}k` : valuations.left.high}</p>
                <p className="text-xs font-bold mt-1" style={{ color: trendColor(valuations.left.trend) }}>
                  {trendArrow(valuations.left.trend)} {valuations.left.trend}
                </p>
              </div>
            )}
            {valuations.right && (
              <div className="flex-1 bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e]">
                <p className="text-[10px] text-[#64748b] mb-1 truncate">{battle.right.playerName ?? battle.right.title}</p>
                <p className="text-base font-black text-white">${valuations.right.mid >= 1000 ? `${(valuations.right.mid/1000).toFixed(1)}k` : valuations.right.mid}</p>
                <p className="text-[10px] text-[#64748b]">${valuations.right.low} – ${valuations.right.high >= 1000 ? `${(valuations.right.high/1000).toFixed(1)}k` : valuations.right.high}</p>
                <p className="text-xs font-bold mt-1" style={{ color: trendColor(valuations.right.trend) }}>
                  {trendArrow(valuations.right.trend)} {valuations.right.trend}
                </p>
              </div>
            )}
          </div>
          <p className="text-[10px] text-[#374151]">* Estimated values only. Not financial advice.</p>
        </div>
      )}

      {/* Stats strip */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#1e1e2e]"
        style={{ background: '#12121a' }}>
        <div className="text-center">
          <p className="text-xl font-black text-white">{battle.totalVotesCached?.toLocaleString() ?? '0'}</p>
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-semibold">Total Votes</p>
        </div>
        <div className="w-px h-8 bg-[#1e1e2e]" />
        <div className="text-center">
          <p className="text-sm font-black" style={{ color: battle.status === 'live' ? '#22c55e' : '#94a3b8' }}>
            {battle.status === 'live' ? '🟢 LIVE' : '⚡ Ended'}
          </p>
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-semibold">Status</p>
        </div>
        <div className="w-px h-8 bg-[#1e1e2e]" />
        <BattleCountdown endsAt={battle.endsAt} />
      </div>

      {/* Vote distribution */}
      {battle.result?.byCategory && Object.keys(battle.result.byCategory).length > 0 && (
        <VoteDistribution battle={battle} />
      )}

      {/* Action row */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowShareModal(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.3)', color: '#6c47ff' }}
        >
          <Share2 size={14} />
          Share
        </button>

        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(29,161,242,0.1)', border: '1px solid rgba(29,161,242,0.3)', color: '#1da1f2' }}
          title="Share on Twitter/X"
        >
          <Twitter size={14} />
        </a>

        {battle.sponsorCta && (
          <a
            href={(battle.sponsorCta as { url: string; label: string }).url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
          >
            Buy card →
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

      {/* Comments */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#12121a', border: '1px solid #1e1e2e' }}>
        <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
          <span className="text-base">💬</span>
          <h2 className="text-sm font-bold text-white">Comments ({commentCount})</h2>
        </div>

        <div className="divide-y divide-[#1e1e2e]">
          {allComments.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#64748b] text-sm">No comments yet. Be the first!</div>
          ) : (
            allComments.map((comment) => (
              <div key={comment.id} className="px-4 py-3 flex gap-3">
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
                {!comment.id.startsWith('temp-') && (
                  <button
                    onClick={() => likeComment(comment.id)}
                    className="flex-shrink-0 flex flex-col items-center gap-0.5 text-[#374151] hover:text-[#ef4444] transition-colors"
                  >
                    <Heart size={13} />
                    {comment.likes > 0 && <span className="text-[10px] font-semibold">{comment.likes}</span>}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

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

      {/* More battles */}
      {moreBattles.length > 0 && (
        <div className="rounded-xl p-4 border border-[#1e1e2e] space-y-3" style={{ background: '#12121a' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">More Battles</h3>
            <Link href="/feed" className="text-xs text-[#6c47ff] hover:underline font-semibold">See all →</Link>
          </div>
          <div className="space-y-2">
            {moreBattles.map((b) => <MiniBattleCard key={b.id} battle={b} />)}
          </div>
        </div>
      )}

      {showShareModal && <ShareModal battle={battle} onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
