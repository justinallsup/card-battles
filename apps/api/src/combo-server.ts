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
    // New cards — NFL
    {p:'Lamar Jackson',y:2018,s:'nfl',c:'241773/000000',t:'Lamar 2018 Prizm Rookie PSA 10'},
    {p:'Jalen Hurts',y:2020,s:'nfl',c:'004953/a5acaf',t:'Hurts 2020 Prizm Rookie Auto'},
    {p:'Justin Herbert',y:2020,s:'nfl',c:'002a5e/ffc20e',t:'Herbert 2020 Prizm Rookie Auto'},
    {p:'Tua Tagovailoa',y:2020,s:'nfl',c:'008e97/fc4c02',t:'Tua 2020 Prizm Rookie Auto'},
    {p:'Drake Maye',y:2024,s:'nfl',c:'002244/c60c30',t:'Maye 2024 Prizm Rookie Auto'},
    {p:'Jayden Daniels',y:2024,s:'nfl',c:'773141/ffb612',t:'Daniels 2024 Prizm Rookie Auto'},
    // New cards — NBA
    {p:'Nikola Jokic',y:2015,s:'nba',c:'0e2240/fec524',t:'Jokic 2015 Prizm RC PSA 10'},
    {p:'Giannis Antetokounmpo',y:2013,s:'nba',c:'00471b/eee1c6',t:'Giannis 2013 Panini RC PSA 10'},
    {p:'Kevin Durant',y:2007,s:'nba',c:'007ac1/ef3b24',t:'KD 2007 Topps Chrome RC PSA 10'},
    {p:'Devin Booker',y:2015,s:'nba',c:'1d1160/e56020',t:'Booker 2015 Prizm RC PSA 10'},
    {p:'Anthony Edwards',y:2020,s:'nba',c:'0c2340/78be20',t:'Ant 2020 Prizm Rookie Auto'},
    {p:'Paolo Banchero',y:2022,s:'nba',c:'0077c0/c4ced4',t:'Paolo 2022 Prizm Rookie Auto'},
    // New cards — MLB
    {p:'Bryce Harper',y:2012,s:'mlb',c:'e81828/002d72',t:'Harper 2012 Topps Chrome RC PSA 10'},
    {p:'Mookie Betts',y:2014,s:'mlb',c:'ef3e42/041e42',t:'Betts 2014 Topps Chrome RC PSA 10'},
    {p:'Fernando Tatis Jr',y:2019,s:'mlb',c:'2f241d/fd5a1e',t:'Tatis 2019 Bowman Chrome Auto'},
    {p:'Julio Rodriguez',y:2022,s:'mlb',c:'005c5c/0052a5',t:'JRod 2022 Topps Chrome RC PSA 10'},
    {p:'Jackson Holliday',y:2024,s:'mlb',c:'df4601/000000',t:'Holliday 2024 Topps RC Auto'},
    // Wave 19 — new cards for expanded battles
    {p:'Trae Young',y:2018,s:'nba',c:'c8102e/010101',t:'Trae Young 2018 Prizm Rookie Auto'},
    {p:'Justin Jefferson',y:2020,s:'nfl',c:'4f2683/ffffff',t:'Jefferson 2020 Prizm Rookie Auto'},
    {p:'Davante Adams',y:2014,s:'nfl',c:'203731/ffb612',t:'D. Adams 2014 Prizm RC PSA 10'},
    {p:'Caitlin Clark',y:2024,s:'nba',c:'041e42/bec0c2',t:'Clark 2024 Rookie Auto PSA 10'},
    {p:'Angel Reese',y:2024,s:'nba',c:'5a2d82/ffffff',t:'Reese 2024 Rookie Auto'},
    {p:'Wilt Chamberlain',y:1961,s:'nba',c:'003da5/ee1c25',t:'Wilt 1961 Fleer Rookie PSA 6'},
    {p:'Bill Russell',y:1957,s:'nba',c:'007a33/ffffff',t:'Russell 1957 Topps RC PSA 5'},
    {p:'Roberto Clemente',y:1955,s:'mlb',c:'002d62/d50032',t:'Clemente 1955 Topps RC PSA 5'},
    {p:'Hank Aaron',y:1954,s:'mlb',c:'002263/b5a642',t:'Aaron 1954 Topps RC PSA 6'},
    {p:'Travis Kelce',y:2013,s:'nfl',c:'e31837/ffb612',t:'Kelce 2013 Prizm RC PSA 10'},
    {p:'Rob Gronkowski',y:2010,s:'nfl',c:'002244/c60c30',t:'Gronk 2010 Topps RC PSA 10'},
    {p:'Joel Embiid',y:2014,s:'nba',c:'006bb6/ed174c',t:'Embiid 2014 Prizm RC PSA 10'},
    {p:'Bo Jackson',y:1986,s:'mlb',c:'004687/ef3e42',t:'Bo 1986 Topps RC PSA 9'},
    {p:'Deion Sanders',y:1989,s:'nfl',c:'a71930/000000',t:'Prime Time 1989 Score RC PSA 9'},
    {p:'Kobe Bryant',y:1996,s:'nba',c:'552583/fdb927',t:'Kobe 1996 Topps Chrome RC PSA 10'},
    {p:'Dirk Nowitzki',y:1998,s:'nba',c:'00538c/b8c4ca',t:'Dirk 1998 Topps Chrome RC PSA 10'},
    {p:'Sandy Koufax',y:1955,s:'mlb',c:'005a9c/ffffff',t:'Koufax 1955 Topps RC PSA 4'},
    {p:'Bob Gibson',y:1959,s:'mlb',c:'c41e3a/0c2340',t:'Gibson 1959 Topps RC PSA 5'},
    {p:'Jamal Murray',y:2016,s:'nba',c:'0e2240/fec524',t:'Murray 2016 Prizm RC PSA 10'},
    {p:'Tyler Herro',y:2019,s:'nba',c:'98002e/f9a01b',t:'Herro 2019 Prizm Rookie Auto'},
    {p:'Gunnar Henderson',y:2023,s:'mlb',c:'df4601/000000',t:'Henderson 2023 Bowman Chrome Auto'},
    {p:'Kawhi Leonard',y:2011,s:'nba',c:'003da5/c4ced4',t:'Kawhi 2011 Prizm RC PSA 10'},
    {p:'Riley Greene',y:2023,s:'mlb',c:'0c2c56/fa4616',t:'Greene 2023 Topps Chrome RC'},
    {p:'Brock Purdy',y:2022,s:'nfl',c:'aa0000/b3995d',t:'Purdy 2022 Prizm RC PSA 10'},
    {p:'Paul Goldschmidt',y:2011,s:'mlb',c:'a71930/000000',t:'Goldschmidt 2011 Topps RC PSA 10'},
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
  // Card index reference (0-based):
  // 0=Mahomes, 1=Brady, 2=Allen, 3=Burrow, 4=LeBron, 5=Jordan, 6=Wemby, 7=Luka, 8=Ohtani, 9=Trout
  // 10=EDLC, 11=CWilliams, 12=Curry, 13=Tatum, 14=Acuna, 15=Soto, 16=Morant, 17=Lillard
  // 18=Judge, 19=Freeman, 20=Stroud, 21=ARichardson
  // 22=Lamar, 23=Hurts, 24=Herbert, 25=Tua, 26=Drake Maye, 27=Daniels
  // 28=Jokic, 29=Giannis, 30=KD, 31=Booker, 32=Edwards, 33=Paolo
  // 34=Harper, 35=Betts, 36=Tatis, 37=JRod, 38=Holliday
  // Wave 19:
  // 39=TraeYoung, 40=JJefferson, 41=DAdams, 42=CaitlinClark, 43=AngelReese
  // 44=Wilt, 45=BillRussell, 46=Clemente, 47=HankAaron, 48=Kelce, 49=Gronk
  // 50=Embiid, 51=BoJackson, 52=DeionSanders, 53=Kobe, 54=Dirk
  // 55=Koufax, 56=BGibson, 57=JMurray, 58=Herro, 59=GHenderson
  // 60=Kawhi, 61=RGreene, 62=BPurdy, 63=PGoldschmidt
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
    // New battles — Wave 5
    {l:22,r:0,title:'Lamar Jackson vs Mahomes — MVP Battle 🏈'},
    {l:23,r:2,title:'Jalen Hurts vs Josh Allen — Eagles vs Bills'},
    {l:24,r:3,title:'Justin Herbert vs Joe Burrow — AFC West vs East'},
    {l:29,r:4,title:'Giannis vs LeBron — Two-Way Monster Showdown 🏀'},
    {l:28,r:6,title:'Jokic vs Wemby — Center of the Universe 🃏'},
    {l:30,r:4,title:'Kevin Durant vs LeBron — Scoring Kings'},
    {l:32,r:7,title:'Anthony Edwards vs Luka — Young Guns Showdown'},
    {l:31,r:13,title:'Devin Booker vs Jayson Tatum — Wing Battle'},
    {l:34,r:15,title:'Bryce Harper vs Juan Soto — NL Sluggers ⚾'},
    {l:36,r:14,title:'Fernando Tatis Jr vs Acuna — NL West Rivals'},
    {l:37,r:8,title:'Julio Rodriguez vs Ohtani — AL Stars'},
    {l:26,r:11,title:'Drake Maye vs Caleb Williams — 2024 QBs Battle'},
    {l:27,r:20,title:'Jayden Daniels vs CJ Stroud — NFC East Rising'},
    {l:33,r:6,title:'Paolo Banchero vs Wemby — Next Gen Bigs 🏀'},
    {l:35,r:9,title:'Mookie Betts vs Mike Trout — Outfield GOATs'},
    // Wave 19 — 20 new battles (total: 50)
    {l:16,r:39,title:'Ja Morant vs Trae Young — 2021 Rookie Battle 🔥'},
    {l:34,r:14,title:'Bryce Harper vs Ronald Acuña Jr. — NL Superstars ⚾'},
    {l:40,r:41,title:'Justin Jefferson vs Davante Adams — WR Royalty 🏈'},
    {l:42,r:43,title:'Caitlin Clark vs Angel Reese — WNBA Revolution 🏀'},
    {l:44,r:45,title:'Wilt Chamberlain vs Bill Russell — NBA Legends Debate 🐐'},
    {l:46,r:47,title:'Roberto Clemente vs Hank Aaron — Baseball Immortals ⚾'},
    {l:48,r:49,title:'Travis Kelce vs Rob Gronkowski — Greatest TE Ever? 🏈'},
    {l:28,r:50,title:'Nikola Jokic vs Joel Embiid — MVP Wars 🏆'},
    {l:18,r:15,title:'Aaron Judge vs Juan Soto — AL vs NL Sluggers ⚾'},
    {l:51,r:52,title:'Bo Jackson vs Deion Sanders — Dual-Sport Legends 🌟'},
    {l:53,r:54,title:'Kobe Bryant vs Dirk Nowitzki — 2000s NBA Icons 🏀'},
    {l:55,r:56,title:'Sandy Koufax vs Bob Gibson — Pitching GOAT Debate ⚾'},
    {l:57,r:58,title:'Jamal Murray vs Tyler Herro — Clutch Shooters 🎯'},
    {l:20,r:21,title:'CJ Stroud vs Anthony Richardson — Rookie Class Revisited 🏈'},
    {l:10,r:59,title:'Elly De La Cruz vs Gunnar Henderson — 2023 MLB Rookies ⚾'},
    {l:30,r:60,title:'Kevin Durant vs Kawhi Leonard — Elite Wings Showdown 🏀'},
    {l:37,r:61,title:'Julio Rodriguez vs Riley Greene — MLB Youth Movement ⚾'},
    {l:62,r:23,title:'Brock Purdy vs Jalen Hurts — NFL Rising Stars 🏈'},
    {l:13,r:31,title:'Jayson Tatum vs Devin Booker — Eastern vs Western Stars 🏀'},
    {l:19,r:63,title:'Freddie Freeman vs Paul Goldschmidt — First Base GOATs ⚾'},
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
  // Seed demo comments into first 8 battles
  const allBattleRows = await pg.query('SELECT id FROM battles ORDER BY created_at DESC LIMIT 8');
  const battleIds = (allBattleRows.rows as {id:string}[]).map(r=>r.id);
  const demoCommentSets = [
    ["This is a no-brainer, Mahomes all day 🏈","Brady's rookie is literally worth 10x more though","PSA 10 Mahomes is still the better investment imo","Both are legends but Brady wins on legacy"],
    ["Jordan 1986 Fleer is the most iconic card in existence","LeBron's longevity makes his cards better long-term","Can't compare eras like this","Jordan card literally defines the hobby"],
    ["Allen is going to win 3 Super Bowls, calling it now","Burrow's ceiling is higher change my mind","Both RCs are undervalued right now tbh 💎","Got my Allen auto graded PSA 10, worth every penny"],
    ["Wemby is a generational anomaly, his cards will be insane","Luka is already top 10 all time statistically","The 2023 Wemby prizm auto is going to be worth 5 figures in 10 years","Luka's rookie year was legendary though"],
    ["Ohtani doing two things at an elite level is unprecedented","Trout is still the best pure baseball player alive","Both cards are must-haves for any MLB portfolio 🙌","Ohtani is changing what's possible in baseball, his rookie will age well"],
    ["EDLC speed is unreal, most exciting player in baseball","Acuna is the complete package though, defense, speed, power","Both are still ascending, great time to buy RCs","NL East vs NL West, who wins the next decade?"],
    ["Caleb Williams looks like the real deal in Chicago","Allen is an established star, no comparison imo","Give Williams 2 seasons, he'll be top 5 QB","Allen 2018 Prizm is one of the best NFL investments right now"],
    ["Curry changed the game forever, 3-point revolution started with him","Tatum is the next big thing in Boston","Curry 2009 Prizm is criminally undervalued","4 rings vs chasing a ring, big difference for card value"],
  ];
  for (let i=0;i<battleIds.length;i++) {
    const bid=battleIds[i];const set=demoCommentSets[i]||[];
    if(!comments.has(bid))comments.set(bid,[]);
    for (let j=0;j<set.length;j++) {
      const u2=users[j%users.length];
      comments.get(bid)!.push({id:randomUUID(),battleId:bid,userId:u2.id,username:u2.username,text:set[j],createdAt:new Date(Date.now()-(set.length-j)*600000).toISOString(),likes:Math.floor(Math.random()*20)});
    }
  }
  // Seed demo chat messages for first 3 battles
  const firstBattles = await pg.query('SELECT id FROM battles LIMIT 3');
  const chatBattleIds = (firstBattles.rows as {id:string}[]).map(r => r.id);
  const demoChats: [string, string][] = [
    ['cardking', 'Mahomes all day 🔥'],
    ['slabmaster', 'Brady > everyone, cope'],
    ['rookiehunter', 'as an investment Mahomes is better long term'],
    ['gradegod', 'this is the battle of the century'],
    ['packripper', '💎💎💎'],
  ];
  chatBattleIds.forEach((bid, i) => {
    chatMessages.set(bid, demoChats.slice(0, 3 + i).map(([u, t]) => ({
      id: randomUUID(), battleId: bid, userId: u, username: u,
      text: t, createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
    })));
  });

  await seedMarketplace();
  await seedBlitz();
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


// ── SANITIZE ──────────────────────────────────────────────────────────────────
function sanitize(s: string): string {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').trim().slice(0, 2000);
}

// ── RATE LIMITER ──────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, max = 100, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  entry.count++;
  return entry.count <= max; // false = rate limited
}

const app = new Hono();
app.use('*', logger());
app.use('*', cors({origin: process.env.CORS_ORIGIN || '*', credentials: true}));

// Apply rate limiting to all API routes
app.use('/api/*', async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  if (!rateLimit(ip, 200, 60_000)) {
    return c.json({ error: 'Too many requests, please slow down' }, 429);
  }
  await next();
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err.message);
  return c.json({ error: 'Internal server error' }, 500);
});

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
// ── FEATURED THIS WEEK ───────────────────────────────────────────────────────
app.get('/api/v1/featured', async (c) => {
  const topBattle = await pg.query(`
    SELECT b.id, b.title, b.total_votes_cached, b.ends_at,
      la.player_name as lp, la.image_url as li,
      ra.player_name as rp, ra.image_url as ri
    FROM battles b
    LEFT JOIN card_assets la ON la.id=b.left_asset_id
    LEFT JOIN card_assets ra ON ra.id=b.right_asset_id
    WHERE b.status='live'
    ORDER BY b.total_votes_cached DESC LIMIT 1
  `);
  const topCard = await pg.query(`
    SELECT ca.id, ca.player_name, ca.image_url, ca.year, ca.sport, COUNT(v.id) as votes
    FROM card_assets ca
    JOIN battles b ON b.left_asset_id=ca.id OR b.right_asset_id=ca.id
    JOIN votes v ON v.battle_id=b.id
    GROUP BY ca.id ORDER BY votes DESC LIMIT 1
  `);
  const risingBattle = await pg.query(`
    SELECT b.id, b.title, b.total_votes_cached,
      la.player_name as lp, la.image_url as li,
      ra.player_name as rp, ra.image_url as ri
    FROM battles b
    LEFT JOIN card_assets la ON la.id=b.left_asset_id
    LEFT JOIN card_assets ra ON ra.id=b.right_asset_id
    WHERE b.status='live'
    ORDER BY RANDOM() LIMIT 1
  `);
  const battle = (topBattle.rows as Record<string,unknown>[])[0];
  const card = (topCard.rows as Record<string,unknown>[])[0];
  const rising = (risingBattle.rows as Record<string,unknown>[])[0];
  return c.json({
    weekOf: new Date().toISOString().slice(0, 10),
    featuredBattle: battle || null,
    cardOfTheWeek: card ? { ...card, estimatedValue: 280 } : null,
    risingBattle: rising || null,
    editorsPick: {
      title: "GOAT Showdown: Brady vs Mahomes",
      description: "The debate that never ends. Cast your vote before Sunday.",
      battleId: battle?.id,
    }
  });
});

// ── TRENDING PLAYERS ──────────────────────────────────────────────────────────
app.get('/api/v1/trending/players', async (c) => {
  const r = await pg.query(`
    SELECT ca.player_name, ca.sport, ca.image_url, COUNT(DISTINCT b.id) as battle_count, SUM(b.total_votes_cached) as total_votes
    FROM card_assets ca
    JOIN battles b ON b.left_asset_id=ca.id OR b.right_asset_id=ca.id
    WHERE b.created_at > NOW() - INTERVAL '7 days'
    GROUP BY ca.player_name, ca.sport, ca.image_url
    ORDER BY total_votes DESC LIMIT 10
  `);
  // Fallback: if no results from last 7 days, return all-time top players
  let players = r.rows as Record<string,unknown>[];
  if (players.length === 0) {
    const fallback = await pg.query(`
      SELECT ca.player_name, ca.sport, ca.image_url, COUNT(DISTINCT b.id) as battle_count, SUM(b.total_votes_cached) as total_votes
      FROM card_assets ca
      JOIN battles b ON b.left_asset_id=ca.id OR b.right_asset_id=ca.id
      GROUP BY ca.player_name, ca.sport, ca.image_url
      ORDER BY total_votes DESC LIMIT 10
    `);
    players = fallback.rows as Record<string,unknown>[];
  }
  return c.json({ players, period: '7 days' });
});

