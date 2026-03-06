import 'dotenv/config';
import { db } from './db';
import { users, userStats, cardAssets, battles, dailyPicks, sponsors } from './db/schema';
import bcrypt from 'bcryptjs';

const passwordHash = bcrypt.hashSync('password123', 12);

const DEMO_USERS = [
  { username: 'cardking', email: 'cardking@demo.com' },
  { username: 'slabmaster', email: 'slabmaster@demo.com' },
  { username: 'rookiehunter', email: 'rookiehunter@demo.com' },
  { username: 'packripper', email: 'packripper@demo.com' },
  { username: 'gradegod', email: 'gradegod@demo.com' },
  { username: 'vintagevault', email: 'vintagevault@demo.com' },
  { username: 'hoopshunter', email: 'hoopshunter@demo.com' },
  { username: 'gridirongrader', email: 'gridirongrader@demo.com' },
  { username: 'diamonddigger', email: 'diamonddigger@demo.com' },
  { username: 'baseballbaron', email: 'baseballbaron@demo.com' },
];

const CARD_ASSETS = [
  // NFL
  { title: 'Patrick Mahomes 2017 Prizm Rookie PSA 10', sport: 'nfl', playerName: 'Patrick Mahomes', year: 2017, setName: 'Prizm', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/1a1a2e/6c47ff?text=Mahomes+Prizm+RC' },
  { title: 'Tom Brady 2000 Bowman Rookie PSA 10', sport: 'nfl', playerName: 'Tom Brady', year: 2000, setName: 'Bowman', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/1a1a2e/6c47ff?text=Brady+Bowman+RC' },
  { title: 'Josh Allen 2018 Prizm Rookie Auto', sport: 'nfl', playerName: 'Josh Allen', year: 2018, setName: 'Prizm', variant: 'Auto', imageUrl: 'https://placehold.co/400x560/1a1a2e/6c47ff?text=Allen+Prizm+Auto' },
  { title: 'Justin Jefferson 2020 Prizm Rookie PSA 10', sport: 'nfl', playerName: 'Justin Jefferson', year: 2020, setName: 'Prizm', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/1a1a2e/6c47ff?text=Jefferson+Prizm+RC' },
  { title: 'Joe Burrow 2020 Prizm Rookie Auto', sport: 'nfl', playerName: 'Joe Burrow', year: 2020, setName: 'Prizm', variant: 'Auto', imageUrl: 'https://placehold.co/400x560/1a1a2e/6c47ff?text=Burrow+Prizm+Auto' },
  { title: 'CJ Stroud 2023 Prizm Rookie PSA 10', sport: 'nfl', playerName: 'CJ Stroud', year: 2023, setName: 'Prizm', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/1a1a2e/6c47ff?text=Stroud+Prizm+RC' },
  { title: 'Caleb Williams 2024 Prizm Rookie Auto', sport: 'nfl', playerName: 'Caleb Williams', year: 2024, setName: 'Prizm', variant: 'Auto', imageUrl: 'https://placehold.co/400x560/1a1a2e/6c47ff?text=Williams+Prizm+Auto' },
  { title: 'Lamar Jackson 2018 Prizm Rookie PSA 10', sport: 'nfl', playerName: 'Lamar Jackson', year: 2018, setName: 'Prizm', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/1a1a2e/6c47ff?text=Jackson+Prizm+RC' },
  { title: 'Ja\'Marr Chase 2021 Prizm Rookie Auto', sport: 'nfl', playerName: "Ja'Marr Chase", year: 2021, setName: 'Prizm', variant: 'Auto', imageUrl: 'https://placehold.co/400x560/1a1a2e/6c47ff?text=Chase+Prizm+Auto' },
  { title: 'Trevor Lawrence 2021 Prizm Rookie PSA 10', sport: 'nfl', playerName: 'Trevor Lawrence', year: 2021, setName: 'Prizm', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/1a1a2e/6c47ff?text=Lawrence+Prizm+RC' },
  // NBA
  { title: 'LeBron James 2003 Topps Chrome Rookie PSA 10', sport: 'nba', playerName: 'LeBron James', year: 2003, setName: 'Topps Chrome', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/0d1b2a/22c55e?text=LeBron+Chrome+RC' },
  { title: 'Michael Jordan 1986 Fleer Rookie PSA 9', sport: 'nba', playerName: 'Michael Jordan', year: 1986, setName: 'Fleer', variant: 'Base PSA 9', imageUrl: 'https://placehold.co/400x560/0d1b2a/22c55e?text=Jordan+Fleer+RC' },
  { title: 'Stephen Curry 2009 Prizm Rookie PSA 10', sport: 'nba', playerName: 'Stephen Curry', year: 2009, setName: 'Prizm', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/0d1b2a/22c55e?text=Curry+Prizm+RC' },
  { title: 'Victor Wembanyama 2023 Prizm Rookie Auto', sport: 'nba', playerName: 'Victor Wembanyama', year: 2023, setName: 'Prizm', variant: 'Auto', imageUrl: 'https://placehold.co/400x560/0d1b2a/22c55e?text=Wemby+Prizm+Auto' },
  { title: 'Luka Doncic 2018 Prizm Rookie PSA 10', sport: 'nba', playerName: 'Luka Doncic', year: 2018, setName: 'Prizm', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/0d1b2a/22c55e?text=Luka+Prizm+RC' },
  { title: 'Jayson Tatum 2017 Prizm Rookie Auto', sport: 'nba', playerName: 'Jayson Tatum', year: 2017, setName: 'Prizm', variant: 'Auto', imageUrl: 'https://placehold.co/400x560/0d1b2a/22c55e?text=Tatum+Prizm+Auto' },
  { title: 'Zion Williamson 2019 Prizm Rookie PSA 10', sport: 'nba', playerName: 'Zion Williamson', year: 2019, setName: 'Prizm', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/0d1b2a/22c55e?text=Zion+Prizm+RC' },
  { title: 'Caitlin Clark 2024 Prizm Rookie Auto', sport: 'nba', playerName: 'Caitlin Clark', year: 2024, setName: 'Prizm', variant: 'Auto', imageUrl: 'https://placehold.co/400x560/0d1b2a/22c55e?text=Clark+Prizm+Auto' },
  { title: 'Nikola Jokic 2015 Prizm Rookie PSA 10', sport: 'nba', playerName: 'Nikola Jokic', year: 2015, setName: 'Prizm', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/0d1b2a/22c55e?text=Jokic+Prizm+RC' },
  { title: 'Giannis Antetokounmpo 2013 Prizm Rookie PSA 10', sport: 'nba', playerName: 'Giannis Antetokounmpo', year: 2013, setName: 'Prizm', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/0d1b2a/22c55e?text=Giannis+Prizm+RC' },
  // MLB
  { title: 'Mike Trout 2011 Topps Update Rookie PSA 10', sport: 'mlb', playerName: 'Mike Trout', year: 2011, setName: 'Topps Update', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/1a0d2e/f59e0b?text=Trout+Topps+RC' },
  { title: 'Shohei Ohtani 2018 Topps Rookie PSA 10', sport: 'mlb', playerName: 'Shohei Ohtani', year: 2018, setName: 'Topps', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/1a0d2e/f59e0b?text=Ohtani+Topps+RC' },
  { title: 'Elly De La Cruz 2023 Topps Chrome Rookie Auto', sport: 'mlb', playerName: 'Elly De La Cruz', year: 2023, setName: 'Topps Chrome', variant: 'Auto', imageUrl: 'https://placehold.co/400x560/1a0d2e/f59e0b?text=EDLC+Chrome+Auto' },
  { title: 'Ronald Acuna Jr 2018 Topps Chrome Rookie PSA 10', sport: 'mlb', playerName: 'Ronald Acuña Jr', year: 2018, setName: 'Topps Chrome', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/1a0d2e/f59e0b?text=Acuna+Chrome+RC' },
  { title: 'Juan Soto 2018 Bowman Chrome Prospect Auto', sport: 'mlb', playerName: 'Juan Soto', year: 2018, setName: 'Bowman Chrome', variant: 'Prospect Auto', imageUrl: 'https://placehold.co/400x560/1a0d2e/f59e0b?text=Soto+Bowman+Auto' },
  { title: 'Julio Rodriguez 2022 Topps Chrome Rookie Auto', sport: 'mlb', playerName: 'Julio Rodriguez', year: 2022, setName: 'Topps Chrome', variant: 'Auto', imageUrl: 'https://placehold.co/400x560/1a0d2e/f59e0b?text=JRod+Chrome+Auto' },
  { title: 'Fernando Tatis Jr 2019 Topps Chrome Rookie PSA 10', sport: 'mlb', playerName: 'Fernando Tatis Jr', year: 2019, setName: 'Topps Chrome', variant: 'Base PSA 10', imageUrl: 'https://placehold.co/400x560/1a0d2e/f59e0b?text=Tatis+Chrome+RC' },
  { title: 'Jackson Chourio 2024 Bowman Chrome Prospect Auto', sport: 'mlb', playerName: 'Jackson Chourio', year: 2024, setName: 'Bowman Chrome', variant: 'Prospect Auto', imageUrl: 'https://placehold.co/400x560/1a0d2e/f59e0b?text=Chourio+Auto' },
];

const BATTLE_PAIRS = [
  { left: 0, right: 1, title: 'Mahomes vs Brady — GOAT Rookie Battle' },
  { left: 2, right: 3, title: 'Allen vs Jefferson — Best 2018/20 RC' },
  { left: 4, right: 5, title: 'Burrow vs Stroud — 2020s QB Rookies' },
  { left: 10, right: 11, title: 'LeBron vs Jordan — The GOAT Debate' },
  { left: 13, right: 14, title: 'Wemby vs Luka — Next Gen Face Off' },
  { left: 12, right: 10, title: 'Curry vs LeBron — Championship era' },
  { left: 18, right: 19, title: 'Jokic vs Giannis — MVP Rookies' },
  { left: 20, right: 21, title: 'Trout vs Ohtani — MLB Legends' },
  { left: 22, right: 23, title: 'EDLC vs Acuña — Next Gen MLB Stars' },
  { left: 24, right: 25, title: 'Soto vs JRod — Power Hitters' },
  { left: 0, right: 4, title: 'Mahomes vs Burrow — Super Bowl Rematch' },
  { left: 13, right: 15, title: 'Wemby vs Tatum — Celtics Challenger?' },
  { left: 6, right: 2, title: 'Caleb Williams vs Josh Allen' },
  { left: 11, right: 12, title: 'Jordan vs Curry — Shooting GOAT Debate' },
  { left: 26, right: 20, title: 'Tatis vs Trout — Best MLB RC?' },
];

async function seed() {
  console.log('🌱 Seeding Card Battles database...');

  // Clear existing data (in order)
  await db.delete(battles).execute().catch(() => {});
  await db.delete(dailyPicks).execute().catch(() => {});
  await db.delete(cardAssets).execute().catch(() => {});
  await db.delete(userStats).execute().catch(() => {});
  await db.delete(users).execute().catch(() => {});
  await db.delete(sponsors).execute().catch(() => {});

  console.log('  Creating users...');
  const createdUsers = await db
    .insert(users)
    .values(DEMO_USERS.map((u) => ({ ...u, passwordHash })))
    .returning();

  await db
    .insert(userStats)
    .values(createdUsers.map((u) => ({
      userId: u.id,
      battlesWon: Math.floor(Math.random() * 30),
      battlesLost: Math.floor(Math.random() * 15),
      battlesCreated: Math.floor(Math.random() * 20),
      votesCast: Math.floor(Math.random() * 500) + 50,
      currentStreak: Math.floor(Math.random() * 10),
      bestStreak: Math.floor(Math.random() * 20) + 5,
    })));

  console.log('  Creating sponsors...');
  const [sponsor] = await db
    .insert(sponsors)
    .values([
      { name: 'PSA Grading', contactEmail: 'sponsorships@psacard.com', logoUrl: 'https://placehold.co/200x80/1a1a2e/ffffff?text=PSA' },
      { name: 'COMC Marketplace', contactEmail: 'ads@comc.com', logoUrl: 'https://placehold.co/200x80/1a1a2e/ffffff?text=COMC' },
      { name: 'Fanatics Collect', contactEmail: 'partners@fanatics.com', logoUrl: 'https://placehold.co/200x80/1a1a2e/ffffff?text=Fanatics' },
    ])
    .returning();

  console.log('  Creating card assets...');
  const createdAssets = await db
    .insert(cardAssets)
    .values(CARD_ASSETS.map((a) => ({
      ...a,
      thumbUrl: a.imageUrl,
      source: 'upload' as const,
      createdByUserId: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
    })))
    .returning();

  console.log('  Creating battles...');
  const now = new Date();
  for (let i = 0; i < BATTLE_PAIRS.length; i++) {
    const pair = BATTLE_PAIRS[i];
    const leftAsset = createdAssets[pair.left];
    const rightAsset = createdAssets[pair.right];
    if (!leftAsset || !rightAsset) continue;

    const endsAt = new Date(now.getTime() + (Math.random() * 48 + 2) * 60 * 60 * 1000);
    const isSponsored = i < 3;

    await db.insert(battles).values({
      createdByUserId: createdUsers[i % createdUsers.length].id,
      leftAssetId: leftAsset.id,
      rightAssetId: rightAsset.id,
      title: pair.title,
      categories: ['investment', 'coolest', 'rarity'],
      durationSeconds: 86400,
      startsAt: now,
      endsAt,
      isSponsored,
      sponsorId: isSponsored ? sponsor.id : null,
      sponsorCta: isSponsored
        ? { label: 'Grade Your Cards', url: 'https://psacard.com', trackClicks: true }
        : null,
      tags: { sport: leftAsset.sport ?? 'nfl', type: 'featured' },
      totalVotesCached: Math.floor(Math.random() * 5000) + 100,
    });
  }

  // Add 5 ended battles
  console.log('  Creating ended battles...');
  for (let i = 0; i < 5; i++) {
    const leftIdx = i * 2;
    const rightIdx = i * 2 + 1;
    const leftAsset = createdAssets[leftIdx % createdAssets.length];
    const rightAsset = createdAssets[(rightIdx) % createdAssets.length];

    await db.insert(battles).values({
      createdByUserId: createdUsers[i].id,
      leftAssetId: leftAsset.id,
      rightAssetId: rightAsset.id,
      title: `[Ended] ${leftAsset.playerName} vs ${rightAsset.playerName}`,
      categories: ['investment', 'coolest', 'rarity'],
      durationSeconds: 86400,
      startsAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      status: 'ended',
      tags: { sport: leftAsset.sport ?? 'nfl', type: 'ended' },
      totalVotesCached: Math.floor(Math.random() * 10000) + 1000,
      result: {
        byCategory: {
          investment: { leftWeightedVotes: 120, rightWeightedVotes: 80, leftPercent: 60, rightPercent: 40, winner: 'left' },
          coolest: { leftWeightedVotes: 90, rightWeightedVotes: 110, leftPercent: 45, rightPercent: 55, winner: 'right' },
          rarity: { leftWeightedVotes: 150, rightWeightedVotes: 50, leftPercent: 75, rightPercent: 25, winner: 'left' },
        },
        overall: { winner: 'left', method: 'best_of_categories' },
        totalWeightedVotes: 600,
      },
    });
  }

  // Daily picks
  console.log('  Creating daily picks...');
  const pickPairs = [
    { left: 13, right: 14, title: 'Investment Pick: Wemby vs Luka' },
    { left: 0, right: 1, title: 'NFL GOAT: Mahomes vs Brady' },
    { left: 20, right: 21, title: 'MLB Icon: Trout vs Ohtani' },
    { left: 10, right: 11, title: 'All-Time: LeBron vs Jordan' },
    { left: 22, right: 23, title: 'Next Gen: EDLC vs Acuña' },
  ];

  for (const pp of pickPairs) {
    const leftAsset = createdAssets[pp.left];
    const rightAsset = createdAssets[pp.right];
    if (!leftAsset || !rightAsset) continue;

    await db.insert(dailyPicks).values({
      leftAssetId: leftAsset.id,
      rightAssetId: rightAsset.id,
      title: pp.title,
      startsAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 22 * 60 * 60 * 1000),
      resolutionMethod: 'manual',
    });
  }

  console.log('✅ Seed complete!');
  console.log(`   Users: ${createdUsers.length}`);
  console.log(`   Card Assets: ${createdAssets.length}`);
  console.log(`   Battles: ${BATTLE_PAIRS.length + 5}`);
  console.log(`   Daily Picks: ${pickPairs.length}`);
  console.log('\n🔑 Login with any demo user: password123');
  console.log('   e.g. cardking@demo.com / password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
