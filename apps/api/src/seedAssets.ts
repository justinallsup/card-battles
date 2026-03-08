import { db } from './db';
import { cardAssets, users } from './db/schema';
import { eq } from 'drizzle-orm';

interface SeedCard {
  title: string;
  playerName: string;
  year: number;
  sport: string;
  setName: string;
  variant?: string;
  grade?: string;
  certNumber?: string;
  imageUrl: string;
}

// Demo cards to seed the platform
const SEED_CARDS: SeedCard[] = [
  {
    title: 'Tom Brady 2000 Playoff Contenders RC Auto',
    playerName: 'Tom Brady',
    year: 2000,
    sport: 'nfl',
    setName: 'Playoff Contenders',
    variant: 'Rookie Ticket Auto',
    grade: 'PSA 9',
    certNumber: '12345678',
    imageUrl: '/images/seed/brady-2000-rc.jpg',
  },
  {
    title: 'Michael Jordan 1986 Fleer RC',
    playerName: 'Michael Jordan',
    year: 1986,
    sport: 'nba',
    setName: 'Fleer',
    variant: 'Base',
    grade: 'PSA 10',
    imageUrl: '/images/seed/jordan-1986-rc.jpg',
  },
  {
    title: 'LeBron James 2003 Topps Chrome RC',
    playerName: 'LeBron James',
    year: 2003,
    sport: 'nba',
    setName: 'Topps Chrome',
    variant: 'Refractor',
    grade: 'BGS 9.5',
    imageUrl: '/images/seed/lebron-2003-chrome.jpg',
  },
  {
    title: 'Mike Trout 2011 Topps Update RC',
    playerName: 'Mike Trout',
    year: 2011,
    sport: 'mlb',
    setName: 'Topps Update',
    variant: 'Base',
    grade: 'PSA 10',
    imageUrl: '/images/seed/trout-2011-update.jpg',
  },
  {
    title: 'Patrick Mahomes 2017 Prizm RC',
    playerName: 'Patrick Mahomes',
    year: 2017,
    sport: 'nfl',
    setName: 'Prizm',
    variant: 'Silver',
    imageUrl: '/images/seed/mahomes-2017-prizm.jpg',
  },
  {
    title: 'Luka Doncic 2018 Prizm RC',
    playerName: 'Luka Doncic',
    year: 2018,
    sport: 'nba',
    setName: 'Prizm',
    variant: 'Base',
    grade: 'PSA 10',
    imageUrl: '/images/seed/luka-2018-prizm.jpg',
  },
  {
    title: 'Wayne Gretzky 1979 O-Pee-Chee RC',
    playerName: 'Wayne Gretzky',
    year: 1979,
    sport: 'nhl',
    setName: 'O-Pee-Chee',
    variant: 'Base',
    grade: 'PSA 8',
    imageUrl: '/images/seed/gretzky-1979-opc.jpg',
  },
  {
    title: 'Kobe Bryant 1996 Topps Chrome RC',
    playerName: 'Kobe Bryant',
    year: 1996,
    sport: 'nba',
    setName: 'Topps Chrome',
    variant: 'Refractor',
    grade: 'BGS 9',
    imageUrl: '/images/seed/kobe-1996-chrome.jpg',
  },
];

async function seedAssets() {
  console.log('[Seed Assets] Starting...');

  // Find or create seeder user
  let [seederUser] = await db.select().from(users).where(eq(users.username, 'system')).limit(1);
  
  if (!seederUser) {
    console.log('[Seed Assets] Creating system user...');
    [seederUser] = await db.insert(users).values({
      username: 'system',
      email: 'system@cardbattles.local',
      passwordHash: null,
      role: 'admin',
      bio: 'Platform seeder',
    }).returning();
  }

  console.log(`[Seed Assets] Importing ${SEED_CARDS.length} seed cards...`);

  for (const card of SEED_CARDS) {
    // Check if already exists
    const existing = await db
      .select()
      .from(cardAssets)
      .where(eq(cardAssets.title, card.title))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭️  Skipping: ${card.title} (already exists)`);
      continue;
    }

    await db.insert(cardAssets).values({
      createdByUserId: seederUser.id,
      imageUrl: card.imageUrl,
      thumbUrl: card.imageUrl, // For seeded, use same URL (static images)
      title: card.title,
      sport: card.sport,
      playerName: card.playerName,
      year: card.year,
      setName: card.setName,
      variant: card.variant || null,
      grade: card.grade || null,
      certNumber: card.certNumber || null,
      source: 'seeded',
      metadata: {
        seedVersion: '1.0',
      },
    });

    console.log(`  ✅ Imported: ${card.title}`);
  }

  console.log('[Seed Assets] Complete!');
}

// Run if called directly
if (require.main === module) {
  seedAssets()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Assets] Error:', err);
      process.exit(1);
    });
}

export { seedAssets };
