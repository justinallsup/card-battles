'use client';
import { useEffect } from 'react';
import { BookOpen, Award, HelpCircle, Send, BookMarked, TrendingUp, ExternalLink } from 'lucide-react';

const GRADES = [
  { grade: 10, label: 'GEM MINT',    desc: 'Perfect card — four sharp corners, no print defects, brilliant surface',    multiplier: '10x', color: '#22c55e' },
  { grade: 9,  label: 'MINT',        desc: 'Near perfect with one or two tiny flaws barely visible to the naked eye',    multiplier: '4x',  color: '#6c47ff' },
  { grade: 8,  label: 'NM-MT',       desc: 'Near mint to mint — light play wear, slightly off-white borders possible',   multiplier: '2x',  color: '#3b82f6' },
  { grade: 7,  label: 'NM',          desc: 'Near mint — normal wear from play, minor creases allowed',                   multiplier: '1.5x',color: '#f59e0b' },
  { grade: 6,  label: 'EX-MT',       desc: 'Excellent mint — slight surface wear, minor nicks on corners',               multiplier: '1x',  color: '#f97316' },
  { grade: 5,  label: 'EX',          desc: 'Excellent — obvious surface wear, loss of original gloss',                   multiplier: '0.6x',color: '#ef4444' },
  { grade: 4,  label: 'VG-EX',       desc: 'Very good to excellent — rounded corners, surface scuffing',                 multiplier: '0.4x',color: '#ef4444' },
  { grade: 3,  label: 'VG',          desc: 'Very good — heavy play wear, significant creases, poor centering',           multiplier: '0.2x',color: '#dc2626' },
  { grade: 2,  label: 'GOOD',        desc: 'Good — heavy creasing, multiple defects, worn through in spots',             multiplier: '0.1x',color: '#b91c1c' },
  { grade: 1,  label: 'POOR',        desc: 'Poor — badly damaged, heavy creasing, writing, holes',                       multiplier: '0.05x',color: '#991b1b' },
];

const GLOSSARY = [
  { term: 'RC',    full: 'Rookie Card',     desc: 'A player\'s first officially licensed trading card, typically most valuable' },
  { term: 'SP',    full: 'Short Print',     desc: 'Cards printed in smaller quantities than the base set, making them rarer' },
  { term: 'SSP',   full: 'Super Short Print', desc: 'Extremely limited print run cards, often 1/10 the quantity of an SP' },
  { term: 'Auto',  full: 'Autograph',       desc: 'A card signed directly by the player, certified by the manufacturer' },
  { term: 'Patch', full: 'Patch Card',      desc: 'Contains a piece of game-used jersey or equipment embedded in the card' },
  { term: '1/1',   full: 'One of One',      desc: 'The only copy in existence — the holy grail of card collecting' },
  { term: 'RPA',   full: 'Rookie Patch Auto', desc: 'Rookie card featuring both an autograph and a game-used patch' },
  { term: 'PSA',   full: 'Professional Sports Authenticator', desc: 'The most widely recognized card grading company' },
  { term: 'BGS',   full: 'Beckett Grading Services', desc: 'Second most popular grading service, known for subgrades' },
  { term: 'SGC',   full: 'Sportscard Guaranty Corp', desc: 'Popular grading service, faster turnaround times' },
  { term: 'Raw',   full: 'Ungraded Card',   desc: 'A card that hasn\'t been professionally graded or encapsulated' },
  { term: 'Slab',  full: 'Graded Case',     desc: 'The plastic holder that protects a graded card' },
];

const INVESTMENT_TIPS = [
  { icon: '🏈', tip: 'Buy the player, not the card', detail: 'Focus on athlete performance and longevity. A star player\'s cards will always hold value better than a trendy set.' },
  { icon: '📦', tip: 'Condition is everything', detail: 'A PSA 10 can be worth 10x a PSA 8. Always store cards properly — sleeves, top-loaders, humidity control.' },
  { icon: '🔍', tip: 'Research before you buy', detail: 'Check recent eBay sold listings (not asking prices). Use tools like PSA\'s price guide and 130point.com.' },
  { icon: '📈', tip: 'Buy low-grade vintage', detail: 'A PSA 3 of a legendary player can appreciate faster than a PSA 10 of a current star. Rarity + legacy = value.' },
  { icon: '🎯', tip: 'Focus on key cards', detail: 'Rookie cards, first Bowman Chrome, and 1st edition cards are foundational. These hold value through market cycles.' },
  { icon: '⏳', tip: 'Play the long game', detail: 'Card collecting rewards patience. Prices fluctuate with sports seasons and player performance. Don\'t panic sell.' },
];

