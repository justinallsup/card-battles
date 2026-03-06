'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';

type Auction = {
  id: string;
  cardId: string;
  playerName: string;
  imageUrl: string;
  title: string;
  currentBid: number;
  startingBid: number;
  bidCount: number;
  highBidder: string;
  endsAt: string;
  status: 'live' | 'ended';
  grade: number;
  certNumber: string;
};

function timeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function BidModal({
  auction,
  onClose,
  onBid,
}: {
  auction: Auction;
  onClose: () => void;
  onBid: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState<string>(String(auction.currentBid + 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num < 1) {
      setError('Enter a valid bid amount');
      return;
    }
    if (num < auction.currentBid + 10) {
      setError(`You've been outbid! Minimum bid is $${auction.currentBid + 10}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onBid(num);
      setSuccess(`Bid of $${num.toLocaleString()} placed! (Demo mode — bids are not real)`);
    } catch {
      setError('Failed to place bid. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl p-6" style={{ background: '#12121a', border: '1px solid #1e1e2e' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-white">Place Bid</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-white text-xl">✕</button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-green-400 font-bold text-lg mb-2">{success}</p>
            <p className="text-[#64748b] text-sm mb-4">Demo mode: bids don't affect real auctions.</p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4 p-3 rounded-xl" style={{ background: '#0a0a0f' }}>
              <p className="text-[#64748b] text-xs mb-1">Current bid</p>
              <p className="text-white font-black text-2xl">${auction.currentBid.toLocaleString()}</p>
              <p className="text-[#64748b] text-xs mt-1">by {auction.highBidder} · {auction.bidCount} bids</p>
            </div>

            <label className="block text-[#64748b] text-xs font-semibold mb-1 uppercase tracking-wider">
              Your Bid (min ${auction.currentBid + 10})
            </label>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#6c47ff] text-xl font-black">$</span>
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-lg outline-none"
                style={{ background: '#1e1e2e', border: '1px solid #374151' }}
                min={auction.currentBid + 10}
                step="1"
              />
            </div>

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm font-semibold">⚠️ {error}</p>
              </div>
            )}

            <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-yellow-400 text-xs">⚠️ Demo mode — bids are not real. eBay integration coming soon.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-black text-white text-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}
            >
              {loading ? 'Placing Bid...' : '🔨 Place Bid'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState(timeLeft(endsAt));
  useEffect(() => {
    const t = setInterval(() => setLabel(timeLeft(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  const isUrgent = new Date(endsAt).getTime() - Date.now() < 3600000;
  return (
    <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-red-400' : 'text-[#a78bfa]'}`}>
      {label}
    </span>
  );
}

export default function AuctionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState<Auction | null>(null);

  const fetchAuctions = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auctions');
      const data = await res.json();
      setAuctions(data.auctions || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  const handleBid = async (amount: number) => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    const res = await fetch(`/api/v1/auctions/${bidding!.id}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Bid failed');
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">🔨 Live Auctions</h1>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-black text-white animate-pulse"
              style={{ background: '#ef4444' }}
            >
              LIVE
            </span>
          </div>
          <p className="text-[#64748b] text-sm mt-0.5">Bid on graded cards in real-time</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: '#1e1e2e' }} />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔨</div>
          <p className="text-white font-bold text-lg">No live auctions right now</p>
          <p className="text-[#64748b] text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {auctions.map(auction => (
            <div
              key={auction.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
            >
              <div className="flex gap-4 p-4">
                {/* Card image */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-24 h-32 rounded-xl overflow-hidden"
                    style={{ border: '1px solid #1e1e2e' }}
                  >
                    {auction.imageUrl ? (
                      <img
                        src={auction.imageUrl}
                        alt={auction.playerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-3xl"
                        style={{ background: '#1e1e2e' }}
                      >
                        🃏
                      </div>
                    )}
                  </div>
                  {/* Grade badge */}
                  <div
                    className="absolute -top-1.5 -right-1.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                    style={{
                      background: auction.grade === 10 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
                      color: '#000',
                      boxShadow: auction.grade === 10 ? '0 0 8px rgba(245,158,11,0.6)' : '0 0 8px rgba(148,163,184,0.4)',
                    }}
                  >
                    {auction.grade}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-black text-base leading-tight">{auction.playerName}</p>
                      <p className="text-[#64748b] text-xs mt-0.5 truncate">{auction.title}</p>
                      <p className="text-[#374151] text-[10px] mt-1 font-mono">PSA {auction.grade} · #{auction.certNumber}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#64748b] text-[10px]">Ends in</p>
                      <CountdownTimer endsAt={auction.endsAt} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-[#64748b] text-xs">Current bid</p>
                      <p className="text-white font-black text-xl">
                        ${auction.currentBid.toLocaleString()}
                      </p>
                      <p className="text-[#64748b] text-[10px]">{auction.bidCount} bids · @{auction.highBidder}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (!user) { router.push('/login'); return; }
                        setBidding(auction);
                      }}
                      className="px-4 py-2.5 rounded-xl font-black text-white text-sm"
                      style={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}
                    >
                      🔨 Bid
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* eBay teaser */}
      <div
        className="mt-6 p-4 rounded-2xl text-center"
        style={{ background: 'rgba(108,71,255,0.06)', border: '1px solid rgba(108,71,255,0.15)' }}
      >
        <p className="text-[#a78bfa] font-bold text-sm">🛒 Coming Soon: Real auctions via eBay integration</p>
        <p className="text-[#64748b] text-xs mt-1">Browse and bid on real graded cards directly</p>
      </div>

      {/* Bid modal */}
      {bidding && (
        <BidModal
          auction={bidding}
          onClose={() => setBidding(null)}
          onBid={handleBid}
        />
      )}
    </div>
  );
}
