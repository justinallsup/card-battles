type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const RARITY: Record<RarityTier, { label: string; color: string; emoji: string }> = {
  common: { label: 'Common', color: '#64748b', emoji: '⚪' },
  uncommon: { label: 'Uncommon', color: '#22c55e', emoji: '🟢' },
  rare: { label: 'Rare', color: '#3b82f6', emoji: '🔵' },
  epic: { label: 'Epic', color: '#8b5cf6', emoji: '🟣' },
  legendary: { label: 'Legendary', color: '#f59e0b', emoji: '🟡' },
};

export function RarityBadge({ tier, size = 'sm' }: { tier: RarityTier | string; size?: 'sm' | 'md' }) {
  const r = RARITY[(tier as RarityTier)] || RARITY.common;
  return (
    <span
      style={{ color: r.color, borderColor: r.color + '66', fontSize: size === 'sm' ? 10 : 12 }}
      className="border rounded-full px-2 py-0.5 font-bold inline-flex items-center gap-1"
    >
      {r.emoji} {r.label}
    </span>
  );
}

/** Utility: determine rarity tier from player name + year (client-side, matches server logic) */
export function getRarityTier(playerName: string, year?: number): RarityTier {
  const LEGEND_PLAYERS = ['Michael Jordan', 'Babe Ruth', 'Roberto Clemente', 'Sandy Koufax', 'Wilt Chamberlain'];
  const EPIC_PLAYERS = ['LeBron James', 'Kobe Bryant', 'Tom Brady', 'Shohei Ohtani'];
  const RARE_PLAYERS = ['Patrick Mahomes', 'Stephen Curry', 'Mike Trout', 'Luka Doncic'];

  if (LEGEND_PLAYERS.includes(playerName) || (year !== undefined && year < 1970)) return 'legendary';
  if (EPIC_PLAYERS.includes(playerName) || (year !== undefined && year < 1990)) return 'epic';
  if (RARE_PLAYERS.includes(playerName) || (year !== undefined && year < 2000)) return 'rare';
  if (year !== undefined && year < 2015) return 'uncommon';
  return 'common';
}
