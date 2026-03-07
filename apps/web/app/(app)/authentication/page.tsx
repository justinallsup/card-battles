'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Shield, ExternalLink, Search, Info } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface RedFlag {
  sign: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
}

interface VerifyStep {
  step: number;
  action: string;
  detail: string;
}

interface CommonFake {
  card: string;
  note: string;
}

interface Resource {
  name: string;
  url: string;
}

interface GuideData {
  redFlags: RedFlag[];
  howToVerify: VerifyStep[];
  commonFakes: CommonFake[];
  resources: Resource[];
}

const SEVERITY_CONFIG = {
  high: {
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    badge: 'bg-red-500/20 text-red-400',
    icon: '🔴',
    label: 'HIGH',
  },
  medium: {
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.3)',
    badge: 'bg-orange-500/20 text-orange-400',
    icon: '🟠',
    label: 'MEDIUM',
  },
  low: {
    bg: 'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.3)',
    badge: 'bg-yellow-500/20 text-yellow-400',
    icon: '🟡',
    label: 'LOW',
  },
};

const STEP_ICONS = ['🔍', '💡', '📊', '🏪', '💬'];

export default function AuthenticationGuidePage() {
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/authentication-guide`)
      .then(r => r.json())
      .then(d => { setGuide(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin text-4xl">🔍</div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="text-center py-24 text-[#64748b]">
        Failed to load guide. Please try again.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="text-5xl mb-2">🔍</div>
        <h1 className="text-2xl font-black text-white">Authenticating Cards</h1>
        <p className="text-[#94a3b8] text-sm leading-relaxed">
          Protect yourself from fakes, reprints, and counterfeit cards.
          Learn the red flags and how to verify authenticity before buying.
        </p>
      </div>

      {/* Disclaimer */}
      <div
        className="flex items-start gap-3 rounded-2xl border p-4"
        style={{ background: 'rgba(108,71,255,0.06)', borderColor: 'rgba(108,71,255,0.2)' }}
      >
        <Info size={18} className="text-[#6c47ff] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#94a3b8] leading-relaxed">
          <strong className="text-[#a78bfa]">Educational content only</strong> — Card Battles is not a card
          authentication service. Always consult professional graders (PSA, BGS, SGC) for official authentication.
        </p>
      </div>

      {/* Red Flags */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-400" />
          <h2 className="text-lg font-black text-white">🚨 Red Flags</h2>
        </div>
        <p className="text-xs text-[#64748b] -mt-1">Watch out for these warning signs when buying cards.</p>
        <div className="space-y-2">
          {guide.redFlags.map((flag, i) => {
            const cfg = SEVERITY_CONFIG[flag.severity];
            return (
              <div
                key={i}
                className="rounded-2xl border p-4 space-y-1.5"
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{cfg.icon}</span>
                    <p className="text-sm font-bold text-white">{flag.sign}</p>
                  </div>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed pl-6">{flag.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How to Verify */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-green-400" />
          <h2 className="text-lg font-black text-white">How to Verify</h2>
        </div>
        <p className="text-xs text-[#64748b] -mt-1">Follow these steps to authenticate a card before purchase.</p>
        <div className="space-y-2">
          {guide.howToVerify.map((step, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#1e1e2e] p-4 flex gap-3"
              style={{ background: '#12121a' }}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center">
                <span className="text-base leading-none">{STEP_ICONS[i] || '✅'}</span>
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#6c47ff]">STEP {step.step}</span>
                  <p className="text-sm font-bold text-white">{step.action}</p>
                </div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Known Fakes */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-orange-400" />
          <h2 className="text-lg font-black text-white">Known Fakes to Watch</h2>
        </div>
        <p className="text-xs text-[#64748b] -mt-1">These cards are commonly counterfeited — extra caution required.</p>
        <div className="space-y-2">
          {guide.commonFakes.map((fake, i) => (
            <div
              key={i}
              className="rounded-2xl border p-4 space-y-1.5"
              style={{ background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.25)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">⚠️</span>
                <p className="text-sm font-bold text-white">{fake.card}</p>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed pl-6">{fake.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trusted Resources */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-blue-400" />
          <h2 className="text-lg font-black text-white">Trusted Resources</h2>
        </div>
        <p className="text-xs text-[#64748b] -mt-1">Verify graded card authenticity through official sources.</p>
        <div className="grid grid-cols-1 gap-2">
          {guide.resources.map((resource, i) => (
            <a
              key={i}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#1e1e2e] p-4 hover:border-[#6c47ff]/40 transition-all group"
              style={{ background: '#12121a' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(108,71,255,0.15)' }}
                >
                  <span className="text-sm">🔗</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-[#6c47ff] transition-colors">
                    {resource.name}
                  </p>
                  <p className="text-[10px] text-[#64748b] mt-0.5">{resource.url}</p>
                </div>
              </div>
              <ExternalLink size={14} className="text-[#64748b] group-hover:text-[#6c47ff] transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      </section>

      {/* Final disclaimer */}
      <div
        className="rounded-2xl border p-4 text-center"
        style={{ background: '#12121a', borderColor: '#1e1e2e' }}
      >
        <p className="text-xs text-[#64748b] leading-relaxed">
          🛡️ When in doubt, only buy authenticated cards from PSA, BGS, or SGC.
          No guide replaces professional authentication for high-value purchases.
        </p>
      </div>

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
