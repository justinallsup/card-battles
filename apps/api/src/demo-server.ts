/**
 * Card Battles — Standalone Demo Server
 * No Docker needed: PGlite (in-memory Postgres) + serves the Next.js app via proxy
 */
import 'dotenv/config';
import { PGlite } from '@electric-sql/pglite';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'demo_jwt_secret_card_battles_2026_long!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'demo_refresh_secret_2026_long!!';
const JWT_SECRET = process.env.JWT_SECRET;

// ── PGlite ────────────────────────────────────────────────────────────────────
const pg = new PGlite();

async function initDb() {
  console.log('[DB] Setting up in-memory PostgreSQL...');
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE,
      password_hash TEXT, avatar_url TEXT, bio TEXT,
      is_admin BOOLEAN DEFAULT false, is_mod BOOLEAN DEFAULT false,
      pro_status TEXT DEFAULT 'none', pro_until TEXT, status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (NOW()), updated_at TEXT DEFAULT (NOW()), last_active_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sponsors (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, contact_email TEXT, logo_url TEXT,
      metadata TEXT DEFAULT '{}', created_at TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS card_assets (
      id TEXT PRIMARY KEY, created_by_user_id TEXT, image_url TEXT NOT NULL,
      thumb_url TEXT, title TEXT NOT NULL, sport TEXT, player_name TEXT,
      year INTEGER, set_name TEXT, variant TEXT, source TEXT DEFAULT 'upload',
      metadata TEXT DEFAULT '{}', created_at TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS battles (
      id TEXT PRIMARY KEY, created_by_user_id TEXT,
      left_asset_id TEXT NOT NULL, right_asset_id TEXT NOT NULL,
      title TEXT NOT NULL, description TEXT, categories TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL,
      status TEXT DEFAULT 'live', is_sponsored BOOLEAN DEFAULT false,
      sponsor_id TEXT, sponsor_cta TEXT, tags TEXT DEFAULT '{}',
      total_votes_cached INTEGER DEFAULT 0, result TEXT, visibility TEXT DEFAULT 'public',
      created_at TEXT DEFAULT (NOW()), updated_at TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY, battle_id TEXT NOT NULL, user_id TEXT NOT NULL,
      category TEXT NOT NULL, choice TEXT NOT NULL, weight REAL DEFAULT 1.0,
      created_at TEXT DEFAULT (NOW()),
      UNIQUE (battle_id, user_id, category)
    );
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY, votes_cast INTEGER DEFAULT 0,
      battles_created INTEGER DEFAULT 0, battles_won INTEGER DEFAULT 0,
      battles_lost INTEGER DEFAULT 0, current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0, daily_pick_wins INTEGER DEFAULT 0,
      daily_pick_losses INTEGER DEFAULT 0, updated_at TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS daily_picks (
      id TEXT PRIMARY KEY, left_asset_id TEXT NOT NULL, right_asset_id TEXT NOT NULL,
      title TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL,
      resolution_method TEXT DEFAULT 'manual', result TEXT,
      created_at TEXT DEFAULT (NOW())
    );
    CREATE TABLE IF NOT EXISTS daily_pick_entries (
      id TEXT PRIMARY KEY, daily_pick_id TEXT NOT NULL, user_id TEXT NOT NULL,
      choice TEXT NOT NULL, created_at TEXT DEFAULT (NOW()),
      UNIQUE (daily_pick_id, user_id)
    );
  `);
  console.log('[DB] Tables ready');
}

async function seedDb() {
  console.log('[Seed] Loading demo data...');
  const hash = bcrypt.hashSync('password123', 10);

  const users = [
    { id: randomUUID(), username: 'cardking', email: 'cardking@demo.com' },
    { id: randomUUID(), username: 'slabmaster', email: 'slabmaster@demo.com' },
    { id: randomUUID(), username: 'rookiehunter', email: 'rookiehunter@demo.com' },
    { id: randomUUID(), username: 'packripper', email: 'packripper@demo.com' },
    { id: randomUUID(), username: 'gradegod', email: 'gradegod@demo.com' },
  ];

  for (const u of users) {
    await pg.query('INSERT INTO users (id,username,email,password_hash) VALUES ($1,$2,$3,$4)', [u.id, u.username, u.email, hash]);
    await pg.query('INSERT INTO user_stats (user_id,votes_cast,battles_won,battles_lost,battles_created,current_streak,best_streak) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [u.id, Math.floor(Math.random()*500)+50, Math.floor(Math.random()*30), Math.floor(Math.random()*15), Math.floor(Math.random()*20), Math.floor(Math.random()*10), Math.floor(Math.random()*25)+5]);
  }

  const cards = [
    { title: 'Patrick Mahomes 2017 Prizm Rookie PSA 10', sport: 'nfl', player: 'Patrick Mahomes', year: 2017, color: '6c47ff/ffffff' },
    { title: 'Tom Brady 2000 Bowman Rookie PSA 10', sport: 'nfl', player: 'Tom Brady', year: 2000, color: '1a1a4e/ffffff' },
    { title: 'Josh Allen 2018 Prizm Rookie Auto', sport: 'nfl', player: 'Josh Allen', year: 2018, color: '003087/ffffff' },
    { title: 'Joe Burrow 2020 Prizm Rookie Auto', sport: 'nfl', player: 'Joe Burrow', year: 2020, color: 'fb4f14/ffffff' },
    { title: 'LeBron James 2003 Topps Chrome RC PSA 10', sport: 'nba', player: 'LeBron James', year: 2003, color: '6f263d/ffc72c' },
    { title: 'Michael Jordan 1986 Fleer Rookie PSA 9', sport: 'nba', player: 'Michael Jordan', year: 1986, color: 'ce1141/000000' },
    { title: 'Victor Wembanyama 2023 Prizm Rookie Auto', sport: 'nba', player: 'Victor Wembanyama', year: 2023, color: '8a8d8f/000000' },
    { title: 'Luka Doncic 2018 Prizm Rookie PSA 10', sport: 'nba', player: 'Luka Doncic', year: 2018, color: '0053bc/ffffff' },
    { title: 'Shohei Ohtani 2018 Topps Rookie PSA 10', sport: 'mlb', player: 'Shohei Ohtani', year: 2018, color: 'ba0021/ffffff' },
    { title: 'Mike Trout 2011 Topps Update RC PSA 10', sport: 'mlb', player: 'Mike Trout', year: 2011, color: '003263/ba0021' },
    { title: 'Elly De La Cruz 2023 Topps Chrome Auto', sport: 'mlb', player: 'Elly De La Cruz', year: 2023, color: 'c6011f/ffffff' },
    { title: 'Caleb Williams 2024 Prizm Rookie Auto', sport: 'nfl', player: 'Caleb Williams', year: 2024, color: '0b162a/c83803' },
    { title: 'Stephen Curry 2009 Prizm Rookie PSA 10', sport: 'nba', player: 'Stephen Curry', year: 2009, color: '1d428a/ffc72c' },
    { title: 'Jayson Tatum 2017 Prizm Rookie Auto', sport: 'nba', player: 'Jayson Tatum', year: 2017, color: '007a33/ffffff' },
    { title: 'Ronald Acuna Jr 2018 Topps Chrome RC', sport: 'mlb', player: 'Ronald Acuna Jr', year: 2018, color: 'ce1141/13274f' },
    { title: 'Juan Soto 2018 Bowman Chrome Auto', sport: 'mlb', player: 'Juan Soto', year: 2018, color: 'ab0003/ffffff' },
  ];

  const assetIds: string[] = [];
  for (const c of cards) {
    const id = randomUUID();
    assetIds.push(id);
    const last = c.player.split(' ').pop() ?? c.player;
    const img = `https://placehold.co/400x560/${c.color}?text=${encodeURIComponent(last + '+' + c.year)}`;
    await pg.query('INSERT INTO card_assets (id,created_by_user_id,image_url,thumb_url,title,sport,player_name,year) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [id, users[0].id, img, img, c.title, c.sport, c.player, c.year]);
  }

  const BATTLES = [
    { l: 0, r: 1, title: 'Mahomes vs Brady — GOAT Rookie Debate 🐐', sponsored: true },
    { l: 4, r: 5, title: 'LeBron vs Jordan — The Greatest Debate Ever', sponsored: true },
    { l: 2, r: 3, title: 'Josh Allen vs Joe Burrow — AFC Rivals' },
    { l: 6, r: 7, title: 'Wembanyama vs Luka — Next Gen Face-Off' },
    { l: 8, r: 9, title: 'Shohei Ohtani vs Mike Trout — MLB Icons' },
    { l: 10, r: 14, title: 'EDLC vs Acuna — Rising MLB Stars' },
    { l: 11, r: 2, title: 'Caleb Williams vs Josh Allen — Bears Rising?' },
    { l: 12, r: 13, title: 'Curry vs Tatum — Championship Legacy' },
    { l: 0, r: 3, title: 'Mahomes vs Burrow — Super Bowl Rivalry 🏆' },
    { l: 4, r: 12, title: 'LeBron vs Curry — Finals Era Debate' },
    { l: 6, r: 5, title: 'Wemby vs Jordan — Impossible Comparison?' },
    { l: 15, r: 9, title: 'Juan Soto vs Mike Trout — Who\'s Better?' },
  ];

  const sponsorId = randomUUID();
  await pg.query('INSERT INTO sponsors (id,name) VALUES ($1,$2)', [sponsorId, 'PSA Grading']);

  const now = new Date();
  for (let i = 0; i < BATTLES.length; i++) {
    const b = BATTLES[i];
    const l = assetIds[b.l];
    const r = assetIds[b.r];
    if (!l || !r) continue;
    const id = randomUUID();
    const hoursLeft = Math.random() * 44 + 2;
    const endsAt = new Date(now.getTime() + hoursLeft * 3600 * 1000).toISOString();
    const totalVotes = Math.floor(Math.random() * 8000) + 200;
    const cta = b.sponsored ? JSON.stringify({ label: 'Grade Your Cards →', url: 'https://psacard.com', trackClicks: true }) : null;
    await pg.query(
      'INSERT INTO battles (id,created_by_user_id,left_asset_id,right_asset_id,title,categories,duration_seconds,starts_at,ends_at,is_sponsored,sponsor_id,sponsor_cta,total_votes_cached,tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
      [id, users[i % users.length].id, l, r, b.title, '["investment","coolest","rarity"]', 86400, now.toISOString(), endsAt, !!b.sponsored, b.sponsored ? sponsorId : null, cta, totalVotes, '{"sport":"mixed"}']
    );

    // Add some fake votes for variety
    const voteCount = Math.floor(Math.random() * 50) + 10;
    for (let v = 0; v < Math.min(voteCount, users.length * 3); v++) {
      const uid = users[v % users.length].id;
      const cats = ['investment', 'coolest', 'rarity'];
      const cat = cats[v % cats.length];
      const choice = Math.random() > 0.5 ? 'left' : 'right';
      const vid = randomUUID();
      await pg.query('INSERT INTO votes (id,battle_id,user_id,category,choice) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', [vid, id, uid, cat, choice]);
    }
  }

  // Daily picks
  const picks = [
    { l: 0, r: 1, title: '🏈 NFL Pick: Mahomes vs Brady' },
    { l: 4, r: 6, title: '🏀 NBA Pick: LeBron vs Wemby' },
    { l: 8, r: 9, title: '⚾ MLB Pick: Ohtani vs Trout' },
  ];
  for (const p of picks) {
    const id = randomUUID();
    const endsAt = new Date(now.getTime() + 22 * 3600 * 1000).toISOString();
    await pg.query('INSERT INTO daily_picks (id,left_asset_id,right_asset_id,title,starts_at,ends_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, assetIds[p.l], assetIds[p.r], p.title, now.toISOString(), endsAt]);
  }

  console.log(`[Seed] ✅ ${users.length} users, ${cards.length} cards, ${BATTLES.length} battles, ${picks.length} daily picks`);
  console.log(`[Seed] 🔑 Login: cardking@demo.com / password123`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeTokens(u: { id: string; username: string; isAdmin: boolean; isMod: boolean }) {
  const p = { sub: u.id, username: u.username, isAdmin: u.isAdmin, isMod: u.isMod };
  return {
    accessToken: jwt.sign(p, JWT_SECRET, { expiresIn: '60m' } as jwt.SignOptions),
    refreshToken: jwt.sign(p, JWT_SECRET, { expiresIn: '30d' } as jwt.SignOptions),
  };
}

function getUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const p = jwt.verify(authHeader.slice(7), JWT_SECRET) as { sub: string };
    return p.sub;
  } catch { return null; }
}

// ── App ───────────────────────────────────────────────────────────────────────
const app = new Hono();
app.use('*', logger());
app.use('*', cors({ origin: '*', credentials: true }));

app.get('/health', (c) => c.json({ status: 'ok', mode: 'demo', timestamp: new Date().toISOString() }));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/v1/auth/register', async (c) => {
  const { username, email, password } = await c.req.json().catch(() => ({}));
  if (!username || !email || !password) return c.json({ error: 'Missing fields' }, 400);
  const ex = await pg.query('SELECT id FROM users WHERE email=$1 OR username=$2', [email.toLowerCase(), username]);
  if ((ex.rows as unknown[]).length) return c.json({ error: 'Email or username already taken' }, 409);
  const id = randomUUID();
  await pg.query('INSERT INTO users (id,username,email,password_hash) VALUES ($1,$2,$3,$4)', [id, username, email.toLowerCase(), bcrypt.hashSync(password, 10)]);
  await pg.query('INSERT INTO user_stats (user_id) VALUES ($1)', [id]);
  const u = { id, username, email: email.toLowerCase(), isAdmin: false, isMod: false };
  return c.json({ user: u, ...makeTokens(u) }, 201);
});

app.post('/api/v1/auth/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}));
  const r = await pg.query('SELECT * FROM users WHERE email=$1', [email?.toLowerCase()]);
  const row = (r.rows as Record<string, unknown>[])[0];
  if (!row || !bcrypt.compareSync(password, row.password_hash as string)) return c.json({ error: 'Invalid credentials' }, 401);
  const { password_hash, ...safe } = row;
  const u = { id: row.id as string, username: row.username as string, isAdmin: !!row.is_admin, isMod: !!row.is_mod };
  return c.json({ user: safe, ...makeTokens(u) });
});

