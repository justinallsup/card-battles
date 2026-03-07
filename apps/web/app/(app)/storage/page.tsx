'use client';
import { useState, useEffect } from 'react';
import { Shield, ChevronDown, ChevronUp, ExternalLink, Check, X } from 'lucide-react';
import { BackButton } from '../../../components/ui/BackButton';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface StorageTip {
  category: string;
  icon: string;
  priority: 'Essential' | 'Important' | 'Optional' | 'Advanced';
  title: string;
  description: string;
  products: string[];
  tips: string[];
  cost: string;
}

interface StorageGuide {
  tips: StorageTip[];
  materials: {
    safe: string[];
    avoid: string[];
  };
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Essential: { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  Important: { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  Optional:  { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  Advanced:  { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
};

const QUICK_START = [
  { done: false, text: 'Buy penny sleeves for all your commons/bulk' },
  { done: false, text: 'Get Perfect Fit sleeves for any card worth $5+' },
  { done: false, text: 'Store valuable cards in toploaders immediately' },
  { done: false, text: 'Keep cards away from direct sunlight' },
  { done: false, text: 'Get a climate-controlled storage box for your collection' },
  { done: false, text: 'Never use rubber bands or paper clips on cards' },
];

function AccordionSection({ tip, defaultOpen }: { tip: StorageTip; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const style = PRIORITY_STYLES[tip.priority];

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-[#1a1a24] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none" aria-hidden="true">{tip.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-white">{tip.title}</p>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ background: style.bg, color: style.text, borderColor: style.border }}
              >
                {tip.priority}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-0.5">{tip.description}</p>
          </div>
        </div>
        {open
          ? <ChevronUp size={16} className="text-[#64748b] flex-shrink-0 ml-2" />
          : <ChevronDown size={16} className="text-[#64748b] flex-shrink-0 ml-2" />
        }
      </button>

      {open && (
        <div className="border-t border-[#1e1e2e] px-4 py-4 space-y-4">
          {/* Tips */}
          <div>
            <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-2">Tips</p>
            <ul className="space-y-1.5">
              {tip.tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#94a3b8]">
                  <span className="text-[#6c47ff] mt-0.5 flex-shrink-0">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-2">Recommended Products</p>
            <div className="space-y-1.5">
              {tip.products.map((p, i) => (
                <a
                  key={i}
                  href={`https://www.amazon.com/s?k=${encodeURIComponent(p)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Search Amazon for ${p}`}
                  className="flex items-center justify-between px-3 py-2 rounded-xl border border-[#1e1e2e] bg-[#0a0a0f] hover:border-[#6c47ff]/40 transition-colors group"
                >
                  <span className="text-sm text-[#94a3b8] group-hover:text-white transition-colors">{p}</span>
                  <ExternalLink size={12} className="text-[#374151] group-hover:text-[#6c47ff] transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* Cost */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e]">
            <span className="text-xs text-[#64748b] font-semibold">Estimated Cost</span>
            <span className="text-xs font-bold text-[#22c55e]">{tip.cost}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StorageGuidePage() {
  const [guide, setGuide] = useState<StorageGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState(QUICK_START.map(i => ({ ...i })));

  useEffect(() => {
    fetch(`${BASE_URL}/storage-guide`)
      .then(r => r.json())
      .then(setGuide)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleCheck = (i: number) => {
    setChecklist(prev => prev.map((item, idx) => idx === i ? { ...item, done: !item.done } : item));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <BackButton />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#6c47ff]/10 border border-[#6c47ff]/20 flex items-center justify-center">
          <Shield size={20} className="text-[#6c47ff]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">🛡️ Card Storage Guide</h1>
          <p className="text-xs text-[#64748b]">Protect your collection like a pro</p>
        </div>
      </div>

      {/* Quick Start Checklist */}
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4">
        <p className="text-xs font-black text-[#64748b] uppercase tracking-widest mb-3">⚡ Quick Start Checklist</p>
        <div className="space-y-2">
          {checklist.map((item, i) => (
            <button
              key={i}
              onClick={() => toggleCheck(i)}
              aria-pressed={item.done}
              className="w-full flex items-start gap-3 text-left"
            >
              <div
                className="w-5 h-5 rounded-md border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
                style={item.done
                  ? { background: '#6c47ff', borderColor: '#6c47ff' }
                  : { background: 'transparent', borderColor: '#374151' }
                }
              >
                {item.done && <Check size={11} className="text-white" />}
              </div>
              <span className={`text-sm transition-colors ${item.done ? 'line-through text-[#374151]' : 'text-[#94a3b8]'}`}>
                {item.text}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[#374151] mt-3">
          {checklist.filter(i => i.done).length}/{checklist.length} completed
        </p>
      </div>

      {/* Priority legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRIORITY_STYLES).map(([label, s]) => (
          <span
            key={label}
            className="text-[10px] font-bold px-2 py-1 rounded-full border"
            style={{ background: s.bg, color: s.text, borderColor: s.border }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Accordion sections */}
      {guide?.tips.map((tip, i) => (
        <AccordionSection key={tip.category} tip={tip} defaultOpen={i === 0} />
      ))}

      {/* Materials checklist */}
      {guide?.materials && (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4 space-y-4">
          <p className="text-xs font-black text-[#64748b] uppercase tracking-widest">Materials Guide</p>

          <div>
            <p className="text-xs font-bold text-[#22c55e] mb-2 flex items-center gap-1.5">
              <Check size={13} /> Safe to Use
            </p>
            <div className="space-y-1">
              {guide.materials.safe.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#94a3b8]">
                  <span className="text-[#22c55e] font-bold flex-shrink-0">✓</span>
                  {m}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-[#ef4444] mb-2 flex items-center gap-1.5">
              <X size={13} /> Never Use
            </p>
            <div className="space-y-1">
              {guide.materials.avoid.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#94a3b8]">
                  <span className="text-[#ef4444] font-bold flex-shrink-0">✗</span>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
