'use client';
import { useEffect, useState } from 'react';
import { BackButton } from '../../../components/ui/BackButton';
import { RarityBadge } from '../../../components/ui/RarityBadge';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

const RARITY_INFO = [
  {
    tier: 'legendary' as const,
    label: 'Legendary',
    emoji: '🟡',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
    border: 'rgba(245,158,11,0.4)',
    description: '1/1 or printer proof, absolute pinnacle',
    examples: ['Michael Jordan 1986 Fleer RC', 'Babe Ruth T206 Honus Wagner equivalent', 'Sandy Koufax 1955 Topps'],
    criteria: ['1/1 or one-of-a-kind', 'Pre-1970 vintage icons', 'Printer proofs or superfractors'],
  },
  {
    tier: 'epic' as const,
    label: 'Epic',
    emoji: '🟣',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.2)',
    border: 'rgba(139,92,246,0.35)',
    description: 'Numbered /100 or less, auto or patch',
    examples: ['LeBron James 2003 Topps Chrome RC', 'Kobe Bryant Rookie Patch Auto', 'Tom Brady 2000 Bowman RC'],
    criteria: ['Active GOAT-tier players', 'Pre-1990 vintage', 'Numbered /100 or less'],
  },
  {
    tier: 'rare' as const,
    label: 'Rare',
    emoji: '🔵',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.2)',
    border: 'rgba(59,130,246,0.35)',
    description: 'Short print or limited run',
    examples: ['Patrick Mahomes 2017 Prizm RC', 'Stephen Curry RC PSA 10', 'Mike Trout 2011 Update'],
    criteria: ['Elite current stars', 'Pre-2000 vintage', 'Short prints and parallels'],
  },
  {
    tier: 'uncommon' as const,
    label: 'Uncommon',
    emoji: '🟢',
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.15)',
    border: 'rgba(34,197,94,0.3)',
    description: 'Less common, some collector interest',
    examples: ['2000–2014 rookies of solid players', 'Regional parallels', 'Refractors of decent players'],
    criteria: ['Cards from 2000–2014', 'Some collector demand', 'Not mainstream stars'],
  },
  {
    tier: 'common' as const,
    label: 'Common',
    emoji: '⚪',
    color: '#64748b',
    glow: 'rgba(100,116,139,0.1)',
    border: 'rgba(100,116,139,0.25)',
    description: 'Standard card, widely available',
    examples: ['Base set cards 2015+', 'Common players from any era', 'Mass-produced base parallels'],
    criteria: ['Post-2015 base cards', 'Common players', 'High print runs'],
  },
];

interface CardAsset {
  id: string;
  player_name: string;
  year: number;
  sport: string;
  image_url: string;
  title: string;
}

export default function RarityPage() {
  const [cards, setCards] = useState<CardAsset[]>([]);

  useEffect(() => {
    fetch(`${BASE}/cards/search?q=`)
      .then(r => r.json())
      .then(d => setCards(d.cards ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-xl font-black text-white">Rarity Guide 💎</h1>
          <p className="text-xs text-[#64748b]">Understanding card rarity tiers</p>
        </div>
      </div>

      {/* Hero */}
      <div
        className="rounded-2xl p-5 text-center space-y-2"
        style={{ background: 'linear-gradient(135deg, rgba(108,71,255,0.15), rgba(245,158,11,0.1))', border: '1px solid rgba(108,71,255,0.2)' }}
      >
        <div className="text-4xl">💎</div>
        <h2 className="text-lg font-black text-white">Card Rarity Explained</h2>
        <p className="text-sm text-[#94a3b8]">
          Every card in Card Battles has a rarity tier based on the player&apos;s legacy, the card&apos;s age, and its scarcity. Higher rarity = more legendary.
        </p>
      </div>

      {/* What makes a card legendary */}
      <div className="bg-[#12121a] border border-[#f59e0b]/30 rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-black text-[#f59e0b] flex items-center gap-2">🟡 What Makes a Card Legendary?</h2>
        <div className="space-y-2 text-sm text-[#94a3b8]">
          <p>A <strong className="text-white">Legendary</strong> card is the holy grail of the hobby. These are:</p>
          <ul className="space-y-1.5 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-[#f59e0b] mt-0.5">•</span>
              <span><strong className="text-white">1/1s</strong> — Literally one exists in the world. True unicorns.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#f59e0b] mt-0.5">•</span>
              <span><strong className="text-white">Pre-1970 vintage icons</strong> — Cards from an era when collecting was analog. Condition is everything.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#f59e0b] mt-0.5">•</span>
              <span><strong className="text-white">All-time greats</strong> — Jordan, Ruth, Clemente. The undisputed GOATs of their sport.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#f59e0b] mt-0.5">•</span>
              <span><strong className="text-white">Printer proofs / Superfractors</strong> — Factory mistakes and 1/1 parallels from modern sets.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Tier showcase */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-white uppercase tracking-widest">All Rarity Tiers</h2>
        {RARITY_INFO.map((tier) => (
          <div
            key={tier.tier}
            className="rounded-2xl p-4 space-y-3"
            style={{ background: tier.glow, border: `1px solid ${tier.border}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tier.emoji}</span>
                <div>
                  <RarityBadge tier={tier.tier} size="md" />
                  <p className="text-xs text-[#64748b] mt-0.5">{tier.description}</p>
                </div>
              </div>
            </div>

            {/* Criteria */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Criteria</p>
              <div className="flex flex-wrap gap-1.5">
                {tier.criteria.map(c => (
                  <span
                    key={c}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: tier.color + '22', color: tier.color, border: `1px solid ${tier.color}44` }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Examples */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Examples</p>
              {tier.examples.map(ex => (
                <div key={ex} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tier.color }} />
                  <p className="text-xs text-[#94a3b8]">{ex}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cards from database */}
      {cards.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Cards in Our Database</h2>
          <div className="space-y-2">
            {cards.slice(0, 10).map(card => {
              // Determine rarity client-side
              const LEGEND = ['Michael Jordan', 'Babe Ruth', 'Roberto Clemente', 'Sandy Koufax', 'Wilt Chamberlain'];
              const EPIC = ['LeBron James', 'Kobe Bryant', 'Tom Brady', 'Shohei Ohtani'];
              const RARE = ['Patrick Mahomes', 'Stephen Curry', 'Mike Trout', 'Luka Doncic'];
              let tier: string = 'common';
              if (LEGEND.includes(card.player_name) || card.year < 1970) tier = 'legendary';
              else if (EPIC.includes(card.player_name) || card.year < 1990) tier = 'epic';
              else if (RARE.includes(card.player_name) || card.year < 2000) tier = 'rare';
              else if (card.year < 2015) tier = 'uncommon';

              return (
                <div
                  key={card.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#1e1e2e] bg-[#12121a]"
                >
                  <img
                    src={card.image_url}
                    alt={card.player_name || card.title}
                    className="w-10 h-14 object-cover rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{card.player_name || card.title}</p>
                    <p className="text-xs text-[#64748b]">{card.year} · {card.sport?.toUpperCase()}</p>
                  </div>
                  <RarityBadge tier={tier} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div
        className="rounded-2xl p-4 text-center space-y-2"
        style={{ background: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.2)' }}
      >
        <p className="text-sm font-bold text-white">Ready to battle?</p>
        <p className="text-xs text-[#64748b]">Pit a Legendary against an Epic and let the community decide!</p>
        <a
          href="/create"
          className="inline-block mt-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
        >
          ⚔️ Create a Battle
        </a>
      </div>
    </div>
  );
}