export default function LearnPage() {
  useEffect(() => { document.title = 'Grading Guide | Card Battles'; }, []);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <BookOpen size={20} className="text-[#6c47ff]" /> Card Grading Guide
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Everything you need to know about grading, collecting, and investing in sports cards
        </p>
      </div>

      {/* Table of Contents */}
      <div className="rounded-2xl border border-[#1e1e2e] p-4" style={{ background: '#12121a' }}>
        <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-3">Contents</p>
        <div className="space-y-1">
          {[
            ['#what-is-psa', 'What is PSA?'],
            ['#grade-scale', 'Grade Scale (1–10)'],
            ['#why-grade', 'Why Grade?'],
            ['#how-to-submit', 'How to Submit'],
            ['#glossary', 'Glossary'],
            ['#investment-tips', 'Investment Tips'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#6c47ff] transition-colors py-0.5"
            >
              <span className="text-[#6c47ff]">→</span>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* What is PSA? */}
      <section id="what-is-psa">
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} className="text-[#f59e0b]" />
          <h2 className="text-base font-black text-white">What is PSA?</h2>
        </div>
        <div className="rounded-2xl border border-[#1e1e2e] p-4" style={{ background: '#12121a' }}>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            <strong className="text-white">PSA (Professional Sports Authenticator)</strong> is the world's largest
            and most trusted third-party card grading company, founded in 1991. They authenticate and grade
            sports cards on a <strong className="text-[#f59e0b]">1–10 scale</strong>, then seal them in a tamper-evident
            plastic holder called a "slab."
          </p>
          <p className="text-sm text-[#94a3b8] leading-relaxed mt-3">
            A PSA grade adds <strong className="text-white">credibility, protection, and liquidity</strong> to your cards.
            Buyers are more confident purchasing graded cards because the condition has been independently verified by
            experts. As of 2024, PSA has graded over <strong className="text-[#22c55e]">50 million</strong> cards.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Founded', value: '1991' },
              { label: 'Cards Graded', value: '50M+' },
              { label: 'Grades Issued', value: '1–10' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] p-3 text-center">
                <p className="text-xs text-[#64748b]">{s.label}</p>
                <p className="text-base font-black text-white mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grade Scale */}
      <section id="grade-scale">
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} className="text-[#6c47ff]" />
          <h2 className="text-base font-black text-white">Grade Scale</h2>
        </div>
        <div className="rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
          <div className="px-4 py-2 border-b border-[#1e1e2e]">
            <div className="grid grid-cols-12 gap-2 text-[9px] font-bold text-[#64748b] uppercase tracking-wider">
              <span className="col-span-1">Gr.</span>
              <span className="col-span-3">Label</span>
              <span className="col-span-6">Description</span>
              <span className="col-span-2 text-right">Value</span>
            </div>
          </div>
          <div className="divide-y divide-[#1e1e2e]">
            {GRADES.map((g) => (
              <div key={g.grade} className="grid grid-cols-12 gap-2 px-4 py-3 items-start hover:bg-[#1e1e2e]/20 transition-colors">
                <div className="col-span-1">
                  <span
                    className="text-sm font-black"
                    style={{ color: g.color }}
                  >
                    {g.grade}
                  </span>
                </div>
                <div className="col-span-3">
                  <span className="text-xs font-bold text-white leading-tight">{g.label}</span>
                </div>
                <div className="col-span-6">
                  <p className="text-[10px] text-[#64748b] leading-relaxed">{g.desc}</p>
                </div>
                <div className="col-span-2 text-right">
                  <span
                    className="text-xs font-black"
                    style={{ color: g.grade >= 9 ? '#22c55e' : g.grade >= 7 ? '#f59e0b' : '#ef4444' }}
                  >
                    {g.multiplier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Grade? */}
      <section id="why-grade">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle size={16} className="text-[#22c55e]" />
          <h2 className="text-base font-black text-white">Why Grade?</h2>
        </div>
        <div className="space-y-3">
          {[
            {
              icon: '💰', title: 'Maximize Value',
              desc: 'A PSA 10 of the same card can sell for 5–20x more than an ungraded copy. Grading unlocks hidden value in your collection.'
            },
            {
              icon: '🔒', title: 'Authentication',
              desc: 'PSA examines cards for trimming, restoration, and counterfeiting. A graded card is certified genuine — critical for high-value purchases.'
            },
            {
              icon: '🛡️', title: 'Protection',
              desc: 'Cards sealed in PSA slabs are protected from bending, moisture, and UV damage. Your investment stays safe for decades.'
            },
            {
              icon: '🤝', title: 'Liquidity',
              desc: 'Graded cards sell faster and for more money. Buyers trust PSA grades, so your cards attract more bidders and better prices.'
            },
          ].map(item => (
            <div
              key={item.title}
              className="flex items-start gap-3 p-4 rounded-xl border border-[#1e1e2e]"
              style={{ background: '#12121a' }}
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-bold text-white">{item.title}</p>
                <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How to Submit */}
      <section id="how-to-submit">
        <div className="flex items-center gap-2 mb-3">
          <Send size={16} className="text-[#f59e0b]" />
          <h2 className="text-base font-black text-white">How to Submit</h2>
        </div>
        <div className="rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              {[
                { step: '1', text: 'Create an account at PSA\'s website and log in' },
                { step: '2', text: 'Start a new submission — choose your service level (bulk, regular, or express)' },
                { step: '3', text: 'List each card you\'re submitting with set name, year, and card number' },
                { step: '4', text: 'Package cards in penny sleeves + top-loaders, then ship insured to PSA' },
                { step: '5', text: 'Wait for grading (varies by tier — 30 days to 6+ months)' },
                { step: '6', text: 'Cards arrive back slabbed with your grade. List, hold, or sell!' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
                  >
                    {s.step}
                  </span>
                  <p className="text-sm text-[#94a3b8]">{s.text}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#1e1e2e]">
              <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-3">Service Tiers</p>
              <div className="space-y-2">
                {[
                  { tier: 'Bulk', time: '60–90 days', price: '~$18/card', note: 'Cards worth <$499' },
                  { tier: 'Regular', time: '30–45 days', price: '~$25/card', note: 'Cards worth <$1,999' },
                  { tier: 'Express', time: '10 days', price: '~$75/card', note: 'Any value' },
                  { tier: 'Super Express', time: '5 days', price: '~$150/card', note: 'Priority service' },
                ].map(t => (
                  <div key={t.tier} className="flex items-center justify-between py-2 border-b border-[#1e1e2e] last:border-0">
                    <div>
                      <p className="text-xs font-bold text-white">{t.tier}</p>
                      <p className="text-[10px] text-[#64748b]">{t.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#f59e0b]">{t.price}</p>
                      <p className="text-[10px] text-[#64748b]">{t.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="https://www.psacard.com/submit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
            >
              <ExternalLink size={14} /> Submit to PSA →
            </a>
          </div>
        </div>
      </section>

      {/* Glossary */}
      <section id="glossary">
        <div className="flex items-center gap-2 mb-3">
          <BookMarked size={16} className="text-[#3b82f6]" />
          <h2 className="text-base font-black text-white">Glossary</h2>
        </div>
        <div className="rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
          <div className="divide-y divide-[#1e1e2e]">
            {GLOSSARY.map(g => (
              <div key={g.term} className="px-4 py-3 hover:bg-[#1e1e2e]/20 transition-colors">
                <div className="flex items-start gap-3">
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa' }}
                  >
                    {g.term}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{g.full}</p>
                    <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Tips */}
      <section id="investment-tips">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-[#22c55e]" />
          <h2 className="text-base font-black text-white">Investment Tips</h2>
        </div>
        <div className="space-y-3">
          {INVESTMENT_TIPS.map(tip => (
            <div
              key={tip.tip}
              className="flex items-start gap-3 p-4 rounded-xl border border-[#1e1e2e]"
              style={{ background: '#12121a' }}
            >
              <span className="text-2xl flex-shrink-0">{tip.icon}</span>
              <div>
                <p className="text-sm font-bold text-white">{tip.tip}</p>
                <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">{tip.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <div className="rounded-xl border border-[#1e1e2e] p-4 text-center" style={{ background: '#12121a' }}>
        <p className="text-xs text-[#64748b]">
          Card collecting involves risk. Values fluctuate based on market conditions, player performance, and supply/demand.
          Always do your own research before significant purchases.
        </p>
      </div>
    </div>
  );
}
