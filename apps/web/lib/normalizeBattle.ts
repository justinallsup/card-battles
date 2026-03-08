import type { Battle } from '@card-battles/types';

/**
 * Normalize battle data to ensure all required fields exist
 * Prevents crashes from malformed API responses
 */
export function normalizeBattle(battle: any): Battle {
  return {
    ...battle,
    categories: Array.isArray(battle.categories) ? battle.categories : ['investment', 'coolest', 'rarity'],
    myVotes: battle.myVotes || {},
    totalVotesCached: battle.totalVotesCached ?? 0,
    left: {
      ...battle.left,
      playerName: battle.left?.playerName ?? null,
      thumbUrl: battle.left?.thumbUrl ?? null,
    },
    right: {
      ...battle.right,
      playerName: battle.right?.playerName ?? null,
      thumbUrl: battle.right?.thumbUrl ?? null,
    },
  };
}

/**
 * Normalize an array of battles
 */
export function normalizeBattles(battles: any[]): Battle[] {
  if (!Array.isArray(battles)) return [];
  return battles.map(normalizeBattle);
}
