// No 'use client' needed since it's a simple embed
export const dynamic = 'force-dynamic';

interface BattleData {
  id: string;
  title?: string;
  totalVotesCached?: number;
  leftCard?: { playerName?: string; imageUrl?: string };
  rightCard?: { playerName?: string; imageUrl?: string };
  left?: { playerName?: string; imageUrl?: string };
  right?: { playerName?: string; imageUrl?: string };
}

export default async function BattleEmbedPage({ params }: { params: { id: string } }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';
  let battle: BattleData | null = null;

  try {
    const res = await fetch(`${apiBase}/battles/${params.id}`, { cache: 'no-store' });
    if (res.ok) battle = await res.json() as BattleData;
  } catch {}

  if (!battle) {
    return (
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style={{ background: '#0a0a0f', color: '#ef4444', padding: 20, fontFamily: 'system-ui', margin: 0 }}>
          Battle not found
        </body>
      </html>
    );
  }

  // Support both API response shapes
  const leftCard = battle.leftCard ?? battle.left;
  const rightCard = battle.rightCard ?? battle.right;
  const votes = battle.totalVotesCached ?? 0;
  const battleUrl = `http://localhost:3000/battles/${params.id}`;

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{battle.title ?? 'Card Battle'}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #0a0a0f; color: white; font-family: system-ui, -apple-system, sans-serif; padding: 12px; }
          .battle { display: flex; gap: 12px; align-items: center; }
          .card { flex: 1; background: #12121a; border-radius: 8px; padding: 8px; text-align: center; border: 1px solid #1e1e2e; }
          .card img { width: 100%; height: 90px; object-fit: cover; border-radius: 4px; margin-bottom: 6px; }
          .name { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .vs { font-size: 22px; font-weight: 900; color: #6c47ff; flex-shrink: 0; }
          .votes { text-align: center; font-size: 11px; color: #64748b; margin: 8px 0; }
          .vote-link { display: block; background: #6c47ff; color: white; text-decoration: none; padding: 8px; border-radius: 8px; text-align: center; font-size: 12px; font-weight: 700; }
          .vote-link:hover { background: #5a38e0; }
        `}</style>
      </head>
      <body>
        <div className="battle">
          <div className="card">
            {leftCard?.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={leftCard.imageUrl} alt={leftCard?.playerName ?? 'Left card'} />
            )}
            <div className="name">{leftCard?.playerName ?? 'Card 1'}</div>
          </div>
          <div className="vs">VS</div>
          <div className="card">
            {rightCard?.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rightCard.imageUrl} alt={rightCard?.playerName ?? 'Right card'} />
            )}
            <div className="name">{rightCard?.playerName ?? 'Card 2'}</div>
          </div>
        </div>
        <div className="votes">{votes.toLocaleString()} votes</div>
        <a className="vote-link" href={battleUrl} target="_blank" rel="noopener noreferrer">
          ⚔️ Vote Now on Card Battles
        </a>
      </body>
    </html>
  );
}
