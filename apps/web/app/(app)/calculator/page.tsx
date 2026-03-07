'use client';
import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Search } from 'lucide-react';
import { BackButton } from '../../../components/ui/BackButton';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface CardSuggestion {
  id: string;
  player_name: string;
  title: string;
  year: number;
}

function getGrowthRate(grade: number): number {
  if (grade === 10) return 0.08;
  if (grade === 9) return 0.05;
  return 0.02;
}

function calcProjected(price: number, rate: number, years: number): number {
  return price * Math.pow(1 + rate, years);
}

function fmt(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function pct(n: number, base: number): string {
  if (base <= 0) return '—';
  const p = ((n - base) / base) * 100;
  return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
}

interface ScenarioColProps {
  label: string;
  color: string;
  icon: React.ReactNode;
  projectedValue: number;
  purchasePrice: number;
  years: number;
  rate: number;
}

function ScenarioCol({ label, color, icon, projectedValue, purchasePrice, years, rate }: ScenarioColProps) {
  const profit = projectedValue - purchasePrice;
  return (
    <div
      className="flex-1 rounded-2xl p-3 text-center border"
      style={{ background: `${color}11`, borderColor: `${color}33` }}
    >
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color }}>
        {label}
      </p>
      <p className="text-white font-black text-base">{fmt(projectedValue)}</p>
      <p className="text-xs font-semibold mt-1" style={{ color: profit >= 0 ? '#22c55e' : '#ef4444' }}>
        {profit >= 0 ? '+' : ''}{fmt(Math.abs(profit))}
      </p>
      <p className="text-[10px] text-[#64748b] mt-0.5">{pct(projectedValue, purchasePrice)} in {years}y</p>
      <p className="text-[9px] text-[#64748b] mt-1">@ {(rate * 100).toFixed(0)}%/yr</p>
    </div>
  );
}

