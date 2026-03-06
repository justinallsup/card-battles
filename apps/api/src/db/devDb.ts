// Dev bootstrap: wire PGlite + in-memory Redis for local dev without Docker
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/pglite';
import * as schema from './schema';
import { readFileSync } from 'fs';
import { join } from 'path';

let _db: ReturnType<typeof drizzlePg> | null = null;

export async function getDevDb() {
  if (_db) return _db;
  const pg = new PGlite(); // in-memory
  _db = drizzlePg(pg, { schema });

  // Run migration SQL
  try {
    const sql = readFileSync(join(__dirname, '../../drizzle/0000_initial.sql'), 'utf8');
    // Split on statement boundaries and run each
    const stmts = sql.split(/;\s*\n/).filter(s => s.trim().length > 0);
    for (const stmt of stmts) {
      try { await pg.exec(stmt + ';'); } catch {}
    }
  } catch (e) {
    console.warn('[DevDB] Migration warning:', (e as Error).message);
  }

  console.log('[DevDB] PGlite in-memory database ready');
  return _db;
}