// ── SEARCH (must be before /:id) ─────────────────────────────────────────────
app.get('/api/v1/battles/search', async (c) => {
  const q = c.req.query('q') || '';
  const sport = c.req.query('sport') || '';
  let query = `SELECT b.*,la.id as lid,la.title as lt,la.image_url as li,la.player_name as lp,ra.id as rid,ra.title as rt,ra.image_url as ri,ra.player_name as rp,u.username as creator FROM battles b LEFT JOIN card_assets la ON la.id=b.left_asset_id LEFT JOIN card_assets ra ON ra.id=b.right_asset_id LEFT JOIN users u ON u.id=b.created_by_user_id WHERE b.status='live'`;
  const params: string[] = [];
  if (q) { params.push(`%${q}%`); query += ` AND (b.title ILIKE $${params.length} OR la.player_name ILIKE $${params.length} OR ra.player_name ILIKE $${params.length})`; }
  if (sport) { params.push(sport); query += ` AND (la.sport=$${params.length} OR ra.sport=$${params.length})`; }
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
// Static routes must be declared before parameterized :username routes
app.get('/api/v1/users/discover', async (c) => {
  const r = await pg.query(`
    SELECT u.id, u.username, u.created_at,
      us.battles_created, us.votes_cast, us.battles_won, us.current_streak
    FROM users u
    LEFT JOIN user_stats us ON us.user_id=u.id
    ORDER BY us.votes_cast DESC NULLS LAST
    LIMIT 20
  `);
  const bios = ['Card collector since 2018', 'Vintage card enthusiast', 'PSA 10 hunter', 'Breaking packs daily', 'Investment collector'];
  const sports = ['NFL', 'NBA', 'MLB', 'All Sports'];
  const users = (r.rows as Record<string,unknown>[]).map(u => ({
    id: u.id, username: u.username, createdAt: u.created_at,
    battlesCreated: u.battles_created || 0, votesCast: u.votes_cast || 0,
    battlesWon: u.battles_won || 0, streak: u.current_streak || 0,
    bio: bios[Math.floor(Math.random() * bios.length)],
    sport: sports[Math.floor(Math.random() * sports.length)],
    followerCount: Math.floor(Math.random() * 200) + 10,
  }));
  return c.json({ users, total: users.length });
});

app.get('/api/v1/users/search', async (c) => {
  const q = c.req.query('q') || '';
  if (q.length < 2) return c.json({ users: [] });
  const r = await pg.query('SELECT id, username FROM users WHERE LOWER(username) LIKE $1 LIMIT 10', [`%${q.toLowerCase()}%`]);
  return c.json({ users: r.rows });
});

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
  if(bio!==undefined)await pg.query('UPDATE users SET bio=$1 WHERE id=$2',[sanitize(bio),u]);
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

app.get('/api/v1/daily-picks/:id/results', async (c) => {
  const { id } = c.req.param();
  const r = await pg.query('SELECT choice FROM daily_pick_entries WHERE daily_pick_id=$1', [id]);
  const rows = r.rows as { choice: string }[];
  const total = rows.length;
  const left = rows.filter(r => r.choice === 'left').length;
  const right = rows.filter(r => r.choice === 'right').length;
  return c.json({
    pickId: id,
    leftPercent: total > 0 ? Math.round(left / total * 1000) / 10 : 50,
    rightPercent: total > 0 ? Math.round(right / total * 1000) / 10 : 50,
    totalVotes: total,
  });
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

// ── CARD VALUATIONS ───────────────────────────────────────────────────────────
const CARD_VALUATIONS: Record<string, { low: number; mid: number; high: number; trend: 'up'|'down'|'stable' }> = {
  'Patrick Mahomes': { low: 180, mid: 280, high: 450, trend: 'up' },
  'Tom Brady': { low: 320, mid: 520, high: 900, trend: 'stable' },
  'LeBron James': { low: 850, mid: 1400, high: 2200, trend: 'up' },
  'Michael Jordan': { low: 8000, mid: 15000, high: 28000, trend: 'stable' },
  'Victor Wembanyama': { low: 95, mid: 180, high: 340, trend: 'up' },
  'Shohei Ohtani': { low: 220, mid: 380, high: 620, trend: 'up' },
  'Mike Trout': { low: 450, mid: 780, high: 1200, trend: 'down' },
  'Luka Doncic': { low: 280, mid: 460, high: 780, trend: 'up' },
  'Stephen Curry': { low: 190, mid: 340, high: 580, trend: 'stable' },
  'Josh Allen': { low: 120, mid: 210, high: 380, trend: 'up' },
};

app.get('/api/v1/cards/:id/valuation', async (c) => {
  const r = await pg.query('SELECT player_name, year, set_name FROM card_assets WHERE id=$1', [c.req.param('id')]);
  const rows = r.rows as { player_name: string; year: number }[];
  if (!rows.length) return c.json({ error: 'Not found' }, 404);
  const { player_name, year } = rows[0];
  const base = CARD_VALUATIONS[player_name];
  if (!base) return c.json({ low: 25, mid: 45, high: 90, trend: 'stable', player: player_name, year, note: 'Estimated value' });
  const ageMult = year < 2000 ? 3 : year < 2010 ? 1.8 : year < 2020 ? 1.2 : 1;
  return c.json({
    low: Math.round(base.low * ageMult),
    mid: Math.round(base.mid * ageMult),
    high: Math.round(base.high * ageMult),
    trend: base.trend,
    player: player_name,
    year,
    gradeAssumed: 'PSA 10',
    lastUpdated: new Date().toISOString(),
  });
});

app.get('/api/v1/battles/:id/valuations', async (c) => {
  const r = await pg.query('SELECT left_asset_id, right_asset_id FROM battles WHERE id=$1', [c.req.param('id')]);
  const rows = r.rows as { left_asset_id: string; right_asset_id: string }[];
  if (!rows.length) return c.json({ error: 'Not found' }, 404);
  const { left_asset_id, right_asset_id } = rows[0];
  const getVal = async (id: string) => {
    const cr = await pg.query('SELECT player_name, year FROM card_assets WHERE id=$1', [id]);
    const crows = cr.rows as { player_name: string; year: number }[];
    if (!crows.length) return null;
    const { player_name, year } = crows[0];
    const base = CARD_VALUATIONS[player_name];
    const ageMult = year < 2000 ? 3 : year < 2010 ? 1.8 : year < 2020 ? 1.2 : 1;
    return base ? { low: Math.round(base.low * ageMult), mid: Math.round(base.mid * ageMult), high: Math.round(base.high * ageMult), trend: base.trend } : { low: 25, mid: 45, high: 90, trend: 'stable' as const };
  };
  return c.json({ left: await getVal(left_asset_id), right: await getVal(right_asset_id) });
});

// ── CARD SEARCH ───────────────────────────────────────────────────────────────
app.get('/api/v1/cards/search', async (c) => {
  const q = (c.req.query('q') || '').toLowerCase();
  if (!q || q.length < 2) return c.json({ cards: [] });
  const r = await pg.query(
    "SELECT id, title, image_url, player_name, year, sport FROM card_assets WHERE LOWER(title) LIKE $1 OR LOWER(player_name) LIKE $1 LIMIT 10",
    [`%${q}%`]
  );
  return c.json({ cards: r.rows });
});

// ── USER FOLLOWING ────────────────────────────────────────────────────────────
const following = new Map<string, Set<string>>(); // userId → Set of userIds they follow

app.post('/api/v1/users/:username/follow', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const ur = await pg.query('SELECT id FROM users WHERE username=$1', [c.req.param('username')]);
  const target = (ur.rows as {id:string}[])[0];
  if (!target) return c.json({ error: 'Not found' }, 404);
  if (!following.has(authUid)) following.set(authUid, new Set());
  following.get(authUid)!.add(target.id);
  return c.json({ following: true, targetId: target.id });
});

app.post('/api/v1/users/:username/unfollow', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const ur = await pg.query('SELECT id FROM users WHERE username=$1', [c.req.param('username')]);
  const target = (ur.rows as {id:string}[])[0];
  if (!target) return c.json({ error: 'Not found' }, 404);
  following.get(authUid)?.delete(target.id);
  return c.json({ following: false });
});

app.get('/api/v1/users/:username/follow-status', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  const ur = await pg.query('SELECT id FROM users WHERE username=$1', [c.req.param('username')]);
  const target = (ur.rows as {id:string}[])[0];
  if (!target) return c.json({ error: 'Not found' }, 404);
  const isFollowing = authUid ? (following.get(authUid)?.has(target.id) ?? false) : false;
  const followerCount = Array.from(following.values()).filter(s => s.has(target.id)).length;
  const followingCount = following.get(target.id)?.size ?? 0;
  return c.json({ isFollowing, followerCount, followingCount });
});

// ── BATTLE WIDGET (embeddable iframe) ─────────────────────────────────────────
app.get('/api/v1/battles/:id/widget', async (c) => {
  const { id } = c.req.param();
  const r = await pg.query(`SELECT b.*, la.player_name as lp, la.image_url as li, ra.player_name as rp, ra.image_url as ri, b.total_votes_cached FROM battles b LEFT JOIN card_assets la ON la.id=b.left_asset_id LEFT JOIN card_assets ra ON ra.id=b.right_asset_id WHERE b.id=$1`, [id]);
  const b = (r.rows as Record<string,unknown>[])[0];
  if (!b) return c.json({error:'Not found'}, 404);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0f;color:white;font-family:system-ui;padding:12px}.battle{display:flex;gap:12px;align-items:center}.card{flex:1;background:#12121a;border-radius:8px;padding:8px;text-align:center}img{width:100%;height:80px;object-fit:cover;border-radius:4px;margin-bottom:4px}.name{font-size:11px;font-weight:700}.vs{font-size:20px;font-weight:900;color:#6c47ff;flex-shrink:0}.votes{text-align:center;font-size:10px;color:#64748b;margin-top:8px}a{display:block;margin-top:8px;background:#6c47ff;color:white;text-decoration:none;padding:6px;border-radius:6px;text-align:center;font-size:11px;font-weight:700}</style></head><body><div class="battle"><div class="card"><img src="${b.li}" alt="${b.lp}"><div class="name">${b.lp}</div></div><div class="vs">VS</div><div class="card"><img src="${b.ri}" alt="${b.rp}"><div class="name">${b.rp}</div></div></div><div class="votes">${Number(b.total_votes_cached||0).toLocaleString()} votes</div><a href="https://cardbattles.app/battles/${id}" target="_blank">⚔️ Vote Now</a></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html', 'X-Frame-Options': 'ALLOWALL', 'Access-Control-Allow-Origin': '*' }});
});

// ── OG SHARE IMAGE ────────────────────────────────────────────────────────────
app.get('/api/v1/share/:battleId/og', async (c) => {
  const { battleId } = c.req.param();
  const r = await pg.query(`
    SELECT b.title, b.total_votes_cached,
      la.player_name as lp, la.image_url as li,
      ra.player_name as rp, ra.image_url as ri
    FROM battles b
    LEFT JOIN card_assets la ON la.id=b.left_asset_id
    LEFT JOIN card_assets ra ON ra.id=b.right_asset_id
    WHERE b.id=$1
  `, [battleId]);
  const rows = r.rows as Record<string,string>[];
  if (!rows.length) return c.json({error:'Not found'},404);
  const b = rows[0];

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0a0a0f"/>
        <stop offset="100%" style="stop-color:#12121a"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#6c47ff"/>
        <stop offset="100%" style="stop-color:#a78bfa"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bg)"/>
    <!-- Purple glow center -->
    <ellipse cx="600" cy="315" rx="300" ry="200" fill="#6c47ff" opacity="0.08"/>
    <!-- Border -->
    <rect x="20" y="20" width="1160" height="590" rx="16" fill="none" stroke="#1e1e2e" stroke-width="2"/>
    <!-- Left card area -->
    <rect x="60" y="80" width="360" height="460" rx="12" fill="#12121a" stroke="#1e1e2e" stroke-width="1.5"/>
    <image href="${b.li}" x="60" y="80" width="360" height="390" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 0 0 0 round 12px)"/>
    <rect x="60" y="430" width="360" height="110" fill="#12121a"/>
    <text x="240" y="465" text-anchor="middle" fill="white" font-size="18" font-weight="700" font-family="system-ui">${(b.lp||'').slice(0,20)}</text>
    <!-- Right card area -->
    <rect x="780" y="80" width="360" height="460" rx="12" fill="#12121a" stroke="#1e1e2e" stroke-width="1.5"/>
    <image href="${b.ri}" x="780" y="80" width="360" height="390" preserveAspectRatio="xMidYMid slice"/>
    <text x="960" y="465" text-anchor="middle" fill="white" font-size="18" font-weight="700" font-family="system-ui">${(b.rp||'').slice(0,20)}</text>
    <!-- VS badge -->
    <circle cx="600" cy="310" r="50" fill="#6c47ff" filter="url(#glow)"/>
    <circle cx="600" cy="310" r="50" fill="none" stroke="#a78bfa" stroke-width="2"/>
    <text x="600" y="321" text-anchor="middle" fill="white" font-size="28" font-weight="900" font-family="system-ui">VS</text>
    <!-- Title -->
    <text x="600" y="50" text-anchor="middle" fill="white" font-size="22" font-weight="800" font-family="system-ui">${(b.title||'').slice(0,60)}</text>
    <!-- Vote count -->
    <text x="600" y="580" text-anchor="middle" fill="#6c47ff" font-size="16" font-family="system-ui">${Number(b.total_votes_cached||0).toLocaleString()} votes · cardbattles.app</text>
  </svg>`;

  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' }});
});

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

// Reports data store (shared between POST /reports and GET /admin/reports)
type Report = { id: string; reporterId: string; targetType: 'battle' | 'comment' | 'user'; targetId: string; reason: string; createdAt: string; status: 'pending' | 'reviewed' };
const reports = new Map<string, Report>();

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
  // Reports are stored in the reports Map
  return c.json({ reports: Array.from(reports.values()), total: reports.size });
});

// ── TOURNAMENTS ───────────────────────────────────────────────────────────────
type Tournament = {
  id: string;
  name: string;
  sport: string;
  status: 'open' | 'active' | 'complete';
  participants: string[]; // battle IDs
  bracket: Record<string, string>; // round -> winner battle ID
  createdAt: string;
};
const tournaments = new Map<string, Tournament>();

// Seed 1 demo tournament
const demoTournament: Tournament = {
  id: randomUUID(),
  name: 'NFL GOAT Card Tournament 🏈',
  sport: 'nfl',
  status: 'active',
  participants: [],
  bracket: { 'round1': 'TBD', 'semifinal': 'TBD', 'final': 'TBD' },
  createdAt: new Date().toISOString(),
};
tournaments.set(demoTournament.id, demoTournament);

const nbaTournament: Tournament = {
  id: randomUUID(),
  name: 'NBA Greatest of All Time 🏀',
  sport: 'nba',
  status: 'open',
  participants: [],
  bracket: {},
  createdAt: new Date().toISOString(),
};
tournaments.set(nbaTournament.id, nbaTournament);

const mlbTournament: Tournament = {
  id: randomUUID(),
  name: 'MLB Legends Showdown ⚾',
  sport: 'mlb',
  status: 'complete',
  participants: [],
  bracket: { 'round1': 'done', 'semifinal': 'done', 'final': 'done' },
  createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
};
tournaments.set(mlbTournament.id, mlbTournament);

app.get('/api/v1/tournaments', (c) => {
  return c.json({ tournaments: Array.from(tournaments.values()) });
});

app.get('/api/v1/tournaments/:id', (c) => {
  const t = tournaments.get(c.req.param('id'));
  return t ? c.json(t) : c.json({ error: 'Not found' }, 404);
});

app.post('/api/v1/tournaments', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const { name, sport } = await c.req.json().catch(() => ({}));
  if (!name) return c.json({ error: 'name required' }, 400);
  const t: Tournament = {
    id: randomUUID(),
    name,
    sport: sport || 'mixed',
    status: 'open',
    participants: [],
    bracket: {},
    createdAt: new Date().toISOString(),
  };
  tournaments.set(t.id, t);
  return c.json(t, 201);
});

// Tournament entry
app.post('/api/v1/tournaments/:id/enter', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { cardId } = await c.req.json().catch(() => ({}));
  if (!cardId) return c.json({ error: 'cardId required' }, 400);
  return c.json({ success: true, message: 'Entered tournament! (Demo)', entrantId: randomUUID() });
});

// Get tournament participants (stub)
app.get('/api/v1/tournaments/:id/participants', (c) => {
  const participants = [
    { username: 'cardking', cardName: 'Patrick Mahomes 2017 Prizm', seeded: 1 },
    { username: 'slabmaster', cardName: 'Tom Brady 2000 Playoff Contenders', seeded: 2 },
    { username: 'gradegod', cardName: 'LeBron James 2003 Exquisite', seeded: 3 },
    { username: 'rookiehunter', cardName: 'Victor Wembanyama 2023 Prizm', seeded: 4 },
  ];
  return c.json({ participants, total: participants.length });
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
  const { id: battleId } = c.req.param();
  const { text } = await c.req.json().catch(() => ({}));
  if (!text?.trim() || text.length > 280) return c.json({ error: 'Text required (max 280 chars)' }, 400);
  const ur = await pg.query('SELECT username FROM users WHERE id=$1', [authUid]);
  const username = (ur.rows as {username:string}[])[0]?.username || 'unknown';
  const comment: Comment = { id: randomUUID(), battleId: battleId, userId: authUid, username, text: sanitize(text.trim()), createdAt: new Date().toISOString(), likes: 0 };
  if (!comments.has(battleId)) comments.set(battleId, []);
  comments.get(battleId)!.push(comment);
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

// ── BATTLE CHAT (SSE) ─────────────────────────────────────────────────────────
type ChatMessage = { id: string; battleId: string; userId: string; username: string; text: string; createdAt: string };
const chatMessages = new Map<string, ChatMessage[]>(); // battleId -> messages
const chatClients = new Map<string, Set<(msg: ChatMessage) => void>>(); // battleId -> SSE callbacks

function broadcastChat(battleId: string, msg: ChatMessage) {
  const clients = chatClients.get(battleId);
  if (clients) clients.forEach(fn => fn(msg));
}

app.get('/api/v1/battles/:id/chat', async (c) => {
  const { id: battleId } = c.req.param();
  const msgs = chatMessages.get(battleId) || [];
  return c.json({ messages: msgs.slice(-50) }); // last 50
});

app.post('/api/v1/battles/:id/chat', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { text } = await c.req.json().catch(() => ({}));
  if (!text?.trim()) return c.json({ error: 'text required' }, 400);
  const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim().slice(0, 300);
  const ur = await pg.query('SELECT username FROM users WHERE id=$1', [userId]);
  const username = (ur.rows as {username:string}[])[0]?.username || 'user';
  const { id: battleId } = c.req.param();
  const msg: ChatMessage = { id: randomUUID(), battleId, userId, username, text: sanitizedText, createdAt: new Date().toISOString() };
  if (!chatMessages.has(battleId)) chatMessages.set(battleId, []);
  chatMessages.get(battleId)!.push(msg);
  broadcastChat(battleId, msg);
  return c.json(msg, 201);
});

app.get('/api/v1/battles/:id/chat/live', (c) => {
  const { id: battleId } = c.req.param();
  const stream = new ReadableStream({
    start(controller) {
      const send = (msg: ChatMessage) => {
        try {
          controller.enqueue(new TextEncoder().encode(`event: chat\ndata: ${JSON.stringify(msg)}\n\n`));
        } catch {}
      };
      if (!chatClients.has(battleId)) chatClients.set(battleId, new Set());
      chatClients.get(battleId)!.add(send);
      // ping to keep alive
      const ping = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode(`event: ping\ndata: {}\n\n`)); } catch {}
      }, 15000);
      c.req.raw.signal.addEventListener('abort', () => {
        chatClients.get(battleId)?.delete(send);
        clearInterval(ping);
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

// ── PUSH NOTIFICATIONS (STUB) ─────────────────────────────────────────────────
app.post('/api/v1/me/push-subscription', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { subscription } = await c.req.json().catch(() => ({}));
  console.log('Push subscription registered for user:', userId, subscription);
  return c.json({ success: true, message: 'Push notifications enabled! (Demo — no real pushes sent)' });
});

app.get('/api/v1/vapid-public-key', (c) => {
  return c.json({ key: 'DEMO_VAPID_KEY_REPLACE_IN_PRODUCTION', demo: true });
});

// ── CARD NEWS FEED ────────────────────────────────────────────────────────────
app.get('/api/v1/news', (c) => {
  const sport = c.req.query('sport');
  const allNews = [
    { id:'1', title:'2023 Panini Prizm Football Checklist Released', summary:'Panini has released the full checklist for 2023 Prizm, featuring all 32 teams and rookie class.', sport:'nfl', source:'Beckett', url:'#', publishedAt: new Date(Date.now() - 3600000).toISOString(), imageUrl: '' },
    { id:'2', title:'LeBron James PSA 10 Rookie Card Sells for $1.8M at Auction', summary:'A gem mint LeBron James 2003-04 Upper Deck Exquisite Collection rookie patch auto sold at Heritage Auctions.', sport:'nba', source:'Sports Card Investor', url:'#', publishedAt: new Date(Date.now() - 7200000).toISOString(), imageUrl: '' },
    { id:'3', title:'Caitlin Clark Rookies Break Sales Records on eBay', summary:"Caitlin Clark's 2024 Parkside WNBA rookie cards continue to dominate secondary market with unprecedented demand.", sport:'wnba', source:'Cardboard Connection', url:'#', publishedAt: new Date(Date.now() - 10800000).toISOString(), imageUrl: '' },
    { id:'4', title:'PSA Raises Submission Fees for Economy Tier', summary:'Professional Sports Authenticator has announced a fee increase for its Economy tier, now starting at $25 per card.', sport:'all', source:'PSA', url:'#', publishedAt: new Date(Date.now() - 14400000).toISOString(), imageUrl: '' },
    { id:'5', title:'Patrick Mahomes Prizm Rookie Tops $400 as Chiefs Win AFC', summary:"Mahomes' 2017 Panini Prizm Silver PSA 10 continues to climb following Kansas City's playoff run.", sport:'nfl', source:'Sports Card Investor', url:'#', publishedAt: new Date(Date.now() - 18000000).toISOString(), imageUrl: '' },
    { id:'6', title:'Topps Chrome Baseball 2024 Box Breaks Average $180 Per Box', summary:'Hobby boxes of 2024 Topps Chrome continue to command premium prices driven by strong rookie class.', sport:'mlb', source:'Beckett', url:'#', publishedAt: new Date(Date.now() - 21600000).toISOString(), imageUrl: '' },
    { id:'7', title:'BGS vs PSA: Which Grading Service Is Best for Your Cards?', summary:'A comprehensive comparison of Beckett Grading Services and PSA for modern and vintage cards in 2024.', sport:'all', source:'Card Ladder', url:'#', publishedAt: new Date(Date.now() - 86400000).toISOString(), imageUrl: '' },
    { id:'8', title:"Victor Wembanyama's Rookie Card Market Analysis", summary:"Six months in, Wembanyama's rookie card market shows strong fundamentals with PSA 10s averaging $175.", sport:'nba', source:'Alt', url:'#', publishedAt: new Date(Date.now() - 90000000).toISOString(), imageUrl: '' },
    { id:'9', title:'eBay Reports 40% Increase in Sports Card Sales YoY', summary:"eBay's annual collectibles report shows sports cards remain the fastest-growing category on the platform.", sport:'all', source:'eBay', url:'#', publishedAt: new Date(Date.now() - 172800000).toISOString(), imageUrl: '' },
    { id:'10', title:'Sandy Koufax 1955 Topps Rookie Card Sells for $288,000', summary:"A PSA 8 example of Koufax's iconic rookie card realized a record price at a recent Heritage auction.", sport:'mlb', source:'Heritage Auctions', url:'#', publishedAt: new Date(Date.now() - 259200000).toISOString(), imageUrl: '' },
  ];
  const filtered = sport && sport !== 'all' ? allNews.filter(n => n.sport === sport || n.sport === 'all') : allNews;
  return c.json({ articles: filtered, total: filtered.length });
});

// ── COLLECTIONS & WATCHLIST ──────────────────────────────────────────────────
const collections = new Map<string, Set<string>>(); // userId → Set of assetIds
const watchlistMap = new Map<string, Set<string>>(); // userId → Set of battleIds

app.get('/api/v1/users/:username/collection', async (c) => {
  const { username } = c.req.param();
  const ur = await pg.query('SELECT id FROM users WHERE username=$1', [username]);
  const user = (ur.rows as {id:string}[])[0];
  if (!user) return c.json({ error: 'User not found' }, 404);

  const saved = collections.get(user.id) || new Set<string>();

  if (saved.size === 0) {
    // Return demo collection for empty collections
    const cr = await pg.query('SELECT id,player_name,image_url,title,year,sport FROM card_assets LIMIT 6');
    return c.json({ username, cards: cr.rows, total: cr.rows.length, isPublic: true });
  }

  const savedArr = Array.from(saved);
  const placeholders = savedArr.map((_, i) => `$${i+1}`).join(',');
  const cr = await pg.query(`SELECT id,player_name,image_url,title,year,sport FROM card_assets WHERE id IN (${placeholders})`, savedArr);
  return c.json({ username, cards: cr.rows, total: cr.rows.length, isPublic: true });
});

app.get('/api/v1/me/collection', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const saved = Array.from(collections.get(userId) || []);
  if (!saved.length) return c.json({ cards: [] });
  const placeholders = saved.map((_, i) => `$${i+1}`).join(',');
  const r = await pg.query(`SELECT * FROM card_assets WHERE id IN (${placeholders})`, saved);
  return c.json({ cards: r.rows });
});

app.post('/api/v1/cards/:id/save', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  if (!collections.has(userId)) collections.set(userId, new Set());
  collections.get(userId)!.add(c.req.param('id'));
  return c.json({ saved: true });
});

app.delete('/api/v1/cards/:id/save', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  collections.get(userId)?.delete(c.req.param('id'));
  return c.json({ saved: false });
});

app.get('/api/v1/me/watchlist', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const watched = Array.from(watchlistMap.get(userId) || []);
  if (!watched.length) return c.json({ battles: [], total: 0 });
  const placeholders = watched.map((_, i) => `$${i+1}`).join(',');
  const r = await pg.query(
    `SELECT b.*,la.image_url as li,la.player_name as lp,ra.image_url as ri,ra.player_name as rp
     FROM battles b
     LEFT JOIN card_assets la ON la.id=b.left_asset_id
     LEFT JOIN card_assets ra ON ra.id=b.right_asset_id
     WHERE b.id IN (${placeholders})`,
    watched
  );
  return c.json({ battles: r.rows, total: (r.rows as unknown[]).length });
});

app.post('/api/v1/battles/:id/watch', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  if (!watchlistMap.has(userId)) watchlistMap.set(userId, new Set());
  watchlistMap.get(userId)!.add(c.req.param('id'));
  return c.json({ watching: true });
});

app.delete('/api/v1/battles/:id/watch', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  watchlistMap.get(userId)?.delete(c.req.param('id'));
  return c.json({ watching: false });
});

// ── VOTE HISTORY ────────────────────────────────────────────────────────────
app.get('/api/v1/me/vote-history', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const r = await pg.query(`
    SELECT v.category, v.choice, v.created_at as voted_at,
      b.id as battle_id, b.title, b.status, b.total_votes_cached,
      b.ends_at, b.result,
      la.image_url as left_img, la.player_name as left_player,
      ra.image_url as right_img, ra.player_name as right_player
    FROM votes v
    JOIN battles b ON b.id = v.battle_id
    JOIN card_assets la ON la.id = b.left_asset_id
    JOIN card_assets ra ON ra.id = b.right_asset_id
    WHERE v.user_id = $1
    ORDER BY v.created_at DESC
    LIMIT 50
  `, [userId]);
  return c.json({ votes: r.rows, total: (r.rows as unknown[]).length });
});

// ── CARD GRADING SIMULATOR ────────────────────────────────────────────────────
app.post('/api/v1/cards/:id/grade', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const r = await pg.query('SELECT * FROM card_assets WHERE id=$1', [c.req.param('id')]);
  const rows = r.rows as Record<string,unknown>[];
  if (!rows.length) return c.json({ error: 'Not found' }, 404);
  const grades = [10, 10, 9, 9, 9, 8, 8, 7, 6];
  const grade = grades[Math.floor(Math.random() * grades.length)];
  const gradeLabels: Record<number,string> = { 10: 'GEM MINT', 9: 'MINT', 8: 'NM-MT', 7: 'NM', 6: 'EX-MT' };
  const turnaround = Math.floor(Math.random() * 45) + 15;
  return c.json({
    cardId: c.req.param('id'),
    grade,
    label: gradeLabels[grade] || 'GOOD',
    turnaroundDays: turnaround,
    estimatedValue: Math.floor(Math.random() * 500) + 50,
    submittedAt: new Date().toISOString(),
    completedAt: new Date(Date.now() + turnaround * 86400000).toISOString(),
    certNumber: Math.floor(Math.random() * 90000000) + 10000000,
    note: 'This is a simulated grade for demo purposes only.',
  });
});

app.get('/api/v1/me/grades', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ grades: [], total: 0 });
});

// ── BATTLE STATS ──────────────────────────────────────────────────────────────
app.get('/api/v1/battles/:id/stats', async (c) => {
  const { id } = c.req.param();
  const vr = await pg.query('SELECT category, choice, weight, created_at FROM votes WHERE battle_id=$1 ORDER BY created_at ASC', [id]);
  const votes = vr.rows as {category:string;choice:string;weight:number;created_at:string}[];
  const cats = ['investment','coolest','rarity'];
  const byCategory: Record<string, unknown> = {};
  for (const cat of cats) {
    const cv = votes.filter(v => v.category === cat);
    const left = cv.filter(v => v.choice === 'left');
    const right = cv.filter(v => v.choice === 'right');
    const total = cv.length;
    byCategory[cat] = {
      total,
      leftCount: left.length,
      rightCount: right.length,
      leftPct: total > 0 ? Math.round(left.length/total*1000)/10 : 50,
      rightPct: total > 0 ? Math.round(right.length/total*1000)/10 : 50,
      timeline: Array.from({length: 6}, (_, i) => ({
        hour: i,
        leftVotes: Math.floor(Math.random() * 20),
        rightVotes: Math.floor(Math.random() * 20),
      })),
    };
  }
  return c.json({
    battleId: id,
    totalVotes: votes.length,
    byCategory,
    momentum: Math.random() > 0.5 ? 'left' : 'right',
    peakHour: Math.floor(Math.random() * 24),
  });
});

// ── REFERRAL SYSTEM ───────────────────────────────────────────────────────────
const referrals = new Map<string, {code: string; userId: string; uses: number; reward: string}>();

app.get('/api/v1/me/referral', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  let ref = Array.from(referrals.values()).find(r => r.userId === authUid);
  if (!ref) {
    const ur = await pg.query('SELECT username FROM users WHERE id=$1', [authUid]);
    const username = (ur.rows as {username:string}[])[0]?.username || 'user';
    const code = `${username.toUpperCase().slice(0,6)}${Math.floor(Math.random()*1000)}`;
    ref = { code, userId: authUid, uses: Math.floor(Math.random() * 5), reward: '1 month Pro free' };
    referrals.set(code, ref);
  }
  return c.json({
    code: ref.code,
    uses: ref.uses,
    reward: ref.reward,
    shareUrl: `https://cardbattles.app/join?ref=${ref.code}`,
    message: 'Share your code and get 1 month Pro free for each friend who joins!',
  });
});