app.get('/api/v1/auth/me', async (c) => {
  const uid = getUserId(c.req.header('Authorization'));
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  const r = await pg.query('SELECT id,username,email,avatar_url,bio,is_admin,is_mod,pro_status,created_at FROM users WHERE id=$1', [uid]);
  const rows = r.rows as unknown[];
  if (!rows.length) return c.json({ error: 'Not found' }, 404);
  return c.json(rows[0]);
});

// ── Battles ───────────────────────────────────────────────────────────────────
app.get('/api/v1/battles/feed', async (c) => {
  const uid = getUserId(c.req.header('Authorization'));
  const r = await pg.query(`
    SELECT b.*, la.id as lid, la.title as ltitle, la.image_url as limg, la.thumb_url as lthumb, la.player_name as lplayer,
      ra.id as rid, ra.title as rtitle, ra.image_url as rimg, ra.thumb_url as rthumb, ra.player_name as rplayer,
      u.username as creator
    FROM battles b
    LEFT JOIN card_assets la ON la.id=b.left_asset_id
    LEFT JOIN card_assets ra ON ra.id=b.right_asset_id
    LEFT JOIN users u ON u.id=b.created_by_user_id
    WHERE b.status='live' ORDER BY b.created_at DESC LIMIT 20`);

  const items = await Promise.all((r.rows as Record<string, unknown>[]).map(async (row) => {
    let myVotes: Record<string,string> = {};
    if (uid) {
      const vr = await pg.query('SELECT category,choice FROM votes WHERE battle_id=$1 AND user_id=$2', [row.id, uid]);
      for (const v of vr.rows as {category:string;choice:string}[]) myVotes[v.category] = v.choice;
    }
    return {
      id: row.id, title: row.title, status: row.status,
      categories: JSON.parse(row.categories as string),
      endsAt: row.ends_at, startsAt: row.starts_at,
      totalVotesCached: row.total_votes_cached,
      isSponsored: !!row.is_sponsored,
      sponsorCta: row.sponsor_cta ? JSON.parse(row.sponsor_cta as string) : null,
      createdByUsername: row.creator, result: row.result,
      left: { assetId: row.lid, title: row.ltitle, imageUrl: row.limg, thumbUrl: row.lthumb, playerName: row.lplayer },
      right: { assetId: row.rid, title: row.rtitle, imageUrl: row.rimg, thumbUrl: row.rthumb, playerName: row.rplayer },
      myVotes,
    };
  }));
  return c.json({ items, nextCursor: null, total: items.length });
});

