'use client';
import { useState, useEffect } from 'react';
import { Crown, Check, Sparkles, Zap, BarChart2, BadgeCheck, Lock, Copy, Twitter, Users, Gift, CreditCard, ClipboardCheck, Trophy } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3333/api/v1');

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  'Unlimited battle creation': <Zap size={16} className="text-[#f59e0b]" />,
  'Advanced analytics': <BarChart2 size={16} className="text-[#6c47ff]" />,
  'Pro badge on profile': <BadgeCheck size={16} className="text-[#22c55e]" />,
  'Early access to new features': <Sparkles size={16} className="text-[#a78bfa]" />,
  'No ads': <Lock size={16} className="text-[#94a3b8]" />,
};

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

interface ReferralData {
  code: string;
  uses: number;
  reward: string;
  shareUrl: string;
  message: string;
}

// ── Gift Card Section ─────────────────────────────────────────────────────────

interface GiftCardData {
  id: string;
  code: string;
  fromUsername: string;
  toUsername?: string;
  amount: number;
  redeemed: boolean;
  createdAt: string;
  expiresAt: string;
}

function GiftCardSection() {
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [toUsername, setToUsername] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdCard, setCreatedCard] = useState<GiftCardData | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [sentCards, setSentCards] = useState<GiftCardData[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  const AMOUNTS = [5, 10, 25, 50];

  useEffect(() => {
    const token = localStorage.getItem('cb_access_token');
    if (!token) return;
    setLoadingCards(true);
    fetch(`${BASE_URL}/me/gift-cards`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setSentCards(d.giftCards ?? []); setLoadingCards(false); })
      .catch(() => setLoadingCards(false));
  }, [createdCard]);

  const handleCreate = async () => {
    const token = localStorage.getItem('cb_access_token');
    if (!token) { alert('Log in to create gift cards'); return; }
    setCreating(true);
    try {
      const res = await fetch(`${BASE_URL}/gift-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: selectedAmount, toUsername: toUsername.trim() || undefined }),
      });
      const data = await res.json() as GiftCardData & { message?: string };
      if (res.ok) {
        setCreatedCard(data);
        setToUsername('');
      }
    } catch {}
    setCreating(false);
  };

  const handleCopyCode = async () => {
    if (!createdCard) return;
    try {
      await navigator.clipboard.writeText(createdCard.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {}
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    const token = localStorage.getItem('cb_access_token');
    if (!token) { setRedeemStatus({ error: 'You must be logged in to redeem' }); return; }
    setRedeeming(true);
    setRedeemStatus(null);
    try {
      const res = await fetch(`${BASE_URL}/gift-cards/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (res.ok) {
        setRedeemStatus({ success: true, message: data.message });
        setRedeemCode('');
      } else {
        setRedeemStatus({ error: data.error || 'Invalid code' });
      }
    } catch {
      setRedeemStatus({ error: 'Failed to redeem. Please try again.' });
    }
    setRedeeming(false);
  };

  return (
    <div className="space-y-5">
      {/* Purchase Gift Card */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Gift size={16} className="text-[#f59e0b]" />
          Give the Gift of Pro
        </h3>
        <p className="text-xs text-[#64748b]">Gift a Pro credit to any collector. They get the perks, you get the karma.</p>

        {/* Amount tiles */}
        <div className="grid grid-cols-4 gap-2">
          {AMOUNTS.map(amt => (
            <button
              key={amt}
              onClick={() => setSelectedAmount(amt)}
              className="py-3 rounded-xl border-2 text-center transition-all"
              style={selectedAmount === amt
                ? { background: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b', color: '#f59e0b' }
                : { background: '#0a0a0f', borderColor: '#1e1e2e', color: '#64748b' }}
            >
              <p className="text-sm font-black">${amt}</p>
              <p className="text-[9px] mt-0.5">{amt === 5 ? '~2wk' : amt === 10 ? '~1mo' : amt === 25 ? '~3mo' : '~6mo'}</p>
            </button>
          ))}
        </div>

        {/* To username */}
        <div>
          <label className="text-xs text-[#64748b] block mb-1">To: @username (optional)</label>
          <input
            type="text"
            value={toUsername}
            onChange={e => setToUsername(e.target.value.replace('@', ''))}
            placeholder="username"
            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#f59e0b] transition-colors"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white' }}
        >
          {creating ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <><CreditCard size={16} /> Purchase Gift Card — ${selectedAmount}</>
          )}
        </button>
      </div>

      {/* Created card display */}
      {createdCard && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <div>
              <p className="text-sm font-black text-white">Gift Card Created!</p>
              <p className="text-xs text-[#64748b]">Share this code with your friend</p>
            </div>
          </div>
          <div
            className="rounded-xl p-3 flex items-center justify-between gap-3"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <p className="text-xl font-black text-white tracking-widest font-mono">{createdCard.code}</p>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
              style={codeCopied
                ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                : { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }
              }
            >
              {codeCopied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
            </button>
          </div>
          <div className="flex justify-between text-xs text-[#64748b]">
            <span>Amount: <span className="text-white font-bold">${createdCard.amount}</span></span>
            <span>Expires: {new Date(createdCard.expiresAt).toLocaleDateString()}</span>
          </div>
          <button
            onClick={() => setCreatedCard(null)}
            className="w-full py-2 rounded-lg text-xs text-[#64748b] hover:text-white transition-colors"
          >
            Create another →
          </button>
        </div>
      )}

      {/* Redeem section */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: '#12121a', border: '1px solid #1e1e2e' }}
      >
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <ClipboardCheck size={16} className="text-[#22c55e]" />
          Redeem a Gift Card
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={redeemCode}
            onChange={e => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#22c55e] font-mono tracking-wider"
          />
          <button
            onClick={handleRedeem}
            disabled={!redeemCode.trim() || redeeming}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}
          >
            {redeeming ? '…' : 'Redeem'}
          </button>
        </div>
        {redeemStatus?.success && (
          <p className="text-xs text-[#22c55e] flex items-center gap-1.5"><Check size={12} /> {redeemStatus.message}</p>
        )}
        {redeemStatus?.error && (
          <p className="text-xs text-[#ef4444]">❌ {redeemStatus.error}</p>
        )}
      </div>

      {/* Sent cards list */}
      {sentCards.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Your Gift Cards Sent</h3>
          {sentCards.map(card => (
            <div
              key={card.id}
              className="flex items-center justify-between p-3 rounded-xl border border-[#1e1e2e] bg-[#12121a]"
            >
              <div>
                <p className="text-sm font-mono font-bold text-white">{card.code}</p>
                <p className="text-xs text-[#64748b]">
                  ${card.amount} {card.toUsername ? `→ @${card.toUsername}` : ''}
                  {' · '}{new Date(card.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={card.redeemed
                  ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                  : { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }
                }
              >
                {card.redeemed ? '✓ Redeemed' : 'Active'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Referral Leaderboard Section ──────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  username: string;
  referrals: number;
  reward: string;
  earned: string;
}

function ReferralLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/referral/leaderboard`)
      .then(r => r.json())
      .then((d: { leaderboard: LeaderboardEntry[] }) => { setLeaderboard(d.leaderboard || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const RANK_BADGES = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <div className="space-y-3 mt-5 pt-5 border-t border-[#1e1e2e]">
      <div className="flex items-center gap-2">
        <Trophy size={16} className="text-[#f59e0b]" />
        <h3 className="text-sm font-black text-white">🏆 Top Referrers This Month</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-4 h-4 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-3 rounded-xl border border-[#1e1e2e] px-3 py-2.5"
              style={{ background: '#0a0a0f' }}
            >
              <span className="text-lg leading-none w-7 text-center flex-shrink-0">
                {RANK_BADGES[entry.rank - 1] ?? `${entry.rank}.`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">@{entry.username}</p>
                <p className="text-[10px] text-[#64748b]">{entry.referrals} referrals · {entry.reward}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  entry.earned === 'earned'
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-[#374151] text-[#64748b]'
                }`}
              >
                {entry.earned === 'earned' ? '✓ Earned' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Your position */}
      <div
        className="flex items-center gap-3 rounded-xl border p-3"
        style={{ background: 'rgba(108,71,255,0.06)', borderColor: 'rgba(108,71,255,0.2)' }}
      >
        <span className="text-lg leading-none">📍</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-[#a78bfa]">Your position: <strong className="text-white">#47</strong></p>
          <p className="text-[10px] text-[#64748b] mt-0.5">Invite friends to climb the leaderboard!</p>
        </div>
        <a
          href="/pro"
          className="text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all"
          style={{ background: 'rgba(108,71,255,0.15)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.3)' }}
        >
          Share ↗
        </a>
      </div>
    </div>
  );
}

// ── Referral Section ──────────────────────────────────────────────────────────
function ReferralSection() {
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('cb_access_token');
    if (!token) { setLoading(false); return; }
    fetch(`${BASE_URL}/me/referral`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setReferral(data as ReferralData); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCopyCode = async () => {
    if (!referral) return;
    try {
      await navigator.clipboard.writeText(referral.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyUrl = async () => {
    if (!referral) return;
    try {
      await navigator.clipboard.writeText(referral.shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    const token = localStorage.getItem('cb_access_token');
    if (!token) { setRedeemStatus({ error: 'You must be logged in to redeem a code' }); return; }
    setRedeeming(true);
    setRedeemStatus(null);
    try {
      const res = await fetch(`${BASE_URL}/referral/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (res.ok) {
        setRedeemStatus({ success: true, message: data.message });
        setRedeemCode('');
      } else {
        setRedeemStatus({ error: data.error || 'Invalid code' });
      }
    } catch {
      setRedeemStatus({ error: 'Failed to redeem. Please try again.' });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-5 h-5 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="text-center py-4 text-sm text-[#64748b]">
        <a href="/login" className="text-[#6c47ff] hover:underline">Log in</a> to get your referral code
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Users size={16} className="text-[#6c47ff]" />
          Refer Friends
        </h3>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.3)' }}
        >
          {referral.uses} referred
        </span>
      </div>

      <p className="text-xs text-[#64748b]">{referral.message}</p>

      {/* Big code box */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ background: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.25)' }}
      >
        <div className="flex-1">
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-1">Your Referral Code</p>
          <p className="text-2xl font-black text-white tracking-widest font-mono">{referral.code}</p>
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={copied
            ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
            : { background: 'rgba(108,71,255,0.15)', color: '#6c47ff', border: '1px solid rgba(108,71,255,0.3)' }
          }
        >
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>

      {/* Reward explanation */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        <span className="text-xl">🎁</span>
        <p className="text-xs text-[#f59e0b]">
          Get <strong>1 month Pro free</strong> for each friend who joins using your code
        </p>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyUrl}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all"
          style={copiedUrl
            ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }
            : { background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.3)', color: '#6c47ff' }
          }
        >
          {copiedUrl ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on Card Battles — the best sports card voting app! Use my code ${referral.code} for a free bonus 🃏 ${referral.shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(29,161,242,0.1)', border: '1px solid rgba(29,161,242,0.3)', color: '#1da1f2' }}
        >
          <Twitter size={14} /> Share
        </a>
      </div>

      {/* Redeem someone else's code */}
      <div className="rounded-xl p-4 border border-[#1e1e2e] space-y-3" style={{ background: '#0a0a0f' }}>
        <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Have a Referral Code?</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={redeemCode}
            onChange={e => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="Enter code…"
            className="flex-1 bg-[#12121a] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] font-mono"
          />
          <button
            onClick={handleRedeem}
            disabled={!redeemCode.trim() || redeeming}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}
          >
            {redeeming ? '…' : 'Redeem'}
          </button>
        </div>
        {redeemStatus?.success && (
          <p className="text-xs text-[#22c55e] flex items-center gap-1"><Check size={11} /> {redeemStatus.message}</p>
        )}
        {redeemStatus?.error && (
          <p className="text-xs text-[#ef4444]">❌ {redeemStatus.error}</p>
        )}
      </div>

      {/* Referral Leaderboard */}
      <ReferralLeaderboard />
    </div>
  );
}

export default function ProPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');
  const [isPro] = useState(false); // In demo mode, always false

  useEffect(() => {
    fetch(`${BASE_URL}/billing/plans`)
      .then((r) => r.json())
      .then((data: { plans: Plan[] }) => {
        setPlan(data.plans[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    const token = localStorage.getItem('cb_access_token');
    if (!token) {
      setError('You must be logged in to subscribe');
      return;
    }
    setSubscribing(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/billing/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json() as { checkoutUrl?: string; message?: string };
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
      }
      if (data.message) {
        setError(data.message);
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPro) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#f59e0b] to-[#6c47ff] flex items-center justify-center shadow-2xl shadow-[#f59e0b]/30">
            <Crown size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">You&apos;re Pro! 👑</h1>
            <p className="text-[#64748b] mt-1">Enjoying all the premium benefits</p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-2xl border border-[#f59e0b]/30 p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#f59e0b] uppercase tracking-widest">Your Pro Benefits</h3>
          {plan?.features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              {FEATURE_ICONS[feature] ?? <Check size={16} className="text-[#22c55e]" />}
              <span className="text-sm text-[#f1f5f9]">{feature}</span>
              <Check size={14} className="ml-auto text-[#22c55e]" />
            </div>
          ))}
        </div>

        <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] p-5">
          <ReferralSection />
        </div>

        <div className="text-center">
          <p className="text-xs text-[#64748b]">
            Subscription renews monthly • Cancel anytime
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="text-center py-6 space-y-3">
        <div className="relative inline-block">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#f59e0b]/20 to-[#6c47ff]/20 border border-[#f59e0b]/30 flex items-center justify-center">
            <Crown size={36} className="text-[#f59e0b]" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#6c47ff] rounded-full flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Upgrade to Pro</h1>
          <p className="text-[#64748b] text-sm mt-1">Unlock the full Card Battles experience</p>
        </div>
      </div>

      {/* Pricing card */}
      <div className="relative rounded-2xl overflow-hidden border border-[#f59e0b]/40 bg-gradient-to-b from-[#f59e0b]/10 to-[#0a0a0f]">
        {/* Popular badge */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px">
          <div className="bg-[#f59e0b] text-[#0a0a0f] text-xs font-black px-4 py-1 rounded-b-lg">
            MOST POPULAR
          </div>
        </div>

        <div className="pt-8 pb-6 px-6 text-center">
          <h2 className="text-lg font-black text-white">{plan?.name ?? 'Card Battles Pro'}</h2>
          <div className="mt-3 flex items-end justify-center gap-1">
            <span className="text-4xl font-black text-white">
              ${plan ? (plan.price / 100).toFixed(2) : '9.99'}
            </span>
            <span className="text-[#64748b] mb-1.5">/ {plan?.interval ?? 'month'}</span>
          </div>
          <p className="text-xs text-[#64748b] mt-1">Billed monthly · Cancel anytime</p>
        </div>

        {/* Features list */}
        <div className="px-6 pb-6 space-y-3">
          {(plan?.features ?? [
            'Unlimited battle creation',
            'Advanced analytics',
            'Pro badge on profile',
            'Early access to new features',
            'No ads',
          ]).map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center shrink-0">
                <Check size={13} className="text-[#22c55e]" />
              </div>
              <div className="flex items-center gap-2 flex-1">
                {FEATURE_ICONS[feature]}
                <span className="text-sm text-[#f1f5f9]">{feature}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white font-black text-base shadow-lg shadow-[#f59e0b]/30 hover:opacity-90 transition-opacity active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {subscribing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Crown size={18} />
                Upgrade to Pro — ${plan ? (plan.price / 100).toFixed(2) : '9.99'}/mo
              </>
            )}
          </button>

          {error && (
            <div className="mt-3 text-center">
              <p className={`text-xs ${error.includes('demo') ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                {error.includes('demo') ? '⚠️ ' : '❌ '}{error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '🔒', label: 'Secure Payment', sub: 'via Stripe' },
          { icon: '↩️', label: 'Cancel Anytime', sub: 'No lock-in' },
          { icon: '💳', label: 'All Cards', sub: 'Accepted' },
        ].map(({ icon, label, sub }) => (
          <div key={label} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{icon}</div>
            <p className="text-xs font-semibold text-[#f1f5f9]">{label}</p>
            <p className="text-[10px] text-[#64748b]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Referral section */}
      <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] p-5">
        <ReferralSection />
      </div>

      {/* Gift Card section */}
      <div className="bg-[#12121a] rounded-2xl border border-[#f59e0b]/20 p-5">
        <GiftCardSection />
      </div>

      <p className="text-center text-xs text-[#374151] pb-2">
        Card Battles Pro · $9.99/month · Stripe-secured billing
      </p>
    </div>
  );
}
