import { db } from '../db';
import { battles, votes, userStats, users } from '../db/schema';
import { eq, lt, and, sql } from 'drizzle-orm';

interface CategoryResult {
  leftWeightedVotes: number;
  rightWeightedVotes: number;
  leftPercent: number;
  rightPercent: number;
  winner: 'left' | 'right' | 'draw';
}

export async function resolveBattle(battleId: string): Promise<void> {
  const [battle] = await db
    .select()
    .from(battles)
    .where(and(eq(battles.id, battleId), eq(battles.status, 'live')))
    .limit(1);

  if (!battle) return;

  const allVotes = await db.select().from(votes).where(eq(votes.battleId, battleId));
  const categories = battle.categories as string[];

  const byCategory: Record<string, CategoryResult> = {};
  let categoryWins = { left: 0, right: 0 };
  let totalWeighted = 0;

  for (const cat of categories) {
    const catVotes = allVotes.filter((v) => v.category === cat);
    const left = catVotes
      .filter((v) => v.choice === 'left')
      .reduce((s, v) => s + parseFloat(v.weight as string), 0);
    const right = catVotes
      .filter((v) => v.choice === 'right')
      .reduce((s, v) => s + parseFloat(v.weight as string), 0);
    const total = left + right;
    totalWeighted += total;

    const winner: 'left' | 'right' | 'draw' =
      left > right ? 'left' : right > left ? 'right' : 'draw';
    if (winner === 'left') categoryWins.left++;
    else if (winner === 'right') categoryWins.right++;

    byCategory[cat] = {
      leftWeightedVotes: Math.round(left * 100) / 100,
      rightWeightedVotes: Math.round(right * 100) / 100,
      leftPercent: total > 0 ? Math.round((left / total) * 100 * 10) / 10 : 50,
      rightPercent: total > 0 ? Math.round((right / total) * 100 * 10) / 10 : 50,
      winner,
    };
  }

  const overallWinner: 'left' | 'right' | 'draw' =
    categoryWins.left > categoryWins.right
      ? 'left'
      : categoryWins.right > categoryWins.left
      ? 'right'
      : 'draw';

  const result = {
    byCategory,
    overall: { winner: overallWinner, method: 'best_of_categories' },
    totalWeightedVotes: Math.round(totalWeighted * 100) / 100,
  };

  // Update battle
  await db
    .update(battles)
    .set({ status: 'ended', result, updatedAt: new Date() })
    .where(eq(battles.id, battleId));

  // Update creator stats
  if (battle.createdByUserId) {
    const isWin = overallWinner === 'left'; // creator's card is left by convention
    await db
      .update(userStats)
      .set({
        battlesWon: isWin ? sql`battles_won + 1` : sql`battles_won`,
        battlesLost: !isWin ? sql`battles_lost + 1` : sql`battles_lost`,
        currentStreak: isWin ? sql`current_streak + 1` : sql`0`,
        bestStreak: isWin
          ? sql`GREATEST(best_streak, current_streak + 1)`
          : sql`best_streak`,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, battle.createdByUserId));
  }

  console.log(`[BattleResolution] Resolved battle ${battleId}: ${overallWinner}`);
}

export async function resolveEndedBattles(): Promise<void> {
  const now = new Date();
  const endedBattles = await db
    .select({ id: battles.id })
    .from(battles)
    .where(and(eq(battles.status, 'live'), lt(battles.endsAt, now)));

  console.log(`[BattleResolution] Found ${endedBattles.length} battles to resolve`);

  for (const { id } of endedBattles) {
    try {
      await resolveBattle(id);
    } catch (err) {
      console.error(`[BattleResolution] Failed to resolve battle ${id}:`, err);
    }
  }
}