app.get('/api/v1/battles/:id', async (c) => {
  const uid = getUserId(c.req.header('Authorization'));
  const { id } = c.req.param();
  const r = await pg.query(`
    SELECT b.*, la.id as lid, la.title as ltitle, la.image_url as limg, la.thumb_url as lthumb, la.player_name as lplayer,
      ra.id as rid, ra.title as rtitle, ra.image_url as rimg, ra.thumb_url as rthumb, ra.player_name as rplayer,
      u.username as creator
    FROM battles b
    LEFT JOIN card_assets la ON la.id=b.left_asset_id
    LEFT JOIN card_assets ra ON ra.id=b.right_asset_id
    LEFT JOIN users u ON u.id=b.created_by_user_id
    WHERE b.id=$1`, [id]);
  const rows = r.rows as Record<string, unknown>[];
  if (!rows.length) return c.json({ error: 'Not found' }, 404);
  const row = rows[0];
  let myVotes: Record<string,string> = {};
  if (uid) {
    const vr = await pg.query('SELECT category,choice FROM votes WHERE battle_id=$1 AND user_id=$2', [id, uid]);
    for (const v of vr.rows as {category:string;choice:string}[]) myVotes[v.category] = v.choice;
  }
  return c.json({
    id: row.id, title: row.title, status: row.status,
    categories: JSON.parse(row.categories as string),
    endsAt: row.ends_at, startsAt: row.starts_at,
    totalVotesCached: row.total_votes_cached,
    isSponsored: !!row.is_sponsored,
    sponsorCta: row.sponsor_cta ? JSON.parse(row.sponsor_cta as string) : null,
    createdByUsername: row.creator, result: row.result,
    left: { assetId: row.lid, title: row.ltitle, imageUrl: row.limg, thumbUrl: row.lthumb, playerName: row.lplayer },
    right: { assetId: row.rid, title: row.rtitle, imageUrl: row.rimg, thumbUrl: row.rthumb, playerName: row.rplayer },
    myVotes,
  });
});

