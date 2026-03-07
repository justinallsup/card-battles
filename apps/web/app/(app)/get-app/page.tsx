'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BackButton } from '../../../components/ui/BackButton';
import { Zap, Bell, WifiOff, Share2, Check } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

function QRCodeSVG() {
  // Simple decorative QR-like graphic
  const cells = [
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,0,1,1,0,1,1,0,1],
    [0,1,0,0,1,0,0,0,1,0,0,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,0,0,1,1,0,0,1],
    [1,1,1,1,1,1,1,1,0,1,0,1,0,0,1,0,0],
    [1,0,0,0,0,0,1,0,1,0,0,1,1,1,0,1,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,0,0,1],
    [1,0,0,0,0,0,1,1,1,0,1,1,0,1,1,0,0],
    [1,1,1,1,1,1,1,0,1,1,0,0,1,0,0,1,1],
  ];
  const size = 8;
  const total = cells.length * size;
  return (
    <svg viewBox={`0 0 ${total} ${total}`} className="w-full" style={{ maxWidth: 136 }}>
      {cells.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * size}
              y={y * size}
              width={size}
              height={size}
              fill="#f1f5f9"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function GetAppPage() {
  const [email, setEmail] = useState('');
  const [waitlistState, setWaitlistState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [position, setPosition] = useState<number | null>(null);
  const [shareToast, setShareToast] = useState(false);
  useEffect(() => { document.title = 'Get the App | Card Battles'; }, []);

  const handleWaitlist = async () => {
    if (!email.includes('@') || waitlistState !== 'idle') return;
    setWaitlistState('loading');
    try {
      const res = await fetch(`${BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setPosition(data.position);
        setWaitlistState('done');
      } else {
        setWaitlistState('idle');
      }
    } catch {
      setWaitlistState('idle');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Card Battles',
      text: 'Vote on sports card battles — it\'s addictive!',
      url: 'https://cardbattles.app',
    };
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as Navigator).share(shareData);
      } else {
        await navigator.clipboard.writeText('https://cardbattles.app');
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      }
    } catch {}
  };

  return (
    <div className="space-y-5 pb-4">
      <BackButton href="/feed" />

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-white">📱 Get Card Battles</h1>
      </div>

      {/* Hero */}
      <div
        className="rounded-2xl p-6 text-center border border-[#6c47ff]/30 space-y-2"
        style={{ background: 'linear-gradient(135deg, #12121a, #1a0a2e)' }}
      >
        <div className="text-5xl mb-3">⚔️</div>
        <h2 className="text-xl font-black text-white">The Ultimate Card Battle App</h2>
        <p className="text-sm text-[#94a3b8]">
          Vote on iconic sports cards, track prices, and compete with collectors worldwide.
          Available anywhere — always in your pocket.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 gap-3">
        {[
          {
            icon: <Zap size={20} className="text-[#f59e0b]" />,
            bg: 'rgba(245,158,11,0.08)',
            border: 'rgba(245,158,11,0.25)',
            title: 'Instant battles',
            desc: 'Vote in seconds — swipe left or right to decide the greatest card.',
          },
          {
            icon: <Bell size={20} className="text-[#6c47ff]" />,
            bg: 'rgba(108,71,255,0.08)',
            border: 'rgba(108,71,255,0.25)',
            title: 'Live notifications',
            desc: 'Never miss a result — get notified when your battles end.',
          },
          {
            icon: <WifiOff size={20} className="text-[#22c55e]" />,
            bg: 'rgba(34,197,94,0.08)',
            border: 'rgba(34,197,94,0.25)',
            title: 'Works offline',
            desc: 'Browse your collection anywhere — even without signal.',
          },
        ].map((f, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 rounded-xl border"
            style={{ background: f.bg, borderColor: f.border }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              {f.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{f.title}</p>
              <p className="text-xs text-[#64748b] mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Install PWA */}
      <div
        className="rounded-xl border border-[#1e1e2e] overflow-hidden"
        style={{ background: '#12121a' }}
      >
        <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
          <span className="text-base">⚡</span>
          <h3 className="text-sm font-bold text-white">Install Now (PWA)</h3>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            Free
          </span>
        </div>
        <div className="p-4 space-y-4">
          {/* Chrome / Android */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <p className="text-xs font-bold text-white">Chrome / Android</p>
            </div>
            <ol className="space-y-1.5 pl-2">
              {[
                'Open this site in Chrome',
                'Tap the ⋮ menu (top-right)',
                'Tap "Add to Home Screen"',
                'Tap "Add" to confirm',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#94a3b8]">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(108,71,255,0.2)', color: '#a78bfa' }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="h-px bg-[#1e1e2e]" />

          {/* Safari / iOS */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🍎</span>
              <p className="text-xs font-bold text-white">Safari / iOS</p>
            </div>
            <ol className="space-y-1.5 pl-2">
              {[
                'Open this site in Safari',
                'Tap the Share button (↑) at the bottom',
                'Scroll down and tap "Add to Home Screen"',
                'Tap "Add" in the top-right',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#94a3b8]">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(108,71,255,0.2)', color: '#a78bfa' }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Scan to open on mobile</p>
            <div
              className="p-3 rounded-xl border border-[#1e1e2e]"
              style={{ background: '#1e1e2e' }}
            >
              <QRCodeSVG />
            </div>
            <p className="text-[9px] text-[#374151]">cardbattles.app</p>
          </div>
        </div>
      </div>

      {/* Coming soon — app stores */}
      <div
        className="rounded-xl p-4 border border-[#374151] text-center space-y-3"
        style={{ background: '#0a0a0f' }}
      >
        <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Coming Soon</p>
        <p className="text-sm font-bold text-white">Native apps for iOS & Android</p>
        <div className="flex gap-3 justify-center">
          {/* App Store placeholder */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#374151]"
            style={{ background: '#12121a' }}
          >
            <span className="text-2xl">🍎</span>
            <div className="text-left">
              <p className="text-[9px] text-[#64748b]">Download on the</p>
              <p className="text-xs font-bold text-white">App Store</p>
            </div>
          </div>
          {/* Play Store placeholder */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#374151]"
            style={{ background: '#12121a' }}
          >
            <span className="text-2xl">▶️</span>
            <div className="text-left">
              <p className="text-[9px] text-[#64748b]">Get it on</p>
              <p className="text-xs font-bold text-white">Google Play</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[#374151]">Join the waitlist to be notified at launch</p>
      </div>

      {/* Beta waitlist */}
      <div
        className="rounded-xl p-4 border border-[#6c47ff]/30 space-y-3"
        style={{ background: 'rgba(108,71,255,0.05)' }}
      >
        <h3 className="text-sm font-bold text-white text-center">🚀 Join the Beta Waitlist</h3>
        <p className="text-xs text-[#64748b] text-center">
          Be the first to know when the native app launches. No spam, ever.
        </p>

        {waitlistState === 'done' ? (
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-sm font-black text-white">You&apos;re on the list!</p>
            {position && (
              <p className="text-xs text-[#22c55e] mt-1">You are #{position} in the queue</p>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleWaitlist()}
              className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#6c47ff]"
            />
            <button
              onClick={handleWaitlist}
              disabled={!email.includes('@') || waitlistState === 'loading'}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all flex items-center gap-1"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
            >
              {waitlistState === 'loading' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Join'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Social share */}
      <div
        className="rounded-xl p-4 text-center border border-[#1e1e2e] space-y-3"
        style={{ background: '#12121a' }}
      >
        <p className="text-sm font-bold text-white">📣 Share Card Battles with friends</p>
        <p className="text-xs text-[#64748b]">The more collectors vote, the better the rankings get!</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-[#6c47ff]/40 transition-all"
            style={{ background: 'rgba(108,71,255,0.1)', color: '#a78bfa' }}
          >
            {shareToast ? (
              <><Check size={14} className="text-[#22c55e]" /> Copied!</>
            ) : (
              <><Share2 size={14} /> Share</>
            )}
          </button>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out Card Battles — vote on the greatest sports cards ever! ⚔️')}&url=${encodeURIComponent('https://cardbattles.app')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-[#1da1f2]/40 transition-all"
            style={{ background: 'rgba(29,161,242,0.08)', color: '#1da1f2' }}
          >
            𝕏 Tweet
          </a>
        </div>
      </div>

      {/* Back to app */}
      <Link
        href="/feed"
        className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white transition-all"
        style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
      >
        ⚔️ Back to Battles
      </Link>
    </div>
  );
}
