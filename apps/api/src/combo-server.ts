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
import type { Context } from 'hono';

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
    await pg.query('INSERT INTO users (id,username,email,password_hash) VALUES ($1,$2,$3,$4)', [u.id, u.username, u.email, hash]);
    await pg.query('INSERT INTO user_stats (user_id,votes_cast,battles_won,battles_lost,battles_created,current_streak,best_streak) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [u.id, Math.floor(Math.random()*500)+50, Math.floor(Math.random()*30), Math.floor(Math.random()*15), Math.floor(Math.random()*20), Math.floor(Math.random()*10), Math.floor(Math.random()*25)+5]);
  }
  const cards = [
    {p:'Patrick Mahomes',y:2017,s:'nfl',c:'6c47ff/ffffff',t:'Mahomes 2017 Prizm RC PSA 10'},
    {p:'Tom Brady',y:2000,s:'nfl',c:'1a1a4e/ffffff',t:'Brady 2000 Bowman RC PSA 10'},
    {p:'Josh Allen',y:2018,s:'nfl',c:'003087/ffffff',t:'Allen 2018 Prizm Rookie Auto'},
    {p:'Joe Burrow',y:2020,s:'nfl',c:'fb4f14/ffffff',t:'Burrow 2020 Prizm Rookie Auto'},
    {p:'LeBron James',y:2003,s:'nba',c:'6f263d/ffc72c',t:'LeBron 2003 Topps Chrome RC PSA 10'},
    {p:'Michael Jordan',y:1986,s:'nba',c:'ce1141/000000',t:'Jordan 1986 Fleer Rookie PSA 9'},
    {p:'Victor Wembanyama',y:2023,s:'nba',c:'8a8d8f/000000',t:'Wemby 2023 Prizm Rookie Auto'},
    {p:'Luka Doncic',y:2018,s:'nba',c:'0053bc/ffffff',t:'Luka 2018 Prizm RC PSA 10'},
    {p:'Shohei Ohtani',y:2018,s:'mlb',c:'ba0021/ffffff',t:'Ohtani 2018 Topps RC PSA 10'},
    {p:'Mike Trout',y:2011,s:'mlb',c:'003263/ba0021',t:'Trout 2011 Topps Update RC PSA 10'},
    {p:'Elly De La Cruz',y:2023,s:'mlb',c:'c6011f/ffffff',t:'EDLC 2023 Topps Chrome Auto'},
    {p:'Caleb Williams',y:2024,s:'nfl',c:'0b162a/c83803',t:'Williams 2024 Prizm Rookie Auto'},
    {p:'Stephen Curry',y:2009,s:'nba',c:'1d428a/ffc72c',t:'Curry 2009 Prizm RC PSA 10'},
    {p:'Jayson Tatum',y:2017,s:'nba',c:'007a33/ffffff',t:'Tatum 2017 Prizm Rookie Auto'},
    {p:'Ronald Acuna Jr',y:2018,s:'mlb',c:'ce1141/13274f',t:'Acuna 2018 Topps Chrome RC'},
    {p:'Juan Soto',y:2018,s:'mlb',c:'ab0003/ffffff',t:'Soto 2018 Bowman Chrome Auto'},
  ];
  const assetIds: string[] = [];
  for (const c of cards) {
    const id = randomUUID(); assetIds.push(id);
    const last = c.p.split(' ').pop()!;
    const img = `https://placehold.co/400x560/${c.c}?text=${encodeURIComponent(last+'+'+c.y)}`;
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
  ];
  const spId = randomUUID();
  await pg.query('INSERT INTO sponsors (id,name) VALUES ($1,$2)', [spId, 'PSA Grading']);
  const now = new Date();
  for (let i = 0; i < battles.length; i++) {
    const b = battles[i]; const l = assetIds[b.l]; const r = assetIds[b.r]; if (!l||!r) continue;
    const id = randomUUID();
    const endsAt = new Date(now.getTime()+(Math.random()*44+2)*3600*1000).toISOString();
    const cta = b.sp ? JSON.stringify({label:'Grade Your Cards →',url:'https://psacard.com'}) : null;
    await pg.query('INSERT INTO battles (id,created_by_user_id,left_asset_id,right_asset_id,title,categories,duration_seconds,starts_at,ends_at,is_sponsored,sponsor_id,sponsor_cta,total_votes_cached) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [id, users[i%users.length].id, l, r, b.title, '["investment","coolest","rarity"]', 86400, now.toISOString(), endsAt, !!b.sp, b.sp?spId:null, cta, Math.floor(Math.random()*8000)+200]);
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
const getUserId = uid;

const app = new Hono();
app.use('*', logger());
app.use('*', cors({origin:'*',credentials:true}));

app.get('/health', (c) => c.json({status:'ok',mode:'demo',ts:new Date().toISOString()}));

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/v1/auth/register', async (c) => {
  const {username,email,password}=await c.req.json().catch(()=>({}));
  if (!username||!email||!password) return c.json({error:'Missing fields'},400);
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
  const r=await pg.query('SELECT * FROM users WHERE email=$1',[email?.toLowerCase()]);
  const row=(r.rows as Record<string,unknown>[])[0];
  if (!row||!bcrypt.compareSync(password,row.password_hash as string)) return c.json({error:'Invalid credentials'},401);
  const {password_hash,...safe}=row;
  return c.json({user:safe,...makeTokens({id:row.id as string,username:row.username as string,isAdmin:!!row.is_admin,isMod:!!row.is_mod})});
});
app.get('/api/v1/auth/me', async (c) => {
  const u=uid(c.req.header('Authorization')); if (!u) return c.json({error:'Unauthorized'},401);
  const r=await pg.query('SELECT id,username,email,avatar_url,bio,is_admin,is_mod,pro_status,created_at FROM users WHERE id=$1',[u]);
  const rows=r.rows as unknown[]; return rows.length?c.json(rows[0]):c.json({error:'Not found'},404);
});

