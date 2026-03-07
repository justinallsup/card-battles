'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scale, CheckCircle, XCircle, ExternalLink, ChevronRight } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface TurnaroundTier {
  name: string;
  time: string;
  price: number;
}

interface GradingService {
  id: string;
  name: string;
  fullName: string;
  founded: number;
  gradingScale: string;
  turnaroundTiers: TurnaroundTier[];
  pros: string[];
  cons: string[];
  bestFor: string;
  marketShare: number;
  avgPremium: number;
  websiteUrl: string;
}

const SERVICE_COLORS: Record<string, { bg: string; border: string; accent: string; badge: string }> = {
  psa: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', accent: '#3b82f6', badge: '#1d428a' },
  bgs: { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  accent: '#ef4444', badge: '#7f1d1d' },
  sgc: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.3)',  accent: '#22c55e', badge: '#14532d' },
};

const SERVICE_ICONS: Record<string, string> = {
  psa: '🔵',
  bgs: '🔴',
  sgc: '🟢',
};

// ── Flowchart recommendation quiz ─────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    q: 'What type of card are you grading?',
    answers: [
      { label: 'Vintage (pre-1980)', value: 'vintage' },
      { label: 'Modern (1980s–2010s)', value: 'modern' },
      { label: 'New (2015+)', value: 'new' },
    ],
  },
  {
    q: 'What matters most to you?',
    answers: [
      { label: 'Resale value / liquidity', value: 'resale' },
      { label: 'Detailed condition grading', value: 'detail' },
      { label: 'Lowest cost / fastest time', value: 'budget' },
    ],
  },
  {
    q: 'What is your card's estimated value?',
    answers: [
      { label: 'Under $100', value: 'low' },
      { label: '$100–$500', value: 'mid' },
      { label: 'Over $500', value: 'high' },
    ],
  },
];

function getRecommendation(answers: string[]): { service: string; reason: string } {
  const [type, priority, value] = answers;

  if (priority === 'budget' || value === 'low') {
    return { service: 'SGC', reason: 'SGC offers the lowest fees and fastest standard turnaround — ideal for budget submissions.' };
  }
  if (priority === 'detail' || type === 'new') {
    return { service: 'BGS', reason: 'BGS subgrades (centering, corners, edges, surface) give you the most detailed condition report — great for modern cards.' };
  }
  if (type === 'vintage' || priority === 'resale' || value === 'high') {
    return { service: 'PSA', reason: 'PSA has the highest market recognition and best eBay liquidity — the gold standard for valuable or vintage cards.' };
  }
  return { service: 'PSA', reason: 'PSA is the safest choice for most collectors thanks to its wide recognition and strong resale market.' };
}