app.post('/api/v1/referral/redeem', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const { code } = await c.req.json().catch(() => ({}));
  const ref = referrals.get((code as string)?.toUpperCase());
  if (!ref) return c.json({ error: 'Invalid referral code' }, 404);
  if (ref.userId === authUid) return c.json({ error: 'Cannot use your own code' }, 400);
  ref.uses++;
  return c.json({ success: true, reward: '7 days Pro free', message: 'Referral applied! 7 days Pro added to your account.' });
});

// ── MARKET FEED ──────────────────────────────────────────────────────────────
app.get('/api/v1/market/feed', async (c) => {
  const r = await pg.query('SELECT id, title, player_name, year, sport, image_url FROM card_assets ORDER BY RANDOM() LIMIT 20');
  const cards = r.rows as {id:string;title:string;player_name:string;year:number;sport:string;image_url:string}[];

  const VALUATIONS: Record<string,number> = {
    'Patrick Mahomes': 280, 'Tom Brady': 520, 'LeBron James': 1400, 'Michael Jordan': 15000,
    'Victor Wembanyama': 180, 'Shohei Ohtani': 380, 'Mike Trout': 780, 'Luka Doncic': 460,
    'Stephen Curry': 340, 'Josh Allen': 210, 'Lamar Jackson': 195, 'Giannis Antetokounmpo': 165,
    'Nikola Jokic': 220, 'Anthony Edwards': 310,
  };

  const items = cards.map(card => {
    const base = VALUATIONS[card.player_name] || 45;
    const change = (Math.random() - 0.45) * 0.2;
    const changeAmt = Math.round(base * change);
    return {
      cardId: card.id,
      title: card.title,
      playerName: card.player_name,
      year: card.year,
      sport: card.sport,
      imageUrl: card.image_url,
      currentPrice: base,
      change: changeAmt,
      changePct: Math.round(change * 1000) / 10,
      trend: changeAmt > 0 ? 'up' : changeAmt < 0 ? 'down' : 'stable',
      volume: Math.floor(Math.random() * 50) + 5,
      lastSale: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    };
  });

  items.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  return c.json({ items, updatedAt: new Date().toISOString() });
});

app.get('/api/v1/market/top-movers', async (c) => {
  const gainers = [
    { playerName: 'Patrick Mahomes', change: +12.4, price: 312 },
    { playerName: 'Victor Wembanyama', change: +8.7, price: 196 },
    { playerName: 'Anthony Edwards', change: +6.2, price: 329 },
  ];
  const losers = [
    { playerName: 'Mike Trout', change: -5.3, price: 738 },
    { playerName: 'Shohei Ohtani', change: -2.1, price: 372 },
  ];
  return c.json({ gainers, losers, updatedAt: new Date().toISOString() });
});

// ── CARD COMPARE ──────────────────────────────────────────────────────────────
app.get('/api/v1/cards/compare', async (c) => {
  const ids = c.req.query('ids')?.split(',').slice(0,2);
  if (!ids || ids.length < 2) return c.json({ error: 'Provide 2 card IDs as ?ids=id1,id2' }, 400);

  const r = await pg.query('SELECT * FROM card_assets WHERE id = ANY($1)', [ids]);
  const cards = r.rows as Record<string,unknown>[];

  const COMP_VALUATIONS: Record<string,{mid:number;trend:string}> = {
    'Patrick Mahomes': {mid:280,trend:'up'}, 'Tom Brady': {mid:520,trend:'stable'},
    'LeBron James': {mid:1400,trend:'up'}, 'Michael Jordan': {mid:15000,trend:'stable'},
    'Victor Wembanyama': {mid:180,trend:'up'}, 'Shohei Ohtani': {mid:380,trend:'up'},
    'Mike Trout': {mid:780,trend:'down'}, 'Luka Doncic': {mid:460,trend:'up'},
    'Stephen Curry': {mid:340,trend:'stable'}, 'Josh Allen': {mid:210,trend:'up'},
    'Lamar Jackson': {mid:195,trend:'up'}, 'Giannis Antetokounmpo': {mid:165,trend:'stable'},
    'Nikola Jokic': {mid:220,trend:'up'}, 'Anthony Edwards': {mid:310,trend:'up'},
  };

  const enriched = cards.map(card => {
    const val = COMP_VALUATIONS[card.player_name as string] || {mid:45,trend:'stable'};
    const year = card.year as number;
    const ageMult = year < 2000 ? 3 : year < 2010 ? 1.8 : 1;
    return {
      ...card,
      estimatedValue: Math.round(val.mid * ageMult),
      trend: val.trend,
      battlesCount: Math.floor(Math.random() * 20) + 1,
      winRate: Math.floor(Math.random() * 40) + 40,
      totalVotesReceived: Math.floor(Math.random() * 50000) + 1000,
    };
  });

  return c.json({ cards: enriched });
});

// ── ENHANCED BATTLES SEARCH ───────────────────────────────────────────────────
app.get('/api/v1/battles/search/advanced', async (c) => {
  const q = (c.req.query('q') || '').toLowerCase();
  const sport = c.req.query('sport');
  const status = c.req.query('status') || 'live';
  const minVotes = parseInt(c.req.query('minVotes') || '0');
  const sortBy = c.req.query('sort') || 'votes';

  let query = `SELECT b.*,la.id as lid,la.title as lt,la.image_url as li,la.player_name as lp,ra.id as rid,ra.title as rt,ra.image_url as ri,ra.player_name as rp FROM battles b LEFT JOIN card_assets la ON la.id=b.left_asset_id LEFT JOIN card_assets ra ON ra.id=b.right_asset_id WHERE 1=1`;
  const params: unknown[] = [];
  let idx = 1;

  if (q) {
    query += ` AND (LOWER(b.title) LIKE $${idx} OR LOWER(la.player_name) LIKE $${idx} OR LOWER(ra.player_name) LIKE $${idx})`;
    params.push(`%${q}%`); idx++;
  }
  if (status !== 'all') {
    query += ` AND b.status=$${idx}`; params.push(status); idx++;
  }
  if (minVotes > 0) {
    query += ` AND b.total_votes_cached>=$${idx}`; params.push(minVotes); idx++;
  }

  const orderMap: Record<string,string> = {
    votes: 'b.total_votes_cached DESC',
    newest: 'b.created_at DESC',
    ending: 'b.ends_at ASC',
  };
  query += ` ORDER BY ${orderMap[sortBy] || 'b.total_votes_cached DESC'} LIMIT 30`;

  const r = await pg.query(query, params);
  const items = (r.rows as Record<string,unknown>[]).map(row => ({
    id:row.id, title:row.title, status:row.status, endsAt:row.ends_at,
    totalVotesCached:row.total_votes_cached, isSponsored:!!row.is_sponsored,
    left:{assetId:row.lid,title:row.lt,imageUrl:row.li,playerName:row.lp},
    right:{assetId:row.rid,title:row.rt,imageUrl:row.ri,playerName:row.rp},
    myVotes:{},
  }));
  return c.json({ items, total: items.length });
});

// ── BULK CREATE BATTLES (ADMIN) ───────────────────────────────────────────────
app.post('/api/v1/admin/bulk-create-battles', async (c) => {
  if (!requireAdmin(c.req.header('Authorization'))) return c.json({ error: 'Forbidden' }, 403);
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);

  const { matchups } = await c.req.json().catch(() => ({matchups:[]}));
  const results: {success:boolean;battleId?:string;title?:string;error?:string}[] = [];

  for (const matchup of matchups as {leftPlayer:string;rightPlayer:string;title?:string}[]) {
    const lr = await pg.query("SELECT id,title,player_name FROM card_assets WHERE LOWER(player_name) LIKE $1 LIMIT 1", [`%${matchup.leftPlayer.toLowerCase()}%`]);
    const rr = await pg.query("SELECT id,title,player_name FROM card_assets WHERE LOWER(player_name) LIKE $1 LIMIT 1", [`%${matchup.rightPlayer.toLowerCase()}%`]);
    const left = (lr.rows as {id:string;title:string;player_name:string}[])[0];
    const right = (rr.rows as {id:string;title:string;player_name:string}[])[0];

    if (left && right) {
      const id = randomUUID();
      const now = new Date();
      const endsAt = new Date(now.getTime() + 86400000).toISOString();
      const title = matchup.title || `${left.player_name} vs ${right.player_name}`;
      await pg.query(
        'INSERT INTO battles (id,created_by_user_id,left_asset_id,right_asset_id,title,categories,duration_seconds,starts_at,ends_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [id, authUid, left.id, right.id, title, '["investment","coolest","rarity"]', 86400, now.toISOString(), endsAt]
      );
      results.push({ success: true, battleId: id, title });
    } else {
      results.push({ success: false, error: `Could not find: ${!left ? matchup.leftPlayer : matchup.rightPlayer}` });
    }
  }

  return c.json({
    results,
    created: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
  });
});

// ── LIVE AUCTIONS ────────────────────────────────────────────────────────────
const auctionData = [
  { player: 'Patrick Mahomes', bid: 287, start: 100, bids: 14, grade: 10 },
  { player: 'Michael Jordan', bid: 16500, start: 10000, bids: 31, grade: 9 },
  { player: 'LeBron James', bid: 1420, start: 800, bids: 22, grade: 10 },
  { player: 'Victor Wembanyama', bid: 195, start: 75, bids: 8, grade: 10 },
  { player: 'Tom Brady', bid: 545, start: 200, bids: 19, grade: 9 },
];

