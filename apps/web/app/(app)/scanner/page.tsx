'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { BackButton } from '../../../components/ui/BackButton';
import { Camera, Upload, Zap, Star } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

const SPORT_EMOJI: Record<string, string> = {
  nfl: '🏈', nba: '🏀', mlb: '⚾', nhl: '🏒', soccer: '⚽',
};

interface ScannedCard {
  id: string;
  playerName: string;
  year: number;
  title: string;
  imageUrl: string;
  sport: string;
  estimatedValue: number;
}

interface ScanResult {
  matched: boolean;
  confidence: number;
  card: ScannedCard;
}

type ScanState = 'idle' | 'scanning' | 'result';

export default function ScannerPage() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runScan = async (delayMs = 3000) => {
    setScanState('scanning');
    setProgress(0);
    setError(null);

    // Animate progress bar
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / delayMs) * 100, 95);
      setProgress(pct);
      if (elapsed < delayMs) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    await new Promise(r => setTimeout(r, delayMs));

    try {
      const res = await fetch(`${BASE}/cards/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: null }),
      });
      const data = await res.json();
      setProgress(100);
      await new Promise(r => setTimeout(r, 300));
      setResult(data as ScanResult);
      setScanState('result');
    } catch {
      setError('Scan failed. Please try again.');
      setScanState('idle');
    }
  };

  const handleViewfinderTap = () => {
    if (scanState !== 'idle') return;
    runScan(3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    runScan(2000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    setScanState('idle');
    setResult(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="space-y-4 pb-4">
      <BackButton href="/feed" />

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-black text-white mb-1">📸 Card Scanner</h1>
        <div
          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
          style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.3)' }}
        >
          Beta
        </div>
        <p className="text-sm text-[#64748b] mt-2">Point your camera at a card to identify it instantly</p>
      </div>

      {/* Scanner viewfinder */}
      {scanState !== 'result' && (
        <button
          onClick={handleViewfinderTap}
          disabled={scanState === 'scanning'}
          className="relative w-full rounded-2xl overflow-hidden transition-all"
          style={{
            aspectRatio: '3/4',
            maxHeight: 360,
            border: scanState === 'scanning'
              ? '2px solid #6c47ff'
              : '2px dashed #374151',
            background: '#0a0a0f',
            cursor: scanState === 'scanning' ? 'default' : 'pointer',
          }}
          aria-label="Tap to scan card"
        >
          {/* Corner brackets */}
          {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} w-8 h-8`}
              style={{
                borderTop: i < 2 ? '3px solid #6c47ff' : 'none',
                borderBottom: i >= 2 ? '3px solid #6c47ff' : 'none',
                borderLeft: i % 2 === 0 ? '3px solid #6c47ff' : 'none',
                borderRight: i % 2 === 1 ? '3px solid #6c47ff' : 'none',
                borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
              }}
            />
          ))}

          {scanState === 'idle' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(108,71,255,0.15)', border: '2px solid rgba(108,71,255,0.3)' }}
              >
                <Camera size={36} className="text-[#6c47ff]" />
              </div>
              <p className="text-white font-bold text-sm">Tap to scan</p>
              <p className="text-[#64748b] text-xs">Hold card in frame</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              {/* Scanning animation */}
              <div className="relative w-24 h-24">
                <div
                  className="absolute inset-0 rounded-full border-4 border-[#6c47ff] border-t-transparent animate-spin"
                  style={{ animationDuration: '1s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={28} className="text-[#6c47ff]" />
                </div>
              </div>
              <p className="text-white font-bold text-sm animate-pulse">Scanning…</p>

              {/* Scan line animation */}
              <div
                className="absolute left-8 right-8 h-0.5 bg-[#6c47ff]"
                style={{
                  animation: 'scanLine 1.5s ease-in-out infinite',
                  top: '40%',
                  boxShadow: '0 0 8px rgba(108,71,255,0.8)',
                }}
              />

              {/* Progress bar */}
              <div className="w-48 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6c47ff, #a78bfa)' }}
                />
              </div>
              <p className="text-[#64748b] text-xs">{Math.round(progress)}%</p>
            </div>
          )}
        </button>
      )}

      {/* Result */}
      {scanState === 'result' && result && (
        <div
          className="rounded-2xl border border-[#22c55e]/40 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #12121a, #0a0a0f)' }}
        >
          {/* Match header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-sm font-black text-white">Match Found!</p>
                <p className="text-xs text-[#22c55e]">{result.confidence}% confidence</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#374151] text-[#64748b] hover:text-white hover:border-[#6c47ff] transition-all"
            >
              Scan Again
            </button>
          </div>

          {/* Card detail */}
          <div className="p-4 flex gap-4">
            <div className="w-24 shrink-0">
              <img
                src={result.card.imageUrl}
                alt={result.card.playerName}
                className="w-full aspect-[3/4] object-cover rounded-xl border border-[#1e1e2e]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    `https://placehold.co/300x400/12121a/6c47ff?text=${encodeURIComponent(result.card.playerName)}`;
                }}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-base font-black text-white">{result.card.playerName}</p>
                <p className="text-xs text-[#64748b]">{result.card.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">{SPORT_EMOJI[result.card.sport] || '🃏'}</span>
                  <span className="text-xs text-[#94a3b8]">{result.card.year}</span>
                </div>
              </div>
              <div
                className="rounded-xl p-2.5"
                style={{ background: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.2)' }}
              >
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider">Est. Value (PSA 10)</p>
                <p className="text-lg font-black text-[#a78bfa]">
                  ${result.card.estimatedValue >= 1000
                    ? `${(result.card.estimatedValue / 1000).toFixed(1)}k`
                    : result.card.estimatedValue.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/players/${encodeURIComponent(result.card.playerName)}`}
                  className="flex-1 text-center py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
                >
                  View Battles
                </Link>
                <Link
                  href="/grader"
                  className="flex-1 text-center py-2 rounded-xl text-xs font-bold border border-[#374151] text-[#94a3b8] hover:border-[#6c47ff] hover:text-[#a78bfa] transition-all"
                >
                  Grade This Card
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-xl p-3 text-center text-sm text-[#ef4444]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Upload + instructions */}
      <div className="space-y-3">
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={scanState === 'scanning'}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanState === 'scanning'}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-all disabled:opacity-50"
            style={{ background: 'rgba(108,71,255,0.08)', borderColor: 'rgba(108,71,255,0.3)', color: '#a78bfa' }}
          >
            <Upload size={16} />
            Upload Photo
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '🎯', label: 'Point camera at card front' },
            { icon: '💡', label: 'Good lighting helps accuracy' },
            { icon: '📐', label: 'Keep card flat and centered' },
          ].map((tip, i) => (
            <div
              key={i}
              className="rounded-xl p-3 text-center border border-[#1e1e2e]"
              style={{ background: '#12121a' }}
            >
              <p className="text-xl mb-1">{tip.icon}</p>
              <p className="text-[10px] text-[#64748b]">{tip.label}</p>
            </div>
          ))}
        </div>

        {/* Demo notice */}
        <div
          className="rounded-xl p-3 flex items-start gap-2 border border-[#374151]"
          style={{ background: '#0a0a0f' }}
        >
          <Star size={14} className="text-[#f59e0b] mt-0.5 shrink-0" />
          <p className="text-xs text-[#64748b]">
            <span className="font-bold text-[#94a3b8]">Card recognition powered by AI</span> — coming soon.
            This demo returns a random card to simulate the experience.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-60px); opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { transform: translateY(60px); }
        }
      `}</style>
    </div>
  );
}
