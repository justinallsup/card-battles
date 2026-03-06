import { db } from '../db';
import { cardAssets, battles } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

const AUTO_BATTLE_TEMPLATES = [
  { sport: 'nfl', type: 'Rookie Battle', categories: ['investment', 'coolest', 'rarity'] },
  { sport: 'nba', type: 'GOAT Debate', categories: ['investment', 'coolest', 'rarity'] },
  { sport: 'mlb', type: 'Diamond Debate', categories: ['investment', 'coolest', 'rarity'] },
];

export async function generateDailyBattles(count: number = 10): Promise<void> {
  console.log(`[AutoBattles] Generating ${count} battles...`);

  for (let i = 0; i < count; i++) {
    const template = AUTO_BATTLE_TEMPLATES[i % AUTO_BATTLE_TEMPLATES.length];

    // Pick 2 random assets for this sport
    const assets = await db
      .select({ id: cardAssets.id, title: cardAssets.title })
      .from(cardAssets)
      .where(eq(cardAssets.sport, template.sport))
      .orderBy(sql`RANDOM()`)
      .limit(2);

    if (assets.length < 2) {
      // Fallback to any 2 assets
      const anyAssets = await db
        .select({ id: cardAssets.id, title: cardAssets.title })
        .from(cardAssets)
        .orderBy(sql`RANDOM()`)
        .limit(2);
      if (anyAssets.length < 2) continue;
      assets.push(...anyAssets.slice(0, 2 - assets.length));
    }

    if (assets.length < 2) continue;

    const [left, right] = assets;
    const now = new Date();
    const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    try {
      await db.insert(battles).values({
        leftAssetId: left.id,
        rightAssetId: right.id,
        title: `${template.type}: ${left.title.split(' ').slice(0, 2).join(' ')} vs ${right.title.split(' ').slice(0, 2).join(' ')}`,
        categories: template.categories,
        durationSeconds: 86400,
        startsAt: now,
        endsAt,
        tags: { sport: template.sport, type: 'auto' },
      });
    } catch (err) {
      console.error('[AutoBattles] Failed to create battle:', err);
    }
  }

  console.log(`[AutoBattles] Done generating battles`);
}