// ── BATTLES ───────────────────────────────────────────────────────────────────
app.get('/api/v1/battles/feed', async (c) => {
  const u=uid(c.req.header('Authorization'));
  const r=await pg.query(`SELECT b.*,la.id as lid,la.title as lt,la.image_url as li,la.player_name as lp,ra.id as rid,ra.title as rt,ra.image_url as ri,ra.player_name as rp,usr.username as creator FROM battles b LEFT JOIN card_assets la ON la.id=b.left_asset_id LEFT JOIN card_assets ra ON ra.id=b.right_asset_id LEFT JOIN users usr ON usr.id=b.created_by_user_id WHERE b.status='live' ORDER BY b.created_at DESC LIMIT 20`);
  const items=await Promise.all((r.rows as Record<string,unknown>[]).map(async(row)=>{
    let mv:Record<string,string>={};
    if(u){const vr=await pg.query('SELECT category,choice FROM votes WHERE battle_id=$1 AND user_id=$2',[row.id,u]);for(const v of vr.rows as{category:string;choice:string}[])mv[v.category]=v.choice;}
    return{id:row.id,title:row.title,status:row.status,categories:JSON.parse(row.categories as string),endsAt:row.ends_at,startsAt:row.starts_at,totalVotesCached:row.total_votes_cached,isSponsored:!!row.is_sponsored,sponsorCta:row.sponsor_cta?JSON.parse(row.sponsor_cta as string):null,createdByUsername:row.creator,left:{assetId:row.lid,title:row.lt,imageUrl:row.li,playerName:row.lp},right:{assetId:row.rid,title:row.rt,imageUrl:row.ri,playerName:row.rp},myVotes:mv};
  }));
  return c.json({items,nextCursor:null,total:items.length});
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
  try{await pg.query('INSERT INTO votes (id,battle_id,user_id,category,choice) VALUES ($1,$2,$3,$4,$5)',[randomUUID(),bid,u,category,choice]);await pg.query('UPDATE battles SET total_votes_cached=total_votes_cached+1 WHERE id=$1',[bid]);}
  catch(e:unknown){if((e as{message?:string}).message?.includes('UNIQUE'))return c.json({error:'Already voted'},409);throw e;}
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
  const u = uid(c.req.header('Authorization'));
  if (!u) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json().catch(() => ({})) as Record<string, string>;
  const { imageUrl, imageBase64, mimeType, title, sport, playerName, year } = body;

  if (!title) return c.json({ error: 'title required' }, 400);

  let finalUrl = imageUrl;

  if (imageBase64 && !imageUrl) {
    // Store as data URL for demo (in production this would go to S3/MinIO)
    const mime = mimeType || 'image/jpeg';
    finalUrl = `data:${mime};base64,${imageBase64}`;
  }

  if (!finalUrl) return c.json({ error: 'imageUrl or imageBase64 required' }, 400);

  const id = randomUUID();
  await pg.query(
    'INSERT INTO card_assets (id,created_by_user_id,image_url,thumb_url,title,sport,player_name,year,source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, u, finalUrl, finalUrl, title, sport || 'unknown', playerName || '', year ? parseInt(year) : null, imageBase64 ? 'upload' : 'url']
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
function requireAdmin(_c: Context, uid: string | null): boolean {
  return uid !== null; // simplified for demo
}

app.get('/api/v1/admin/stats', async (c) => {
  const u = getUserId(c.req.header('Authorization'));
  if (!requireAdmin(c, u)) return c.json({ error: 'Unauthorized' }, 401);

  const [users, battles, votes] = await Promise.all([
    pg.query('SELECT COUNT(*) as count FROM users'),
    pg.query('SELECT COUNT(*) as count FROM battles'),
    pg.query('SELECT COUNT(*) as count FROM votes'),
  ]);

  const activeBattles = await pg.query("SELECT COUNT(*) as count FROM battles WHERE status='live'");

  return c.json({
    totalUsers: parseInt((users.rows as {count:string}[])[0].count),
    totalBattles: parseInt((battles.rows as {count:string}[])[0].count),
    totalVotes: parseInt((votes.rows as {count:string}[])[0].count),
    activeBattles: parseInt((activeBattles.rows as {count:string}[])[0].count),
  });
});

app.get('/api/v1/admin/battles', async (c) => {
  const u = getUserId(c.req.header('Authorization'));
  if (!requireAdmin(c, u)) return c.json({ error: 'Unauthorized' }, 401);
  const r = await pg.query('SELECT b.*,u.username as creator FROM battles b LEFT JOIN users u ON u.id=b.created_by_user_id ORDER BY b.created_at DESC LIMIT 50');
  return c.json({ items: r.rows, total: (r.rows as unknown[]).length });
});

app.delete('/api/v1/admin/battles/:id', async (c) => {
  const u = getUserId(c.req.header('Authorization'));
  if (!requireAdmin(c, u)) return c.json({ error: 'Unauthorized' }, 401);
  await pg.query('UPDATE battles SET status=$1 WHERE id=$2', ['removed', c.req.param('id')]);
  return c.json({ message: 'Battle removed' });
});

app.get('/api/v1/admin/users', async (c) => {
  const u = getUserId(c.req.header('Authorization'));
  if (!requireAdmin(c, u)) return c.json({ error: 'Unauthorized' }, 401);
  const r = await pg.query('SELECT id,username,email,is_admin,status,pro_status,created_at FROM users ORDER BY created_at DESC');
  return c.json({ items: r.rows, total: (r.rows as unknown[]).length });
});

app.post('/api/v1/admin/users/:id/suspend', async (c) => {
  const u = getUserId(c.req.header('Authorization'));
  if (!requireAdmin(c, u)) return c.json({ error: 'Unauthorized' }, 401);
  await pg.query("UPDATE users SET status='suspended' WHERE id=$1", [c.req.param('id')]);
  return c.json({ message: 'User suspended' });
});

// ── SEARCH ───────────────────────────────────────────────────────────────────
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
