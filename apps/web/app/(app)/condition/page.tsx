'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BackButton } from '../../../components/ui/BackButton';

type CornerEdge = 'sharp' | 'slight_wear' | 'damaged' | null;
type Surface = 'pristine' | 'light_scratches' | 'print_lines' | 'creases' | 'stains' | null;

const CORNER_LABELS = ['Top Left', 'Top Right', 'Bottom Left', 'Bottom Right'];
const EDGE_LABELS = ['Top', 'Right', 'Bottom', 'Left'];

const CORNER_OPTIONS: { value: CornerEdge; label: string; icon: string; color: string }[] = [
  { value: 'sharp', label: 'Sharp', icon: '✓', color: '#22c55e' },
  { value: 'slight_wear', label: 'Slight Wear', icon: '⚠️', color: '#f59e0b' },
  { value: 'damaged', label: 'Damaged', icon: '✗', color: '#ef4444' },
];

const SURFACE_OPTIONS: { value: Surface; label: string; desc: string; icon: string; color: string }[] = [
  { value: 'pristine', label: 'Pristine', desc: 'No marks whatsoever', icon: '✨', color: '#22c55e' },
  { value: 'light_scratches', label: 'Light Scratches', desc: 'Minor surface marks', icon: '〰️', color: '#f59e0b' },
  { value: 'print_lines', label: 'Print Lines', desc: 'Lines from manufacturing', icon: '📏', color: '#f59e0b' },
  { value: 'creases', label: 'Creases', desc: 'Bent or folded areas', icon: '📄', color: '#ef4444' },
  { value: 'stains', label: 'Stains', desc: 'Discoloration or marks', icon: '💧', color: '#ef4444' },
];

function estimateGrade(
  corners: (CornerEdge)[],
  edges: (CornerEdge)[],
  surface: Surface | null,
  centeringScore: number
): number {
  let score = 10;
  const all = [...corners, ...edges];
  const damages = all.filter(c => c === 'damaged').length;
  const wears = all.filter(c => c === 'slight_wear').length;
  score -= damages * 1.5;
  score -= wears * 0.5;
  if (surface === 'light_scratches') score -= 0.5;
  if (surface === 'print_lines') score -= 1;
  if (surface === 'creases') score -= 2;
  if (surface === 'stains') score -= 2;
  if (centeringScore > 75) score -= 1;
  if (centeringScore > 85) score -= 1;
  return Math.max(1, Math.min(10, Math.round(score)));
}

function getGradeColor(grade: number): string {
  if (grade >= 9) return '#22c55e';
  if (grade >= 7) return '#fbbf24';
  if (grade >= 5) return '#f59e0b';
  if (grade >= 3) return '#ef4444';
  return '#9b1c1c';
}

function getGradeLabel(grade: number): string {
  if (grade === 10) return 'Gem Mint';
  if (grade === 9) return 'Mint';
  if (grade === 8) return 'Near Mint-Mint';
  if (grade === 7) return 'Near Mint';
  if (grade === 6) return 'Excellent-Mint';
  if (grade === 5) return 'Excellent';
  if (grade === 4) return 'Very Good-Excellent';
  if (grade === 3) return 'Very Good';
  if (grade === 2) return 'Good';
  return 'Poor';
}

function getGradeValueNote(grade: number): string {
  if (grade === 10) return 'Maximum value. Highly sought after by collectors. Some cards worth 10-100x raw value.';
  if (grade === 9) return 'Excellent investment. Near-perfect condition commands strong premium.';
  if (grade === 8) return 'Good investment value. Minor imperfections acceptable to most collectors.';
  if (grade === 7) return 'Moderate value. Light wear present but still a quality card.';
  if (grade >= 5) return 'Below average. Noticeable wear reduces collectability and value.';
  if (grade >= 3) return 'Heavy wear. Significant damage lowers value substantially.';
  return 'Poor condition. Value largely sentimental. Grading may not be worthwhile.';
}

