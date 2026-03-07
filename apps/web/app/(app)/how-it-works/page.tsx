'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Interactive Score Calculator ────────────────────────────────────────────
function ScoreCalculator() {
  const [investmentPct, setInvestmentPct] = useState(60);
  const [coolestPct, setCoolestPct] = useState(55);
  const [rarityPct, setRarityPct] = useState(70);

  const overallA =
    (investmentPct * 0.4) + (coolestPct * 0.3) + (rarityPct * 0.3);
  const overallB =
    ((100 - investmentPct) * 0.4) + ((100 - coolestPct) * 0.3) + ((100 - rarityPct) * 0.3);
  const winner = overallA > overallB ? 'Card A' : overallA < overallB ? 'Card B' : 'Tie';

  const pct = (v: number) => `${Math.round(v)}%`;

  return (
    <div className="rounded-2xl border border-[#1e1e2e] p-5 space-y-5" style={{ background: '#12121a' }}>
      <h3 className="text-base font-black text-white">🧮 Interactive Score Calculator</h3>
      <p className="text-xs text-[#64748b]">
        Drag the sliders to see how vote percentages affect the overall winner.
      </p>

      {/* Sliders */}
      <div className="space-y-4">
        {[
          { label: 'Investment', value: investmentPct, set: setInvestmentPct, weight: '40%', color: '#22c55e' },
          { label: 'Coolest',   value: coolestPct,   set: setCoolestPct,   weight: '30%', color: '#3b82f6' },
          { label: 'Rarity',    value: rarityPct,    set: setRarityPct,    weight: '30%', color: '#f59e0b' },
        ].map(({ label, value, set, weight, color }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">{label} <span className="text-xs font-normal text-[#64748b]">({weight} weight)</span></span>
              <div className="flex gap-4 text-xs font-bold">
                <span style={{ color }}>Card A: {pct(value)}</span>
                <span className="text-[#64748b]">Card B: {pct(100 - value)}</span>
              </div>
            </div>
            <div className="relative">
              <input
                type="range" min={0} max={100} value={value}
                onChange={e => set(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Result */}
      <div className="rounded-xl border border-[#1e1e2e] p-4" style={{ background: '#0a0a0f' }}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-xs text-[#64748b] mb-1">Card A Score</p>
            <p className="text-2xl font-black text-[#a78bfa]">{pct(overallA)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#64748b] mb-1">Card B Score</p>
            <p className="text-2xl font-black text-[#64748b]">{pct(overallB)}</p>
          </div>
        </div>
        <div className="text-center pt-3 border-t border-[#1e1e2e]">
          <p className="text-xs text-[#64748b] mb-1">Winner</p>
          <p className="text-xl font-black text-[#22c55e]">
            {winner === 'Tie' ? '🤝 It\'s a Tie!' : `🏆 ${winner} Wins!`}
          </p>
          <p className="text-xs text-[#64748b] mt-1">
            Formula: (Investment% × 0.4) + (Coolest% × 0.3) + (Rarity% × 0.3)
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Callout Box ──────────────────────────────────────────────────────────────
function Callout({ icon, title, children, color = '#6c47ff' }: {
  icon: string; title: string; children: React.ReactNode; color?: string;
}) {
  return (
    <div
      className="rounded-xl border p-4 space-y-1"
      style={{ background: color + '10', borderColor: color + '30' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-black" style={{ color }}>{title}</h4>
      </div>
      <div className="text-sm text-[#94a3b8] leading-relaxed pl-7">{children}</div>
    </div>
  );
}

// ── Formula Display ──────────────────────────────────────────────────────────
function Formula({ children }: { children: string }) {
  return (
    <div
      className="rounded-lg p-3 font-mono text-sm text-[#a78bfa] overflow-x-auto"
      style={{ background: '#0a0a0f', border: '1px solid rgba(108,71,255,0.2)' }}
    >
      {children}
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────
function Section({ number, title, children }: {
  number: number; title: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
        >
          {number}
        </div>
        <h2 className="text-lg font-black text-white">{title}</h2>
      </div>
      <div className="pl-11 space-y-4">{children}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  useEffect(() => { document.title = 'How Scoring Works | Card Battles'; }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#64748b] hover:text-white transition-colors text-sm">
            ← Back
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">⚡ How Scoring Works</h1>
          <p className="text-sm text-[#64748b] mt-2">
            A transparent look at how Card Battles determines winners — no black boxes, no surprises.
          </p>
        </div>

        {/* Section 1: Vote Weighting */}
        <Section number={1} title="Vote Weighting">
          <p className="text-sm text-[#94a3b8]">
            Not all votes are equal. Account age affects how much weight your vote carries,
            which prevents new accounts from gaming the system.
          </p>

          <div className="rounded-xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  <th className="text-left py-2 px-4 text-[#64748b] font-semibold text-xs">Account Age</th>
                  <th className="text-left py-2 px-4 text-[#64748b] font-semibold text-xs">Vote Weight</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { age: '< 1 day',    weight: '0.25×', color: '#ef4444' },
                  { age: '1–7 days',   weight: '0.5×',  color: '#f97316' },
                  { age: '8–30 days',  weight: '0.75×', color: '#eab308' },
                  { age: '30+ days',   weight: '1.0×',  color: '#22c55e' },
                ].map(row => (
                  <tr key={row.age} className="border-b border-[#1e1e2e] last:border-b-0">
                    <td className="py-2.5 px-4 text-white">{row.age}</td>
                    <td className="py-2.5 px-4 font-bold" style={{ color: row.color }}>{row.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout icon="🛡️" title="Why We Do This" color="#6c47ff">
            This prevents sybil attacks where someone creates many new accounts to skew vote results.
            Established voters carry full weight; new accounts build trust over time.
          </Callout>
        </Section>

        {/* Section 2: Category System */}
        <Section number={2} title="Category System">
          <p className="text-sm text-[#94a3b8]">
            Each battle has three voting categories. Voters pick their winner in each category independently.
          </p>

          <div className="space-y-3">
            <Callout icon="💰" title="Investment" color="#22c55e">
              Which card is the better financial investment? Consider PSA grade, rarity, player trajectory,
              and market trends. Example: A PSA 10 rookie card of a rising star.
            </Callout>
            <Callout icon="😎" title="Coolest" color="#3b82f6">
              Which card has the best design, aesthetics, or cultural significance?
              This is subjective — rookie cards, foil designs, game-used memorabilia all count.
            </Callout>
            <Callout icon="💎" title="Rarity" color="#f59e0b">
              Which card is harder to find? Consider print run, population reports, parallels,
              and overall scarcity. A 1/1 superfractor beats a base card every time.
            </Callout>
          </div>
        </Section>

        {/* Section 3: Overall Winner */}
        <Section number={3} title="Overall Winner Calculation">
          <p className="text-sm text-[#94a3b8]">
            The overall winner is calculated by weighting each category:
          </p>
          <Formula>{'Overall Score = (Investment% × 0.4)\n             + (Coolest%    × 0.3)\n             + (Rarity%     × 0.3)'}</Formula>
          <p className="text-sm text-[#94a3b8]">
            Investment carries the most weight (40%) because card value is central to the hobby.
            Coolest and Rarity share the remaining 60% equally at 30% each.
          </p>
          <ScoreCalculator />
        </Section>

        {/* Section 4: Leaderboard Points */}
        <Section number={4} title="Leaderboard Points">
          <p className="text-sm text-[#94a3b8]">
            Earn points for creating battles and making correct predictions.
          </p>

          <div className="space-y-3">
            <div className="rounded-xl border border-[#1e1e2e] p-4 space-y-2" style={{ background: '#12121a' }}>
              <h4 className="text-sm font-black text-white">Creator Points</h4>
              <p className="text-xs text-[#94a3b8]">+1 point per 100 votes your battle receives</p>
              <Formula>{'Creator Points = floor(totalVotes / 100)'}</Formula>
            </div>
            <div className="rounded-xl border border-[#1e1e2e] p-4 space-y-2" style={{ background: '#12121a' }}>
              <h4 className="text-sm font-black text-white">Voter Points</h4>
              <p className="text-xs text-[#94a3b8]">+1 point for each correct prediction in a completed battle</p>
            </div>
            <div className="rounded-xl border border-[#1e1e2e] p-4 space-y-2" style={{ background: '#12121a' }}>
              <h4 className="text-sm font-black text-white">Streak Bonus</h4>
              <p className="text-xs text-[#94a3b8]">Voting every day increases your bonus multiplier</p>
              <Formula>{'Streak Bonus = basePoints × (1 + streakDays × 0.1)'}</Formula>
              <p className="text-xs text-[#64748b]">
                Example: 7-day streak = +70% bonus on all points earned that day
              </p>
            </div>
          </div>
        </Section>

        {/* Section 5: Anti-Gaming */}
        <Section number={5} title="Anti-Gaming Measures">
          <p className="text-sm text-[#94a3b8]">
            We take fairness seriously. Multiple layers of protection ensure results reflect genuine community opinion.
          </p>

          <div className="space-y-3">
            <Callout icon="⚖️" title="Vote Weight System" color="#6c47ff">
              As described in Section 1, new accounts have reduced vote weight. This is the primary
              defense against coordinated manipulation.
            </Callout>
            <Callout icon="⏱️" title="Rate Limiting" color="#f59e0b">
              Each account can only vote once per battle category. Rapid voting across many battles
              triggers a cooldown period to prevent bot-like behavior.
            </Callout>
            <Callout icon="🌐" title="IP Checks" color="#3b82f6">
              We detect multiple accounts voting from the same IP address. Votes from the same IP
              on the same battle are flagged and may be reduced in weight.
            </Callout>
            <Callout icon="📊" title="Anomaly Detection" color="#22c55e">
              Battles that receive sudden large vote surges are reviewed. Organic growth looks
              different from coordinated attacks — we know the difference.
            </Callout>
          </div>
        </Section>

        {/* CTA */}
        <div
          className="rounded-2xl border border-[#6c47ff]/30 p-6 text-center space-y-3"
          style={{ background: 'rgba(108,71,255,0.08)' }}
        >
          <p className="text-lg font-black text-white">Ready to Battle?</p>
          <p className="text-sm text-[#64748b]">
            Now that you understand the scoring, put your knowledge to the test.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
            >
              ⚔️ Vote Now
            </Link>
            <Link
              href="/create"
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: '#1e1e2e', color: '#a78bfa' }}
            >
              + Create Battle
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
