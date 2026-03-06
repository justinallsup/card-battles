'use client';
import { useState, useEffect } from 'react';
import { Crown, Check, Sparkles, Zap, BarChart2, BadgeCheck, Lock } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

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

      <p className="text-center text-xs text-[#374151] pb-2">
        Card Battles Pro · $9.99/month · Stripe-secured billing
      </p>
    </div>
  );
}