export default function GradingServicesPage() {
  const [services, setServices] = useState<GradingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizStep, setQuizStep] = useState(-1); // -1 = not started
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<{ service: string; reason: string } | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/grading-services`)
      .then(r => r.json())
      .then((d: { services: GradingService[] }) => {
        setServices(d.services);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleQuizAnswer = (value: string) => {
    const newAnswers = [...quizAnswers, value];
    setQuizAnswers(newAnswers);
    if (newAnswers.length >= QUIZ_QUESTIONS.length) {
      setRecommendation(getRecommendation(newAnswers));
      setQuizStep(QUIZ_QUESTIONS.length);
    } else {
      setQuizStep(quizStep + 1);
    }
  };

  const resetQuiz = () => {
    setQuizStep(-1);
    setQuizAnswers([]);
    setRecommendation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-[#1e1e2e]">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)' }}>
              <Scale size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">⚖️ Grading Services Compared</h1>
              <p className="text-xs text-[#64748b]">PSA vs BGS vs SGC — Which is right for you?</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6 pt-5">

        {/* Market share overview */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4">
          <h2 className="text-sm font-black text-white mb-3 uppercase tracking-widest">Market Share</h2>
          <div className="space-y-3">
            {services.map((svc) => {
              const colors = SERVICE_COLORS[svc.id];
              return (
                <div key={svc.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{SERVICE_ICONS[svc.id]} {svc.name}</span>
                    <span className="text-xs text-[#94a3b8] font-mono">{Math.round(svc.marketShare * 100)}%</span>
                  </div>
                  <div className="h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${svc.marketShare * 100}%`, background: colors.accent }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Cards */}
        {services.map((svc) => {
          const colors = SERVICE_COLORS[svc.id];
          return (
            <div key={svc.id}
              className="rounded-2xl border overflow-hidden"
              style={{ background: colors.bg, borderColor: colors.border }}>

              {/* Service header */}
              <div className="px-4 py-4 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{SERVICE_ICONS[svc.id]}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-white">{svc.name}</h2>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                          style={{ background: colors.accent }}>
                          {Math.round(svc.avgPremium * 100)}% premium
                        </span>
                      </div>
                      <p className="text-xs text-[#94a3b8]">{svc.fullName} · Est. {svc.founded}</p>
                    </div>
                  </div>
                  <a href={svc.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors hover:opacity-80"
                    style={{ borderColor: colors.border, color: colors.accent }}>
                    Visit <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Grading scale */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748b] font-semibold">Scale:</span>
                  <span className="text-xs text-white font-bold">{svc.gradingScale}</span>
                </div>

                {/* Turnaround tiers */}
                <div>
                  <p className="text-xs font-black text-[#94a3b8] uppercase tracking-widest mb-2">Turnaround & Pricing</p>
                  <div className="space-y-1.5">
                    {svc.turnaroundTiers.map((tier) => (
                      <div key={tier.name} className="flex items-center justify-between bg-[#0a0a0f]/60 rounded-xl px-3 py-2">
                        <div>
                          <span className="text-xs font-bold text-white">{tier.name}</span>
                          <span className="text-xs text-[#64748b] ml-2">{tier.time}</span>
                        </div>
                        <span className="text-xs font-black" style={{ color: colors.accent }}>${tier.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-black text-[#22c55e] uppercase tracking-widest mb-2">Pros</p>
                    <ul className="space-y-1.5">
                      {svc.pros.map((pro) => (
                        <li key={pro} className="flex items-start gap-1.5">
                          <CheckCircle size={12} className="text-[#22c55e] mt-0.5 shrink-0" />
                          <span className="text-[11px] text-[#94a3b8] leading-tight">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#ef4444] uppercase tracking-widest mb-2">Cons</p>
                    <ul className="space-y-1.5">
                      {svc.cons.map((con) => (
                        <li key={con} className="flex items-start gap-1.5">
                          <XCircle size={12} className="text-[#ef4444] mt-0.5 shrink-0" />
                          <span className="text-[11px] text-[#94a3b8] leading-tight">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Best For callout */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: colors.accent + '15', border: `1px solid ${colors.accent}30` }}>
                  <span className="text-lg">🏆</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.accent }}>Best For</p>
                    <p className="text-xs text-white font-semibold">{svc.bestFor}</p>
                  </div>
                </div>

                {/* CTA */}
                <a
                  href={svc.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: colors.accent }}>
                  Submit to {svc.name} <ExternalLink size={14} />
                </a>
              </div>
            </div>
          );
        })}

        {/* "Which should I use?" Quiz */}
        <div className="bg-[#12121a] border border-[#6c47ff]/30 rounded-2xl overflow-hidden">
          <div className="px-4 py-4 border-b border-[#1e1e2e]">
            <h2 className="text-base font-black text-white">🤔 Which should I use?</h2>
            <p className="text-xs text-[#64748b] mt-0.5">Answer 3 quick questions to get a personalized recommendation</p>
          </div>

          <div className="p-4">
            {quizStep === -1 && (
              <button
                onClick={() => setQuizStep(0)}
                className="w-full py-3 rounded-xl font-black text-white text-sm transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)' }}>
                Find My Grading Service <ChevronRight size={16} />
              </button>
            )}

            {quizStep >= 0 && quizStep < QUIZ_QUESTIONS.length && (
              <div className="space-y-4">
                {/* Progress */}
                <div className="flex gap-1.5">
                  {QUIZ_QUESTIONS.map((_, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: i <= quizStep ? '#6c47ff' : '#1e1e2e' }} />
                  ))}
                </div>
                <p className="text-sm font-bold text-white">{QUIZ_QUESTIONS[quizStep].q}</p>
                <div className="space-y-2">
                  {QUIZ_QUESTIONS[quizStep].answers.map((ans) => (
                    <button
                      key={ans.value}
                      onClick={() => handleQuizAnswer(ans.value)}
                      className="w-full text-left px-4 py-3 rounded-xl border border-[#1e1e2e] text-sm font-semibold text-[#94a3b8] hover:border-[#6c47ff]/50 hover:text-white hover:bg-[#6c47ff]/10 transition-all">
                      {ans.label}
                    </button>
                  ))}
                </div>
                <button onClick={resetQuiz} className="text-xs text-[#64748b] hover:text-white transition-colors">
                  ← Start over
                </button>
              </div>
            )}

            {recommendation && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {recommendation.service === 'PSA' ? '🔵' : recommendation.service === 'BGS' ? '🔴' : '🟢'}
                  </div>
                  <div className="text-xl font-black text-white mb-1">We recommend {recommendation.service}</div>
                  <p className="text-sm text-[#94a3b8]">{recommendation.reason}</p>
                </div>
                {services.filter(s => s.name === recommendation.service).map(svc => (
                  <a key={svc.id} href={svc.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm text-white transition-all hover:opacity-90"
                    style={{ background: SERVICE_COLORS[svc.id].accent }}>
                    Submit to {svc.name} <ExternalLink size={14} />
                  </a>
                ))}
                <button onClick={resetQuiz} className="w-full py-2.5 rounded-xl border border-[#1e1e2e] text-sm text-[#64748b] hover:text-white transition-colors">
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Back to explore */}
        <div className="text-center pb-4">
          <Link href="/feed" className="text-sm text-[#64748b] hover:text-white transition-colors">
            ← Back to Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