function CornerEdgeAssessment({
  labels,
  values,
  onChange,
  title,
  subtitle,
}: {
  labels: string[];
  values: (CornerEdge)[];
  onChange: (idx: number, val: CornerEdge) => void;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-black text-white">{title}</h3>
        <p className="text-sm text-[#64748b] mt-1">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {labels.map((label, idx) => (
          <div key={label} className="space-y-2">
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">{label}</p>
            <div className="flex flex-col gap-1.5">
              {CORNER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onChange(idx, opt.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                  style={
                    values[idx] === opt.value
                      ? { background: `${opt.color}20`, borderColor: `${opt.color}60`, color: opt.color }
                      : { background: '#0a0a0f', borderColor: '#1e1e2e', color: '#64748b' }
                  }
                >
                  <span className="w-4 text-center">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { n: 1, label: 'Corners' },
  { n: 2, label: 'Edges' },
  { n: 3, label: 'Surface' },
  { n: 4, label: 'Centering' },
  { n: 5, label: 'Result' },
];

export default function ConditionCheckerPage() {
  const [step, setStep] = useState(1);
  const [corners, setCorners] = useState<(CornerEdge)[]>([null, null, null, null]);
  const [edges, setEdges] = useState<(CornerEdge)[]>([null, null, null, null]);
  const [surface, setSurface] = useState<Surface | null>(null);
  const [lrCentering, setLrCentering] = useState(50);
  const [tbCentering, setTbCentering] = useState(50);

  const updateCorner = (idx: number, val: CornerEdge) => {
    const next = [...corners];
    next[idx] = val;
    setCorners(next);
  };

  const updateEdge = (idx: number, val: CornerEdge) => {
    const next = [...edges];
    next[idx] = val;
    setEdges(next);
  };

  const centeringScore = Math.max(lrCentering, 100 - lrCentering, tbCentering, 100 - tbCentering);
  const grade = estimateGrade(corners, edges, surface, centeringScore);
  const gradeColor = getGradeColor(grade);

  const canAdvance =
    step === 1 ? corners.every(c => c !== null) :
    step === 2 ? edges.every(e => e !== null) :
    step === 3 ? surface !== null :
    step === 4 ? true : false;

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-xl font-black text-white">🔍 Condition Checker</h1>
          <p className="text-sm text-[#64748b] mt-0.5">PSA-style grade estimator</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer"
                style={
                  step === s.n
                    ? { background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', color: 'white' }
                    : step > s.n
                    ? { background: '#22c55e', color: 'white' }
                    : { background: '#1e1e2e', color: '#374151' }
                }
                onClick={() => step > s.n && setStep(s.n)}
              >
                {step > s.n ? '✓' : s.n}
              </div>
              <p className="text-[9px] mt-1" style={{ color: step >= s.n ? '#a78bfa' : '#374151' }}>
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="h-px flex-1 mb-4 mx-1 transition-all"
                style={{ background: step > s.n ? '#6c47ff' : '#1e1e2e' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-[#1e1e2e] p-4 space-y-4" style={{ background: '#12121a' }}>
        {step === 1 && (
          <CornerEdgeAssessment
            labels={CORNER_LABELS}
            values={corners}
            onChange={updateCorner}
            title="Step 1: Corners"
            subtitle="Examine each corner under good lighting. Sharp corners are key to a high grade."
          />
        )}

        {step === 2 && (
          <CornerEdgeAssessment
            labels={EDGE_LABELS}
            values={edges}
            onChange={updateEdge}
            title="Step 2: Edges"
            subtitle="Check all 4 edges for chips, nicks, or roughness. Run your fingernail lightly along each edge."
          />
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-white">Step 3: Surface</h3>
              <p className="text-sm text-[#64748b] mt-1">Examine front and back surface condition under good lighting at an angle.</p>
            </div>
            <div className="space-y-2">
              {SURFACE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSurface(opt.value)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                  style={
                    surface === opt.value
                      ? { background: `${opt.color}15`, borderColor: `${opt.color}50` }
                      : { background: '#0a0a0f', borderColor: '#1e1e2e' }
                  }
                >
                  <span className="text-xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: surface === opt.value ? opt.color : 'white' }}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-[#64748b]">{opt.desc}</p>
                  </div>
                  {surface === opt.value && (
                    <span className="text-lg" style={{ color: opt.color }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-white">Step 4: Centering</h3>
              <p className="text-sm text-[#64748b] mt-1">
                Measure the centering ratio. PSA 10 requires 55/45 or better on both axes.
              </p>
            </div>

            {/* Visual centering preview */}
            <div className="relative mx-auto" style={{ width: 200, height: 140 }}>
              <div className="absolute inset-0 rounded-lg border-2 border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
                {/* Card inside showing centering */}
                <div
                  className="absolute rounded border-2 border-[#6c47ff]/60"
                  style={{
                    background: 'rgba(108,71,255,0.1)',
                    left: `${lrCentering * 0.3}%`,
                    right: `${(100 - lrCentering) * 0.3}%`,
                    top: `${tbCentering * 0.3}%`,
                    bottom: `${(100 - tbCentering) * 0.3}%`,
                  }}
                />
              </div>
              <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[9px] text-[#64748b]">
                <span>L:{lrCentering}%</span>
                <span>R:{100 - lrCentering}%</span>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              {/* Left-Right slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#64748b]">
                  <span>Left–Right</span>
                  <span className="font-bold text-white">{lrCentering}/{100 - lrCentering}</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={90}
                  value={lrCentering}
                  onChange={e => setLrCentering(Number(e.target.value))}
                  className="w-full accent-[#6c47ff]"
                />
                <div className="flex justify-between text-[10px] text-[#374151]">
                  <span>50/50 (Perfect)</span>
                  <span>90/10 (Off-center)</span>
                </div>
              </div>

              {/* Top-Bottom slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#64748b]">
                  <span>Top–Bottom</span>
                  <span className="font-bold text-white">{tbCentering}/{100 - tbCentering}</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={90}
                  value={tbCentering}
                  onChange={e => setTbCentering(Number(e.target.value))}
                  className="w-full accent-[#6c47ff]"
                />
                <div className="flex justify-between text-[10px] text-[#374151]">
                  <span>50/50 (Perfect)</span>
                  <span>90/10 (Off-center)</span>
                </div>
              </div>
            </div>

            {centeringScore > 75 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-xs text-[#f59e0b]">
                ⚠️ Centering ratio {Math.round(centeringScore)}/{Math.round(100 - centeringScore)} — this will reduce the grade
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-white">Step 5: Your Result</h3>
              <p className="text-sm text-[#64748b] mt-1">Based on your assessment</p>
            </div>

            {/* Grade display */}
            <div
              className="text-center py-8 rounded-2xl border"
              style={{ background: `${gradeColor}10`, borderColor: `${gradeColor}40` }}
            >
              <div
                className="inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-black border-4 mx-auto mb-3"
                style={{ color: gradeColor, borderColor: gradeColor, background: `${gradeColor}15` }}
              >
                {grade}
              </div>
              <p className="text-xl font-black text-white">{getGradeLabel(grade)}</p>
              <p className="text-xs text-[#64748b] mt-1">PSA {grade} Equivalent</p>
            </div>

            {/* Value note */}
            <div className="p-4 rounded-xl border border-[#1e1e2e] bg-[#0a0a0f]">
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest mb-1.5">💰 Value Insight</p>
              <p className="text-sm text-[#94a3b8] leading-relaxed">{getGradeValueNote(grade)}</p>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest">Score Breakdown</p>
              {corners.filter(c => c === 'damaged').length > 0 && (
                <div className="flex justify-between text-xs text-[#ef4444]">
                  <span>Damaged corners ({corners.filter(c => c === 'damaged').length}×)</span>
                  <span>−{(corners.filter(c => c === 'damaged').length * 1.5).toFixed(1)}</span>
                </div>
              )}
              {corners.filter(c => c === 'slight_wear').length > 0 && (
                <div className="flex justify-between text-xs text-[#f59e0b]">
                  <span>Worn corners ({corners.filter(c => c === 'slight_wear').length}×)</span>
                  <span>−{(corners.filter(c => c === 'slight_wear').length * 0.5).toFixed(1)}</span>
                </div>
              )}
              {edges.filter(c => c === 'damaged').length > 0 && (
                <div className="flex justify-between text-xs text-[#ef4444]">
                  <span>Damaged edges ({edges.filter(c => c === 'damaged').length}×)</span>
                  <span>−{(edges.filter(c => c === 'damaged').length * 1.5).toFixed(1)}</span>
                </div>
              )}
              {edges.filter(c => c === 'slight_wear').length > 0 && (
                <div className="flex justify-between text-xs text-[#f59e0b]">
                  <span>Worn edges ({edges.filter(c => c === 'slight_wear').length}×)</span>
                  <span>−{(edges.filter(c => c === 'slight_wear').length * 0.5).toFixed(1)}</span>
                </div>
              )}
              {surface && surface !== 'pristine' && (
                <div className="flex justify-between text-xs text-[#f59e0b]">
                  <span>Surface: {surface.replace('_', ' ')}</span>
                  <span>
                    −{surface === 'light_scratches' ? '0.5' :
                       surface === 'print_lines' ? '1.0' :
                       surface === 'creases' ? '2.0' :
                       surface === 'stains' ? '2.0' : '0'}
                  </span>
                </div>
              )}
              {centeringScore > 75 && (
                <div className="flex justify-between text-xs text-[#f59e0b]">
                  <span>Off-centering penalty</span>
                  <span>−{centeringScore > 85 ? '2.0' : '1.0'}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white border-t border-[#1e1e2e] pt-2 mt-2">
                <span>Estimated Grade</span>
                <span style={{ color: gradeColor }}>PSA {grade}</span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/grader"
              className="block w-full py-3 text-center rounded-xl font-black text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
                color: 'white',
                boxShadow: '0 0 20px rgba(108,71,255,0.3)',
              }}
            >
              🏅 Send it to PSA? Try the Grader Simulator
            </Link>

            <button
              onClick={() => {
                setStep(1);
                setCorners([null, null, null, null]);
                setEdges([null, null, null, null]);
                setSurface(null);
                setLrCentering(50);
                setTbCentering(50);
              }}
              className="block w-full py-3 text-center rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#1e1e2e', color: '#94a3b8' }}
            >
              🔄 Start Over
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 5 && (
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: '#1e1e2e', color: '#94a3b8' }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance}
            className="flex-1 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40"
            style={{
              background: canAdvance
                ? 'linear-gradient(135deg, #6c47ff, #8b5cf6)'
                : '#1e1e2e',
              color: canAdvance ? 'white' : '#374151',
            }}
          >
            {step === 4 ? '🏁 See Results' : 'Next →'}
          </button>
        </div>
      )}

      {/* Grade preview during steps */}
      {step < 5 && corners.some(c => c !== null) && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#1e1e2e]"
          style={{ background: '#12121a' }}
        >
          <span className="text-xs text-[#64748b]">Preview grade so far:</span>
          <span className="text-lg font-black" style={{ color: gradeColor }}>
            PSA ~{estimateGrade(corners, edges, surface, centeringScore)}
          </span>
        </div>
      )}
    </div>
  );
}
