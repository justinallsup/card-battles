'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '../../../components/ui/BackButton';
import { showToast } from '../../../components/ui/Toast';

interface Persona {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

const PERSONAS: Persona[] = [
  { id: 'investor', name: 'The Investor', emoji: '📈', description: 'You treat cards like stocks. Buy low, sell high.', color: '#22c55e' },
  { id: 'hunter',   name: 'The Hunter',   emoji: '🎯', description: "You're after the rarest, most exclusive cards.", color: '#ef4444' },
  { id: 'fan',      name: 'The Fan',      emoji: '❤️', description: 'You collect the players you love, period.', color: '#6c47ff' },
  { id: 'historian',name: 'The Historian',emoji: '🏺', description: 'Vintage cards are your passion. The older the better.', color: '#f59e0b' },
];

interface Question {
  text: string;
  options: { label: string; scores: Record<string, number> }[];
}

const QUESTIONS: Question[] = [
  {
    text: 'When you open a pack, you\'re hoping for…',
    options: [
      { label: 'The most valuable card',  scores: { investor: 3, hunter: 1, fan: 0, historian: 0 } },
      { label: 'The rarest card',         scores: { investor: 1, hunter: 3, fan: 0, historian: 0 } },
      { label: 'Your favorite player',    scores: { investor: 0, hunter: 0, fan: 3, historian: 0 } },
      { label: 'A rookie card',           scores: { investor: 1, hunter: 0, fan: 1, historian: 2 } },
    ],
  },
  {
    text: 'Your collection strategy is…',
    options: [
      { label: 'Buy and hold for years',  scores: { investor: 3, hunter: 0, fan: 1, historian: 2 } },
      { label: 'Flip for profit',         scores: { investor: 3, hunter: 0, fan: 0, historian: 0 } },
      { label: 'Display and enjoy',       scores: { investor: 0, hunter: 0, fan: 3, historian: 1 } },
      { label: 'Complete sets',           scores: { investor: 0, hunter: 2, fan: 1, historian: 2 } },
    ],
  },
  {
    text: 'You check card prices…',
    options: [
      { label: 'Multiple times a day',    scores: { investor: 3, hunter: 1, fan: 0, historian: 0 } },
      { label: 'Weekly',                  scores: { investor: 1, hunter: 2, fan: 1, historian: 1 } },
      { label: 'Never, I just love cards', scores: { investor: 0, hunter: 0, fan: 3, historian: 2 } },
    ],
  },
  {
    text: 'Your dream card is…',
    options: [
      { label: 'A 1/1 printer proof',     scores: { investor: 2, hunter: 3, fan: 0, historian: 0 } },
      { label: 'A PSA 10 rookie',         scores: { investor: 3, hunter: 1, fan: 0, historian: 0 } },
      { label: 'A vintage classic',       scores: { investor: 1, hunter: 0, fan: 0, historian: 3 } },
      { label: 'A signed auto',           scores: { investor: 0, hunter: 1, fan: 3, historian: 1 } },
    ],
  },
  {
    text: 'At a card show, you head straight to…',
    options: [
      { label: 'The high-end cases',      scores: { investor: 3, hunter: 1, fan: 0, historian: 0 } },
      { label: 'The vintage bins',        scores: { investor: 0, hunter: 0, fan: 1, historian: 3 } },
      { label: 'New releases',            scores: { investor: 1, hunter: 1, fan: 2, historian: 0 } },
      { label: 'The grading booth',       scores: { investor: 2, hunter: 2, fan: 0, historian: 1 } },
    ],
  },
];

export default function PersonaPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = intro, 1-5 = questions, 6 = result
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Persona | null>(null);

