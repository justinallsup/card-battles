'use client';
import { use, useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { useBattle } from '../../../../hooks/useBattles';
import { useComments, usePostComment, useLikeComment } from '../../../../hooks/useComments';
import { useAuth } from '../../../../hooks/useAuth';
import { BattleCard } from '../../../../components/battle/BattleCard';
import { PageSpinner } from '../../../../components/ui/LoadingSpinner';
import { Flag, Copy, Check, Heart, Send, Share2, Twitter, X, ExternalLink, Download, Bookmark, Eye, FlipHorizontal, Bell, BellOff, Trash2, BarChart2, TrendingUp, ChevronDown } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { BackButton } from '../../../../components/ui/BackButton';
import { battles as battlesApi, getToken } from '../../../../lib/api';
import { DonutChart } from '../../../../components/ui/DonutChart';
import { BarChart } from '../../../../components/ui/BarChart';
import { showToast } from '../../../../components/ui/Toast';
import { PriceHistoryChart } from '../../../../components/ui/PriceHistoryChart';
import { BattleReplayPanel } from '../../../../components/battles/BattleReplayPanel';
import Link from 'next/link';
import type { Battle } from '@card-battles/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

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
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/battles/${battle.id}`
    : `https://cardbattles.app/battles/${battle.id}`;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';
  const ogImageUrl = `${apiBase}/share/${battle.id}/og`;
  const widgetUrl = `${apiBase}/battles/${battle.id}/widget`;
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeTab, setActiveTabShare] = useState<'share' | 'ogcard' | 'embed'>('share');

  const leftPlayer = battle.left.playerName ?? 'Left';
  const rightPlayer = battle.right.playerName ?? 'Right';
  const sport = (battle.left as unknown as Record<string,string>).sport ?? 'sports';

  const twitterText = `🥊 Card Battle: ${leftPlayer} vs ${rightPlayer}\nVote now and pick the 🏆\n#${sport}Cards #CardBattles #SportCards`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${twitterText}\n${shareUrl}`)}`;
  const embedCode = `<iframe src="${widgetUrl}" width="320" height="200" frameborder="0" style="border-radius:12px;overflow:hidden;" allowfullscreen></iframe>`;

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const handleCopyEmbed = async () => {
    try { await navigator.clipboard.writeText(embedCode); setCopiedEmbed(true); setTimeout(() => setCopiedEmbed(false), 2000); } catch {}
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(ogImageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `battle-${battle.id}.svg`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const tabStyle = (tab: 'share' | 'ogcard' | 'embed') => activeTab === tab
    ? { color: '#a78bfa', borderBottom: '2px solid #6c47ff', background: 'rgba(108,71,255,0.08)' }
    : { color: '#64748b' };

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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <Share2 size={15} className="text-[#6c47ff]" />
            <h3 className="text-sm font-bold text-white">Share Battle</h3>
          </div>
          <button onClick={onClose} aria-label="Close share dialog" className="text-[#64748b] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e1e2e]">
          {(['share', 'ogcard', 'embed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTabShare(tab)}
              className="flex-1 py-2 text-xs font-bold transition-all"
              style={tabStyle(tab)}
            >
              {tab === 'share' ? '🔗 Share' : tab === 'ogcard' ? '🖼️ OG Card' : '📋 Embed'}
            </button>
          ))}
        </div>

        {/* Share Tab */}
        {activeTab === 'share' && (
          <div className="p-4 space-y-3">
            {/* Copy link */}
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
                {copied ? <span className="flex items-center gap-1"><Check size={11} /> Copied!</span>
                  : <span className="flex items-center gap-1"><Copy size={11} /> Copy</span>}
              </button>
            </div>

            {/* Twitter/X button */}
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

            {/* WhatsApp button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#1e1e2e] hover:border-[#25d366]/40 hover:bg-[#25d366]/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: 'rgba(37,211,102,0.1)' }}>
                💬
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">Share on WhatsApp</p>
                <p className="text-xs text-[#64748b]">Send to friends and groups</p>
              </div>
              <ExternalLink size={12} className="text-[#374151] group-hover:text-[#25d366] transition-colors" />
            </a>

            {/* Native share */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={async () => {
                  try { await (navigator as Navigator).share({ title: battle.title, text: twitterText, url: shareUrl }); } catch {}
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
        )}

        {/* OG Card Tab */}
        {activeTab === 'ogcard' && (
          <div className="p-4 space-y-3">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-semibold">Battle Card Preview</p>
            <div className="rounded-xl overflow-hidden border border-[#1e1e2e] bg-[#0a0a0f]" style={{ aspectRatio: '1200/630' }}>
              <img
                src={ogImageUrl}
                alt="Battle card preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.3)', color: '#a78bfa' }}
              >
                <Download size={12} /> Download SVG
              </button>
              <a
                href={ogImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: 'rgba(30,30,46,0.8)', border: '1px solid #1e1e2e', color: '#64748b' }}
              >
                <ExternalLink size={12} /> Open Full Size
              </a>
            </div>
          </div>
        )}

        {/* Embed Tab */}
        {activeTab === 'embed' && (
          <div className="p-4 space-y-3">
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-semibold">Embed this Battle</p>
            <p className="text-xs text-[#94a3b8]">Copy and paste this code into your website or blog.</p>
            <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-3">
              <code className="text-[10px] text-[#a78bfa] break-all leading-relaxed font-mono whitespace-pre-wrap">
                {embedCode}
              </code>
            </div>
            <button
              onClick={handleCopyEmbed}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={copiedEmbed
                ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }
                : { background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.3)', color: '#6c47ff' }}
            >
              {copiedEmbed ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Embed Code</>}
            </button>
            <div className="rounded-xl overflow-hidden border border-[#1e1e2e]" style={{ height: 200 }}>
              <iframe
                src={widgetUrl}
                width="100%"
                height="200"
                style={{ border: 'none', borderRadius: 8 }}
                title="Battle widget preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Image Lightbox ─────────────────────────────────────────────────────────────
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close lightbox"
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[#1e1e2e] border border-[#374151] flex items-center justify-center text-[#64748b] hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full rounded-2xl border border-[#1e1e2e] object-contain max-h-[80vh]"
        />
        <p className="text-center text-xs text-[#64748b] mt-2">{alt}</p>
      </div>
    </div>
  );
}

// ── Save Card Button ────────────────────────────────────────────────────────────
function SaveCardButton({ assetId, cardName }: { assetId: string; cardName: string }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const method = saved ? 'DELETE' : 'POST';
      await fetch(`${BASE_URL}/cards/${assetId}/save`, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSaved(!saved);
    } catch {}
    setLoading(false);
  };

  if (!user) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from collection' : `Save ${cardName} to collection`}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
      style={saved
        ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
        : { background: 'rgba(108,71,255,0.08)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.2)' }
      }
    >
      {saved ? <><Check size={11} /> Saved!</> : <><FlipHorizontal size={11} /> 💾 Save Card</>}
    </button>
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

// ── Progress Ring (CSS-only) ───────────────────────────────────────────────────
function ProgressRing({ pct, winner, size = 56 }: { pct: number; winner: boolean; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (pct / 100) * circ), 150);
    return () => clearTimeout(t);
  }, [pct, circ]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e1e2e" strokeWidth={6} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={winner ? '#6c47ff' : '#374151'}
          strokeWidth={6}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <span className="relative text-[11px] font-black" style={{ color: winner ? '#a78bfa' : '#94a3b8' }}>
        {pct}%
      </span>
    </div>
  );
}

function VoteDistribution({ battle, myVote }: { battle: Battle; myVote?: Record<string, string> }) {
  if (!battle.result?.byCategory) return null;
  const entries = Object.entries(battle.result.byCategory);
  if (!entries.length) return null;

  return (
    <div className="rounded-xl p-4 space-y-4 border border-[#1e1e2e]" style={{ background: '#12121a' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Vote Distribution</h3>
        {myVote && Object.keys(myVote).length > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            ✓ You voted
          </span>
        )}
      </div>
      <div className="flex justify-between text-[10px] text-[#64748b] mb-1">
        <span className="truncate max-w-[45%]">← {battle.left.playerName ?? battle.left.title}</span>
        <span className="truncate max-w-[45%] text-right">{battle.right.playerName ?? battle.right.title} →</span>
      </div>
      {entries.map(([cat, data]) => {
        const votedSide = myVote?.[cat];
        return (
          <div key={cat}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6c47ff]">{cat}</span>
                {votedSide && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.3)' }}
                  >
                    {votedSide === 'left' ? (battle.left.playerName ?? 'Left') : (battle.right.playerName ?? 'Right')} ✓
                  </span>
                )}
              </div>
              {data.winner !== 'draw' && (
                <span className="text-[10px] text-[#64748b]">
                  Winner: <span className="text-white font-semibold">
                    {data.winner === 'left' ? (battle.left.playerName ?? 'Left') : (battle.right.playerName ?? 'Right')}
                  </span>
                </span>
              )}
            </div>
            {/* Progress rings + bars */}
            <div className="flex items-center gap-3">
              <ProgressRing pct={data.leftPercent} winner={data.winner === 'left'} />
              <div className="flex-1 space-y-1">
                <div className="h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                  <BarFill pct={data.leftPercent} winner={data.winner === 'left'} />
                </div>
                <div className="flex justify-between text-[9px] text-[#374151]">
                  <span>{battle.left.playerName ?? 'Left'}</span>
                  <span>{battle.right.playerName ?? 'Right'}</span>
                </div>
                <div className="h-2 bg-[#1e1e2e] rounded-full overflow-hidden flex justify-end">
                  <BarFill pct={data.rightPercent} winner={data.winner === 'right'} />
                </div>
              </div>
              <ProgressRing pct={data.rightPercent} winner={data.winner === 'right'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}


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

// ── Price Alert Widget ─────────────────────────────────────────────────────────
interface PriceAlert {
  cardId: string;
  playerName: string;
  threshold: number;
  set: number;
}

function PriceAlertWidget({ cardId, playerName }: { cardId: string; playerName: string }) {
  const [threshold, setThreshold] = useState('');
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [saved, setSaved] = useState(false);

  const loadAlerts = () => {
    try {
      const raw = localStorage.getItem('cb_alerts');
      setAlerts(raw ? JSON.parse(raw) : []);
    } catch { setAlerts([]); }
  };

  useEffect(() => { loadAlerts(); }, []);

  const myAlert = alerts.find(a => a.cardId === cardId);

  const handleSet = () => {
    const val = parseFloat(threshold);
    if (!val || val <= 0) return;
    const existing = alerts.filter(a => a.cardId !== cardId);
    const newAlert: PriceAlert = { cardId, playerName, threshold: val, set: Date.now() };
    const updated = [...existing, newAlert];
    localStorage.setItem('cb_alerts', JSON.stringify(updated));
    setAlerts(updated);
    setThreshold('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemove = () => {
    const updated = alerts.filter(a => a.cardId !== cardId);
    localStorage.setItem('cb_alerts', JSON.stringify(updated));
    setAlerts(updated);
  };

  return (
    <div className="bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e] space-y-2">
      <p className="text-[10px] text-[#64748b] truncate font-semibold">{playerName}</p>
      {myAlert ? (
        <div className="flex items-center gap-2">
          <Bell size={12} className="text-[#6c47ff] flex-shrink-0" />
          <span className="text-xs text-white flex-1">Alert at <span className="font-bold text-[#6c47ff]">${myAlert.threshold}</span></span>
          <button
            onClick={handleRemove}
            aria-label="Remove price alert"
            className="p-1 rounded-lg hover:bg-[#ef4444]/10 text-[#64748b] hover:text-[#ef4444] transition-colors"
            title="Remove alert"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#64748b]">$</span>
            <input
              type="number"
              min="1"
              placeholder="Price"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg pl-5 pr-2 py-1.5 text-xs text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]"
            />
          </div>
          <button
            onClick={handleSet}
            disabled={!threshold || parseFloat(threshold) <= 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 bg-[#6c47ff]/10 border border-[#6c47ff]/30 text-[#6c47ff] hover:bg-[#6c47ff]/20"
          >
            {saved ? <Check size={11} /> : <Bell size={11} />}
            {saved ? 'Set!' : 'Alert'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Battle Stats Panel ────────────────────────────────────────────────────────
interface CategoryStats {
  total: number;
  leftCount: number;
  rightCount: number;
  leftPct: number;
  rightPct: number;
  timeline: { hour: number; leftVotes: number; rightVotes: number }[];
}

interface BattleStats {
  battleId: string;
  totalVotes: number;
  byCategory: Record<string, CategoryStats>;
  momentum: 'left' | 'right';
  peakHour: number;
}

function BattleStatsPanel({ battleId, battle }: { battleId: string; battle: Battle }) {
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/battles/${battleId}/stats`)
      .then(r => r.json())
      .then(data => { setStats(data as BattleStats); setLoading(false); })
      .catch(() => setLoading(false));
  }, [battleId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-center text-[#64748b] text-sm py-4">Failed to load stats</p>;
  }

  const cats = ['investment', 'coolest', 'rarity'];
  const catEmoji: Record<string, string> = { investment: '📈', coolest: '🔥', rarity: '💎' };
  const momentumSide = stats.momentum === 'left' ? (battle.left.playerName ?? 'Left') : (battle.right.playerName ?? 'Right');

  return (
    <div className="space-y-4">
      {/* Total stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0a0a0f] rounded-xl p-3 text-center border border-[#1e1e2e]">
          <p className="text-xl font-black text-white">{stats.totalVotes.toLocaleString()}</p>
          <p className="text-[10px] text-[#64748b] uppercase tracking-wide mt-0.5">Total Votes</p>
        </div>
        <div className="bg-[#0a0a0f] rounded-xl p-3 text-center border border-[#1e1e2e]">
          <p className="text-xl font-black text-white">{stats.peakHour}:00</p>
          <p className="text-[10px] text-[#64748b] uppercase tracking-wide mt-0.5">Peak Hour</p>
        </div>
        <div className="bg-[#0a0a0f] rounded-xl p-3 text-center border border-[#1e1e2e]">
          <TrendingUp size={14} className="mx-auto mb-1 text-[#22c55e]" />
          <p className="text-xs font-bold text-[#22c55e] truncate">{momentumSide}</p>
          <p className="text-[10px] text-[#64748b] uppercase tracking-wide mt-0.5">Momentum</p>
        </div>
      </div>

      {/* Momentum indicator */}
      <div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
      >
        <TrendingUp size={16} className="text-[#22c55e] flex-shrink-0" />
        <p className="text-sm text-[#f1f5f9]">
          <span className="font-bold text-[#22c55e]">{momentumSide}</span> is currently gaining momentum
        </p>
      </div>

      {/* Per-category donut charts */}
      <div>
        <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-3">Category Breakdown</p>
        <div className="grid grid-cols-3 gap-2">
          {cats.map(cat => {
            const data = stats.byCategory[cat] as CategoryStats | undefined;
            if (!data) return null;
            return (
              <div
                key={cat}
                className="bg-[#0a0a0f] rounded-xl p-3 border border-[#1e1e2e] flex flex-col items-center gap-2"
              >
                <p className="text-xs font-bold text-white capitalize">
                  {catEmoji[cat]} {cat}
                </p>
                <DonutChart
                  leftPct={data.leftPct}
                  rightPct={data.rightPct}
                  leftColor="#6c47ff"
                  rightColor="#374151"
                  size={80}
                  strokeWidth={10}
                  label={`${data.total}`}
                />
                <div className="w-full text-[9px] text-[#64748b] flex justify-between">
                  <span className="truncate max-w-[45%]">{battle.left.playerName?.split(' ').pop()}</span>
                  <span className="truncate max-w-[45%] text-right">{battle.right.playerName?.split(' ').pop()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vote timeline bar charts */}
      {cats.map(cat => {
        const data = stats.byCategory[cat] as CategoryStats | undefined;
        if (!data?.timeline?.length) return null;
        return (
          <div key={`timeline-${cat}`} className="bg-[#0a0a0f] rounded-xl p-4 border border-[#1e1e2e]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-white capitalize">{catEmoji[cat]} {cat} — Hourly Votes</p>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#6c47ff] inline-block" />
                  {battle.left.playerName?.split(' ').pop()}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#374151] inline-block" />
                  {battle.right.playerName?.split(' ').pop()}
                </span>
              </div>
            </div>
            <BarChart
              data={data.timeline}
              leftColor="#6c47ff"
              rightColor="#64748b"
              height={70}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Category Insights ─────────────────────────────────────────────────────────
const CATEGORY_INFO: Record<string, { emoji: string; label: string; description: string }> = {
  investment: { emoji: '💰', label: 'Investment', description: 'Which card will be worth more in 5 years?' },
  coolest:    { emoji: '😎', label: 'Coolest',    description: 'Which card has the best look, design, and feel?' },
  rarity:     { emoji: '💎', label: 'Rarity',     description: 'Which card is harder to find in top grade?' },
};

function CategoryInsights({ battleId, battle }: { battleId: string; battle: Battle }) {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<Record<string, { leftPct: number; rightPct: number; total: number; winner: string }> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (stats || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/battles/${battleId}/stats`);
      const data = await r.json();
      const by: Record<string, { leftPct: number; rightPct: number; total: number; winner: string }> = {};
      for (const [cat, val] of Object.entries(data.byCategory || {})) {
        const v = val as { leftPct: number; rightPct: number; total: number; winner: string };
        by[cat] = v;
      }
      setStats(by);
    } catch {}
    setLoading(false);
  };

  const toggle = () => {
    setOpen(o => !o);
    if (!open) load();
  };

  const cats = ['investment', 'coolest', 'rarity'];
  const leftName = battle.left.playerName ?? 'Left';
  const rightName = battle.right.playerName ?? 'Right';

  // Overall winner
  const overallWinner = (() => {
    if (!stats) return null;
    let leftWins = 0, rightWins = 0;
    for (const cat of cats) {
      const w = stats[cat]?.winner;
      if (w === 'left') leftWins++;
      else if (w === 'right') rightWins++;
    }
    if (leftWins > rightWins) return { side: 'left', name: leftName, wins: leftWins };
    if (rightWins > leftWins) return { side: 'right', name: rightName, wins: rightWins };
    return { side: 'draw', name: 'Tied', wins: 0 };
  })();

  return (
    <div className="rounded-xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1e1e2e]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🔍</span>
          <h3 className="text-sm font-bold text-white">Category Insights</h3>
        </div>
        <ChevronDown
          size={16}
          className="text-[#64748b] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#1e1e2e] pt-3">
          {loading && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && overallWinner && overallWinner.side !== 'draw' && (
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.25)' }}
            >
              <p className="text-xs text-[#64748b] mb-0.5">Overall Leader</p>
              <p className="text-sm font-black text-[#a78bfa]">
                {overallWinner.name} leads {overallWinner.wins}/3 categories
              </p>
            </div>
          )}

          {!loading && stats && cats.map(cat => {
            const info = CATEGORY_INFO[cat];
            const data = stats[cat];
            if (!data) return null;
            const leftWins = data.winner === 'left';
            const rightWins = data.winner === 'right';

            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5">{info.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-white">{info.label}</p>
                    <p className="text-[10px] text-[#64748b]">{info.description}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#94a3b8] w-24 truncate">{leftName}</span>
                    <div className="flex-1 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${data.leftPct}%`, background: leftWins ? '#6c47ff' : '#374151' }}
                      />
                    </div>
                    <span className="text-[10px] font-bold w-8 text-right" style={{ color: leftWins ? '#a78bfa' : '#64748b' }}>
                      {data.leftPct}%
                    </span>
                    {leftWins && <span className="text-[10px] text-[#22c55e]">✓</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#94a3b8] w-24 truncate">{rightName}</span>
                    <div className="flex-1 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${data.rightPct}%`, background: rightWins ? '#6c47ff' : '#374151' }}
                      />
                    </div>
                    <span className="text-[10px] font-bold w-8 text-right" style={{ color: rightWins ? '#a78bfa' : '#64748b' }}>
                      {data.rightPct}%
                    </span>
                    {rightWins && <span className="text-[10px] text-[#22c55e]">✓</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Vote All Button ────────────────────────────────────────────────────────────
function VoteAllButton({ battleId, battle, onVoted }: { battleId: string; battle: Battle; onVoted: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<'left' | 'right' | null>(null);
  if (!user) return null;

  const handleVoteAll = async (choice: 'left' | 'right') => {
    setLoading(choice);
    try {
      const res = await fetch(`${BASE_URL}/battles/${battleId}/vote-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ choice }),
      });
      const data = await res.json();
      const succeeded = (data.results || []).filter((r: { success: boolean }) => r.success).length;
      const skipped = (data.results || []).length - succeeded;
      if (succeeded > 0) {
        showToast(`Voted ${choice} in ${succeeded} categor${succeeded === 1 ? 'y' : 'ies'}!${skipped > 0 ? ` (${skipped} already voted)` : ''}`, 'success');
        onVoted();
      } else {
        showToast('Already voted in all categories', 'info');
      }
    } catch {
      showToast('Failed to vote', 'error');
    }
    setLoading(null);
  };

  const leftName = battle.left.playerName ?? 'Left';
  const rightName = battle.right.playerName ?? 'Right';

  return (
    <div
      className="rounded-xl p-3 border border-[#6c47ff]/25 space-y-2"
      style={{ background: 'rgba(108,71,255,0.05)' }}
    >
      <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider text-center">⚡ Vote All Categories</p>
      <p className="text-[10px] text-[#64748b] text-center">Cast your vote in all 3 categories at once</p>
      <div className="flex gap-2">
        <button
          onClick={() => handleVoteAll('left')}
          disabled={!!loading}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.35)' }}
        >
          {loading === 'left' ? '…' : `← ${leftName}`}
        </button>
        <button
          onClick={() => handleVoteAll('right')}
          disabled={!!loading}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.35)' }}
        >
          {loading === 'right' ? '…' : `${rightName} →`}
        </button>
      </div>
    </div>
  );
}

// ── Mini battle card ───────────────────────────────────────────────────────────
function MiniBattleCard({ battle }: { battle: Battle }) {  return (
    <Link
      href={`/battles/${battle.id}`}
      className="flex gap-3 p-3 rounded-xl border border-[#1e1e2e] hover:border-[#6c47ff]/40 hover:-translate-y-0.5 transition-all group"
      style={{ background: '#0a0a0f' }}
    >
      <div className="flex gap-1 shrink-0">
        <div className="w-8 h-10 rounded-lg overflow-hidden border border-[#252535]">
          <img src={battle.left.imageUrl} alt={battle.left.playerName ?? battle.left.title} className="w-full h-full object-cover" />
        </div>
        <div className="w-8 h-10 rounded-lg overflow-hidden border border-[#252535]">
          <img src={battle.right.imageUrl} alt={battle.right.playerName ?? battle.right.title} className="w-full h-full object-cover" />
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
  const [lightboxSrc, setLightboxSrc] = useState<{ src: string; alt: string } | null>(null);
  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [myVote, setMyVote] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'replay'>('overview');
  const inputRef = useRef<HTMLInputElement>(null);

  // Set document title
  useEffect(() => {
    if (battle) {
      const left = battle.left.playerName ?? 'Left';
      const right = battle.right.playerName ?? 'Right';
      document.title = `${left} vs ${right} | Card Battles`;
    }
    return () => { document.title = 'Card Battles'; };
  }, [battle]);

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

  // Extract myVote from battle data
  useEffect(() => {
    if (battle?.myVotes) {
      setMyVote(battle.myVotes as Record<string, string>);
    }
  }, [battle]);

  const handleWatchToggle = async () => {
    if (!user) return;
    setWatchLoading(true);
    try {
      const method = watching ? 'DELETE' : 'POST';
      await fetch(`${BASE_URL}/battles/${id}/watch`, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setWatching(!watching);
    } catch {}
    setWatchLoading(false);
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
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/battles/${battle.id}`
    : `https://cardbattles.app/battles/${battle.id}`;
  const twitterShareText = `🥊 Card Battle: ${battle.left.playerName ?? 'Left'} vs ${battle.right.playerName ?? 'Right'}\nVote now and pick the 🏆\n#CardBattles #SportCards`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterShareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="space-y-4">
      <BackButton href="/feed" />
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

      {/* Tab selector */}
      <div className="flex rounded-xl overflow-hidden border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
        <button
          onClick={() => setActiveTab('overview')}
          className="flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-1.5"
          style={activeTab === 'overview'
            ? { background: 'rgba(108,71,255,0.15)', color: '#a78bfa', borderBottom: '2px solid #6c47ff' }
            : { color: '#64748b' }
          }
        >
          ⚔️ Overview
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className="flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-1.5"
          style={activeTab === 'stats'
            ? { background: 'rgba(108,71,255,0.15)', color: '#a78bfa', borderBottom: '2px solid #6c47ff' }
            : { color: '#64748b' }
          }
        >
          <BarChart2 size={14} /> Full Stats
        </button>
        <button
          onClick={() => setActiveTab('replay')}
          className="flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-1.5"
          style={activeTab === 'replay'
            ? { background: 'rgba(108,71,255,0.15)', color: '#a78bfa', borderBottom: '2px solid #6c47ff' }
            : { color: '#64748b' }
          }
        >
          ▶️ Replay
        </button>
      </div>

      {/* Stats tab content */}
      {activeTab === 'stats' && (
        <BattleStatsPanel battleId={id} battle={battle} />
      )}

      {/* Replay tab content */}
      {activeTab === 'replay' && (
        <BattleReplayPanel battleId={id} />
      )}

      {/* Overview tab content */}
      {activeTab === 'overview' && (<>
      <div className="grid grid-cols-2 gap-3">
        {[
          { asset: battle.left, side: 'left' as const },
          { asset: battle.right, side: 'right' as const },
        ].map(({ asset, side }) => (
          <div key={side} className="space-y-2">
            <button
              className="w-full rounded-xl overflow-hidden border border-[#1e1e2e] hover:border-[#6c47ff]/40 transition-all cursor-zoom-in"
              onClick={() => setLightboxSrc({ src: asset.imageUrl, alt: asset.playerName ?? asset.title })}
              aria-label={`View ${asset.playerName ?? asset.title} full screen`}
              title="Tap to view full screen"
            >
              <img
                src={asset.imageUrl}
                alt={asset.playerName ?? asset.title}
                className="w-full aspect-[3/4] object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    `https://placehold.co/300x400/12121a/6c47ff?text=${encodeURIComponent(asset.playerName ?? '?')}`;
                }}
              />
            </button>
            <div className="flex justify-center">
              <SaveCardButton assetId={asset.assetId} cardName={asset.playerName ?? asset.title} />
            </div>
          </div>
        ))}
      </div>

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
          {/* Price History Charts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-[10px] text-[#64748b] font-semibold truncate">{battle.left.playerName ?? battle.left.title}</p>
              <PriceHistoryChart cardId={battle.left.assetId} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-[#64748b] font-semibold truncate">{battle.right.playerName ?? battle.right.title}</p>
              <PriceHistoryChart cardId={battle.right.assetId} />
            </div>
          </div>
          {/* Price Alert stubs */}
          <div>
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-semibold mb-2">🔔 Price Alerts (PSA 10)</p>
            <div className="grid grid-cols-2 gap-2">
              {valuations.left && (
                <PriceAlertWidget cardId={`${id}-left`} playerName={battle.left.playerName ?? battle.left.title} />
              )}
              {valuations.right && (
                <PriceAlertWidget cardId={`${id}-right`} playerName={battle.right.playerName ?? battle.right.title} />
              )}
            </div>
            <p className="text-[9px] text-[#374151] mt-1.5">Price alerts will notify you via email in production. <Link href="/alerts" className="text-[#6c47ff] hover:underline">View all alerts →</Link></p>
          </div>
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
        <VoteDistribution battle={battle} myVote={myVote} />
      )}

      {/* Category Insights */}
      <CategoryInsights battleId={id} battle={battle} />

      {/* Vote All */}
      {battle.status === 'live' && (
        <VoteAllButton battleId={id} battle={battle} onVoted={() => {}} />
      )}

      {/* Action row */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowShareModal(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.3)', color: '#6c47ff' }}
        >
          <Share2 size={14} />
          Share
        </button>

        {user && (
          <button
            onClick={handleWatchToggle}
            disabled={watchLoading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={watching
              ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }
              : { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }
            }
            title={watching ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Bookmark size={14} fill={watching ? 'currentColor' : 'none'} />
            {watching ? 'Watching' : 'Watch'}
          </button>
        )}

        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Twitter/X"
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
                    aria-label="Like comment"
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
                aria-label="Add a comment"
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#6c47ff]/50 pr-16"
              />
              <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-[#374151]">
                {commentText.length}/280
              </div>
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isPosting}
                aria-label="Submit comment"
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
      </>)}

      {showShareModal && <ShareModal battle={battle} onClose={() => setShowShareModal(false)} />}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc.src}
          alt={lightboxSrc.alt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
}