app.post('/api/v1/battles/:id/vote', async (c) => {
  const uid = getUserId(c.req.header('Authorization'));
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  const { id: battleId } = c.req.param();
  const { category, choice } = await c.req.json().catch(() => ({}));
  if (!['left','right'].includes(choice)) return c.json({ error: 'Invalid choice' }, 400);
  try {
    await pg.query('INSERT INTO votes (id,battle_id,user_id,category,choice) VALUES ($1,$2,$3,$4,$5)', [randomUUID(), battleId, uid, category, choice]);
    await pg.query('UPDATE battles SET total_votes_cached=total_votes_cached+1 WHERE id=$1', [battleId]);
  } catch (e: unknown) {
    if ((e as {message?:string}).message?.includes('UNIQUE')) return c.json({ error: 'Already voted' }, 409);
    throw e;
  }
  const vr = await pg.query('SELECT choice FROM votes WHERE battle_id=$1 AND category=$2', [battleId, category]);
  const rows = vr.rows as {choice:string}[];
  const left = rows.filter(v => v.choice==='left').length;
  const right = rows.filter(v => v.choice==='right').length;
  const total = left + right;
  return c.json({ battleId, category, userChoice: choice, leftPercent: total > 0 ? Math.round(left/total*1000)/10 : 50, rightPercent: total > 0 ? Math.round(right/total*1000)/10 : 50, totalVotesInCategory: total });
});

