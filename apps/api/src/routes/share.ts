import { Hono } from 'hono';
import { db } from '../db';
import { battles, cardAssets } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { AppVariables } from '../types';

const router = new Hono<{ Variables: AppVariables }>();

// GET /api/v1/share/:battleId/og
// Returns an SVG suitable for OG image sharing
router.get('/:battleId/og', async (c) => {
  const { battleId } = c.req.param();

  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!battle) return c.json({ error: 'Battle not found' }, 404);

  const [left] = await db.select().from(cardAssets).where(eq(cardAssets.id, battle.leftAssetId)).limit(1);
  const [right] = await db.select().from(cardAssets).where(eq(cardAssets.id, battle.rightAssetId)).limit(1);

  const result = battle.result as { overall?: { winner?: string } } | null;
  const winner = result?.overall?.winner;
  const totalVotes = battle.totalVotesCached;

  const leftName = (left?.playerName ?? left?.title ?? 'Left Card').slice(0, 24);
  const rightName = (right?.playerName ?? right?.title ?? 'Right Card').slice(0, 24);
  const title = battle.title.slice(0, 48);

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#12121a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6c47ff"/>
      <stop offset="100%" style="stop-color:#9b73ff"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Top accent bar -->
  <rect width="1200" height="6" fill="url(#accent)"/>

  <!-- Logo -->
  <text x="600" y="70" font-family="Arial Black, Arial" font-weight="900" font-size="28" fill="#6c47ff" text-anchor="middle" letter-spacing="4">⚔️ CARDBATTLES</text>

  <!-- Battle title -->
  <text x="600" y="115" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#94a3b8" text-anchor="middle">${escapeXml(title)}</text>

  <!-- VS divider -->
  <rect x="575" y="140" width="50" height="50" rx="25" fill="#1e1e2e" stroke="#374151" stroke-width="2"/>
  <text x="600" y="172" font-family="Arial Black" font-weight="900" font-size="16" fill="#64748b" text-anchor="middle">VS</text>

  <!-- Left card box -->
  <rect x="80" y="140" width="460" height="380" rx="20" fill="#12121a" stroke="#1e1e2e" stroke-width="2"/>
  ${winner === 'left' ? '<rect x="80" y="140" width="460" height="380" rx="20" fill="none" stroke="#6c47ff" stroke-width="4"/>' : ''}
  ${winner === 'left' ? '<text x="310" y="200" font-family="Arial Black" font-size="18" fill="#6c47ff" text-anchor="middle">👑 WINNER</text>' : ''}
  <text x="310" y="${winner === 'left' ? '260' : '330'}" font-family="Arial Black, Arial" font-weight="900" font-size="32" fill="#f1f5f9" text-anchor="middle">${escapeXml(leftName)}</text>

  <!-- Right card box -->
  <rect x="660" y="140" width="460" height="380" rx="20" fill="#12121a" stroke="#1e1e2e" stroke-width="2"/>
  ${winner === 'right' ? '<rect x="660" y="140" width="460" height="380" rx="20" fill="none" stroke="#6c47ff" stroke-width="4"/>' : ''}
  ${winner === 'right' ? '<text x="890" y="200" font-family="Arial Black" font-size="18" fill="#6c47ff" text-anchor="middle">👑 WINNER</text>' : ''}
  <text x="890" y="${winner === 'right' ? '260' : '330'}" font-family="Arial Black, Arial" font-weight="900" font-size="32" fill="#f1f5f9" text-anchor="middle">${escapeXml(rightName)}</text>

  <!-- Stats bar -->
  <rect x="0" y="570" width="1200" height="60" fill="#0d0d14"/>
  <text x="600" y="608" font-family="Arial, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">${totalVotes.toLocaleString()} votes cast • cardbattles.app</text>
</svg>`;

  c.header('Content-Type', 'image/svg+xml');
  c.header('Cache-Control', 'public, max-age=3600');
  return c.body(svg);
});

// GET /api/v1/share/:battleId/card — shareable URL metadata
router.get('/:battleId/card', async (c) => {
  const { battleId } = c.req.param();
  const [battle] = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  if (!battle) return c.json({ error: 'Battle not found' }, 404);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') ?? 'http://localhost:3000';
  return c.json({
    shareUrl: `${baseUrl}/battles/${battleId}`,
    ogImageUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1'}/share/${battleId}/og`,
    title: battle.title,
    description: `Vote on this Card Battle — ${battle.totalVotesCached} votes so far!`,
  });
});

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default router;