app.get('/api/v1/auctions', async (c) => {
  const r = await pg.query("SELECT id,image_url,player_name,title,year FROM card_assets WHERE player_name IN ('Patrick Mahomes','Michael Jordan','LeBron James','Victor Wembanyama','Tom Brady') LIMIT 5");
  const cards = r.rows as {id:string;image_url:string;player_name:string;title:string;year:number}[];
  const mockAuctions = cards.map((card, i) => {
    const data = auctionData[i] || { bid: 100, start: 50, bids: 5, grade: 9 };
    const hoursLeft = Math.random() * 23 + 1;
    return {
      id: `auction-${card.id}`,
      cardId: card.id,
      playerName: card.player_name,
      imageUrl: card.image_url,
      title: card.title,
      currentBid: data.bid,
      startingBid: data.start,
      bidCount: data.bids,
      highBidder: ['cardking', 'slabmaster', 'gradegod'][i % 3],
      endsAt: new Date(Date.now() + hoursLeft * 3600000).toISOString(),
      status: 'live' as const,
      grade: data.grade,
      certNumber: String(Math.floor(Math.random() * 90000000) + 10000000),
    };
  });
  return c.json({ auctions: mockAuctions, total: mockAuctions.length });
});

app.post('/api/v1/auctions/:id/bid', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const { amount } = await c.req.json().catch(() => ({}));
  if (!amount || amount < 1) return c.json({ error: 'Invalid bid amount' }, 400);
  return c.json({ success: true, bidId: randomUUID(), amount, message: 'Bid placed! (Demo mode — bids are not real)' });
});

// ── CARD SETS ────────────────────────────────────────────────────────────────
app.get('/api/v1/card-sets', async (c) => {
  return c.json({
    sets: [
      { id: 'prizm', name: 'Panini Prizm', year: '2017-present', description: 'The most popular modern card set', cardCount: 42, avgValue: 280, sport: 'all', imageColor: '6c47ff' },
      { id: 'topps-chrome', name: 'Topps Chrome', year: '1996-present', description: 'Chrome refractor technology, collector favorite', cardCount: 38, avgValue: 195, sport: 'mlb', imageColor: '22c55e' },
      { id: 'bowman-chrome', name: 'Bowman Chrome', year: '2001-present', description: 'The definitive prospect card set', cardCount: 29, avgValue: 145, sport: 'mlb', imageColor: '3b82f6' },
      { id: 'fleer', name: 'Fleer', year: '1960-2007', description: 'Vintage classics including Jordan rookie', cardCount: 15, avgValue: 820, sport: 'nba', imageColor: 'f59e0b' },
      { id: 'sp-authentic', name: 'SP Authentic', year: '1993-present', description: 'Premium autos and rookies', cardCount: 22, avgValue: 340, sport: 'nfl', imageColor: 'ef4444' },
      { id: 'national-treasures', name: 'National Treasures', year: '2004-present', description: 'Ultra-premium patch autos', cardCount: 18, avgValue: 1250, sport: 'all', imageColor: 'a855f7' },
    ]
  });
});

// ── PERSONAL ANALYTICS ───────────────────────────────────────────────────────
app.get('/api/v1/me/analytics', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const stats = await pg.query('SELECT * FROM user_stats WHERE user_id=$1', [authUid]);
  const s = (stats.rows as Record<string,number>[])[0] || {};
  const votesTimeline = Array.from({length: 7}, (_, i) => ({
    day: new Date(Date.now() - (6-i) * 86400000).toLocaleDateString('en', {weekday:'short'}),
    votes: Math.floor(Math.random() * 30) + 5,
  }));
  const sportBreakdown = [
    { sport: 'NFL 🏈', winRate: Math.floor(Math.random() * 30) + 45, battles: Math.floor(Math.random() * 10) + 2 },
    { sport: 'NBA 🏀', winRate: Math.floor(Math.random() * 30) + 45, battles: Math.floor(Math.random() * 10) + 2 },
    { sport: 'MLB ⚾', winRate: Math.floor(Math.random() * 30) + 45, battles: Math.floor(Math.random() * 10) + 2 },
  ];
  return c.json({
    summary: {
      totalVotes: s.votes_cast || 0,
      battlesWon: s.battles_won || 0,
      battlesCreated: s.battles_created || 0,
      currentStreak: s.current_streak || 0,
      bestStreak: s.best_streak || 0,
      winRate: s.battles_won && s.battles_lost ? Math.round(s.battles_won / (s.battles_won + s.battles_lost) * 100) : 0,
    },
    votesTimeline,
    sportBreakdown,
    topCategory: 'investment',
    peakVotingHour: Math.floor(Math.random() * 12) + 8,
  });
});

// ── CHECK USERNAME AVAILABILITY ─────────────────────────────────────────────
app.get('/api/v1/auth/check-username', async (c) => {
  const username = c.req.query('username');
  if (!username || username.length < 3) return c.json({ available: false, error: 'Too short' });
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) return c.json({ available: false, error: 'Invalid characters' });
  const r = await pg.query('SELECT id FROM users WHERE username=$1', [username]);
  return c.json({ available: (r.rows as unknown[]).length === 0 });
});

// ── COMMUNITY ENDPOINTS ───────────────────────────────────────────────────────
app.get('/api/v1/community/feed', async (c) => {
  const battles = await pg.query(`SELECT b.id, b.title, b.created_at, b.total_votes_cached, u.username FROM battles b LEFT JOIN users u ON u.id=b.created_by_user_id ORDER BY b.created_at DESC LIMIT 5`);
  const brows = battles.rows as {id:string;title:string;created_at:string;total_votes_cached:number;username:string}[];

  const events: unknown[] = [];

  for (const b of brows) {
    events.push({ type: 'battle_created', battleId: b.id, title: b.title, username: b.username, votes: b.total_votes_cached, createdAt: b.created_at });
  }

  const communityEvents = [
    { type: 'milestone', text: 'Card Battles hit 10,000 total votes! 🎉', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { type: 'new_member', username: 'vintagevault', text: 'just joined Card Battles', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { type: 'hot_battle', text: 'Mahomes vs Brady is trending 🔥 — 8,421 votes in 24 hours', createdAt: new Date(Date.now() - 10800000).toISOString() },
    { type: 'tournament', text: 'NFL GOAT Tournament has started! 🏆', createdAt: new Date(Date.now() - 14400000).toISOString() },
  ];

  const allEvents = [...events, ...communityEvents].sort((a: unknown, b: unknown) => {
    const aTime = new Date((a as {createdAt:string}).createdAt).getTime();
    const bTime = new Date((b as {createdAt:string}).createdAt).getTime();
    return bTime - aTime;
  });

  return c.json({ events: allEvents });
});

app.get('/api/v1/community/stats', async (c) => {
  const ur = await pg.query('SELECT COUNT(*) as n FROM users');
  const br = await pg.query('SELECT COUNT(*) as n FROM battles');
  const vr = await pg.query('SELECT COUNT(*) as n FROM votes');
  const lr = await pg.query("SELECT COUNT(*) as n FROM battles WHERE status='live'");
  const uCount = parseInt((ur.rows as {n:string}[])[0].n);
  const bCount = parseInt((br.rows as {n:string}[])[0].n);
  const vCount = parseInt((vr.rows as {n:string}[])[0].n);
  const lCount = parseInt((lr.rows as {n:string}[])[0].n);
  return c.json({
    totalMembers: uCount + 4847,
    totalBattles: bCount + 1293,
    totalVotes: vCount + 9847,
    liveBattles: lCount,
    onlineNow: Math.floor(Math.random() * 80) + 20,
    newTodayMembers: Math.floor(Math.random() * 30) + 5,
  });
});

// ── GRADING SERVICES ──────────────────────────────────────────────────────────
app.get('/api/v1/grading-services', (c) => c.json({
  services: [
    {
      id: 'psa', name: 'PSA', fullName: 'Professional Sports Authenticator',
      founded: 1991, gradingScale: '1-10', turnaroundTiers: [
        { name: 'Economy', time: '120 business days', price: 25 },
        { name: 'Regular', time: '45 business days', price: 50 },
        { name: 'Express', time: '15 business days', price: 150 },
        { name: 'Super Express', time: '5 business days', price: 300 },
      ],
      pros: ['Most widely recognized', 'Best liquidity on eBay', 'Pop reports available', 'Established secondary market'],
      cons: ['Slower turnaround', 'More expensive for bulk', 'Label less visually striking'],
      bestFor: 'Vintage cards and high-value modern cards',
      marketShare: 0.65, avgPremium: 1.0, websiteUrl: 'https://www.psacard.com',
    },
    {
      id: 'bgs', name: 'BGS', fullName: 'Beckett Grading Services',
      founded: 1999, gradingScale: '1-10 (with subgrades)',
      turnaroundTiers: [
        { name: 'Economy', time: '90 business days', price: 22 },
        { name: 'Standard', time: '30 business days', price: 35 },
        { name: 'Express', time: '10 business days', price: 99 },
      ],
      pros: ['Subgrades (centering, corners, edges, surface)', 'Black label BGS 10 is prestigious', 'Modern card friendly', 'Half-point grades'],
      cons: ['Lower liquidity than PSA', 'BGS 9.5 often comparable to PSA 10 in price'],
      bestFor: 'Modern cards where subgrades matter',
      marketShare: 0.22, avgPremium: 0.85, websiteUrl: 'https://www.beckett.com/grading',
    },
    {
      id: 'sgc', name: 'SGC', fullName: 'Sportscard Guaranty Corporation',
      founded: 1998, gradingScale: '1-10',
      turnaroundTiers: [
        { name: 'Standard', time: '30 business days', price: 19 },
        { name: 'Express', time: '10 business days', price: 59 },
      ],
      pros: ['Most affordable', 'Faster turnaround', 'Growing recognition', 'Black label look'],
      cons: ['Less liquidity than PSA/BGS', 'Smaller collector base'],
      bestFor: 'Vintage pre-1980 cards and budget submissions',
      marketShare: 0.13, avgPremium: 0.7, websiteUrl: 'https://www.sgccard.com',
    },
  ]
}));

// ── ANALYTICS OVERVIEW ────────────────────────────────────────────────────────
app.get('/api/v1/analytics/overview', async (c) => {
  const [battles, votes, users, liveBattles] = await Promise.all([
    pg.query('SELECT COUNT(*) as n FROM battles'),
    pg.query('SELECT COUNT(*) as n FROM votes'),
    pg.query('SELECT COUNT(*) as n FROM users'),
    pg.query("SELECT COUNT(*) as n FROM battles WHERE status='live'"),
  ]);

  const topSport = await pg.query(`
    SELECT ca.sport, COUNT(v.id) as vote_count
    FROM votes v
    JOIN battles b ON b.id=v.battle_id
    JOIN card_assets ca ON ca.id=b.left_asset_id
    GROUP BY ca.sport ORDER BY vote_count DESC LIMIT 1
  `);

  const avgVotesPerBattle = await pg.query('SELECT AVG(total_votes_cached) as avg FROM battles WHERE total_votes_cached > 0');

  return c.json({
    totalBattles: parseInt((battles.rows as {n:string}[])[0].n),
    totalVotes: parseInt((votes.rows as {n:string}[])[0].n),
    totalUsers: parseInt((users.rows as {n:string}[])[0].n),
    liveBattles: parseInt((liveBattles.rows as {n:string}[])[0].n),
    topSport: (topSport.rows as {sport:string}[])[0]?.sport || 'nfl',
    avgVotesPerBattle: Math.round(parseFloat((avgVotesPerBattle.rows as {avg:string}[])[0]?.avg || '0')),
    generatedAt: new Date().toISOString(),
  });
});

app.get('/api/v1/analytics/votes-by-sport', async (c) => {
  const r = await pg.query(`
    SELECT ca.sport, COUNT(v.id) as votes, COUNT(DISTINCT b.id) as battles
    FROM votes v
    JOIN battles b ON b.id=v.battle_id
    JOIN card_assets ca ON ca.id=b.left_asset_id
    GROUP BY ca.sport ORDER BY votes DESC
  `);
  return c.json({ breakdown: r.rows });
});

app.get('/api/v1/analytics/top-categories', async (c) => {
  const r = await pg.query('SELECT category, COUNT(*) as n FROM votes GROUP BY category ORDER BY n DESC');
  return c.json({ categories: r.rows });
});

app.get('/api/v1/community/discussions', async (c) => {
  const r = await pg.query(`SELECT b.id, b.title, b.total_votes_cached, u.username FROM battles b LEFT JOIN users u ON u.id=b.created_by_user_id ORDER BY b.total_votes_cached DESC LIMIT 5`);
  return c.json({ battles: r.rows });
});

app.get('/api/v1/community/rising-stars', async (c) => {
  const r = await pg.query(`SELECT us.votes_cast, us.current_streak, u.username, u.avatar_url FROM user_stats us JOIN users u ON u.id=us.user_id ORDER BY us.votes_cast DESC LIMIT 3`);
  return c.json({ users: r.rows });
});

// ── NEWS ──────────────────────────────────────────────────────────────────────
const NEWS_ARTICLES = [
  { id: '1', title: 'Patrick Mahomes Rookie Card Hits Record $4.3M at Auction', sport: 'nfl', category: 'market', summary: 'A PSA 10 2017 Patrick Mahomes rookie card shattered records at a major auction house this weekend.', publishedAt: new Date(Date.now() - 2*3600000).toISOString(), source: 'Card World', imageUrl: null },
  { id: '2', title: 'LeBron James Prizm PSA 10 Surges 40% This Month', sport: 'nba', category: 'market', summary: 'LeBron James Prizm Silver rookie cards continue to climb as demand from overseas collectors intensifies.', publishedAt: new Date(Date.now() - 5*3600000).toISOString(), source: 'SlabReport', imageUrl: null },
  { id: '3', title: 'PSA Announces New 10-Day Grading Tier', sport: 'all', category: 'grading', summary: 'PSA has unveiled a new turnaround option for collectors who want faster grading at a premium price point.', publishedAt: new Date(Date.now() - 8*3600000).toISOString(), source: 'Grading Daily', imageUrl: null },
  { id: '4', title: 'Shohei Ohtani 2023 Topps Chrome Rookies Flying Off Shelves', sport: 'mlb', category: 'market', summary: 'First-year Ohtani cards in his Angels uniform are seeing unprecedented demand following his Dodgers signing.', publishedAt: new Date(Date.now() - 12*3600000).toISOString(), source: 'Card World', imageUrl: null },
  { id: '5', title: 'Victor Wembanyama Rookie Cards: 1 Year Later', sport: 'nba', category: 'investment', summary: 'We look back at how Wemby\'s first-year cards have performed over 12 months — spoiler: it\'s complicated.', publishedAt: new Date(Date.now() - 24*3600000).toISOString(), source: 'SlabReport', imageUrl: null },
  { id: '6', title: 'Top 10 NFL Cards to Watch Heading Into Playoffs', sport: 'nfl', category: 'investment', summary: 'Which quarterback cards spike during playoff runs? Our analysts break down the top 10 to watch.', publishedAt: new Date(Date.now() - 36*3600000).toISOString(), source: 'Card World', imageUrl: null },
  { id: '7', title: 'Beckett vs PSA: Which Grader Is Right for Your Cards?', sport: 'all', category: 'grading', summary: 'A head-to-head comparison of the two biggest grading companies — fees, turnaround, and resale value.', publishedAt: new Date(Date.now() - 48*3600000).toISOString(), source: 'Grading Daily', imageUrl: null },
  { id: '8', title: 'Mike Trout 2011 Update Series PSA 10: Still the King?', sport: 'mlb', category: 'market', summary: 'The ultimate baseball card investment has held its value for a decade. Is it finally time to sell?', publishedAt: new Date(Date.now() - 60*3600000).toISOString(), source: 'SlabReport', imageUrl: null },
];

app.get('/api/v1/news', async (c) => {
  const sport = (c.req.query('sport') || '').toLowerCase();
  const category = c.req.query('category') || '';
  let articles = [...NEWS_ARTICLES];
  if (sport) articles = articles.filter(a => a.sport === sport || a.sport === 'all');
  if (category) articles = articles.filter(a => a.category === category);
  return c.json({ articles, total: articles.length });
});

// ── STREAK ENDPOINT ───────────────────────────────────────────────────────────
app.get('/api/v1/me/streak', async (c) => {
  const u = uid(c.req.header('Authorization'));
  if (!u) return c.json({ error: 'Unauthorized' }, 401);
  const r = await pg.query('SELECT current_streak, best_streak, daily_pick_wins, daily_pick_losses FROM user_stats WHERE user_id=$1', [u]);
  const row = (r.rows as Record<string,number>[])[0] || {};

  const rewards = [
    { streak: 3, label: '3-Day Streak', reward: 'Bronze Badge', icon: '🥉', unlocked: (row.current_streak || 0) >= 3 },
    { streak: 7, label: '7-Day Streak', reward: 'Silver Badge', icon: '🥈', unlocked: (row.current_streak || 0) >= 7 },
    { streak: 14, label: '14-Day Streak', reward: 'Gold Badge', icon: '🥇', unlocked: (row.current_streak || 0) >= 14 },
    { streak: 30, label: '30-Day Streak', reward: '1 Month Pro Free', icon: '💎', unlocked: (row.current_streak || 0) >= 30 },
  ];

  return c.json({
    currentStreak: row.current_streak || 0,
    bestStreak: row.best_streak || 0,
    totalWins: row.daily_pick_wins || 0,
    totalLosses: row.daily_pick_losses || 0,
    rewards,
    nextReward: rewards.find(r => !r.unlocked),
  });
});

// ── MARKETPLACE ──────────────────────────────────────────────────────────────
type Listing = {
  id: string; sellerId: string; sellerName: string; cardId: string;
  playerName: string; imageUrl: string; title: string; year: number;
  askingPrice: number; condition: string; grade: number | null;
  description: string; status: 'active' | 'sold' | 'removed';
  createdAt: string;
};
const marketplace = new Map<string, Listing>();

async function seedMarketplace() {
  const r = await pg.query('SELECT id,player_name,image_url,title,year FROM card_assets LIMIT 6');
  const cards = r.rows as {id:string;player_name:string;image_url:string;title:string;year:number}[];
  const prices = [285, 16200, 1380, 190, 540, 320];
  const conditions = ['PSA 10', 'PSA 9', 'PSA 10', 'Raw NM', 'PSA 8', 'PSA 10'];
  cards.forEach((card, i) => {
    const id = randomUUID();
    marketplace.set(id, {
      id, sellerId: 'demo', sellerName: ['cardking','slabmaster','gradegod'][i%3],
      cardId: card.id, playerName: card.player_name, imageUrl: card.image_url,
      title: card.title, year: card.year, askingPrice: prices[i] || 100,
      condition: conditions[i] || 'PSA 10', grade: conditions[i]?.includes('PSA') ? parseInt(conditions[i].split(' ')[1]) : null,
      description: `Beautiful ${conditions[i]} example. Ships in top loader + team bag.`,
      status: 'active', createdAt: new Date(Date.now() - Math.random()*7*86400000).toISOString(),
    });
  });
}

app.get('/api/v1/marketplace', async (c) => {
  const sort = c.req.query('sort') || 'newest';
  let listings = Array.from(marketplace.values()).filter(l => l.status === 'active');
  const orderFns: Record<string, (a: Listing, b: Listing) => number> = {
    newest: (a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    price_asc: (a,b) => a.askingPrice - b.askingPrice,
    price_desc: (a,b) => b.askingPrice - a.askingPrice,
  };
  listings.sort(orderFns[sort] || orderFns.newest);
  return c.json({ listings, total: listings.length });
});

app.post('/api/v1/marketplace', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { cardId, askingPrice, condition, description } = await c.req.json().catch(() => ({}));
  if (!cardId || !askingPrice) return c.json({ error: 'cardId and askingPrice required' }, 400);
  const cr = await pg.query('SELECT player_name,image_url,title,year FROM card_assets WHERE id=$1', [cardId]);
  const card = (cr.rows as {player_name:string;image_url:string;title:string;year:number}[])[0];
  if (!card) return c.json({ error: 'Card not found' }, 404);
  const ur = await pg.query('SELECT username FROM users WHERE id=$1', [userId]);
  const username = (ur.rows as {username:string}[])[0]?.username || 'user';
  const id = randomUUID();
  const listing: Listing = { id, sellerId: userId, sellerName: username, cardId, playerName: card.player_name, imageUrl: card.image_url, title: card.title, year: card.year, askingPrice: Number(askingPrice), condition: condition || 'Raw', grade: null, description: description ? sanitize(description) : '', status: 'active', createdAt: new Date().toISOString() };
  marketplace.set(id, listing);
  return c.json(listing, 201);
});

app.post('/api/v1/marketplace/:id/contact', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ message: 'Message sent to seller! (Demo mode — messages are not real)', demo: true });
});