app.post('/api/v1/battles', async (c) => {
  const uid = getUserId(c.req.header('Authorization'));
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  const { title, leftAssetId, rightAssetId, categories, durationSeconds } = await c.req.json().catch(() => ({}));
  if (!leftAssetId || !rightAssetId) return c.json({ error: 'Both assets required' }, 400);
  const id = randomUUID();
  const now = new Date();
  const endsAt = new Date(now.getTime() + (durationSeconds||86400)*1000).toISOString();
  await pg.query('INSERT INTO battles (id,created_by_user_id,left_asset_id,right_asset_id,title,categories,duration_seconds,starts_at,ends_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, uid, leftAssetId, rightAssetId, title||'New Battle', JSON.stringify(categories||['investment','coolest','rarity']), durationSeconds||86400, now.toISOString(), endsAt]);
  const r = await pg.query('SELECT * FROM battles WHERE id=$1', [id]);
  return c.json((r.rows as unknown[])[0], 201);
});

// ── Leaderboards ──────────────────────────────────────────────────────────────
app.get('/api/v1/leaderboards', async (c) => {
  const type = c.req.query('type') || 'creators';
  const period = c.req.query('period') || 'week';
  const col = type === 'voters' ? 'us.votes_cast' : 'us.battles_won';
  const r = await pg.query(`SELECT us.*,u.username,u.avatar_url FROM user_stats us JOIN users u ON u.id=us.user_id ORDER BY ${col} DESC LIMIT 20`);
  const items = (r.rows as Record<string,unknown>[]).map((row,i) => ({
    rank: i+1, userId: row.user_id, username: row.username, avatarUrl: row.avatar_url,
    score: type === 'voters' ? row.votes_cast : row.battles_won,
    battlesWon: row.battles_won, votesCast: row.votes_cast, streak: row.current_streak,
  }));
  return c.json({ type, period, items });
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.get('/api/v1/users/:username', async (c) => {
  const r = await pg.query('SELECT id,username,email,avatar_url,bio,pro_status,created_at FROM users WHERE username=$1', [c.req.param('username')]);
  const rows = r.rows as unknown[];
  if (!rows.length) return c.json({ error: 'Not found' }, 404);
  return c.json(rows[0]);
});
app.get('/api/v1/users/:username/stats', async (c) => {
  const ur = await pg.query('SELECT id FROM users WHERE username=$1', [c.req.param('username')]);
  const urows = ur.rows as {id:string}[];
  if (!urows.length) return c.json({ error: 'Not found' }, 404);
  const sr = await pg.query('SELECT * FROM user_stats WHERE user_id=$1', [urows[0].id]);
  return c.json((sr.rows as unknown[])[0] ?? {});
});

// ── Daily Picks ───────────────────────────────────────────────────────────────
app.get('/api/v1/daily-picks/current', async (c) => {
  const uid = getUserId(c.req.header('Authorization'));
  const now = new Date().toISOString();
  const r = await pg.query(`
    SELECT dp.*, la.id as lid, la.title as ltitle, la.image_url as limg, la.player_name as lplayer,
      ra.id as rid, ra.title as rtitle, ra.image_url as rimg, ra.player_name as rplayer
    FROM daily_picks dp
    LEFT JOIN card_assets la ON la.id=dp.left_asset_id
    LEFT JOIN card_assets ra ON ra.id=dp.right_asset_id
    WHERE dp.starts_at<=$1 AND dp.ends_at>=$1`, [now]);
  const rows = r.rows as Record<string,unknown>[];
  const picks = await Promise.all(rows.map(async (row) => {
    let myEntry = null;
    if (uid) {
      const er = await pg.query('SELECT choice FROM daily_pick_entries WHERE daily_pick_id=$1 AND user_id=$2', [row.id, uid]);
      myEntry = (er.rows as {choice:string}[])[0]?.choice ?? null;
    }
    return {
      id: row.id, title: row.title, startsAt: row.starts_at, endsAt: row.ends_at, result: row.result, myEntry,
      left: { assetId: row.lid, title: row.ltitle, imageUrl: row.limg, playerName: row.lplayer },
      right: { assetId: row.rid, title: row.rtitle, imageUrl: row.rimg, playerName: row.rplayer },
    };
  }));
  return c.json(picks);
});

app.post('/api/v1/daily-picks/:id/enter', async (c) => {
  const uid = getUserId(c.req.header('Authorization'));
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  const { id } = c.req.param();
  const { choice } = await c.req.json().catch(() => ({}));
  if (!['left','right'].includes(choice)) return c.json({ error: 'Invalid choice' }, 400);
  try {
    await pg.query('INSERT INTO daily_pick_entries (id,daily_pick_id,user_id,choice) VALUES ($1,$2,$3,$4)', [randomUUID(), id, uid, choice]);
  } catch { return c.json({ error: 'Already entered' }, 409); }
  return c.json({ message: 'Entry submitted', choice }, 201);
});

app.get('/api/v1/battles/:id/results', async (c) => {
  const { id } = c.req.param();
  const vr = await pg.query('SELECT category,choice,weight FROM votes WHERE battle_id=$1', [id]);
  const votes = vr.rows as {category:string;choice:string;weight:number}[];
  const cats = ['investment','coolest','rarity'];
  const byCategory: Record<string,unknown> = {};
  for (const cat of cats) {
    const cv = votes.filter(v => v.category===cat);
    const left = cv.filter(v => v.choice==='left').reduce((s,v) => s+Number(v.weight), 0);
    const right = cv.filter(v => v.choice==='right').reduce((s,v) => s+Number(v.weight), 0);
    const total = left+right;
    byCategory[cat] = { leftWeightedVotes: left, rightWeightedVotes: right, leftPercent: total>0?Math.round(left/total*1000)/10:50, rightPercent: total>0?Math.round(right/total*1000)/10:50, winner: left>right?'left':right>left?'right':'draw' };
  }
  return c.json({ battleId: id, live: { byCategory } });
});

app.post('/api/v1/battles/:id/report', async (c) => {
  const uid = getUserId(c.req.header('Authorization'));
  if (!uid) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ message: 'Report submitted' }, 201);
});

app.post('/api/v1/analytics/sponsor-click', async (c) => {
  return c.json({ tracked: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8000');

initDb()
  .then(seedDb)
  .then(() => {
    serve({ fetch: app.fetch, port: PORT });
    console.log(`\n🚀 Card Battles Demo API running at http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Feed:   http://localhost:${PORT}/api/v1/battles/feed\n`);
  })
  .catch((e) => { console.error('Startup failed:', e); process.exit(1); });

export default app;