function ROIBarChart({
  worst, base, best, purchasePrice,
}: {
  worst: number; base: number; best: number; purchasePrice: number;
}) {
  const maxVal = Math.max(worst, base, best);
  const bars = [
    { label: 'Worst', value: worst, color: '#ef4444' },
    { label: 'Base', value: base, color: '#6c47ff' },
    { label: 'Best', value: best, color: '#22c55e' },
  ];

  return (
    <div className="rounded-2xl border border-[#1e1e2e] p-4" style={{ background: '#12121a' }}>
      <h3 className="text-sm font-bold text-white mb-4">📊 ROI Projection Chart</h3>
      <div className="flex items-end gap-3 h-32 mb-3">
        {bars.map(bar => {
          const heightPct = maxVal > 0 ? (bar.value / maxVal) * 100 : 10;
          return (
            <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold" style={{ color: bar.color }}>
                {fmt(bar.value)}
              </span>
              <div className="w-full rounded-t-lg transition-all duration-500 relative" style={{ height: `${heightPct}%`, background: `${bar.color}cc`, minHeight: 8 }}>
                {purchasePrice > 0 && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-white/30"
                    style={{ bottom: `${(purchasePrice / bar.value) * 100}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        {bars.map(bar => (
          <div key={bar.label} className="flex-1 flex items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: bar.color }} />
            <span className="text-[10px] text-[#64748b]">{bar.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-[#374151] mt-2 text-center">Dashed line = purchase price</p>
    </div>
  );
}

export default function CalculatorPage() {
  const [playerName, setPlayerName] = useState('');
  const [suggestions, setSuggestions] = useState<CardSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState<number>(100);
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [grade, setGrade] = useState<number>(9);
  const [yearsToHold, setYearsToHold] = useState<number>(3);

  // Debounced autocomplete
  useEffect(() => {
    if (playerName.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      fetch(`${BASE}/cards/search?q=${encodeURIComponent(playerName)}`)
        .then(r => r.json())
        .then((d: { cards: CardSuggestion[] }) => setSuggestions(d.cards || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [playerName]);

  // Calculate years since purchase
  const yearsSincePurchase = useMemo(() => {
    const purchase = new Date(purchaseDate).getTime();
    const now = Date.now();
    return Math.max(0, (now - purchase) / (365.25 * 24 * 3600 * 1000));
  }, [purchaseDate]);

  const baseRate = getGrowthRate(grade);

  // Current estimated value
  const estimatedCurrentValue = useMemo(() => {
    return calcProjected(purchasePrice, baseRate, yearsSincePurchase);
  }, [purchasePrice, baseRate, yearsSincePurchase]);

  // Scenario rates
  const worstRate = -0.10;
  const bestRate = 0.15;

  const projBase  = useMemo(() => calcProjected(estimatedCurrentValue, baseRate,  yearsToHold), [estimatedCurrentValue, baseRate,  yearsToHold]);
  const projBest  = useMemo(() => calcProjected(estimatedCurrentValue, bestRate,  yearsToHold), [estimatedCurrentValue, bestRate,  yearsToHold]);
  const projWorst = useMemo(() => calcProjected(estimatedCurrentValue, worstRate, yearsToHold), [estimatedCurrentValue, worstRate, yearsToHold]);

  const totalReturnPct = estimatedCurrentValue > 0 ? ((projBase - purchasePrice) / purchasePrice) * 100 : 0;
  const totalReturnDollar = projBase - purchasePrice;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-[#1e1e2e]"
        style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-black text-white">💰 Investment Calculator</h1>
            <p className="text-xs text-[#64748b]">Simulate your card&apos;s growth</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-5">
        {/* Input Form */}
        <div className="rounded-2xl border border-[#1e1e2e] p-4 space-y-4" style={{ background: '#12121a' }}>
          <h2 className="text-sm font-bold text-white">Card Details</h2>

          {/* Player Name */}
          <div className="relative">
            <label className="text-xs text-[#64748b] font-semibold mb-1 block">Player Name</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                value={playerName}
                onChange={e => { setPlayerName(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="e.g. Patrick Mahomes"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#64748b] border border-[#1e1e2e] focus:outline-none focus:border-[#6c47ff]"
                style={{ background: '#0a0a0f' }}
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute z-10 top-full left-0 right-0 mt-1 rounded-xl border border-[#1e1e2e] overflow-hidden"
                style={{ background: '#1e1e2e' }}
              >
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#0a0a0f] transition-colors"
                    onClick={() => { setPlayerName(s.player_name); setShowSuggestions(false); setSuggestions([]); }}
                  >
                    <p className="text-white text-sm font-medium">{s.player_name}</p>
                    <p className="text-[#64748b] text-xs">{s.title} · {s.year}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Purchase Price */}
          <div>
            <label className="text-xs text-[#64748b] font-semibold mb-1 block">Purchase Price ($)</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="number"
                value={purchasePrice}
                onChange={e => setPurchasePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                min={0}
                step={1}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white border border-[#1e1e2e] focus:outline-none focus:border-[#6c47ff]"
                style={{ background: '#0a0a0f' }}
              />
            </div>
          </div>

          {/* Purchase Date */}
          <div>
            <label className="text-xs text-[#64748b] font-semibold mb-1 block">Purchase Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="date"
                value={purchaseDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white border border-[#1e1e2e] focus:outline-none focus:border-[#6c47ff]"
                style={{ background: '#0a0a0f', colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Grade */}
          <div>
            <label className="text-xs text-[#64748b] font-semibold mb-1 block">Current Grade</label>
            <select
              value={grade}
              onChange={e => setGrade(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-[#1e1e2e] focus:outline-none focus:border-[#6c47ff]"
              style={{ background: '#0a0a0f' }}
            >
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(g => (
                <option key={g} value={g}>
                  PSA {g} {g === 10 ? '(Gem Mint)' : g === 9 ? '(Mint)' : g === 8 ? '(NM-MT)' : g === 7 ? '(NM)' : ''}
                </option>
              ))}
              <option value={0}>Raw (Ungraded)</option>
            </select>
          </div>

          {/* Years to Hold */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-[#64748b] font-semibold">Years to Hold</label>
              <span className="text-xs font-bold text-[#6c47ff]">{yearsToHold} yr{yearsToHold !== 1 ? 's' : ''}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={yearsToHold}
              onChange={e => setYearsToHold(parseInt(e.target.value))}
              className="w-full accent-[#6c47ff]"
            />
            <div className="flex justify-between mt-0.5">
              <span className="text-[10px] text-[#374151]">1 yr</span>
              <span className="text-[10px] text-[#374151]">10 yrs</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-2xl border border-[#1e1e2e] p-4 space-y-4" style={{ background: '#12121a' }}>
          <h2 className="text-sm font-bold text-white">📈 Results</h2>

          {/* Current vs Projected */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0a0f] rounded-xl p-3">
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">Estimated Current Value</p>
              <p className="text-white font-black text-lg">{fmt(estimatedCurrentValue)}</p>
              <p className="text-[10px] text-[#64748b] mt-0.5">
                {yearsSincePurchase.toFixed(1)}y held · {(baseRate * 100).toFixed(0)}%/yr
              </p>
            </div>
            <div className="bg-[#0a0a0f] rounded-xl p-3">
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">Projected in {yearsToHold}y</p>
              <p className="font-black text-lg" style={{ color: projBase >= purchasePrice ? '#22c55e' : '#ef4444' }}>
                {fmt(projBase)}
              </p>
              <p className="text-[10px] text-[#64748b] mt-0.5">
                Base case ({(baseRate * 100).toFixed(0)}%/yr)
              </p>
            </div>
          </div>

          {/* Total Return */}
          <div
            className="flex items-center justify-between rounded-xl p-3"
            style={{
              background: totalReturnDollar >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${totalReturnDollar >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              {totalReturnDollar >= 0 ? (
                <TrendingUp size={18} className="text-[#22c55e]" />
              ) : (
                <TrendingDown size={18} className="text-[#ef4444]" />
              )}
              <div>
                <p className="text-xs text-[#64748b] font-semibold">Total Return (Base)</p>
                <p className="text-[10px] text-[#64748b]">Purchase → {yearsToHold}yr projected</p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="font-black text-sm"
                style={{ color: totalReturnDollar >= 0 ? '#22c55e' : '#ef4444' }}
              >
                {totalReturnDollar >= 0 ? '+' : ''}{fmt(Math.abs(totalReturnDollar))}
              </p>
              <p
                className="text-xs font-bold"
                style={{ color: totalReturnDollar >= 0 ? '#22c55e' : '#ef4444' }}
              >
                {pct(projBase, purchasePrice)}
              </p>
            </div>
          </div>

          {/* 3 Scenarios */}
          <div>
            <p className="text-xs text-[#64748b] font-semibold uppercase tracking-wider mb-2">Scenarios</p>
            <div className="flex gap-2">
              <ScenarioCol
                label="Worst Case"
                color="#ef4444"
                icon="📉"
                projectedValue={projWorst}
                purchasePrice={purchasePrice}
                years={yearsToHold}
                rate={worstRate}
              />
              <ScenarioCol
                label="Base Case"
                color="#6c47ff"
                icon="📊"
                projectedValue={projBase}
                purchasePrice={purchasePrice}
                years={yearsToHold}
                rate={baseRate}
              />
              <ScenarioCol
                label="Best Case"
                color="#22c55e"
                icon="🚀"
                projectedValue={projBest}
                purchasePrice={purchasePrice}
                years={yearsToHold}
                rate={bestRate}
              />
            </div>
          </div>
        </div>

        {/* ROI Chart */}
        <ROIBarChart
          worst={projWorst}
          base={projBase}
          best={projBest}
          purchasePrice={purchasePrice}
        />

        {/* Disclaimer */}
        <div
          className="rounded-2xl border border-[#1e1e2e] p-4"
          style={{ background: '#12121a' }}
        >
          <p className="text-[11px] text-[#64748b] leading-relaxed">
            ⚠️ <strong className="text-[#94a3b8]">Disclaimer:</strong> Estimates are for entertainment purposes only. Card values are highly speculative and depend on player performance, market conditions, grade, and numerous other factors. Past performance does not guarantee future results. Always do your own research before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