app.delete('/api/v1/marketplace/:id', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const listing = marketplace.get(c.req.param('id'));
  if (!listing) return c.json({ error: 'Not found' }, 404);
  if (listing.sellerId !== userId) return c.json({ error: 'Forbidden' }, 403);
  listing.status = 'removed';
  return c.json({ message: 'Listing removed' });
});

// ── PLAYER PROFILES ───────────────────────────────────────────────────────────
app.get('/api/v1/players', async (c) => {
  const r = await pg.query("SELECT DISTINCT player_name, sport, COUNT(*) as card_count FROM card_assets GROUP BY player_name, sport ORDER BY card_count DESC LIMIT 50");
  return c.json({ players: r.rows });
});

app.get('/api/v1/players/:name', async (c) => {
  const name = decodeURIComponent(c.req.param('name'));
  const cards = await pg.query("SELECT * FROM card_assets WHERE LOWER(player_name) LIKE $1 ORDER BY year DESC", [`%${name.toLowerCase()}%`]);
  const crows = cards.rows as Record<string,unknown>[];
  if (!crows.length) return c.json({ error: 'Player not found' }, 404);
  const playerName = (crows[0].player_name as string);
  const battles = await pg.query(`
    SELECT b.id, b.title, b.total_votes_cached, b.ends_at, b.status
    FROM battles b
    LEFT JOIN card_assets la ON la.id=b.left_asset_id
    LEFT JOIN card_assets ra ON ra.id=b.right_asset_id
    WHERE LOWER(la.player_name) LIKE $1 OR LOWER(ra.player_name) LIKE $1
    ORDER BY b.created_at DESC LIMIT 10
  `, [`%${name.toLowerCase()}%`]);
  const VALUATIONS: Record<string,{mid:number;trend:string}> = {
    'Patrick Mahomes':{mid:280,trend:'up'},'Tom Brady':{mid:520,trend:'stable'},'LeBron James':{mid:1400,trend:'up'},'Michael Jordan':{mid:15000,trend:'stable'},
    'Josh Allen':{mid:180,trend:'up'},'Joe Burrow':{mid:120,trend:'up'},'Shohei Ohtani':{mid:340,trend:'up'},'Mike Trout':{mid:420,trend:'stable'},
    'Victor Wembanyama':{mid:890,trend:'up'},'Luka Doncic':{mid:650,trend:'up'},'Stephen Curry':{mid:380,trend:'stable'},'Nikola Jokic':{mid:290,trend:'up'},
  };
  const val = VALUATIONS[playerName] || {mid:45,trend:'stable'};
  return c.json({
    playerName, sport: crows[0].sport, cards: crows, battles: battles.rows,
    totalCards: crows.length, totalBattles: (battles.rows as unknown[]).length,
    estimatedValue: val.mid, trend: val.trend,
    popularityScore: Math.floor(Math.random() * 40) + 60,
  });
});

// ── PRICE HISTORY ─────────────────────────────────────────────────────────────
app.get('/api/v1/cards/:id/price-history', async (c) => {
  const { id } = c.req.param();
  const r = await pg.query('SELECT player_name, year FROM card_assets WHERE id=$1', [id]);
  const card = (r.rows as {player_name:string;year:number}[])[0];
  if (!card) return c.json({ error: 'Not found' }, 404);

  const VALUATIONS: Record<string,number> = {
    'Patrick Mahomes': 280, 'Tom Brady': 520, 'LeBron James': 1400, 'Michael Jordan': 15000,
    'Victor Wembanyama': 180, 'Shohei Ohtani': 380, 'Mike Trout': 780, 'Luka Doncic': 460,
    'Stephen Curry': 340, 'Josh Allen': 210,
  };
  const base = VALUATIONS[card.player_name] || 45;

  const trend = Math.random() > 0.5 ? 1 : -1;
  const points = Array.from({ length: 30 }, (_, i) => {
    const daysAgo = 29 - i;
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
    const noise = (Math.random() - 0.5) * 0.15;
    const drift = trend * i * 0.004;
    const price = Math.round(base * (1 + noise + drift));
    return { date, price };
  });

  const prices = points.map(p => p.price);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const current = prices[prices.length - 1];
  const start = prices[0];
  const changePct = Math.round((current - start) / start * 1000) / 10;

  return c.json({ cardId: id, playerName: card.player_name, points, high, low, current, changePct, trend: changePct > 0 ? 'up' : 'down' });
});

// ── BATCH PRICES ──────────────────────────────────────────────────────────────
app.get('/api/v1/cards/batch-prices', async (c) => {
  const ids = c.req.query('ids')?.split(',').slice(0, 3) || [];
  if (!ids.length) return c.json({ error: 'Provide card IDs as ?ids=id1,id2,id3' }, 400);

  const r = await pg.query('SELECT id, player_name, image_url, year FROM card_assets WHERE id=ANY($1)', [ids]);
  const cards = r.rows as {id:string;player_name:string;image_url:string;year:number}[];

  const VALUATIONS: Record<string,number> = {
    'Patrick Mahomes': 280, 'Tom Brady': 520, 'LeBron James': 1400, 'Michael Jordan': 15000,
    'Victor Wembanyama': 180, 'Caitlin Clark': 145, 'Kobe Bryant': 2800, 'Shohei Ohtani': 380,
    'Mike Trout': 780, 'Stephen Curry': 340,
  };

  const prices = cards.map(card => ({
    cardId: card.id, playerName: card.player_name, imageUrl: card.image_url, year: card.year,
    psa10: VALUATIONS[card.player_name] || 45,
    psa9: Math.round((VALUATIONS[card.player_name] || 45) * 0.4),
    psa8: Math.round((VALUATIONS[card.player_name] || 45) * 0.2),
    raw: Math.round((VALUATIONS[card.player_name] || 45) * 0.05),
    trend: Math.random() > 0.5 ? 'up' : 'down',
    changePct: Math.round((Math.random() - 0.4) * 20 * 10) / 10,
  }));

  return c.json({ prices, comparedAt: new Date().toISOString() });
});

// ── BLITZ BATTLES ─────────────────────────────────────────────────────────────
type BlitzBattle = {
  id: string; leftAssetId: string; rightAssetId: string;
  leftPlayer: string; rightPlayer: string; leftImage: string; rightImage: string;
  leftVotes: number; rightVotes: number; endsAt: string; status: 'live' | 'ended';
  winner?: 'left' | 'right'; createdAt: string;
};
const blitzBattles = new Map<string, BlitzBattle>();

async function seedBlitz() {
  const r = await pg.query('SELECT id, player_name, image_url FROM card_assets ORDER BY RANDOM() LIMIT 2');
  const cards = r.rows as {id:string;player_name:string;image_url:string}[];
  if (cards.length < 2) return;
  const id = randomUUID();
  blitzBattles.set(id, {
    id, leftAssetId: cards[0].id, rightAssetId: cards[1].id,
    leftPlayer: cards[0].player_name, rightPlayer: cards[1].player_name,
    leftImage: cards[0].image_url, rightImage: cards[1].image_url,
    leftVotes: Math.floor(Math.random() * 20), rightVotes: Math.floor(Math.random() * 20),
    endsAt: new Date(Date.now() + 5 * 60000).toISOString(),
    status: 'live', createdAt: new Date().toISOString(),
  });
}

app.get('/api/v1/blitz', async (c) => {
  const now = new Date();
  for (const [, b] of blitzBattles) {
    if (new Date(b.endsAt) < now && b.status === 'live') {
      b.status = 'ended';
      b.winner = b.leftVotes >= b.rightVotes ? 'left' : 'right';
    }
  }
  const live = Array.from(blitzBattles.values()).filter(b => b.status === 'live');
  // Auto-create a new blitz if none live
  if (!live.length) {
    await seedBlitz();
    const newLive = Array.from(blitzBattles.values()).filter(b => b.status === 'live');
    return c.json({ battles: Array.from(blitzBattles.values()).slice(-5), live: newLive[0] || null });
  }
  return c.json({ battles: Array.from(blitzBattles.values()).slice(-5), live: live[0] || null });
});

app.post('/api/v1/blitz/:id/vote', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const battle = blitzBattles.get(c.req.param('id'));
  if (!battle || battle.status !== 'live') return c.json({ error: 'Battle not live' }, 400);
  if (new Date(battle.endsAt) < new Date()) return c.json({ error: 'Battle ended' }, 400);
  const { choice } = await c.req.json().catch(() => ({} as {choice?:string}));
  if (!['left','right'].includes(choice ?? '')) return c.json({ error: 'Invalid choice' }, 400);
  if (choice === 'left') battle.leftVotes++;
  else battle.rightVotes++;
  return c.json({ battle, choice });
});

// ── COLLECTOR PERSONAS ─────────────────────────────────────────────────────────
app.get('/api/v1/personas', (c) => c.json({
  personas: [
    { id: 'investor', name: 'The Investor', emoji: '📈', description: 'You treat cards like stocks. ROI is everything.', color: '#22c55e' },
    { id: 'hunter', name: 'The Hunter', emoji: '🎯', description: 'Chasing the rarest, hardest-to-find cards.', color: '#ef4444' },
    { id: 'fan', name: 'The Fan', emoji: '❤️', description: 'You collect the players you love, full stop.', color: '#6c47ff' },
    { id: 'historian', name: 'The Historian', emoji: '🏺', description: 'Vintage cards are your passion. The older the better.', color: '#f59e0b' },
  ]
}));

// ── CARD SCAN ─────────────────────────────────────────────────────────────────
app.post('/api/v1/cards/scan', async (c) => {
  await c.req.json().catch(() => ({})); // consume body
  const r = await pg.query('SELECT * FROM card_assets ORDER BY RANDOM() LIMIT 1');
  const card = (r.rows as Record<string,unknown>[])[0];
  if (!card) return c.json({ error: 'No cards in database' }, 404);

  const VALUATIONS: Record<string,number> = {
    'Patrick Mahomes': 280, 'Tom Brady': 520, 'LeBron James': 1400, 'Michael Jordan': 15000,
  };

  await new Promise(res => setTimeout(res, 1000));
  return c.json({
    matched: true,
    confidence: Math.floor(Math.random() * 15) + 85,
    card: {
      id: card.id, playerName: card.player_name, year: card.year,
      title: card.title, imageUrl: card.image_url, sport: card.sport,
      estimatedValue: VALUATIONS[card.player_name as string] || 45,
    }
  });
});

// ── HALL OF FAME ──────────────────────────────────────────────────────────────
app.get('/api/v1/hall-of-fame', async (c) => {
  const r = await pg.query(`
    SELECT ca.id, ca.player_name, ca.image_url, ca.title, ca.year, ca.sport,
      COUNT(v.id) as vote_count,
      SUM(CASE WHEN v.choice='left' AND b.left_asset_id=ca.id THEN 1
               WHEN v.choice='right' AND b.right_asset_id=ca.id THEN 1 ELSE 0 END) as wins
    FROM card_assets ca
    LEFT JOIN battles b ON b.left_asset_id=ca.id OR b.right_asset_id=ca.id
    LEFT JOIN votes v ON v.battle_id=b.id
    GROUP BY ca.id ORDER BY vote_count DESC LIMIT 10
  `);

  const items = (r.rows as Record<string,string|number>[]).map((row, i) => ({
    rank: i + 1,
    cardId: row.id,
    playerName: row.player_name,
    imageUrl: row.image_url,
    title: row.title,
    year: row.year,
    sport: row.sport,
    totalVotes: Number(row.vote_count || 0),
    wins: Number(row.wins || 0),
    inducted: new Date(Date.now() - (10 - i) * 7 * 86400000).toISOString().slice(0,10),
  }));

  return c.json({ inductees: items, lastUpdated: new Date().toISOString() });
});

// ── WAITLIST ──────────────────────────────────────────────────────────────────
app.post('/api/v1/waitlist', async (c) => {
  const { email } = await c.req.json().catch(() => ({}));
  if (!email || !email.includes('@')) return c.json({ error: 'Valid email required' }, 400);
  return c.json({ success: true, message: 'Added to waitlist!', position: Math.floor(Math.random() * 200) + 847 });
});

// ── TRADE PROPOSALS ──────────────────────────────────────────────────────────
type TradeProposal = {
  id: string; fromUserId: string; fromUsername: string; toUserId: string; toUsername: string;
  offeredCardIds: string[]; requestedCardIds: string[];
  message: string; status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
};
const tradeProposals = new Map<string, TradeProposal>();

app.get('/api/v1/trades', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const myTrades = Array.from(tradeProposals.values()).filter(t => t.fromUserId === userId || t.toUserId === userId);
  return c.json({ trades: myTrades, total: myTrades.length });
});

app.post('/api/v1/trades', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { toUserId, offeredCardIds, requestedCardIds, message } = await c.req.json().catch(() => ({}));
  if (!toUserId || !offeredCardIds?.length || !requestedCardIds?.length) {
    return c.json({ error: 'toUserId, offeredCardIds, and requestedCardIds are required' }, 400);
  }
  const ur = await pg.query('SELECT username FROM users WHERE id=$1', [userId]);
  const tor = await pg.query('SELECT username FROM users WHERE id=$1', [toUserId]);
  const fromUsername = (ur.rows as {username:string}[])[0]?.username || 'user';
  const toUsername = (tor.rows as {username:string}[])[0]?.username || 'user';
  const id = randomUUID();
  const trade: TradeProposal = { id, fromUserId: userId, fromUsername, toUserId, toUsername, offeredCardIds, requestedCardIds, message: message ? sanitize(message) : '', status: 'pending', createdAt: new Date().toISOString() };
  tradeProposals.set(id, trade);
  return c.json(trade, 201);
});

app.patch('/api/v1/trades/:id', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const trade = tradeProposals.get(c.req.param('id'));
  if (!trade) return c.json({ error: 'Not found' }, 404);
  if (trade.toUserId !== userId && trade.fromUserId !== userId) return c.json({ error: 'Forbidden' }, 403);
  const { status } = await c.req.json().catch(() => ({}));
  if (!['accepted','declined','cancelled'].includes(status)) return c.json({ error: 'Invalid status' }, 400);
  trade.status = status;
  return c.json(trade);
});

// ── PORTFOLIO ─────────────────────────────────────────────────────────────────
app.get('/api/v1/me/portfolio', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const saved = collections.get(userId) || new Set<string>();
  const watchlist = watchlistMap.get(userId) || new Set<string>();

  const VALUATIONS: Record<string,number> = {
    'Patrick Mahomes': 280, 'Tom Brady': 520, 'LeBron James': 1400, 'Michael Jordan': 15000,
    'Victor Wembanyama': 180, 'Shohei Ohtani': 380, 'Mike Trout': 780, 'Luka Doncic': 460,
    'Stephen Curry': 340, 'Josh Allen': 210, 'Lamar Jackson': 195,
  };

  let totalValue = 0;
  const cardDetails: unknown[] = [];

  if (saved.size > 0) {
    const cr = await pg.query('SELECT id,player_name,image_url,title,year,sport FROM card_assets WHERE id=ANY($1)', [Array.from(saved)]);
    for (const card of cr.rows as {id:string;player_name:string;image_url:string;title:string;year:number;sport:string}[]) {
      const val = VALUATIONS[card.player_name] || 45;
      totalValue += val;
      cardDetails.push({ ...card, estimatedValue: val, change: (Math.random() - 0.45) * 0.15 });
    }
  }

  const timeline = Array.from({ length: 30 }, (_, i) => {
    const daysAgo = 29 - i;
    const date = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0,10);
    const fluctuation = 1 + (Math.random() - 0.48) * 0.05;
    const runningValue = totalValue > 0 ? Math.round(totalValue * (0.85 + i * 0.005) * fluctuation) : Math.round((Math.random() * 500) + 200);
    return { date, value: runningValue };
  });

  return c.json({
    totalValue,
    cardCount: saved.size,
    watchlistCount: watchlist.size,
    timeline,
    topCard: cardDetails.sort((a: unknown, b: unknown) => (b as {estimatedValue:number}).estimatedValue - (a as {estimatedValue:number}).estimatedValue)[0] || null,
    cards: cardDetails,
    change30d: timeline.length > 1 ? Math.round((timeline[timeline.length-1].value - timeline[0].value) / timeline[0].value * 1000) / 10 : 0,
  });
});

// ── BATTLE REPLAY ─────────────────────────────────────────────────────────────
app.get('/api/v1/battles/:id/replay', async (c) => {
  const { id } = c.req.param();
  const br = await pg.query(`SELECT b.*, la.player_name as lp, la.image_url as li, ra.player_name as rp, ra.image_url as ri FROM battles b LEFT JOIN card_assets la ON la.id=b.left_asset_id LEFT JOIN card_assets ra ON ra.id=b.right_asset_id WHERE b.id=$1`, [id]);
  const battle = (br.rows as Record<string,unknown>[])[0];
  if (!battle) return c.json({ error: 'Not found' }, 404);

  const vr = await pg.query('SELECT choice, category, created_at FROM votes WHERE battle_id=$1 ORDER BY created_at ASC', [id]);
  const votes = vr.rows as {choice:string;category:string;created_at:string}[];

  const chunkSize = Math.max(1, Math.ceil(votes.length / 10));
  const snapshots = [];
  let leftTotal = 0, rightTotal = 0;

  for (let i = 0; i < votes.length; i += chunkSize) {
    const chunk = votes.slice(i, i + chunkSize);
    for (const v of chunk) { if (v.choice === 'left') leftTotal++; else rightTotal++; }
    const total = leftTotal + rightTotal;
    snapshots.push({
      index: Math.floor(i / chunkSize),
      timestamp: chunk[chunk.length-1]?.created_at,
      leftPct: total > 0 ? Math.round(leftTotal / total * 100) : 50,
      rightPct: total > 0 ? Math.round(rightTotal / total * 100) : 50,
      leftVotes: leftTotal, rightVotes: rightTotal,
      totalVotes: total,
    });
  }

  const moments = [
    { time: '0:00', event: 'Battle started', icon: '⚔️' },
    ...(votes.length > 10 ? [{ time: '~25%', event: `${battle.lp as string} takes early lead`, icon: '📈' }] : []),
    ...(snapshots.length > 0 && snapshots[Math.floor(snapshots.length/2)]?.leftPct > 60 ? [{ time: '~50%', event: `${battle.lp as string} dominates midway`, icon: '🔥' }] : []),
    ...(votes.length > 0 ? [{ time: 'Final', event: `${(leftTotal > rightTotal ? battle.lp : battle.rp) as string} wins!`, icon: '🏆' }] : []),
  ];

  return c.json({ battle, snapshots, moments, finalLeft: leftTotal, finalRight: rightTotal, totalVotes: votes.length });
});

// ── VOTE ALL ──────────────────────────────────────────────────────────────────
app.post('/api/v1/battles/:id/vote-all', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const battleId = c.req.param('id');
  const { choice } = await c.req.json().catch(() => ({}));
  if (!['left','right'].includes(choice)) return c.json({ error: 'Invalid choice' }, 400);
  const cats = ['investment', 'coolest', 'rarity'];
  const results = [];
  for (const category of cats) {
    try {
      await pg.query('INSERT INTO votes (id,battle_id,user_id,category,choice) VALUES ($1,$2,$3,$4,$5)', [randomUUID(), battleId, userId, category, choice]);
      results.push({ category, success: true });
    } catch {
      results.push({ category, success: false, reason: 'already_voted' });
    }
  }
  const successCount = results.filter(r=>r.success).length;
  if (successCount > 0) {
    await pg.query('UPDATE battles SET total_votes_cached=total_votes_cached+$1 WHERE id=$2', [successCount, battleId]);
  }
  return c.json({ results, choice });
});

// ── BATTLE DRAFTS ─────────────────────────────────────────────────────────────
type BattleDraft = {
  id: string; userId: string; leftAssetId?: string; rightAssetId?: string;
  title?: string; sport?: string; categories: string[];
  createdAt: string; updatedAt: string;
};
const battleDrafts = new Map<string, BattleDraft>();