  function selectOption(optionIdx: number) {
    const newAnswers = [...answers, optionIdx];
    setAnswers(newAnswers);

    if (step < QUESTIONS.length) {
      setStep(step + 1);
    }

    if (newAnswers.length === QUESTIONS.length) {
      // Calculate scores
      const totals: Record<string, number> = { investor: 0, hunter: 0, fan: 0, historian: 0 };
      newAnswers.forEach((optIdx, qIdx) => {
        const scores = QUESTIONS[qIdx].options[optIdx]?.scores ?? {};
        for (const [k, v] of Object.entries(scores)) {
          totals[k] = (totals[k] || 0) + v;
        }
      });
      const winner = Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];
      const persona = PERSONAS.find(p => p.id === winner) ?? PERSONAS[0];
      setResult(persona);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cb_persona', JSON.stringify(persona));
      }
      setStep(QUESTIONS.length + 1);
    }
  }

  const qIdx = step - 1;
  const currentQ = step >= 1 && step <= QUESTIONS.length ? QUESTIONS[qIdx] : null;
  const progress = Math.round((step / (QUESTIONS.length + 1)) * 100);

  return (
    <div className="min-h-screen pb-24 flex flex-col" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-3 border-b border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-lg font-black text-white">🎭 Collector Persona</h1>
            <p className="text-xs text-[#94a3b8]">What kind of collector are you?</p>
          </div>
        </div>
        {step > 0 && step <= QUESTIONS.length && (
          <div className="mt-3 h-1.5 rounded-full bg-[#1e1e2e] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6c47ff,#8b5cf6)' }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Intro */}
        {step === 0 && (
          <div className="text-center max-w-sm mx-auto">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-2xl font-black text-white mb-3">What Kind of Collector Are You?</h2>
            <p className="text-[#94a3b8] mb-6 leading-relaxed">
              Take our 5-question quiz and discover your collector persona. 
              Are you a savvy investor, a relentless hunter, a passionate fan, or a history buff?
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {PERSONAS.map(p => (
                <div key={p.id} className="rounded-xl p-3 border border-[#2a2a3e] text-left"
                  style={{ background: '#12121a' }}>
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <div className="text-sm font-bold text-white">{p.name}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full py-4 rounded-xl font-black text-white text-lg"
              style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)' }}
            >
              Start Quiz →
            </button>
          </div>
        )}

        {/* Questions */}
        {currentQ && (
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-6">
              <div className="text-xs font-bold text-[#6c47ff] uppercase tracking-widest mb-2">
                Question {step} of {QUESTIONS.length}
              </div>
              <h2 className="text-xl font-black text-white leading-snug">{currentQ.text}</h2>
            </div>
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => selectOption(idx)}
                  className="w-full text-left px-5 py-4 rounded-xl border border-[#2a2a3e] font-semibold text-white transition-all duration-150 hover:border-[#6c47ff] hover:bg-[#6c47ff]/10 active:scale-95"
                  style={{ background: '#12121a' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {step > QUESTIONS.length && result && (
          <div className="w-full max-w-sm mx-auto text-center">
            <div className="rounded-2xl border-2 p-8 mb-6" style={{ borderColor: result.color, background: '#12121a' }}>
              <div className="text-7xl mb-4">{result.emoji}</div>
              <h2 className="text-3xl font-black text-white mb-2">{result.name}</h2>
              <p className="text-[#94a3b8] leading-relaxed">{result.description}</p>

              <div className="mt-6 p-4 rounded-xl" style={{ background: `${result.color}15`, border: `1px solid ${result.color}40` }}>
                <p className="text-sm font-bold" style={{ color: result.color }}>
                  Your persona is saved to your profile!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setStep(0);
                  setAnswers([]);
                  setResult(null);
                }}
                className="py-3 rounded-xl border border-[#2a2a3e] text-sm font-bold text-[#94a3b8] hover:text-white transition-colors"
                style={{ background: '#12121a' }}
              >
                Retake Quiz
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="py-3 rounded-xl text-sm font-black text-white"
                style={{ background: 'linear-gradient(135deg,#6c47ff,#8b5cf6)' }}
              >
                View Profile →
              </button>
            </div>

            <p className="text-xs text-[#94a3b8] mt-4">
              Share your persona with friends!
            </p>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `I'm ${result.name} on Card Battles!`, text: result.description, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(`I'm ${result.name} ${result.emoji} on Card Battles! ${result.description}`);
                  showToast('Copied to clipboard!', 'success');
                }
              }}
              className="mt-2 text-sm font-bold text-[#6c47ff] hover:underline"
            >
              Share {result.emoji}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
