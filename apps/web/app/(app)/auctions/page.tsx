'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { BackButton } from '../../../components/ui/BackButton';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cb_access_token');
}

type AuctionListing = {
  id: string;
  cardName: string;
  cardImage: string;
  sport: string;
  startingBid: number;
  currentBid: number;
  highBidder: string | null;
  bidCount: number;
  endsAt: string;
  status: 'live' | 'ended';
  condition: string;
  sellerId: string;
  sellerName: string;
};

const SPORT_EMOJI: Record<string, string> = {
  nfl: '🏈', nba: '🏀', mlb: '⚾', nhl: '🏒',
};

function timeLeft(endsAt: string): { label: string; isUrgent: boolean } {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { label: 'Ended', isUrgent: false };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const isUrgent = diff < 3600000; // < 1h
  if (h > 0) return { label: `${h}h ${m}m`, isUrgent };
  if (m > 0) return { label: `${m}m ${s}s`, isUrgent };
  return { label: `${s}s`, isUrgent: true };
}

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const { label, isUrgent } = timeLeft(endsAt);
  return (
    <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-red-400 animate-pulse' : 'text-[#a78bfa]'}`}>
      ⏱ {label}
    </span>
  );
}

function BidModal({ auction, onClose, onBid }: {
  auction: AuctionListing;
  onClose: () => void;
  onBid: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(auction.currentBid + 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= auction.currentBid) {
      setError(`Bid must be above $${auction.currentBid}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onBid(num);
      setSuccess(`Bid of $${num.toLocaleString()} placed!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place bid';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-t-3xl p-6"
        style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-white">🔨 Place Bid</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-white text-xl">✕</button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-green-400 font-bold text-lg mb-1">{success}</p>
            <p className="text-[#64748b] text-sm mb-4">You are the high bidder!</p>
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
            <div className="mb-4 p-3 rounded-xl" style={{ background: '#0a0a0f', border: '1px solid #1e1e2e' }}>
              <p className="text-[#64748b] text-xs mb-1 uppercase tracking-wider">Current bid</p>
              <p className="text-white font-black text-2xl">${auction.currentBid.toLocaleString()}</p>
              {auction.highBidder ? (
                <p className="text-[#64748b] text-xs mt-1">by @{auction.highBidder} · {auction.bidCount} bids</p>
              ) : (
                <p className="text-[#64748b] text-xs mt-1">No bids yet · Be the first!</p>
              )}
            </div>

            <label className="block text-[#64748b] text-xs font-semibold mb-1.5 uppercase tracking-wider">
              Your bid (must be &gt; ${auction.currentBid})
            </label>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#6c47ff] text-xl font-black">$</span>
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-lg outline-none"
                style={{ background: '#1e1e2e', border: '1px solid #374151' }}
                min={auction.currentBid + 1}
                step="1"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-red-400 text-sm font-semibold">⚠️ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-black text-white text-lg disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Bid...
                </span>
              ) : '🔨 Place Bid'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function AuctionCard({ auction, onBid, isLoggedIn, onLoginRequired }: {
  auction: AuctionListing;
  onBid: (a: AuctionListing) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}) {
  const isEnded = auction.status === 'ended' || new Date(auction.endsAt).getTime() <= Date.now();
  const sportEmoji = SPORT_EMOJI[auction.sport] || '🃏';

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        background: '#12121a',
        borderColor: isEnded ? '#1e1e2e' : 'rgba(108,71,255,0.3)',
      }}
    >
      <div className="flex gap-3 p-4">
        {/* Card image */}
        <div className="relative flex-shrink-0">
          <div
            className="w-20 h-28 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: '#1e1e2e', border: '1px solid #374151' }}
          >
            {auction.cardImage ? (
              <img
                src={auction.cardImage}
                alt={auction.cardName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl">{sportEmoji}</span>
            )}
          </div>
          {/* Condition badge */}
          <div
            className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-lg text-[9px] font-black"
            style={{ background: '#12121a', border: '1px solid #374151', color: '#94a3b8' }}
          >
            {auction.condition}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-1">
            <div className="min-w-0">
              <p className="text-white font-black text-sm leading-tight truncate">{auction.cardName}</p>
              <p className="text-[#64748b] text-[10px]">by @{auction.sellerName}</p>
            </div>
            {!isEnded && <CountdownTimer endsAt={auction.endsAt} />}
            {isEnded && (
              <span className="text-[10px] font-bold text-[#64748b] bg-[#1e1e2e] px-2 py-0.5 rounded-full flex-shrink-0">
                Ended
              </span>
            )}
          </div>

          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider">
                {isEnded ? 'Final bid' : 'Current bid'}
              </p>
              <p className="text-white font-black text-xl">${auction.currentBid.toLocaleString()}</p>
              {auction.highBidder ? (
                <p className="text-[10px] text-[#64748b]">
                  🏆 @{auction.highBidder} · {auction.bidCount} bids
                </p>
              ) : (
                <p className="text-[10px] text-[#64748b]">No bids yet</p>
              )}
            </div>

            {!isEnded && (
              <button
                onClick={() => isLoggedIn ? onBid(auction) : onLoginRequired()}
                className="px-3 py-2 rounded-xl font-black text-white text-sm transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #6c47ff, #a78bfa)' }}
              >
                Bid
              </button>
            )}

            {isEnded && auction.highBidder && (
              <div
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}
              >
                🏆 {auction.highBidder} won
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuctionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [live, setLive] = useState<AuctionListing[]>([]);
  const [ended, setEnded] = useState<AuctionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<AuctionListing | null>(null);

  const fetchAuctions = useCallback(async () => {
    try {
      const [liveRes, endedRes] = await Promise.all([
        fetch(`${BASE}/auctions?status=live`),
        fetch(`${BASE}/auctions?status=ended`),
      ]);
      const liveData = await liveRes.json();
      const endedData = await endedRes.json();
      setLive(liveData.listings || []);
      setEnded(endedData.listings || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Live Auctions | Card Battles';
    fetchAuctions();
    // Refresh every 30s
    const t = setInterval(fetchAuctions, 30000);
    return () => clearInterval(t);
  }, [fetchAuctions]);

  const handleBid = async (amount: number) => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    const res = await fetch(`${BASE}/auctions/${selectedAuction!.id}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Bid failed');
    // Update the local state
    if (data.auction) {
      setLive(prev => prev.map(a => a.id === data.auction.id ? data.auction : a));
    }
  };

  const handleBidClose = () => {
    setSelectedAuction(null);
    fetchAuctions();
  };

  return (
    <div className="space-y-5 pb-4">
      <BackButton href="/feed" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-white">🔨 Live Auctions</h1>
            {live.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-black text-red-400">LIVE</span>
              </div>
            )}
          </div>
          <p className="text-sm text-[#64748b] mt-0.5">Bid on sports cards with real countdown timers</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-2xl bg-[#12121a] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Live auctions */}
          {live.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center border border-[#1e1e2e]"
              style={{ background: '#12121a' }}
            >
              <div className="text-4xl mb-2">🔨</div>
              <p className="text-white font-bold">No live auctions right now</p>
              <p className="text-sm text-[#64748b] mt-1">Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {live.map(auction => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  onBid={setSelectedAuction}
                  isLoggedIn={!!user}
                  onLoginRequired={() => router.push('/login')}
                />
              ))}
            </div>
          )}

          {/* Ended auctions */}
          {ended.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Ended Auctions</h2>
                <div className="flex-1 h-px bg-[#1e1e2e]" />
              </div>
              <div className="space-y-3">
                {ended.map(auction => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    onBid={setSelectedAuction}
                    isLoggedIn={!!user}
                    onLoginRequired={() => router.push('/login')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Teaser */}
          <div
            className="rounded-xl p-4 text-center border border-[#1e1e2e]"
            style={{ background: '#12121a' }}
          >
            <p className="text-sm font-bold text-[#a78bfa]">🛒 eBay Integration Coming Soon</p>
            <p className="text-xs text-[#64748b] mt-1">Browse and bid on real graded cards directly</p>
          </div>
        </>
      )}

      {/* Bid modal */}
      {selectedAuction && (
        <BidModal
          auction={selectedAuction}
          onClose={handleBidClose}
          onBid={handleBid}
        />
      )}
    </div>
  );
}