app.get('/api/v1/me/drafts', async (c) => {
  const uid2 = uid(c.req.header('Authorization'));
  if (!uid2) return c.json({ error: 'Unauthorized' }, 401);
  const drafts = Array.from(battleDrafts.values()).filter(d => d.userId === uid2);
  return c.json({ drafts, total: drafts.length });
});

app.post('/api/v1/me/drafts', async (c) => {
  const uid2 = uid(c.req.header('Authorization'));
  if (!uid2) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json().catch(() => ({}));
  const id = randomUUID();
  const draft: BattleDraft = {
    id, userId: uid2,
    leftAssetId: body.leftAssetId, rightAssetId: body.rightAssetId,
    title: body.title, sport: body.sport,
    categories: body.categories || ['investment','coolest','rarity'],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  battleDrafts.set(id, draft);
  return c.json(draft, 201);
});

app.patch('/api/v1/me/drafts/:id', async (c) => {
  const uid2 = uid(c.req.header('Authorization'));
  if (!uid2) return c.json({ error: 'Unauthorized' }, 401);
  const draft = battleDrafts.get(c.req.param('id'));
  if (!draft || draft.userId !== uid2) return c.json({ error: 'Not found' }, 404);
  const body = await c.req.json().catch(() => ({}));
  Object.assign(draft, body, { updatedAt: new Date().toISOString() });
  return c.json(draft);
});

app.delete('/api/v1/me/drafts/:id', async (c) => {
  const uid2 = uid(c.req.header('Authorization'));
  if (!uid2) return c.json({ error: 'Unauthorized' }, 401);
  const draft = battleDrafts.get(c.req.param('id'));
  if (!draft || draft.userId !== uid2) return c.json({ error: 'Not found' }, 404);
  battleDrafts.delete(c.req.param('id'));
  return c.json({ message: 'Draft deleted' });
});

// ── SPOTLIGHT ─────────────────────────────────────────────────────────────────
app.get('/api/v1/spotlight', async (c) => {
  const r = await pg.query(`
    SELECT ca.id, ca.player_name, ca.image_url, ca.title, ca.year, ca.sport,
      COUNT(v.id) as vote_count
    FROM card_assets ca
    JOIN battles b ON b.left_asset_id=ca.id OR b.right_asset_id=ca.id
    JOIN votes v ON v.battle_id=b.id
    WHERE v.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY ca.id
    ORDER BY vote_count DESC
    LIMIT 1
  `);

  // Fallback to random card if no votes today
  const card = (r.rows as Record<string,unknown>[])[0] ||
    (await pg.query('SELECT * FROM card_assets ORDER BY RANDOM() LIMIT 1')).rows[0];

  if (!card) return c.json({ error: 'No cards found' }, 404);

  const VALUATIONS: Record<string,number> = {
    'Patrick Mahomes': 280, 'Tom Brady': 520, 'LeBron James': 1400, 'Michael Jordan': 15000,
    'Victor Wembanyama': 180, 'Caitlin Clark': 145, 'Kobe Bryant': 2800,
  };

  return c.json({
    card,
    estimatedValue: VALUATIONS[card.player_name as string] || 45,
    voteCount: Number(card.vote_count || 0),
    featuredDate: new Date().toISOString().slice(0, 10),
    reason: 'Most voted card in the last 24 hours',
  });
});

// ── RECOMMENDATIONS ───────────────────────────────────────────────────────────
app.get('/api/v1/me/recommendations', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ battles: [], basedOn: 'Popular battles' });

  // Get user's voted sports
  const votedR = await pg.query(`
    SELECT DISTINCT ca.sport
    FROM votes v
    JOIN battles b ON b.id=v.battle_id
    JOIN card_assets ca ON ca.id=b.left_asset_id OR ca.id=b.right_asset_id
    WHERE v.user_id=$1
    LIMIT 5
  `, [authUid]);
  const sports = (votedR.rows as {sport:string}[]).map(r => r.sport);

  // Get battles the user hasn't voted on yet
  const notVotedR = await pg.query(`
    SELECT b.id, b.title, b.total_votes_cached, b.ends_at,
      la.player_name as lp, la.image_url as li,
      ra.player_name as rp, ra.image_url as ri
    FROM battles b
    LEFT JOIN card_assets la ON la.id=b.left_asset_id
    LEFT JOIN card_assets ra ON ra.id=b.right_asset_id
    WHERE b.status='live'
      AND b.id NOT IN (SELECT battle_id FROM votes WHERE user_id=$1)
    ORDER BY b.total_votes_cached DESC
    LIMIT 6
  `, [authUid]);

  return c.json({
    battles: notVotedR.rows,
    basedOn: sports.length > 0 ? `Your ${sports[0]} interest` : 'Popular battles',
  });
});

// ── PRICE ALERTS ─────────────────────────────────────────────────────────────
type PriceAlert = { id: string; userId: string; playerName: string; targetPrice: number; direction: 'above' | 'below'; triggered: boolean; triggeredAt?: string; createdAt: string };
const priceAlerts = new Map<string, PriceAlert>();

const PRICE_VALUATIONS: Record<string, number> = {
  'Patrick Mahomes': 280, 'Tom Brady': 520, 'LeBron James': 1400, 'Michael Jordan': 15000,
  'Victor Wembanyama': 180, 'Shohei Ohtani': 380, 'Mike Trout': 780, 'Luka Doncic': 460,
  'Stephen Curry': 340, 'Josh Allen': 210, 'Lamar Jackson': 195, 'Giannis Antetokounmpo': 165,
  'Nikola Jokic': 220, 'Anthony Edwards': 310,
};

function getCurrentPrice(playerName: string): number {
  const base = PRICE_VALUATIONS[playerName] || 45;
  const jitter = (Math.random() - 0.5) * 0.1;
  return Math.round(base * (1 + jitter));
}

function checkAlertTriggered(alert: PriceAlert): boolean {
  const currentPrice = getCurrentPrice(alert.playerName);
  if (alert.direction === 'above' && currentPrice >= alert.targetPrice) return true;
  if (alert.direction === 'below' && currentPrice <= alert.targetPrice) return true;
  return false;
}

app.get('/api/v1/me/price-alerts', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  // Re-check triggers on fetch
  for (const [id, alert] of priceAlerts.entries()) {
    if (!alert.triggered && alert.userId === authUid && checkAlertTriggered(alert)) {
      priceAlerts.set(id, { ...alert, triggered: true, triggeredAt: new Date().toISOString() });
    }
  }
  const myAlerts = Array.from(priceAlerts.values()).filter(a => a.userId === authUid);
  return c.json({ alerts: myAlerts, total: myAlerts.length });
});

app.post('/api/v1/me/price-alerts', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const { playerName, targetPrice, direction } = await c.req.json().catch(() => ({}));
  if (!playerName || !targetPrice || !['above', 'below'].includes(direction)) {
    return c.json({ error: 'playerName, targetPrice, and direction (above/below) required' }, 400);
  }
  const id = randomUUID();
  const alert: PriceAlert = { id, userId: authUid, playerName, targetPrice: Number(targetPrice), direction, triggered: false, createdAt: new Date().toISOString() };
  priceAlerts.set(id, alert);
  return c.json(alert, 201);
});

app.delete('/api/v1/me/price-alerts/:id', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const alert = priceAlerts.get(c.req.param('id'));
  if (!alert || alert.userId !== authUid) return c.json({ error: 'Not found' }, 404);
  priceAlerts.delete(c.req.param('id'));
  return c.json({ message: 'Alert deleted' });
});

// ── SEASONAL EVENTS ──────────────────────────────────────────────────────────

type SeasonalEvent = {
  id: string; title: string; description: string; theme: string;
  startDate: string; endDate: string; status: 'upcoming' | 'live' | 'ended';
  prize: string; participantCount: number; battles: string[];
  bannerColor: string; emoji: string;
};

const seasonalEvents: SeasonalEvent[] = [
  {
    id: 'goat-showdown', title: 'GOAT Showdown', description: 'The greatest players of all time face off. Who truly is the GOAT?',
    theme: 'All-time greats only', startDate: new Date(Date.now() - 86400000).toISOString(),
    endDate: new Date(Date.now() + 6 * 86400000).toISOString(), status: 'live',
    prize: '1 Month Pro + GOAT Badge', participantCount: 1247, battles: [],
    bannerColor: '#fbbf24', emoji: '🐐',
  },
  {
    id: 'rookie-rumble', title: 'Rookie Rumble', description: 'Only 2023-24 rookie cards. Who has the best future?',
    theme: '2023-24 rookies only', startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 9 * 86400000).toISOString(), status: 'upcoming',
    prize: 'Rookie Hunter Badge', participantCount: 423, battles: [],
    bannerColor: '#22c55e', emoji: '⭐',
  },
  {
    id: 'vintage-vault', title: 'Vintage Vault', description: 'Cards from before 2000 only. Classic collector territory.',
    theme: 'Pre-2000 cards', startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 86400000).toISOString(), status: 'ended',
    prize: 'Vintage Collector Badge', participantCount: 892, battles: [],
    bannerColor: '#8b5cf6', emoji: '🏺',
  },
];

app.get('/api/v1/events', (c) => {
  return c.json({ events: seasonalEvents, total: seasonalEvents.length });
});

app.get('/api/v1/events/:id', (c) => {
  const event = seasonalEvents.find(e => e.id === c.req.param('id'));
  if (!event) return c.json({ error: 'Not found' }, 404);
  return c.json(event);
});

app.post('/api/v1/events/:id/join', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const event = seasonalEvents.find(e => e.id === c.req.param('id'));
  if (!event) return c.json({ error: 'Not found' }, 404);
  if (event.status === 'ended') return c.json({ error: 'Event has ended' }, 400);
  event.participantCount++;
  return c.json({ success: true, message: `Joined ${event.title}!`, event });
});

// ── CARD PACKS ────────────────────────────────────────────────────────────────

type Pack = { id: string; name: string; price: number; cardsPerPack: number; rarityWeights: Record<string,number>; sport: string };
const PACKS: Pack[] = [
  { id: 'prizm-blaster', name: 'Prizm Blaster Box', price: 89, cardsPerPack: 20, rarityWeights: { common: 0.7, rare: 0.2, legendary: 0.1 }, sport: 'all' },
  { id: 'chrome-hobby', name: 'Chrome Hobby Box', price: 120, cardsPerPack: 18, rarityWeights: { common: 0.6, rare: 0.25, legendary: 0.15 }, sport: 'mlb' },
  { id: 'national-treasures', name: 'National Treasures', price: 999, cardsPerPack: 4, rarityWeights: { common: 0.1, rare: 0.4, legendary: 0.5 }, sport: 'all' },
];

app.get('/api/v1/packs', (c) => c.json({ packs: PACKS }));

app.post('/api/v1/packs/:id/open', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const pack = PACKS.find(p => p.id === c.req.param('id'));
  if (!pack) return c.json({ error: 'Pack not found' }, 404);

  const r = await pg.query('SELECT * FROM card_assets ORDER BY RANDOM() LIMIT $1', [pack.cardsPerPack]);
  const cards = r.rows as Record<string,unknown>[];

  const VALUATIONS: Record<string,number> = {
    'Patrick Mahomes': 280, 'Tom Brady': 520, 'LeBron James': 1400, 'Michael Jordan': 15000,
    'Victor Wembanyama': 180, 'Caitlin Clark': 145, 'Kobe Bryant': 2800, 'Shohei Ohtani': 380,
  };

  const pulledCards = cards.map(card => {
    const rand = Math.random();
    let rarity = 'common';
    if (rand > (1 - pack.rarityWeights.legendary)) rarity = 'legendary';
    else if (rand > (1 - pack.rarityWeights.legendary - pack.rarityWeights.rare)) rarity = 'rare';
    const baseVal = VALUATIONS[card.player_name as string] || 25;
    const multiplier = rarity === 'legendary' ? 3 : rarity === 'rare' ? 1.5 : 0.4;
    return {
      ...card,
      rarity,
      estimatedValue: Math.round(baseVal * multiplier * (0.8 + Math.random() * 0.4)),
      isHit: rarity === 'legendary',
    };
  });

  const totalValue = pulledCards.reduce((sum, c) => sum + (c.estimatedValue as number), 0);
  const hits = pulledCards.filter(c => c.isHit);

  return c.json({ pack, cards: pulledCards, totalValue, hits, packValue: pack.price, profit: totalValue - pack.price });
});

// ── MULTI-ROUND BATTLES ───────────────────────────────────────────────────────

type MultiRoundBattle = {
  id: string; leftAssetId: string; rightAssetId: string; title: string;
  rounds: { round: number; category: string; leftVotes: number; rightVotes: number; winner?: 'left' | 'right' }[];
  currentRound: number; leftWins: number; rightWins: number;
  status: 'live' | 'complete'; winner?: 'left' | 'right'; createdAt: string;
  leftCard?: Record<string,unknown>; rightCard?: Record<string,unknown>;
};
const multiRoundBattles = new Map<string, MultiRoundBattle>();

app.get('/api/v1/multi-battles', async (c) => {
  const battles = Array.from(multiRoundBattles.values());
  // Enrich with card data
  const enriched = await Promise.all(battles.map(async b => {
    const lr = await pg.query('SELECT * FROM card_assets WHERE id=$1', [b.leftAssetId]);
    const rr = await pg.query('SELECT * FROM card_assets WHERE id=$1', [b.rightAssetId]);
    return {
      ...b,
      leftCard: (lr.rows as Record<string,unknown>[])[0],
      rightCard: (rr.rows as Record<string,unknown>[])[0],
    };
  }));
  return c.json({ battles: enriched, total: enriched.length });
});

app.post('/api/v1/multi-battles', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const { leftAssetId, rightAssetId, title } = await c.req.json().catch(() => ({}));
  if (!leftAssetId || !rightAssetId) return c.json({ error: 'leftAssetId and rightAssetId required' }, 400);
  const id = randomUUID();
  const battle: MultiRoundBattle = {
    id, leftAssetId, rightAssetId, title: title || 'Best of 3 Battle',
    rounds: [
      { round: 1, category: 'investment', leftVotes: 0, rightVotes: 0 },
      { round: 2, category: 'coolest', leftVotes: 0, rightVotes: 0 },
      { round: 3, category: 'rarity', leftVotes: 0, rightVotes: 0 },
    ],
    currentRound: 1, leftWins: 0, rightWins: 0, status: 'live',
    createdAt: new Date().toISOString(),
  };
  multiRoundBattles.set(id, battle);
  return c.json(battle, 201);
});

app.post('/api/v1/multi-battles/:id/vote', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const battle = multiRoundBattles.get(c.req.param('id'));
  if (!battle || battle.status === 'complete') return c.json({ error: 'Battle not found or complete' }, 404);
  const { choice } = await c.req.json().catch(() => ({}));
  if (!['left','right'].includes(choice)) return c.json({ error: 'Invalid choice' }, 400);
  const currentRound = battle.rounds[battle.currentRound - 1];
  if (choice === 'left') currentRound.leftVotes++;
  else currentRound.rightVotes++;
  return c.json(battle);
});

app.post('/api/v1/multi-battles/:id/advance', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const battle = multiRoundBattles.get(c.req.param('id'));
  if (!battle || battle.status === 'complete') return c.json({ error: 'Battle not found or complete' }, 404);
  const round = battle.rounds[battle.currentRound - 1];
  const roundWinner = round.leftVotes >= round.rightVotes ? 'left' : 'right';
  round.winner = roundWinner;
  if (roundWinner === 'left') battle.leftWins++;
  else battle.rightWins++;
  if (battle.currentRound < 3) {
    battle.currentRound++;
  } else {
    battle.status = 'complete';
    battle.winner = battle.leftWins > battle.rightWins ? 'left' : 'right';
  }
  multiRoundBattles.set(battle.id, battle);
  return c.json(battle);
});

// ── COLLECTOR RANK TIERS ─────────────────────────────────────────────────────

const RANKS = [
  { name: 'Rookie',      minPoints: 0,    icon: '🌱', color: '#64748b', perks: 'Basic features' },
  { name: 'Collector',   minPoints: 50,   icon: '📦', color: '#22c55e', perks: 'Priority search' },
  { name: 'Enthusiast',  minPoints: 200,  icon: '🏅', color: '#3b82f6', perks: 'Extended daily picks' },
  { name: 'Expert',      minPoints: 500,  icon: '💎', color: '#8b5cf6', perks: 'Early access to events' },
  { name: 'Elite',       minPoints: 1000, icon: '🔥', color: '#f59e0b', perks: 'Exclusive elite badge' },
  { name: 'Legend',      minPoints: 5000, icon: '👑', color: '#6c47ff', perks: 'Legend status + custom badge' },
];

app.get('/api/v1/me/rank', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const r = await pg.query('SELECT votes_cast, battles_created, battles_won FROM user_stats WHERE user_id=$1', [authUid]);
  const stats = (r.rows as {votes_cast:number;battles_created:number;battles_won:number}[])[0] || {};
  const points = (stats.votes_cast || 0) + (stats.battles_created || 0) * 5 + (stats.battles_won || 0) * 3;
  const currentRank = [...RANKS].reverse().find(rk => points >= rk.minPoints) || RANKS[0];
  const currentIdx = RANKS.indexOf(currentRank);
  const nextRank = RANKS[currentIdx + 1];
  return c.json({
    points, currentRank, nextRank,
    progress: nextRank ? Math.round((points - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints) * 100) : 100,
    pointsToNext: nextRank ? nextRank.minPoints - points : 0,
    ranks: RANKS,
    breakdown: { votes: stats.votes_cast || 0, battlesCreated: stats.battles_created || 0, battlesWon: stats.battles_won || 0 },
  });
});

app.get('/api/v1/ranks', (c) => c.json({ ranks: RANKS }));

// ── BATTLE TEMPLATES ──────────────────────────────────────────────────────────

app.get('/api/v1/battle-templates', async (c) => {
  const templates = [
    { id: 't1', name: 'NFL GOAT Debate', leftPlayer: 'Tom Brady', rightPlayer: 'Patrick Mahomes', category: 'investment', description: 'The ultimate QB showdown' },
    { id: 't2', name: 'NBA GOAT Debate', leftPlayer: 'Michael Jordan', rightPlayer: 'LeBron James', category: 'coolest', description: 'Who is the greatest of all time?' },
    { id: 't3', name: 'Baseball Legends', leftPlayer: 'Hank Aaron', rightPlayer: 'Babe Ruth', category: 'rarity', description: 'Vintage vs. vintage' },
    { id: 't4', name: 'Modern NBA Stars', leftPlayer: 'Stephen Curry', rightPlayer: 'Luka Doncic', category: 'investment', description: 'Best shooter vs. best playmaker' },
    { id: 't5', name: 'Rookie Investments', leftPlayer: 'Victor Wembanyama', rightPlayer: 'Caitlin Clark', category: 'investment', description: 'Top 2023-24 rookies' },
    { id: 't6', name: 'GOAT Pitchers', leftPlayer: 'Sandy Koufax', rightPlayer: 'Bob Gibson', category: 'rarity', description: 'Vintage pitching legends' },
  ];

  const enriched = await Promise.all(templates.map(async t => {
    const lr = await pg.query("SELECT id,image_url FROM card_assets WHERE LOWER(player_name) LIKE $1 LIMIT 1", [`%${t.leftPlayer.toLowerCase()}%`]);
    const rr = await pg.query("SELECT id,image_url FROM card_assets WHERE LOWER(player_name) LIKE $1 LIMIT 1", [`%${t.rightPlayer.toLowerCase()}%`]);
    return {
      ...t,
      leftCardId: (lr.rows as {id:string}[])[0]?.id,
      leftImageUrl: (lr.rows as {id:string;image_url:string}[])[0]?.image_url,
      rightCardId: (rr.rows as {id:string}[])[0]?.id,
      rightImageUrl: (rr.rows as {id:string;image_url:string}[])[0]?.image_url,
    };
  }));

  return c.json({ templates: enriched });
});

// ── WISHLIST ──────────────────────────────────────────────────────────────────

const wishlistStore = new Map<string, Set<string>>(); // userId -> Set<assetId>

