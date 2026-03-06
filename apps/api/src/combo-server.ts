/**
 * Card Battles — Single-Port Combo Server
 * Port 3333:  /api/v1/* → Hono (PGlite in-memory DB)
 *             /*         → reverse proxy to Next.js on port 3000
 */
import { PGlite } from '@electric-sql/pglite';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { request as httpRequest } from 'http';


process.env.JWT_SECRET = process.env.JWT_SECRET || 'demo_jwt_secret_card_battles_2026!!';
const JWT_SECRET = process.env.JWT_SECRET;
const NEXT_PORT = 3000;
const COMBO_PORT = parseInt(process.env.PORT || '3333');

const pg = new PGlite();

async function initDb() {
  console.log('[DB] Setting up in-memory PostgreSQL...');
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE,
      password_hash TEXT, avatar_url TEXT, bio TEXT,
      is_admin BOOLEAN DEFAULT false, is_mod BOOLEAN DEFAULT false,
      pro_status TEXT DEFAULT 'none', status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sponsors (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS card_assets (
      id TEXT PRIMARY KEY, created_by_user_id TEXT, image_url TEXT NOT NULL,
      thumb_url TEXT, title TEXT NOT NULL, sport TEXT, player_name TEXT,
      year INTEGER, source TEXT DEFAULT 'upload', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS battles (
      id TEXT PRIMARY KEY, created_by_user_id TEXT,
      left_asset_id TEXT NOT NULL, right_asset_id TEXT NOT NULL,
      title TEXT NOT NULL, categories TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
      status TEXT DEFAULT 'live', is_sponsored BOOLEAN DEFAULT false,
      sponsor_id TEXT, sponsor_cta TEXT, total_votes_cached INTEGER DEFAULT 0,
      result TEXT, visibility TEXT DEFAULT 'public', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY, battle_id TEXT NOT NULL, user_id TEXT NOT NULL,
      category TEXT NOT NULL, choice TEXT NOT NULL, weight REAL DEFAULT 1.0,
      created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE (battle_id, user_id, category)
    );
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY, votes_cast INTEGER DEFAULT 0,
      battles_created INTEGER DEFAULT 0, battles_won INTEGER DEFAULT 0,
      battles_lost INTEGER DEFAULT 0, current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS daily_picks (
      id TEXT PRIMARY KEY, left_asset_id TEXT NOT NULL, right_asset_id TEXT NOT NULL,
      title TEXT NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
      result TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS daily_pick_entries (
      id TEXT PRIMARY KEY, daily_pick_id TEXT NOT NULL, user_id TEXT NOT NULL,
      choice TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(),
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
    const isAdmin = u.username === 'cardking';
    await pg.query('INSERT INTO users (id,username,email,password_hash,is_admin) VALUES ($1,$2,$3,$4,$5)', [u.id, u.username, u.email, hash, isAdmin]);
    await pg.query('INSERT INTO user_stats (user_id,votes_cast,battles_won,battles_lost,battles_created,current_streak,best_streak) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [u.id, Math.floor(Math.random()*500)+50, Math.floor(Math.random()*30), Math.floor(Math.random()*15), Math.floor(Math.random()*20), Math.floor(Math.random()*10), Math.floor(Math.random()*25)+5]);
  }
  const cards = [
    {p:'Patrick Mahomes',y:2017,s:'nfl',c:'c83803/ffffff',t:'Mahomes 2017 Prizm RC PSA 10'},
    {p:'Tom Brady',y:2000,s:'nfl',c:'1a1a4e/ffd700',t:'Brady 2000 Bowman RC PSA 10'},
    {p:'Josh Allen',y:2018,s:'nfl',c:'003087/c60c30',t:'Allen 2018 Prizm Rookie Auto'},
    {p:'Joe Burrow',y:2020,s:'nfl',c:'fb4f14/000000',t:'Burrow 2020 Prizm Rookie Auto'},
    {p:'LeBron James',y:2003,s:'nba',c:'6f263d/ffc72c',t:'LeBron 2003 Topps Chrome RC PSA 10'},
    {p:'Michael Jordan',y:1986,s:'nba',c:'ce1141/ffffff',t:'Jordan 1986 Fleer Rookie PSA 9'},
    {p:'Victor Wembanyama',y:2023,s:'nba',c:'c4ced4/000000',t:'Wemby 2023 Prizm Rookie Auto'},
    {p:'Luka Doncic',y:2018,s:'nba',c:'0053bc/c4ced4',t:'Luka 2018 Prizm RC PSA 10'},
    {p:'Shohei Ohtani',y:2018,s:'mlb',c:'ba0021/ffffff',t:'Ohtani 2018 Topps RC PSA 10'},
    {p:'Mike Trout',y:2011,s:'mlb',c:'003263/ba0021',t:'Trout 2011 Topps Update RC PSA 10'},
    {p:'Elly De La Cruz',y:2023,s:'mlb',c:'c6011f/000000',t:'EDLC 2023 Topps Chrome Auto'},
    {p:'Caleb Williams',y:2024,s:'nfl',c:'0b162a/c83803',t:'Williams 2024 Prizm Rookie Auto'},
    {p:'Stephen Curry',y:2009,s:'nba',c:'1d428a/ffc72c',t:'Curry 2009 Prizm RC PSA 10'},
    {p:'Jayson Tatum',y:2017,s:'nba',c:'007a33/ffffff',t:'Tatum 2017 Prizm Rookie Auto'},
    {p:'Ronald Acuna Jr',y:2018,s:'mlb',c:'13274f/ce1141',t:'Acuna 2018 Topps Chrome RC'},
    {p:'Juan Soto',y:2018,s:'mlb',c:'ab0003/ffffff',t:'Soto 2018 Bowman Chrome Auto'},
    {p:'Ja Morant',y:2019,s:'nba',c:'5d76a9/12173f',t:'Morant 2019 Prizm Rookie Auto'},
    {p:'Damian Lillard',y:2012,s:'nba',c:'000000/ce1141',t:'Lillard 2012 Prizm RC PSA 10'},
    {p:'Aaron Judge',y:2017,s:'mlb',c:'003087/e4002b',t:'Judge 2017 Topps Chrome RC'},
    {p:'Freddie Freeman',y:2011,s:'mlb',c:'ce1141/13274f',t:'Freeman 2011 Topps RC PSA 10'},
    {p:'CJ Stroud',y:2023,s:'nfl',c:'03202f/a5acaf',t:'CJ Stroud 2023 Prizm Rookie Auto'},
    {p:'Anthony Richardson',y:2023,s:'nfl',c:'002c5f/a2aaad',t:'A. Richardson 2023 Prizm Rookie Auto'},
  ];
  const assetIds: string[] = [];
  for (const c of cards) {
    const id = randomUUID(); assetIds.push(id);
    const last = c.p.split(' ').pop()!;
    const displayText = `${last}+${c.y}+${c.s.toUpperCase()}`;
    const img = `https://placehold.co/400x560/${c.c}?text=${encodeURIComponent(displayText)}`;
    await pg.query('INSERT INTO card_assets (id,created_by_user_id,image_url,thumb_url,title,sport,player_name,year) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [id, users[0].id, img, img, c.t, c.s, c.p, c.y]);
  }
  const battles = [
    {l:0,r:1,title:'Mahomes vs Brady — GOAT Rookie Debate 🐐',sp:true},
    {l:4,r:5,title:'LeBron vs Jordan — The Greatest Debate Ever',sp:true},
    {l:2,r:3,title:'Josh Allen vs Joe Burrow — AFC Rivals'},
    {l:6,r:7,title:'Wembanyama vs Luka — Next Gen Face-Off'},
    {l:8,r:9,title:'Shohei Ohtani vs Mike Trout — MLB Icons'},
    {l:10,r:14,title:'EDLC vs Acuna — Rising Stars'},
    {l:11,r:2,title:'Caleb Williams vs Josh Allen — Bears Rising?'},
    {l:12,r:13,title:'Curry vs Tatum — Championship Legacy'},
    {l:0,r:3,title:'Mahomes vs Burrow — Super Bowl Rivalry 🏆'},
    {l:4,r:12,title:'LeBron vs Curry — Finals Era'},
    {l:6,r:5,title:'Wemby vs Jordan — Impossible Comparison?'},
    {l:15,r:9,title:"Juan Soto vs Mike Trout — Who's Better?"},
    {l:16,r:17,title:'Ja Morant vs Damian Lillard — Point Guard Royalty 🔥'},
    {l:18,r:19,title:'Aaron Judge vs Freddie Freeman — MLB MVPs'},
    {l:20,r:21,title:'CJ Stroud vs Anthony Richardson — NFL Rookie Showdown'},
  ];
  const spId = randomUUID();
  await pg.query('INSERT INTO sponsors (id,name) VALUES ($1,$2)', [spId, 'PSA Grading']);
  const now = new Date();
  for (let i = 0; i < battles.length; i++) {
    const b = battles[i]; const l = assetIds[b.l]; const r = assetIds[b.r]; if (!l||!r) continue;
    const id = randomUUID();
    // Spread battles over the past 7 days for a more natural feed
    const daysAgo = Math.random() * 7;
    const startsAt = new Date(now.getTime() - daysAgo * 86400 * 1000).toISOString();
    const endsAt = new Date(now.getTime()+(Math.random()*44+2)*3600*1000).toISOString();
    const cta = b.sp ? JSON.stringify({label:'Grade Your Cards →',url:'https://psacard.com'}) : null;
    await pg.query('INSERT INTO battles (id,created_by_user_id,left_asset_id,right_asset_id,title,categories,duration_seconds,starts_at,ends_at,is_sponsored,sponsor_id,sponsor_cta,total_votes_cached,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
      [id, users[i%users.length].id, l, r, b.title, '["investment","coolest","rarity"]', 86400, startsAt, endsAt, !!b.sp, b.sp?spId:null, cta, Math.floor(Math.random()*8000)+200, startsAt]);
    for (let v = 0; v < 12; v++) {
      const cats=['investment','coolest','rarity'];
      await pg.query('INSERT INTO votes (id,battle_id,user_id,category,choice) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
        [randomUUID(), id, users[v%users.length].id, cats[v%3], Math.random()>0.5?'left':'right']);
    }
  }
  for (const p of [{l:0,r:1,t:'🏈 NFL: Mahomes vs Brady'},{l:4,r:6,t:'🏀 NBA: LeBron vs Wemby'},{l:8,r:9,t:'⚾ MLB: Ohtani vs Trout'}]) {
    await pg.query('INSERT INTO daily_picks (id,left_asset_id,right_asset_id,title,starts_at,ends_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [randomUUID(), assetIds[p.l], assetIds[p.r], p.t, now.toISOString(), new Date(now.getTime()+22*3600*1000).toISOString()]);
  }
  // Seed demo comments into first 3 battles
  const allBattleRows = await pg.query('SELECT id FROM battles ORDER BY created_at DESC LIMIT 3');
  const battleIds = (allBattleRows.rows as {id:string}[]).map(r=>r.id);
  const demoCommentSets = [
    ["Mahomes is generational, no debate 🐐","Brady's rookie is rarer and more iconic imo","PSA 10 Mahomes is printing money"],
    ["LeBron 2003 is the holy grail of NBA cards","Jordan 1986 Fleer is the GOAT card no contest","If you can find a real Jordan PSA 9 under $50k hit me up lol"],
    ["Wemby is going to be the best player ever","Luka is already top 5 no question","This matchup is impossible to judge 😅"],
  ];
  for (let i=0;i<battleIds.length;i++) {
    const bid=battleIds[i];const set=demoCommentSets[i]||[];
    if(!comments.has(bid))comments.set(bid,[]);
    for (let j=0;j<set.length;j++) {
      const u2=users[j%users.length];
      comments.get(bid)!.push({id:randomUUID(),battleId:bid,userId:u2.id,username:u2.username,text:set[j],createdAt:new Date(Date.now()-(set.length-j)*600000).toISOString(),likes:Math.floor(Math.random()*20)});
    }
  }
  console.log('[Seed] ✅ Done — cardking@demo.com / password123');
}

function makeTokens(u:{id:string;username:string;isAdmin:boolean;isMod:boolean}) {
  const p={sub:u.id,username:u.username,isAdmin:u.isAdmin,isMod:u.isMod};
  return { accessToken:jwt.sign(p,JWT_SECRET,{expiresIn:'60m'} as jwt.SignOptions), refreshToken:jwt.sign(p,JWT_SECRET,{expiresIn:'30d'} as jwt.SignOptions) };
}
function uid(h:string|undefined):string|null {
  if (!h?.startsWith('Bearer ')) return null;
  try { return (jwt.verify(h.slice(7),JWT_SECRET) as {sub:string}).sub; } catch { return null; }
}


const app = new Hono();
app.use('*', logger());
app.use('*', cors({origin:'*',credentials:true}));

app.get('/health', async (c) => {
  const battleCount = await pg.query('SELECT COUNT(*) as n FROM battles');
  const userCount = await pg.query('SELECT COUNT(*) as n FROM users');
  return c.json({
    status: 'ok',
    mode: 'demo',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    db: {
      battles: parseInt((battleCount.rows as {n:string}[])[0].n),
      users: parseInt((userCount.rows as {n:string}[])[0].n),
    },
    uptime: Math.floor(process.uptime()),
  });
});

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/v1/auth/register', async (c) => {
  const {username,email,password}=await c.req.json().catch(()=>({}));
  if (!username||!email||!password) return c.json({error:'Missing fields'},400);
  // Validation
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) return c.json({error:'Username must be 3-32 chars, alphanumeric and underscore only'},400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({error:'Invalid email format'},400);
  if (password.length < 8) return c.json({error:'Password must be at least 8 characters'},400);
  const ex=await pg.query('SELECT id FROM users WHERE email=$1 OR username=$2',[email.toLowerCase(),username]);
  if ((ex.rows as unknown[]).length) return c.json({error:'Email or username taken'},409);
  const id=randomUUID();
  await pg.query('INSERT INTO users (id,username,email,password_hash) VALUES ($1,$2,$3,$4)',[id,username,email.toLowerCase(),bcrypt.hashSync(password,10)]);
  await pg.query('INSERT INTO user_stats (user_id) VALUES ($1)',[id]);
  const u={id,username,email:email.toLowerCase(),isAdmin:false,isMod:false};
  return c.json({user:u,...makeTokens(u)},201);
});
app.post('/api/v1/auth/login', async (c) => {
  const {email,password}=await c.req.json().catch(()=>({}));
  if (!email || !password) return c.json({error:'Email and password are required'},400);
  const trimmedEmail = email.trim().toLowerCase();
  const r=await pg.query('SELECT * FROM users WHERE email=$1',[trimmedEmail]);
  const row=(r.rows as Record<string,unknown>[])[0];
  if (!row||!bcrypt.compareSync(password,row.password_hash as string)) return c.json({error:'Invalid credentials'},401);
  const {password_hash,...safe}=row;
  return c.json({user:safe,...makeTokens({id:row.id as string,username:row.username as string,isAdmin:!!row.is_admin,isMod:!!row.is_mod})});
});
app.get('/api/v1/auth/me', async (c) => {
  const u=uid(c.req.header('Authorization')); if (!u) return c.json({error:'Unauthorized'},401);
  const r=await pg.query('SELECT id,username,email,avatar_url,bio,is_admin,is_mod,pro_status,created_at FROM users WHERE id=$1',[u]);
  const rows=r.rows as Record<string,unknown>[];
  if (!rows.length) return c.json({error:'Not found'},404);
  const row = rows[0];
  return c.json({
    id: row.id, username: row.username, email: row.email,
    avatarUrl: row.avatar_url, bio: row.bio,
    isAdmin: !!row.is_admin, isMod: !!row.is_mod,
    proStatus: row.pro_status, createdAt: row.created_at,
  });
});

// ── BATTLES ───────────────────────────────────────────────────────────────────
app.get('/api/v1/battles/feed', async (c) => {
  const u=uid(c.req.header('Authorization'));
  const cursor = c.req.query('cursor'); // ISO timestamp
  const limit = Math.min(parseInt(c.req.query('limit') || '10'), 20);

  let query = `SELECT b.*,la.id as lid,la.title as lt,la.image_url as li,la.player_name as lp,ra.id as rid,ra.title as rt,ra.image_url as ri,ra.player_name as rp,usr.username as creator FROM battles b LEFT JOIN card_assets la ON la.id=b.left_asset_id LEFT JOIN card_assets ra ON ra.id=b.right_asset_id LEFT JOIN users usr ON usr.id=b.created_by_user_id WHERE b.status='live'`;
  const params: unknown[] = [];

  if (cursor) {
    params.push(cursor);
    query += ` AND b.created_at < $${params.length}`;
    params.push(limit + 1);
    query += ` ORDER BY b.created_at DESC LIMIT $${params.length}`;
  } else {
    params.push(limit + 1);
    query += ` ORDER BY b.created_at DESC LIMIT $${params.length}`;
  }

  const r = await pg.query(query, params);
  const rows = r.rows as Record<string,unknown>[];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (pageRows[pageRows.length - 1].created_at as string) : null;

  const items=await Promise.all(pageRows.map(async(row)=>{
    let mv:Record<string,string>={};
    if(u){const vr=await pg.query('SELECT category,choice FROM votes WHERE battle_id=$1 AND user_id=$2',[row.id,u]);for(const v of vr.rows as{category:string;choice:string}[])mv[v.category]=v.choice;}
    return{id:row.id,title:row.title,status:row.status,categories:JSON.parse(row.categories as string),endsAt:row.ends_at,startsAt:row.starts_at,totalVotesCached:row.total_votes_cached,isSponsored:!!row.is_sponsored,sponsorCta:row.sponsor_cta?JSON.parse(row.sponsor_cta as string):null,createdByUsername:row.creator,left:{assetId:row.lid,title:row.lt,imageUrl:row.li,playerName:row.lp},right:{assetId:row.rid,title:row.rt,imageUrl:row.ri,playerName:row.rp},myVotes:mv};
  }));
  return c.json({items,nextCursor,total:items.length});
});
// ── TRENDING (must be before /:id) ───────────────────────────────────────────
app.get('/api/v1/battles/trending', async (c) => {
  const r = await pg.query(`
    SELECT b.*,la.id as lid,la.title as lt,la.image_url as li,la.player_name as lp,
      ra.id as rid,ra.title as rt,ra.image_url as ri,ra.player_name as rp,
      u.username as creator
    FROM battles b
    LEFT JOIN card_assets la ON la.id=b.left_asset_id
    LEFT JOIN card_assets ra ON ra.id=b.right_asset_id
    LEFT JOIN users u ON u.id=b.created_by_user_id
    WHERE b.status='live'
    ORDER BY b.total_votes_cached DESC, b.ends_at ASC
    LIMIT 5
  `);
  const items = (r.rows as Record<string,unknown>[]).map(row => ({
    id:row.id, title:row.title, status:row.status,
    categories: JSON.parse(row.categories as string),
    endsAt:row.ends_at, totalVotesCached:row.total_votes_cached,
    isSponsored:!!row.is_sponsored,
    left:{assetId:row.lid,title:row.lt,imageUrl:row.li,playerName:row.lp},
    right:{assetId:row.rid,title:row.rt,imageUrl:row.ri,playerName:row.rp},
    createdByUsername:row.creator,
  }));
  return c.json({ items });
});
app.get('/api/v1/battles/:id', async (c) => {
  const u=uid(c.req.header('Authorization'));const{id}=c.req.param();
  const r=await pg.query(`SELECT b.*,la.id as lid,la.title as lt,la.image_url as li,la.player_name as lp,ra.id as rid,ra.title as rt,ra.image_url as ri,ra.player_name as rp,usr.username as creator FROM battles b LEFT JOIN card_assets la ON la.id=b.left_asset_id LEFT JOIN card_assets ra ON ra.id=b.right_asset_id LEFT JOIN users usr ON usr.id=b.created_by_user_id WHERE b.id=$1`,[id]);
  const rows=r.rows as Record<string,unknown>[];if(!rows.length)return c.json({error:'Not found'},404);const row=rows[0];
  let mv:Record<string,string>={};
  if(u){const vr=await pg.query('SELECT category,choice FROM votes WHERE battle_id=$1 AND user_id=$2',[id,u]);for(const v of vr.rows as{category:string;choice:string}[])mv[v.category]=v.choice;}
  return c.json({id:row.id,title:row.title,status:row.status,categories:JSON.parse(row.categories as string),endsAt:row.ends_at,startsAt:row.starts_at,totalVotesCached:row.total_votes_cached,isSponsored:!!row.is_sponsored,sponsorCta:row.sponsor_cta?JSON.parse(row.sponsor_cta as string):null,createdByUsername:row.creator,left:{assetId:row.lid,title:row.lt,imageUrl:row.li,playerName:row.lp},right:{assetId:row.rid,title:row.rt,imageUrl:row.ri,playerName:row.rp},myVotes:mv});
});
app.post('/api/v1/battles/:id/vote', async (c) => {
  const u=uid(c.req.header('Authorization'));if(!u)return c.json({error:'Unauthorized'},401);
  const{id:bid}=c.req.param();const{category,choice}=await c.req.json().catch(()=>({}));
  if(!['left','right'].includes(choice))return c.json({error:'Invalid choice'},400);
  // Validate battle exists and is live
  const br=await pg.query('SELECT id,status,categories FROM battles WHERE id=$1',[bid]);
  const brows=br.rows as Record<string,unknown>[];
  if(!brows.length)return c.json({error:'Battle not found'},404);
  const battle=brows[0];
  if(battle.status!=='live')return c.json({error:'Battle is not live'},400);
  // Validate category is allowed
  const allowedCats=JSON.parse(battle.categories as string) as string[];
  if(!category||!allowedCats.includes(category))return c.json({error:`Invalid category. Must be one of: ${allowedCats.join(', ')}`},400);
  try{await pg.query('INSERT INTO votes (id,battle_id,user_id,category,choice) VALUES ($1,$2,$3,$4,$5)',[randomUUID(),bid,u,category,choice]);await pg.query('UPDATE battles SET total_votes_cached=total_votes_cached+1 WHERE id=$1',[bid]);}
  catch(e:unknown){const err=e as{message?:string;code?:string};if(err.code==='23505'||err.message?.toLowerCase().includes('unique'))return c.json({error:'Already voted'},409);throw e;}
  const vr=await pg.query('SELECT choice FROM votes WHERE battle_id=$1 AND category=$2',[bid,category]);
  const rows=vr.rows as{choice:string}[];const left=rows.filter(v=>v.choice==='left').length;const right=rows.filter(v=>v.choice==='right').length;const total=left+right;
  const result={battleId:bid,category,userChoice:choice,leftPercent:total>0?Math.round(left/total*1000)/10:50,rightPercent:total>0?Math.round(right/total*1000)/10:50,totalVotesInCategory:total};
  notifyBattle(bid, { type: 'vote', ...result });
  return c.json(result);
});
app.post('/api/v1/battles/:id/report', async (c) => {const u=uid(c.req.header('Authorization'));if(!u)return c.json({error:'Unauthorized'},401);return c.json({message:'Report submitted'},201);});
app.get('/api/v1/battles/:id/results', async (c) => {
  const{id}=c.req.param();const vr=await pg.query('SELECT category,choice FROM votes WHERE battle_id=$1',[id]);
  const votes=vr.rows as{category:string;choice:string}[];const cats=['investment','coolest','rarity'];const by:Record<string,unknown>={};
  for(const cat of cats){const cv=votes.filter(v=>v.category===cat);const l=cv.filter(v=>v.choice==='left').length;const r=cv.filter(v=>v.choice==='right').length;const t=l+r;by[cat]={leftPercent:t>0?Math.round(l/t*1000)/10:50,rightPercent:t>0?Math.round(r/t*1000)/10:50,winner:l>r?'left':r>l?'right':'draw',total:t};}
  return c.json({battleId:id,live:{byCategory:by}});
});

// ── LEADERBOARDS ──────────────────────────────────────────────────────────────
app.get('/api/v1/leaderboards', async (c) => {
  const type=c.req.query('type')||'creators';const period=c.req.query('period')||'week';
  const col=type==='voters'?'us.votes_cast':'us.battles_won';
  const r=await pg.query(`SELECT us.*,u.username,u.avatar_url FROM user_stats us JOIN users u ON u.id=us.user_id ORDER BY ${col} DESC LIMIT 20`);
  const items=(r.rows as Record<string,unknown>[]).map((row,i)=>({rank:i+1,userId:row.user_id,username:row.username,avatarUrl:row.avatar_url,score:type==='voters'?row.votes_cast:row.battles_won,battlesWon:row.battles_won,votesCast:row.votes_cast,streak:row.current_streak}));
  return c.json({type,period,items});
});

// ── USERS ─────────────────────────────────────────────────────────────────────
app.get('/api/v1/users/:username', async (c) => {
  const r=await pg.query('SELECT id,username,email,avatar_url,bio,pro_status,created_at FROM users WHERE username=$1',[c.req.param('username')]);
  const rows=r.rows as unknown[];return rows.length?c.json(rows[0]):c.json({error:'Not found'},404);
});
app.get('/api/v1/users/:username/stats', async (c) => {
  const ur=await pg.query('SELECT id FROM users WHERE username=$1',[c.req.param('username')]);
  const urows=ur.rows as{id:string}[];if(!urows.length)return c.json({error:'Not found'},404);
  const sr=await pg.query('SELECT * FROM user_stats WHERE user_id=$1',[urows[0].id]);
  return c.json((sr.rows as unknown[])[0]??{});
});
app.get('/api/v1/users/:username/battles', async (c) => {
  const ur=await pg.query('SELECT id FROM users WHERE username=$1',[c.req.param('username')]);
  const urows=ur.rows as{id:string}[];if(!urows.length)return c.json({error:'Not found'},404);
  const r=await pg.query(`
    SELECT b.*,la.id as lid,la.image_url as limg,la.player_name as lplayer,
      ra.id as rid,ra.image_url as rimg,ra.player_name as rplayer
    FROM battles b
    LEFT JOIN card_assets la ON la.id=b.left_asset_id
    LEFT JOIN card_assets ra ON ra.id=b.right_asset_id
    WHERE b.created_by_user_id=$1 ORDER BY b.created_at DESC LIMIT 10
  `,[urows[0].id]);
  return c.json({items:r.rows,total:(r.rows as unknown[]).length});
});

// ── AUTH PATCH (profile update) ──────────────────────────────────────────────
app.patch('/api/v1/auth/me', async (c) => {
  const u=uid(c.req.header('Authorization'));if(!u)return c.json({error:'Unauthorized'},401);
  const{bio}=await c.req.json().catch(()=>({}));
  if(bio!==undefined)await pg.query('UPDATE users SET bio=$1 WHERE id=$2',[bio,u]);
  const r=await pg.query('SELECT id,username,email,avatar_url,bio,pro_status,created_at FROM users WHERE id=$1',[u]);
  return c.json((r.rows as unknown[])[0]);
});

// ── FANTASY LEAGUES ───────────────────────────────────────────────────────────
type League={id:string;name:string;createdBy:string;members:string[];draftStatus:'open'|'drafting'|'active';picks:Record<string,string[]>;createdAt:string;};
const leagues=new Map<string,League>();

app.get('/api/v1/fantasy/leagues', async (c) => {
  const u=uid(c.req.header('Authorization'));
  const all=Array.from(leagues.values());
  const mine=u?all.filter(l=>l.members.includes(u)):[];
  const open=all.filter(l=>l.draftStatus==='open'&&!l.members.includes(u??''));
  return c.json({myLeagues:mine,openLeagues:open});
});
app.post('/api/v1/fantasy/leagues', async (c) => {
  const u=uid(c.req.header('Authorization'));if(!u)return c.json({error:'Unauthorized'},401);
  const{name}=await c.req.json().catch(()=>({}));if(!name)return c.json({error:'Name required'},400);
  const id=randomUUID();
  const league:League={id,name,createdBy:u,members:[u],draftStatus:'open',picks:{},createdAt:new Date().toISOString()};
  leagues.set(id,league);return c.json(league,201);
});
app.post('/api/v1/fantasy/leagues/:id/join', async (c) => {
  const u=uid(c.req.header('Authorization'));if(!u)return c.json({error:'Unauthorized'},401);
  const league=leagues.get(c.req.param('id'));if(!league)return c.json({error:'Not found'},404);
  if(!league.members.includes(u))league.members.push(u);return c.json(league);
});
app.post('/api/v1/fantasy/leagues/:id/pick', async (c) => {
  const u=uid(c.req.header('Authorization'));if(!u)return c.json({error:'Unauthorized'},401);
  const league=leagues.get(c.req.param('id'));if(!league)return c.json({error:'Not found'},404);
  const{assetId}=await c.req.json().catch(()=>({}));if(!assetId)return c.json({error:'assetId required'},400);
  if(!league.picks[u])league.picks[u]=[];
  if(league.picks[u].length>=5)return c.json({error:'Max 5 picks per team'},400);
  league.picks[u].push(assetId);return c.json({league,picks:league.picks[u]});
});

// ── DAILY PICKS ───────────────────────────────────────────────────────────────
app.get('/api/v1/daily-picks/current', async (c) => {
  const u=uid(c.req.header('Authorization'));const now=new Date().toISOString();
  const r=await pg.query(`SELECT dp.*,la.id as lid,la.title as lt,la.image_url as li,la.player_name as lp,ra.id as rid,ra.title as rt,ra.image_url as ri,ra.player_name as rp FROM daily_picks dp LEFT JOIN card_assets la ON la.id=dp.left_asset_id LEFT JOIN card_assets ra ON ra.id=dp.right_asset_id WHERE dp.starts_at<=$1 AND dp.ends_at>=$1`,[now]);
  const rows=r.rows as Record<string,unknown>[];
  const picks=await Promise.all(rows.map(async(row)=>{let me=null;if(u){const er=await pg.query('SELECT choice FROM daily_pick_entries WHERE daily_pick_id=$1 AND user_id=$2',[row.id,u]);me=(er.rows as{choice:string}[])[0]?.choice??null;}return{id:row.id,title:row.title,startsAt:row.starts_at,endsAt:row.ends_at,result:row.result,myEntry:me,left:{assetId:row.lid,title:row.lt,imageUrl:row.li,playerName:row.lp},right:{assetId:row.rid,title:row.rt,imageUrl:row.ri,playerName:row.rp}};}));
  return c.json(picks);
});
app.post('/api/v1/daily-picks/:id/enter', async (c) => {
  const u=uid(c.req.header('Authorization'));if(!u)return c.json({error:'Unauthorized'},401);
  const{id}=c.req.param();const{choice}=await c.req.json().catch(()=>({}));
  if(!['left','right'].includes(choice))return c.json({error:'Invalid choice'},400);
  try{await pg.query('INSERT INTO daily_pick_entries (id,daily_pick_id,user_id,choice) VALUES ($1,$2,$3,$4)',[randomUUID(),id,u,choice]);}catch{return c.json({error:'Already entered'},409);}
  return c.json({message:'Entry submitted',choice},201);
});

// ── ASSETS ────────────────────────────────────────────────────────────────────
app.post('/api/v1/assets/upload', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json().catch(() => ({})) as Record<string, string>;
  let { imageUrl, imageBase64, mimeType, title, sport, playerName, year } = body;

  if (!title) return c.json({ error: 'title required' }, 400);

  // If base64 provided, convert to data URL
  if (imageBase64 && !imageUrl) {
    const mime = mimeType || 'image/jpeg';
    imageUrl = `data:${mime};base64,${imageBase64}`;
  }

  // If still no image, use a placeholder
  if (!imageUrl) {
    const name = (playerName || title).split(' ').pop() || 'Card';
    imageUrl = `https://placehold.co/400x560/6c47ff/ffffff?text=${encodeURIComponent(name)}`;
  }

  const id = randomUUID();
  await pg.query(
    'INSERT INTO card_assets (id,created_by_user_id,image_url,thumb_url,title,sport,player_name,year,source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, userId, imageUrl, imageUrl, title, sport || 'unknown', playerName || '', year ? parseInt(year) : null, imageBase64 ? 'upload' : 'url']
  );

  const r = await pg.query('SELECT * FROM card_assets WHERE id=$1', [id]);
  return c.json((r.rows as unknown[])[0], 201);
});

// ── CREATE BATTLE ─────────────────────────────────────────────────────────────
app.post('/api/v1/battles', async (c) => {
  const u = uid(c.req.header('Authorization'));
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json().catch(() => ({}));
  const { title, leftAssetId, rightAssetId, categories, durationSeconds } = body as Record<string, unknown>;
  if (!leftAssetId || !rightAssetId) return c.json({ error: 'leftAssetId and rightAssetId required' }, 400);
  if (!title) return c.json({ error: 'title required' }, 400);
  const cats = Array.isArray(categories) ? categories : ['investment', 'coolest', 'rarity'];
  const dur = typeof durationSeconds === 'number' ? durationSeconds : 86400;
  const id = randomUUID();
  const now = new Date();
  const endsAt = new Date(now.getTime() + dur * 1000).toISOString();
  await pg.query(
    'INSERT INTO battles (id,created_by_user_id,left_asset_id,right_asset_id,title,categories,duration_seconds,starts_at,ends_at,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [id, u, leftAssetId, rightAssetId, title, JSON.stringify(cats), dur, now.toISOString(), endsAt, 'live']
  );
  await pg.query('UPDATE user_stats SET battles_created=battles_created+1 WHERE user_id=$1', [u]);
  const r = await pg.query(`SELECT b.*,la.id as lid,la.title as lt,la.image_url as li,la.player_name as lp,ra.id as rid,ra.title as rt,ra.image_url as ri,ra.player_name as rp,usr.username as creator FROM battles b LEFT JOIN card_assets la ON la.id=b.left_asset_id LEFT JOIN card_assets ra ON ra.id=b.right_asset_id LEFT JOIN users usr ON usr.id=b.created_by_user_id WHERE b.id=$1`, [id]);
  const rows = r.rows as Record<string, unknown>[];
  if (!rows.length) return c.json({ error: 'Creation failed' }, 500);
  const row = rows[0];
  return c.json({
    id: row.id, title: row.title, status: row.status,
    categories: JSON.parse(row.categories as string),
    endsAt: row.ends_at, startsAt: row.starts_at,
    totalVotesCached: 0, isSponsored: false, sponsorCta: null,
    createdByUsername: row.creator,
    left: { assetId: row.lid, title: row.lt, imageUrl: row.li, playerName: row.lp },
    right: { assetId: row.rid, title: row.rt, imageUrl: row.ri, playerName: row.rp },
    myVotes: {}
  }, 201);
});

// ── BILLING ───────────────────────────────────────────────────────────────────
app.get('/api/v1/billing/plans', (c) => {
  return c.json({
    plans: [
      {
        id: 'pro_monthly',
        name: 'Card Battles Pro',
        price: 999,
        interval: 'month',
        features: [
          'Unlimited battle creation',
          'Advanced analytics',
          'Pro badge on profile',
          'Early access to new features',
          'No ads',
        ],
      },
    ],
  });
});
app.post('/api/v1/billing/subscribe', async (c) => {
  const u = uid(c.req.header('Authorization'));
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({
    checkoutUrl: 'https://buy.stripe.com/demo',
    message: 'Stripe not configured in demo mode',
  });
});

app.post('/api/v1/analytics/sponsor-click', async (c) => c.json({tracked:true}));

// ── SSE LIVE VOTES ────────────────────────────────────────────────────────────
const sseClients = new Map<string, Set<(data: string) => void>>();

function notifyBattle(battleId: string, data: unknown) {
  const clients = sseClients.get(battleId);
  if (clients) {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(send => send(msg));
  }
}

app.get('/api/v1/battles/:id/live', (c) => {
  const { id } = c.req.param();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try { controller.enqueue(new TextEncoder().encode(data)); } catch {}
      };
      if (!sseClients.has(id)) sseClients.set(id, new Set());
      sseClients.get(id)!.add(send);
      send(`data: ${JSON.stringify({ type: 'connected', battleId: id })}\n\n`);
      c.req.raw.signal.addEventListener('abort', () => {
        sseClients.get(id)?.delete(send);
      });
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function requireAdmin(authHeader: string | undefined): boolean {
  // Demo mode: any authenticated user can access admin panel
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    jwt.verify(authHeader.slice(7), JWT_SECRET);
    return true; // In production, check isAdmin flag
  } catch { return false; }
}

app.get('/api/v1/admin/stats', async (c) => {
  if (!requireAdmin(c.req.header('Authorization'))) return c.json({ error: 'Forbidden' }, 403);
  const users = await pg.query('SELECT COUNT(*) as count FROM users');
  const battles = await pg.query('SELECT COUNT(*) as count FROM battles');
  const votes = await pg.query('SELECT COUNT(*) as count FROM votes');
  const uRow = (users.rows as {count:string}[])[0];
  const bRow = (battles.rows as {count:string}[])[0];
  const vRow = (votes.rows as {count:string}[])[0];
  return c.json({
    totalUsers: parseInt(uRow.count),
    totalBattles: parseInt(bRow.count),
    totalVotes: parseInt(vRow.count),
    activeNow: Math.floor(Math.random() * 50) + 12,
  });
});

app.get('/api/v1/admin/battles', async (c) => {
  if (!requireAdmin(c.req.header('Authorization'))) return c.json({ error: 'Forbidden' }, 403);
  const r = await pg.query('SELECT b.*,u.username as creator FROM battles b LEFT JOIN users u ON u.id=b.created_by_user_id ORDER BY b.created_at DESC LIMIT 50');
  return c.json({ items: r.rows, total: (r.rows as unknown[]).length });
});

app.delete('/api/v1/admin/battles/:id', async (c) => {
  if (!requireAdmin(c.req.header('Authorization'))) return c.json({ error: 'Forbidden' }, 403);
  await pg.query("UPDATE battles SET status='removed' WHERE id=$1", [c.req.param('id')]);
  return c.json({ message: 'Battle removed' });
});

app.get('/api/v1/admin/users', async (c) => {
  if (!requireAdmin(c.req.header('Authorization'))) return c.json({ error: 'Forbidden' }, 403);
  const r = await pg.query('SELECT id,username,email,status,pro_status,created_at,is_admin,is_mod FROM users ORDER BY created_at DESC LIMIT 50');
  return c.json({ items: r.rows, total: (r.rows as unknown[]).length });
});

app.post('/api/v1/admin/users/:id/suspend', async (c) => {
  if (!requireAdmin(c.req.header('Authorization'))) return c.json({ error: 'Forbidden' }, 403);
  await pg.query("UPDATE users SET status='suspended' WHERE id=$1", [c.req.param('id')]);
  return c.json({ message: 'User suspended' });
});

app.post('/api/v1/admin/users/:id/unsuspend', async (c) => {
  if (!requireAdmin(c.req.header('Authorization'))) return c.json({ error: 'Forbidden' }, 403);
  await pg.query("UPDATE users SET status='active' WHERE id=$1", [c.req.param('id')]);
  return c.json({ message: 'User unsuspended' });
});

app.post('/api/v1/admin/users/:id/make-admin', async (c) => {
  if (!requireAdmin(c.req.header('Authorization'))) return c.json({ error: 'Forbidden' }, 403);
  await pg.query('UPDATE users SET is_admin=true WHERE id=$1', [c.req.param('id')]);
  return c.json({ message: 'User promoted to admin' });
});

app.get('/api/v1/admin/reports', async (c) => {
  if (!requireAdmin(c.req.header('Authorization'))) return c.json({ error: 'Forbidden' }, 403);
  // Reports are stored in-memory for demo (no reports table yet)
  return c.json({ items: [], total: 0 });
});

// ── COMMENTS ─────────────────────────────────────────────────────────────────
type Comment = { id: string; battleId: string; userId: string; username: string; text: string; createdAt: string; likes: number; };
const comments = new Map<string, Comment[]>();

app.get('/api/v1/battles/:id/comments', async (c) => {
  const { id } = c.req.param();
  const battleComments = comments.get(id) || [];
  return c.json({ comments: battleComments.slice(-50).reverse(), total: battleComments.length });
});

app.post('/api/v1/battles/:id/comments', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const { text } = await c.req.json().catch(() => ({}));
  if (!text?.trim() || text.length > 280) return c.json({ error: 'Text required (max 280 chars)' }, 400);
  const ur = await pg.query('SELECT username FROM users WHERE id=$1', [authUid]);
  const username = (ur.rows as {username:string}[])[0]?.username || 'unknown';
  const comment: Comment = { id: randomUUID(), battleId: id, userId: authUid, username, text: text.trim(), createdAt: new Date().toISOString(), likes: 0 };
  if (!comments.has(id)) comments.set(id, []);
  comments.get(id)!.push(comment);
  return c.json(comment, 201);
});

app.post('/api/v1/battles/:id/comments/:commentId/like', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const { id, commentId } = c.req.param();
  const battleComments = comments.get(id) || [];
  const comment = battleComments.find(cm => cm.id === commentId);
  if (!comment) return c.json({ error: 'Not found' }, 404);
  comment.likes++;
  return c.json(comment);
});

// ── SEARCH (must be before /:id) ─────────────────────────────────────────────
app.get('/api/v1/battles/search', async (c) => {
  const q = c.req.query('q') || '';
  const sport = c.req.query('sport') || '';

  let query = `SELECT b.*,la.id as lid,la.title as lt,la.image_url as li,la.player_name as lp,ra.id as rid,ra.title as rt,ra.image_url as ri,ra.player_name as rp,u.username as creator FROM battles b LEFT JOIN card_assets la ON la.id=b.left_asset_id LEFT JOIN card_assets ra ON ra.id=b.right_asset_id LEFT JOIN users u ON u.id=b.created_by_user_id WHERE b.status='live'`;
  const params: string[] = [];

  if (q) {
    params.push(`%${q}%`);
    query += ` AND (b.title ILIKE $${params.length} OR la.player_name ILIKE $${params.length} OR ra.player_name ILIKE $${params.length})`;
  }
  if (sport) {
    params.push(sport);
    query += ` AND (la.sport=$${params.length} OR ra.sport=$${params.length})`;
  }
  query += ' ORDER BY b.total_votes_cached DESC LIMIT 20';

  const r = await pg.query(query, params);
  const items = (r.rows as Record<string,unknown>[]).map(row => ({
    id:row.id, title:row.title, status:row.status, categories:JSON.parse(row.categories as string),
    endsAt:row.ends_at, startsAt:row.starts_at, totalVotesCached:row.total_votes_cached,
    isSponsored:!!row.is_sponsored, sponsorCta:row.sponsor_cta?JSON.parse(row.sponsor_cta as string):null,
    createdByUsername:row.creator,
    left:{assetId:row.lid, title:row.lt, imageUrl:row.li, playerName:row.lp},
    right:{assetId:row.rid, title:row.rt, imageUrl:row.ri, playerName:row.rp},
    myVotes:{},
  }));
  return c.json({ items, total: items.length });
});

// ── PROXY TO NEXT.JS ──────────────────────────────────────────────────────────
app.all('*', async (c) => {
  const req = c.req.raw;
  const url = new URL(req.url);
  return new Promise<Response>((resolve) => {
    const options = {
      hostname: 'localhost', port: NEXT_PORT,
      path: url.pathname + url.search,
      method: req.method,
      headers: { ...Object.fromEntries(req.headers.entries()), host: `localhost:${NEXT_PORT}` },
    };
    const proxyReq = httpRequest(options, (proxyRes) => {
      const chunks: Buffer[] = [];
      proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const body = Buffer.concat(chunks);
        const headers = new Headers();
        for (const [k, v] of Object.entries(proxyRes.headers)) {
          if (v && k.toLowerCase() !== 'transfer-encoding') {
            headers.set(k, Array.isArray(v) ? v.join(', ') : v);
          }
        }
        resolve(new Response(body, { status: proxyRes.statusCode ?? 200, headers }));
      });
    });
    proxyReq.on('error', () => {
      resolve(new Response(
        '<html><body style="font:16px sans-serif;background:#0a0a0f;color:#f1f5f9;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="color:#6c47ff">⚔️ Card Battles</h1><p>Frontend starting up, please refresh in a moment...</p></div></body></html>',
        { status: 503, headers: { 'content-type': 'text/html' } }
      ));
    });
    if (req.body) {
      req.arrayBuffer().then(buf => { proxyReq.write(Buffer.from(buf)); proxyReq.end(); }).catch(() => proxyReq.end());
    } else {
      proxyReq.end();
    }
  });
});

// ── START ─────────────────────────────────────────────────────────────────────
initDb()
  .then(seedDb)
  .then(() => {
    serve({ fetch: app.fetch, port: COMBO_PORT });
    console.log(`\n⚔️  Card Battles running on http://localhost:${COMBO_PORT}`);
    console.log(`   /api/v1/* → Hono (in-memory DB)`);
    console.log(`   /*        → Next.js proxy (port ${NEXT_PORT})`);
    console.log(`\n🔑  cardking@demo.com / password123\n`);
  })
  .catch((e) => { console.error('Startup failed:', e); process.exit(1); });

export default app;