app.get('/api/v1/me/wishlist', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const wished = wishlistStore.get(userId) || new Set<string>();
  if (wished.size === 0) return c.json({ cards: [], total: 0, totalEstimatedCost: 0 });
  const r = await pg.query('SELECT id,player_name,image_url,title,year,sport FROM card_assets WHERE id=ANY($1)', [Array.from(wished)]);
  const VALUATIONS: Record<string,number> = { 'Patrick Mahomes': 280,'Tom Brady': 520,'LeBron James': 1400,'Michael Jordan': 15000,'Victor Wembanyama': 180,'Caitlin Clark': 145,'Kobe Bryant': 2800 };
  const cards = (r.rows as Record<string,unknown>[]).map(row => ({ ...row, estimatedValue: VALUATIONS[row.player_name as string] || 45 }));
  return c.json({ cards, total: cards.length, totalEstimatedCost: cards.reduce((s,row) => s + (row.estimatedValue as number), 0) });
});

app.post('/api/v1/me/wishlist/:assetId', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  if (!wishlistStore.has(userId)) wishlistStore.set(userId, new Set());
  wishlistStore.get(userId)!.add(c.req.param('assetId'));
  return c.json({ wished: true });
});

app.delete('/api/v1/me/wishlist/:assetId', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  wishlistStore.get(userId)?.delete(c.req.param('assetId'));
  return c.json({ wished: false });
});

app.get('/api/v1/me/wishlist/:assetId/status', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ wished: false });
  return c.json({ wished: wishlistStore.get(userId)?.has(c.req.param('assetId')) || false });
});

// ── BATTLE PREDICTIONS ────────────────────────────────────────────────────────

type Prediction = { id: string; userId: string; battleId: string; predictedWinner: 'left' | 'right'; predictedMargin: number; correct?: boolean; createdAt: string };
const predictions = new Map<string, Prediction>(); // `${userId}-${battleId}` -> Prediction

app.post('/api/v1/battles/:id/predict', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const battleId = c.req.param('id');
  const body = await c.req.json().catch(() => ({} as Record<string,unknown>));
  const { predictedWinner, predictedMargin } = body as { predictedWinner?: string; predictedMargin?: number };
  if (!predictedWinner || !['left','right'].includes(predictedWinner)) return c.json({ error: 'predictedWinner must be left or right' }, 400);
  const key = `${userId}-${battleId}`;
  if (predictions.has(key)) return c.json({ error: 'Already predicted' }, 409);
  const pred: Prediction = { id: randomUUID(), userId, battleId, predictedWinner: predictedWinner as 'left'|'right', predictedMargin: Number(predictedMargin) || 10, createdAt: new Date().toISOString() };
  predictions.set(key, pred);
  return c.json(pred, 201);
});

app.get('/api/v1/battles/:id/predictions', async (c) => {
  const battleId = c.req.param('id');
  const battlePreds = Array.from(predictions.values()).filter(p => p.battleId === battleId);
  const leftCount = battlePreds.filter(p => p.predictedWinner === 'left').length;
  const rightCount = battlePreds.filter(p => p.predictedWinner === 'right').length;
  const total = battlePreds.length;
  return c.json({ total, leftPct: total > 0 ? Math.round(leftCount/total*100) : 50, rightPct: total > 0 ? Math.round(rightCount/total*100) : 50, userPrediction: null });
});

app.get('/api/v1/me/predictions', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const myPreds = Array.from(predictions.values()).filter(p => p.userId === userId);
  return c.json({ predictions: myPreds, total: myPreds.length });
});

// ── CREATOR EARNINGS ──────────────────────────────────────────────────────────

app.get('/api/v1/me/earnings', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const battlesR = await pg.query('SELECT id, title, total_votes_cached, created_at FROM battles WHERE created_by_user_id=$1 ORDER BY total_votes_cached DESC', [userId]);
  const battleRows = battlesR.rows as {id:string;title:string;total_votes_cached:number;created_at:string}[];
  const CPM = 0.50;
  const earnings = battleRows.map(b => ({
    battleId: b.id,
    title: b.title,
    votes: b.total_votes_cached || 0,
    earned: Math.round((b.total_votes_cached || 0) / 1000 * CPM * 100) / 100,
    createdAt: b.created_at,
  }));
  const totalEarned = earnings.reduce((s, e) => s + e.earned, 0);
  const totalVotes = earnings.reduce((s, e) => s + e.votes, 0);
  const monthly = Array.from({length: 6}, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.toLocaleDateString('en', {month:'short', year:'2-digit'}),
      earned: Math.round(Math.random() * 5 * 100) / 100,
      votes: Math.floor(Math.random() * 10000),
    };
  });
  return c.json({
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalVotes,
    battleCount: battleRows.length,
    earnings,
    monthly,
    payoutThreshold: 10.00,
    pendingPayout: totalEarned < 10 ? Math.round(totalEarned * 100) / 100 : 0,
    currency: 'USD',
    note: 'Earnings are simulated at $0.50 CPM for demo purposes',
  });
});

// ── REPORTS ───────────────────────────────────────────────────────────────────

app.post('/api/v1/reports', async (c) => {
  const authUid = uid(c.req.header('Authorization'));
  if (!authUid) return c.json({ error: 'Unauthorized' }, 401);
  const { targetType, targetId, reason } = await c.req.json().catch(() => ({}));
  if (!targetType || !targetId || !reason) return c.json({ error: 'targetType, targetId, and reason required' }, 400);
  if (!['battle','comment','user'].includes(targetType)) return c.json({ error: 'Invalid targetType' }, 400);
  const sanitizedReason = reason.replace(/</g,'&lt;').replace(/>/g,'&gt;').trim().slice(0, 500);
  const id = randomUUID();
  reports.set(id, { id, reporterId: authUid, targetType, targetId, reason: sanitizedReason, createdAt: new Date().toISOString(), status: 'pending' });
  return c.json({ success: true, reportId: id, message: 'Report submitted. Our team will review it.' });
});

// ── TRADING CARD GENERATOR ────────────────────────────────────────────────────

app.get('/api/v1/users/:username/card', async (c) => {
  const { username } = c.req.param();
  const ur = await pg.query('SELECT id, username, created_at, is_admin FROM users WHERE username=$1', [username]);
  const user = (ur.rows as {id:string;username:string;created_at:string;is_admin:boolean}[])[0];
  if (!user) return c.json({ error: 'User not found' }, 404);

  const sr = await pg.query('SELECT * FROM user_stats WHERE user_id=$1', [user.id]);
  const stats = (sr.rows as Record<string,number|string>[])[0] || {};

  // Generate SVG trading card
  const memberSince = new Date(user.created_at).getFullYear();
  const votesCast = Number(stats.votes_cast) || 0;
  const rank = votesCast > 1000 ? 'Legend' : votesCast > 500 ? 'Elite' : votesCast > 200 ? 'Expert' : votesCast > 50 ? 'Collector' : 'Rookie';
  const rankColor = ({ Legend: '#6c47ff', Elite: '#f59e0b', Expert: '#8b5cf6', Collector: '#22c55e', Rookie: '#64748b' } as Record<string,string>)[rank] ?? '#64748b';

  const svg = `<svg width="300" height="420" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#12121a"/>
        <stop offset="100%" stop-color="#0a0a0f"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${rankColor}"/>
        <stop offset="100%" stop-color="${rankColor}88"/>
      </linearGradient>
    </defs>
    <rect width="300" height="420" rx="16" fill="url(#bg)" stroke="${rankColor}" stroke-width="2"/>
    <rect x="0" y="0" width="300" height="4" rx="2" fill="url(#accent)"/>
    <!-- Header -->
    <text x="150" y="30" text-anchor="middle" fill="${rankColor}" font-size="10" font-weight="700" font-family="system-ui" letter-spacing="3">CARD BATTLES</text>
    <!-- Avatar circle -->
    <circle cx="150" cy="120" r="60" fill="${rankColor}22" stroke="${rankColor}" stroke-width="2"/>
    <text x="150" y="133" text-anchor="middle" fill="${rankColor}" font-size="48" font-family="system-ui">${username.charAt(0).toUpperCase()}</text>
    <!-- Username -->
    <text x="150" y="210" text-anchor="middle" fill="white" font-size="20" font-weight="900" font-family="system-ui">@${username}</text>
    <!-- Rank badge -->
    <rect x="105" y="220" width="90" height="22" rx="11" fill="${rankColor}33" stroke="${rankColor}" stroke-width="1"/>
    <text x="150" y="235" text-anchor="middle" fill="${rankColor}" font-size="11" font-weight="700" font-family="system-ui">${rank.toUpperCase()}</text>
    <!-- Stats -->
    <line x1="30" y1="260" x2="270" y2="260" stroke="#1e1e2e" stroke-width="1"/>
    <text x="75" y="285" text-anchor="middle" fill="white" font-size="18" font-weight="900" font-family="system-ui">${votesCast}</text>
    <text x="75" y="300" text-anchor="middle" fill="#64748b" font-size="9" font-family="system-ui">VOTES</text>
    <text x="150" y="285" text-anchor="middle" fill="white" font-size="18" font-weight="900" font-family="system-ui">${Number(stats.battles_created) || 0}</text>
    <text x="150" y="300" text-anchor="middle" fill="#64748b" font-size="9" font-family="system-ui">BATTLES</text>
    <text x="225" y="285" text-anchor="middle" fill="white" font-size="18" font-weight="900" font-family="system-ui">${Number(stats.current_streak) || 0}</text>
    <text x="225" y="300" text-anchor="middle" fill="#64748b" font-size="9" font-family="system-ui">STREAK</text>
    <line x1="30" y1="315" x2="270" y2="315" stroke="#1e1e2e" stroke-width="1"/>
    <!-- Member since -->
    <text x="150" y="345" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui">COLLECTOR SINCE ${memberSince}</text>
    <!-- Card number -->
    <text x="150" y="400" text-anchor="middle" fill="${rankColor}66" font-size="9" font-family="system-ui">cardbattle.app · #${String(Math.floor(Math.random()*9000)+1000).padStart(4,'0')}</text>
  </svg>`;

  const format = c.req.query('format') || 'svg';
  if (format === 'svg') {
    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' }});
  }
  return c.json({ svg, username, rank, rankColor, stats });
});

// ── BATTLE SERIES ─────────────────────────────────────────────────────────────

type BattleSeries = {
  id: string; title: string; description: string; leftPlayer: string; rightPlayer: string;
  frequency: 'weekly' | 'daily'; totalEpisodes: number; currentEpisode: number;
  lastBattleId?: string; nextBattleAt: string; createdAt: string;
};
const battleSeries = new Map<string, BattleSeries>();

// Seed 2 series
const _series1: BattleSeries = {
  id: 'goat-weekly', title: 'GOAT of the Week', description: 'Every week a new GOAT debate. Who reigns supreme?',
  leftPlayer: 'Patrick Mahomes', rightPlayer: 'Tom Brady', frequency: 'weekly',
  totalEpisodes: 52, currentEpisode: 12, nextBattleAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  createdAt: new Date(Date.now() - 84 * 86400000).toISOString(),
};
const _series2: BattleSeries = {
  id: 'daily-investment', title: 'Daily Investment Pick', description: 'Which card is the better investment today?',
  leftPlayer: 'LeBron James', rightPlayer: 'Michael Jordan', frequency: 'daily',
  totalEpisodes: 365, currentEpisode: 84, nextBattleAt: new Date(Date.now() + 12 * 3600000).toISOString(),
  createdAt: new Date(Date.now() - 84 * 86400000).toISOString(),
};
battleSeries.set(_series1.id, _series1);
battleSeries.set(_series2.id, _series2);

app.get('/api/v1/series', (c) => c.json({ series: Array.from(battleSeries.values()) }));
app.get('/api/v1/series/:id', (c) => {
  const s = battleSeries.get(c.req.param('id'));
  return s ? c.json(s) : c.json({ error: 'Not found' }, 404);
});
app.post('/api/v1/series/:id/subscribe', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const s = battleSeries.get(c.req.param('id'));
  if (!s) return c.json({ error: 'Not found' }, 404);
  return c.json({ success: true, message: `Subscribed to ${s.title}! You'll be notified for each new episode.` });
});

// ── WEEKLY DIGEST ─────────────────────────────────────────────────────────────

app.get('/api/v1/me/digest/preview', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  // Build digest content
  const topBattles = await pg.query('SELECT id, title, total_votes_cached FROM battles ORDER BY total_votes_cached DESC LIMIT 3');
  const leaderR = await pg.query('SELECT username FROM users ORDER BY created_at LIMIT 3');

  return c.json({
    weekOf: new Date().toISOString().slice(0, 10),
    topBattles: topBattles.rows,
    newBattles: Math.floor(Math.random() * 20) + 5,
    totalVotesThisWeek: Math.floor(Math.random() * 5000) + 1000,
    yourVotes: Math.floor(Math.random() * 50) + 5,
    yourRank: Math.floor(Math.random() * 100) + 1,
    featured: 'GOAT Showdown event is live this week!',
    topCollectors: (leaderR.rows as {username:string}[]).map(r => r.username),
  });
});

app.post('/api/v1/me/digest/subscribe', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { frequency } = await c.req.json().catch(() => ({ frequency: 'weekly' }));
  return c.json({ success: true, frequency, message: `Weekly digest enabled! (Demo — emails not sent in demo mode)` });
});

// ── SOLD COMPS ────────────────────────────────────────────────────────────────

app.get('/api/v1/cards/:id/sold-comps', async (c) => {
  const { id } = c.req.param();
  const r = await pg.query('SELECT player_name, year, sport FROM card_assets WHERE id=$1', [id]);
  const card = (r.rows as {player_name:string;year:number;sport:string}[])[0];
  if (!card) return c.json({ error: 'Not found' }, 404);

  const VALUATIONS: Record<string,number> = {
    'Patrick Mahomes': 280, 'Tom Brady': 520, 'LeBron James': 1400, 'Michael Jordan': 15000,
    'Victor Wembanyama': 180, 'Caitlin Clark': 145, 'Kobe Bryant': 2800, 'Shohei Ohtani': 380,
    'Mike Trout': 780, 'Stephen Curry': 340,
  };
  const base = VALUATIONS[card.player_name] || 45;

  // Generate simulated sold comps (last 10 sales)
  const grades = [10, 10, 9, 10, 9, 8, 10, 9, 7, 10];
  const multipliers: Record<number,number> = { 10: 1, 9: 0.4, 8: 0.2, 7: 0.1 };
  const platforms = ['eBay', 'PWCC', 'Heritage Auctions', 'Goldin', 'eBay', 'StockX', 'eBay', 'Goldin', 'eBay', 'PWCC'];

  const comps = grades.map((grade, i) => {
    const noise = 0.85 + Math.random() * 0.3;
    const price = Math.round(base * (multipliers[grade] || 0.1) * noise * (grade === 10 ? 1 : 1));
    const daysAgo = Math.floor(Math.random() * 90) + 1;
    return {
      grade,
      price,
      platform: platforms[i],
      soldAt: new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10),
      certNumber: String(Math.floor(Math.random() * 90000000) + 10000000),
      url: '#',
    };
  }).sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());

  const psa10s = comps.filter(c => c.grade === 10);
  const avgPsa10 = psa10s.length > 0 ? Math.round(psa10s.reduce((s,c) => s+c.price, 0) / psa10s.length) : base;

  return c.json({
    cardId: id, playerName: card.player_name, year: card.year,
    comps, avgPsa10, highSale: Math.max(...comps.map(c => c.price)),
    lowSale: Math.min(...comps.map(c => c.price)),
    totalSales: comps.length,
    note: 'Simulated comparable sales for demo purposes',
  });
});

// ── MILESTONES ────────────────────────────────────────────────────────────────

app.get('/api/v1/milestones', async (c) => {
  // Generate simulated milestone events
  const ur = await pg.query('SELECT username FROM users LIMIT 5');
  const users = (ur.rows as {username:string}[]).map(r => r.username);

  const milestoneTypes = [
    { type: 'first_battle', template: (u: string) => `🎉 @${u} created their first battle!` },
    { type: 'streak_7', template: (u: string) => `🔥 @${u} hit a 7-day voting streak!` },
    { type: 'votes_100', template: (u: string) => `💯 @${u} cast their 100th vote!` },
    { type: 'rank_up', template: (u: string) => `⬆️ @${u} ranked up to Expert!` },
    { type: 'battle_popular', template: (u: string) => `🚀 @${u}'s battle hit 1,000 votes!` },
    { type: 'badge_earned', template: (u: string) => `🏅 @${u} earned the "Hot Streak" badge!` },
  ];

  const milestones = Array.from({ length: 20 }, (_, i) => {
    const user = users[i % users.length] || 'collector';
    const milestone = milestoneTypes[i % milestoneTypes.length];
    return {
      id: String(i + 1),
      text: milestone.template(user),
      type: milestone.type,
      username: user,
      createdAt: new Date(Date.now() - i * 3600000 * (0.5 + Math.random())).toISOString(),
    };
  });

  return c.json({ milestones, total: milestones.length });
});

// ── GIFT CARDS ────────────────────────────────────────────────────────────────

type GiftCard = { id: string; code: string; fromUserId: string; fromUsername: string; toUsername?: string; amount: number; redeemed: boolean; redeemedBy?: string; createdAt: string; expiresAt: string };
const giftCards = new Map<string, GiftCard>();

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length: 16}, (_, i) => (i > 0 && i % 4 === 0 ? '-' : '') + chars[Math.floor(Math.random() * chars.length)]).join('');
}

app.post('/api/v1/gift-cards', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { toUsername, amount } = await c.req.json().catch(() => ({}));
  if (!amount || ![5, 10, 25, 50].includes(Number(amount))) return c.json({ error: 'amount must be 5, 10, 25, or 50' }, 400);
  const ur = await pg.query('SELECT username FROM users WHERE id=$1', [userId]);
  const fromUsername = (ur.rows as {username:string}[])[0]?.username || 'user';
  const id = randomUUID();
  const code = generateGiftCode();
  const gc: GiftCard = { id, code, fromUserId: userId, fromUsername, toUsername, amount: Number(amount), redeemed: false, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 365 * 86400000).toISOString() };
  giftCards.set(id, gc);
  return c.json({ ...gc, message: 'Gift card created! Share the code with your friend.' }, 201);
});

app.post('/api/v1/gift-cards/redeem', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { code } = await c.req.json().catch(() => ({}));
  if (!code) return c.json({ error: 'code required' }, 400);
  const normalizedInput = String(code).toUpperCase().replace(/-/g, '');
  const gc = Array.from(giftCards.values()).find(g => {
    const normalizedStored = g.code.replace(/-/g, '');
    return normalizedStored === normalizedInput;
  });
  if (!gc) return c.json({ error: 'Invalid gift card code' }, 400);
  if (gc.redeemed) return c.json({ error: 'Gift card already redeemed' }, 400);
  if (new Date(gc.expiresAt) < new Date()) return c.json({ error: 'Gift card expired' }, 400);
  gc.redeemed = true;
  gc.redeemedBy = userId;
  return c.json({ success: true, amount: gc.amount, message: `$${gc.amount} Pro credit applied! (Demo — no real charge)` });
});

app.get('/api/v1/me/gift-cards', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const mine = Array.from(giftCards.values()).filter(g => g.fromUserId === userId);
  return c.json({ giftCards: mine, total: mine.length });
});

// ── RARITY TIERS ─────────────────────────────────────────────────────────────

const RARITY_TIERS: Record<string, {label: string; color: string; glow: string; description: string; emoji: string}> = {
  common: { label: 'Common', color: '#64748b', glow: '#64748b33', description: 'Standard card, widely available', emoji: '⚪' },
  uncommon: { label: 'Uncommon', color: '#22c55e', glow: '#22c55e33', description: 'Less common, some collector interest', emoji: '🟢' },
  rare: { label: 'Rare', color: '#3b82f6', glow: '#3b82f633', description: 'Short print or limited run', emoji: '🔵' },
  epic: { label: 'Epic', color: '#8b5cf6', glow: '#8b5cf633', description: 'Numbered /100 or less, auto or patch', emoji: '🟣' },
  legendary: { label: 'Legendary', color: '#f59e0b', glow: '#f59e0b33', description: '1/1 or printer proof, absolute pinnacle', emoji: '🟡' },
};

app.get('/api/v1/rarity-tiers', (c) => c.json({ tiers: RARITY_TIERS }));

app.get('/api/v1/cards/:id/rarity', async (c) => {
  const { id } = c.req.param();
  const r = await pg.query('SELECT player_name, year FROM card_assets WHERE id=$1', [id]);
  const card = (r.rows as {player_name:string;year:number}[])[0];
  if (!card) return c.json({ error: 'Not found' }, 404);

  const LEGEND_PLAYERS = ['Michael Jordan', 'Babe Ruth', 'Roberto Clemente', 'Sandy Koufax', 'Wilt Chamberlain'];
  const EPIC_PLAYERS = ['LeBron James', 'Kobe Bryant', 'Tom Brady', 'Shohei Ohtani'];
  const RARE_PLAYERS = ['Patrick Mahomes', 'Stephen Curry', 'Mike Trout', 'Luka Doncic'];

  let tierKey = 'common';
  if (LEGEND_PLAYERS.includes(card.player_name) || card.year < 1970) tierKey = 'legendary';
  else if (EPIC_PLAYERS.includes(card.player_name) || card.year < 1990) tierKey = 'epic';
  else if (RARE_PLAYERS.includes(card.player_name) || card.year < 2000) tierKey = 'rare';
  else if (card.year < 2015) tierKey = 'uncommon';

  return c.json({ cardId: id, tier: tierKey, ...RARITY_TIERS[tierKey] });
});

// ── BATTLE CATEGORIES ─────────────────────────────────────────────────────────

const AVAILABLE_CATEGORIES = [
  { id: 'investment', label: 'Investment', emoji: '💰', description: 'Which will be worth more in 5 years?' },
  { id: 'coolest', label: 'Coolest', emoji: '😎', description: 'Which has the better look and design?' },
  { id: 'rarity', label: 'Rarity', emoji: '💎', description: 'Which is harder to find in top grade?' },
  { id: 'rookie', label: 'Rookie Impact', emoji: '⭐', description: 'Which rookie had more impact?' },
  { id: 'goat', label: 'GOAT Factor', emoji: '🐐', description: 'Which is more legendary overall?' },
  { id: 'nostalgia', label: 'Nostalgia', emoji: '🎞️', description: 'Which brings back more memories?' },
  { id: 'condition', label: 'Condition', emoji: '🔍', description: 'Which is in better condition?' },
  { id: 'pop', label: 'Pop Culture', emoji: '🌟', description: 'Which player has more cultural impact?' },
];

app.get('/api/v1/categories', (c) => c.json({ categories: AVAILABLE_CATEGORIES }));

// ── TASK 1: Card Vintage / Age Calculator ────────────────────────────────────
app.get('/api/v1/cards/:id/vintage', async (c) => {
  const { id } = c.req.param();
  const r = await pg.query('SELECT player_name, year, sport FROM card_assets WHERE id=$1', [id]);
  const card = (r.rows as {player_name:string;year:number;sport:string}[])[0];
  if (!card) return c.json({ error: 'Not found' }, 404);

  const currentYear = new Date().getFullYear();
  const age = currentYear - card.year;

  const eras = [
    { name: 'Pre-War', range: 'Pre-1945', minAge: 80, premium: 5.0, description: 'Extremely rare, museum quality' },
    { name: 'Vintage', range: '1945-1979', minAge: 46, premium: 3.5, description: 'Classic era, strong collector demand' },
    { name: 'Junk Wax', range: '1980-1993', minAge: 32, premium: 0.3, description: 'Overproduced era, lower values' },
    { name: 'Modern', range: '1994-2009', minAge: 16, premium: 1.5, description: 'Rookie card era begins' },
    { name: 'Current', range: '2010-present', minAge: 0, premium: 1.0, description: 'High demand, easy to authenticate' },
  ];

  const era = [...eras].sort((a, b) => b.minAge - a.minAge).find(e => age >= e.minAge) || eras[eras.length - 1];

  const VALUATIONS: Record<string,number> = { 'Patrick Mahomes': 280, 'Michael Jordan': 15000, 'LeBron James': 1400, 'Tom Brady': 520 };
  const base = VALUATIONS[card.player_name] || 45;

  return c.json({
    cardId: id, playerName: card.player_name, year: card.year, age,
    era: era.name, eraRange: era.range, eraDescription: era.description,
    agePremium: era.premium, estimatedValueWithAge: Math.round(base * era.premium),
    milestones: [
      { age: 25, label: 'Silver Anniversary', reached: age >= 25 },
      { age: 50, label: 'Golden Anniversary', reached: age >= 50 },
      { age: 75, label: 'Diamond Anniversary', reached: age >= 75 },
      { age: 100, label: 'Centenarian', reached: age >= 100 },
    ],
    nextMilestone: [25, 50, 75, 100].find(m => age < m),
    yearsToNextMilestone: [25, 50, 75, 100].find(m => age < m) ? ([25, 50, 75, 100].find(m => age < m) as number) - age : null,
  });
});

// ── TASK 2: Battle Voting Insights ───────────────────────────────────────────
app.get('/api/v1/battles/:id/my-insights', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ insights: null });
  const { id: battleId } = c.req.param();

  // Get user's votes on this battle
  const vr = await pg.query('SELECT category, choice FROM votes WHERE battle_id=$1 AND user_id=$2', [battleId, userId]);
  const myVotes = vr.rows as {category:string;choice:string}[];

  // Get total votes to calculate alignment
  const tr = await pg.query('SELECT choice, COUNT(*) as n FROM votes WHERE battle_id=$1 GROUP BY choice', [battleId]);
  const totals = tr.rows as {choice:string;n:string}[];
  const leftTotal = parseInt(totals.find(t => t.choice === 'left')?.n || '0');
  const rightTotal = parseInt(totals.find(t => t.choice === 'right')?.n || '0');

  // Alignment: how many of user's votes matched majority
  let aligned = 0;
  for (const vote of myVotes) {
    const majority = leftTotal > rightTotal ? 'left' : 'right';
    if (vote.choice === majority) aligned++;
  }
  const alignmentPct = myVotes.length > 0 ? Math.round(aligned / myVotes.length * 100) : 0;

  // Votes today
  const todayR = await pg.query("SELECT COUNT(*) as n FROM votes WHERE user_id=$1 AND created_at > NOW() - INTERVAL '24 hours'", [userId]);
  const votesToday = parseInt((todayR.rows as {n:string}[])[0]?.n || '0');

  return c.json({
    myVotes,
    alignmentPct,
    votesToday,
    hasVoted: myVotes.length > 0,
  });
});

// ── TASK 3: Friend Challenges ────────────────────────────────────────────────
type Challenge = {
  id: string; fromUserId: string; fromUsername: string;
  toUserId: string; toUsername: string; battleId: string;
  battleTitle: string; message: string; status: 'pending' | 'accepted' | 'declined'; createdAt: string
};
const challenges = new Map<string, Challenge>();

app.post('/api/v1/challenges', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { toUsername, battleId, message } = await c.req.json().catch(() => ({}));
  if (!toUsername || !battleId) return c.json({ error: 'toUsername and battleId required' }, 400);

  const ur = await pg.query('SELECT username FROM users WHERE id=$1', [userId]);
  const tor = await pg.query('SELECT id, username FROM users WHERE username=$1', [toUsername]);
  const br = await pg.query('SELECT title FROM battles WHERE id=$1', [battleId]);

  const fromUsername = (ur.rows as {username:string}[])[0]?.username;
  const toUser = (tor.rows as {id:string;username:string}[])[0];
  const battle = (br.rows as {title:string}[])[0];

  if (!toUser) return c.json({ error: 'User not found' }, 404);
  if (!battle) return c.json({ error: 'Battle not found' }, 404);

  const id = randomUUID();
  const challenge: Challenge = {
    id, fromUserId: userId, fromUsername: fromUsername || 'user',
    toUserId: toUser.id, toUsername: toUser.username, battleId,
    battleTitle: battle.title, message: (message || '').slice(0, 200),
    status: 'pending', createdAt: new Date().toISOString()
  };
  challenges.set(id, challenge);
  return c.json(challenge, 201);
});

app.get('/api/v1/me/challenges', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const mine = Array.from(challenges.values()).filter(ch => ch.fromUserId === userId || ch.toUserId === userId);
  return c.json({
    challenges: mine,
    incoming: mine.filter(ch => ch.toUserId === userId && ch.status === 'pending'),
    outgoing: mine.filter(ch => ch.fromUserId === userId)
  });
});

app.patch('/api/v1/challenges/:id', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const challenge = challenges.get(c.req.param('id'));
  if (!challenge || challenge.toUserId !== userId) return c.json({ error: 'Not found' }, 403);
  const { status } = await c.req.json().catch(() => ({}));
  if (!['accepted','declined'].includes(status)) return c.json({ error: 'Invalid status' }, 400);
  challenge.status = status;
  return c.json(challenge);
});

// ── CARD SET CARDS & SET COMPLETION ─────────────────────────────────────────
app.get('/api/v1/card-sets/:setId/cards', async (c) => {
  const { setId } = c.req.param();
  const sportMap: Record<string,string> = {
    'prizm': 'all', 'topps-chrome': 'mlb', 'bowman-chrome': 'mlb',
    'fleer': 'nba', 'sp-authentic': 'nfl', 'national-treasures': 'all',
  };
  const sport = sportMap[setId];
  if (!sport) return c.json({ error: 'Set not found' }, 404);
  const query = sport === 'all'
    ? 'SELECT id, player_name, year, sport, image_url FROM card_assets LIMIT 12'
    : 'SELECT id, player_name, year, sport, image_url FROM card_assets WHERE sport=$1 LIMIT 12';
  const params = sport === 'all' ? [] : [sport];
  const r = await pg.query(query, params);
  const cards = (r.rows as Record<string,unknown>[]).map((card, i) => ({
    ...card, cardNumber: String(i + 1).padStart(3, '0'),
    parallel: ['Base', 'Silver', 'Gold', 'Red'][Math.floor(Math.random() * 4)],
    printRun: [null, null, null, 50, 25, 10, 1][Math.floor(Math.random() * 7)],
  }));
  return c.json({ setId, cards, total: cards.length });
});

// Set completion tracker (in-memory)
const setCompletions = new Map<string, Set<string>>(); // `${userId}-${setId}` -> Set<cardId>

app.get('/api/v1/me/set-completion/:setId', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const key = `${userId}-${c.req.param('setId')}`;
  const owned = setCompletions.get(key) || new Set<string>();
  return c.json({ ownedCardIds: Array.from(owned), count: owned.size });
});

app.post('/api/v1/me/set-completion/:setId/:cardId', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const key = `${userId}-${c.req.param('setId')}`;
  if (!setCompletions.has(key)) setCompletions.set(key, new Set());
  setCompletions.get(key)!.add(c.req.param('cardId'));
  return c.json({ owned: true });
});

// ── BATTLE REMINDERS ─────────────────────────────────────────────────────────
const battleReminders = new Map<string, {userId:string;battleId:string;battleTitle:string;endsAt:string;notifyBefore:number;createdAt:string}[]>();

app.post('/api/v1/battles/:id/remind', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { id: battleId } = c.req.param();
  const { notifyBefore } = await c.req.json().catch(() => ({ notifyBefore: 60 }));
  const br = await pg.query('SELECT title, ends_at FROM battles WHERE id=$1', [battleId]);
  const battle = (br.rows as {title:string;ends_at:string}[])[0];
  if (!battle) return c.json({ error: 'Battle not found' }, 404);
  if (!battleReminders.has(userId)) battleReminders.set(userId, []);
  battleReminders.get(userId)!.push({
    userId, battleId, battleTitle: battle.title, endsAt: battle.ends_at,
    notifyBefore: Number(notifyBefore) || 60, createdAt: new Date().toISOString()
  });
  return c.json({ success: true, message: `Reminder set! We'll notify you ${notifyBefore} minutes before this battle ends. (Demo — notifications not sent in demo mode)` });
});

app.get('/api/v1/me/reminders', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const reminders = battleReminders.get(userId) || [];
  return c.json({ reminders, total: reminders.length });
});

// ── EXTENDED USER PROFILES ───────────────────────────────────────────────────
app.patch('/api/v1/auth/me/profile', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const { bio, favoritePlayer, favoriteSet, location, twitter, instagram } = await c.req.json().catch(() => ({}));
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (bio !== undefined) { fields.push(`bio=$${idx++}`); values.push(bio.slice(0, 200)); }
  if (favoritePlayer !== undefined) { fields.push(`display_name=$${idx++}`); values.push(favoritePlayer.slice(0, 100)); }
  if (fields.length > 0) {
    values.push(userId);
    await pg.query(`UPDATE users SET ${fields.join(',')} WHERE id=$${idx}`, values);
  }
  const r = await pg.query('SELECT id,username,email,bio,display_name,is_admin FROM users WHERE id=$1', [userId]);
  const userRow = (r.rows as Record<string,unknown>[])[0];
  return c.json({ ...userRow, location: location || null, favoriteSet: favoriteSet || null, twitter: twitter || null, instagram: instagram || null });
});

app.get('/api/v1/users/:username/profile', async (c) => {
  const { username } = c.req.param();
  const r = await pg.query('SELECT id, username, bio, display_name, created_at, is_admin FROM users WHERE username=$1', [username]);
  const userRow = (r.rows as Record<string,unknown>[])[0];
  if (!userRow) return c.json({ error: 'Not found' }, 404);
  const sr = await pg.query('SELECT * FROM user_stats WHERE user_id=$1', [userRow.id as string]);
  const stats = (sr.rows as Record<string,number>[])[0] || {};
  const battlesR = await pg.query(
    'SELECT b.id, b.title, b.total_votes_cached, b.status FROM battles b WHERE b.created_by_user_id=$1 ORDER BY b.created_at DESC LIMIT 5',
    [userRow.id as string]
  );
  return c.json({ ...userRow, stats, recentBattles: battlesR.rows });
});

// ── STORAGE GUIDE ─────────────────────────────────────────────────────────────
app.get('/api/v1/storage-guide', (c) => c.json({
  tips: [
    {
      category: 'Sleeves', icon: '🛡️', priority: 'Essential',
      title: 'Card Sleeves',
      description: 'The first line of defense. Always sleeve immediately.',
      products: ['Ultra Pro Perfect Fit Sleeves', 'KMC Perfect Fit', 'Dragon Shield Perfect Fit'],
      tips: ['Use penny sleeves for bulk', 'Perfect fit inside toploaders', 'Double-sleeve high-value cards'],
      cost: '$0.03-0.10 per card',
    },
    {
      category: 'Toploaders', icon: '📦', priority: 'Essential',
      title: 'Rigid Toploaders',
      description: 'Rigid protection against bending. Standard for most cards.',
      products: ['Ultra Pro 3x4 Toploaders', 'BCW Toploaders', 'Card Saver I (for grading)'],
      tips: ['Card Saver I preferred for PSA/BGS submission', 'Use team bags to seal toploaders', '35pt for standard cards, 75pt+ for thick relics'],
      cost: '$0.10-0.25 per toploader',
    },
    {
      category: 'Storage', icon: '🗄️', priority: 'Important',
      title: 'Long-term Storage',
      description: 'Boxes, binders, and climate control for your collection.',
      products: ['BCW Short Card Storage Box', 'Vault X Premium Binder', 'Card Saver boxes'],
      tips: ['Store vertically, not flat', 'Keep at 65-70°F, 45-55% humidity', 'Away from direct sunlight', 'Acid-free materials only'],
      cost: '$10-50 per storage solution',
    },
    {
      category: 'Display', icon: '🖼️', priority: 'Optional',
      title: 'Display Options',
      description: 'Show off your best cards safely.',
      products: ['One-touch magnetic holders', 'UV-protected frames', 'Graded card display cases'],
      tips: ['UV protection is critical for displayed cards', 'One-touch holders for frequent display', 'Avoid direct sunlight even with UV protection'],
      cost: '$1-20 per display unit',
    },
    {
      category: 'Grading', icon: '🏅', priority: 'Advanced',
      title: 'Pre-grading Prep',
      description: 'How to prepare cards for submission to PSA/BGS/SGC.',
      products: ['Card Saver I holders', 'Microfiber cloths (dry only)', 'Submission forms'],
      tips: ['Never clean cards with liquid', 'Handle by edges only', 'Use Card Saver I not toploaders for submission', 'Take photos before sending'],
      cost: '$25+ per card for grading fees',
    },
  ],
  materials: {
    safe: ['Polypropylene sleeves', 'Acid-free boxes', 'Mylar holders', 'Cotton gloves'],
    avoid: ['PVC sleeves (yellows cards)', 'Rubber bands', 'Paper clips', 'Tape of any kind', 'Lamination'],
  }
}));

// ── INVESTMENT WATCHLIST ───────────────────────────────────────────────────────
const investmentWatchlist = new Map<string, Set<string>>(); // userId -> Set<playerName>

app.get('/api/v1/me/investment-watch', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const watching = investmentWatchlist.get(userId) || new Set<string>();

  const VALUATIONS: Record<string,{mid:number;trend:string;reason:string}> = {
    'Patrick Mahomes': { mid:280, trend:'up', reason:'Chiefs dynasty continues' },
    'Tom Brady': { mid:520, trend:'stable', reason:'GOAT status locked in retirement' },
    'LeBron James': { mid:1400, trend:'up', reason:'All-time scoring record boost' },
    'Michael Jordan': { mid:15000, trend:'stable', reason:'GOAT debate eternal' },
    'Caitlin Clark': { mid:145, trend:'up', reason:'WNBA boom driving demand' },
    'Victor Wembanyama': { mid:180, trend:'up', reason:'Generational talent premium' },
    'Kobe Bryant': { mid:2800, trend:'up', reason:'Posthumous appreciation growing' },
  };

  const watchedPlayers = Array.from(watching).map(name => ({
    playerName: name,
    ...(VALUATIONS[name] || { mid: 45, trend: 'stable', reason: 'Monitor for changes' }),
    addedAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
  }));

  return c.json({ players: watchedPlayers, total: watchedPlayers.length });
});

app.post('/api/v1/me/investment-watch/:playerName', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  if (!investmentWatchlist.has(userId)) investmentWatchlist.set(userId, new Set());
  investmentWatchlist.get(userId)!.add(decodeURIComponent(c.req.param('playerName')));
  return c.json({ watching: true });
});

app.delete('/api/v1/me/investment-watch/:playerName', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  investmentWatchlist.get(userId)?.delete(decodeURIComponent(c.req.param('playerName')));
  return c.json({ watching: false });
});

// ── DATA EXPORT ────────────────────────────────────────────────────────────────
app.get('/api/v1/me/export', async (c) => {
  const userId = uid(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  const format = c.req.query('format') || 'json';

  const [votes, stats] = await Promise.all([
    pg.query(`
      SELECT v.category, v.choice, v.created_at, b.title as battle_title
      FROM votes v JOIN battles b ON b.id=v.battle_id
      WHERE v.user_id=$1 ORDER BY v.created_at DESC LIMIT 500
    `, [userId]),
    pg.query('SELECT * FROM user_stats WHERE user_id=$1', [userId]),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    votes: votes.rows,
    stats: (stats.rows as Record<string,unknown>[])[0] || {},
  };

  if (format === 'csv') {
    const rows = (votes.rows as {category:string;choice:string;created_at:string;battle_title:string}[]);
    const csv = ['Battle,Category,Choice,Date', ...rows.map(r => `"${r.battle_title}","${r.category}","${r.choice}","${r.created_at}"`)].join('\n');
    return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="card-battles-export.csv"' }});
  }

  return c.json(data);
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
// Only start the HTTP server when running directly (not when imported in tests)
const isMain = !process.env.VITEST && process.argv[1] &&
  (process.argv[1].endsWith('combo-server.ts') || process.argv[1].endsWith('combo-server.js'));

initDb()
  .then(seedDb)
  .then(() => {
    if (isMain) {
      serve({ fetch: app.fetch, port: COMBO_PORT });
      console.log(`\n⚔️  Card Battles running on http://localhost:${COMBO_PORT}`);
      console.log(`   /api/v1/* → Hono (in-memory DB)`);
      console.log(`   /*        → Next.js proxy (port ${NEXT_PORT})`);
      console.log(`\n🔑  cardking@demo.com / password123\n`);
    }
  })
  .catch((e) => { console.error('Startup failed:', e); process.exit(1); });

export default app;
