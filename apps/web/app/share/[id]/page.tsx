import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface Battle {
  id: string;
  title: string;
  total_votes_cached: number;
  lp: string;
  li: string;
  rp: string;
  ri: string;
  left_votes?: number;
  right_votes?: number;
}

async function getBattleData(id: string): Promise<Battle | null> {
  try {
    // Use the OG endpoint data (available in server) by fetching battle details
    const res = await fetch(`${API_BASE}/battles/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      title: data.title,
      total_votes_cached: data.totalVotesCached ?? 0,
      lp: data.left?.playerName ?? 'Player 1',
      li: data.left?.imageUrl ?? '',
      rp: data.right?.playerName ?? 'Player 2',
      ri: data.right?.imageUrl ?? '',
    };
  } catch {
    return null;
  }
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const battle = await getBattleData(params.id);

  if (!battle) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontSize: 48 }}>⚔️</p>
          <h1 style={{ color: 'white', marginTop: 12 }}>Battle not found</h1>
          <a href="/" style={{ color: '#6c47ff', marginTop: 16, display: 'block' }}>← Browse Battles</a>
        </div>
      </div>
    );
  }

  const totalVotes = battle.total_votes_cached ?? 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'white',
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(10,10,15,0.9)',
        borderBottom: '1px solid #1e1e2e',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href="/" style={{ textDecoration: 'none', color: 'white', fontWeight: 900, fontSize: 18 }}>
          ⚔️ <span style={{ color: '#a78bfa' }}>CARD</span><span style={{ color: '#6c47ff' }}>BATTLES</span>
        </a>
        <a
          href={`/battles/${battle.id}`}
          style={{
            background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
            color: 'white',
            textDecoration: 'none',
            padding: '8px 20px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Vote Now →
        </a>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(108,71,255,0.1)',
            border: '1px solid rgba(108,71,255,0.2)',
            borderRadius: 20,
            padding: '6px 14px',
            marginBottom: 12,
          }}>
            <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 900 }}>● LIVE</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>{battle.title}</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
            🗳️ {totalVotes.toLocaleString()} votes cast
          </p>
        </div>

        {/* Battle cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 12,
          alignItems: 'center',
          marginBottom: 32,
        }}>
          {/* Left card */}
          <div style={{
            background: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            overflow: 'hidden',
            textAlign: 'center',
          }}>
            {battle.li ? (
              <img
                src={battle.li}
                alt={battle.lp}
                style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: '3/4',
                background: 'linear-gradient(135deg, #6c47ff44, #6c47ff22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
              }}>🃏</div>
            )}
            <div style={{ padding: '10px 12px' }}>
              <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{battle.lp}</p>
            </div>
          </div>

          {/* VS */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#6c47ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 14,
            boxShadow: '0 0 20px rgba(108,71,255,0.5)',
            flexShrink: 0,
          }}>VS</div>

          {/* Right card */}
          <div style={{
            background: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: 16,
            overflow: 'hidden',
            textAlign: 'center',
          }}>
            {battle.ri ? (
              <img
                src={battle.ri}
                alt={battle.rp}
                style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: '3/4',
                background: 'linear-gradient(135deg, #1e1e2e, #12121a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
              }}>🃏</div>
            )}
            <div style={{ padding: '10px 12px' }}>
              <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{battle.rp}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <a
            href={`/battles/${battle.id}`}
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
              color: 'white',
              textDecoration: 'none',
              padding: '14px 40px',
              borderRadius: 16,
              fontWeight: 900,
              fontSize: 16,
              boxShadow: '0 0 24px rgba(108,71,255,0.4)',
              marginBottom: 12,
            }}
          >
            ⚔️ Cast Your Vote
          </a>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
            Which card wins? You decide.
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 48, borderTop: '1px solid #1e1e2e', paddingTop: 24 }}>
          <p style={{ color: '#374151', fontSize: 12 }}>
            Shared via{' '}
            <a href="/" style={{ color: '#6c47ff', textDecoration: 'none', fontWeight: 700 }}>
              Card Battles
            </a>
            {' '}· The ultimate sports card voting app
          </p>
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const battle = await getBattleData(params.id);
  if (!battle) return { title: 'Card Battle' };
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';
  return {
    title: `${battle.title} — Card Battles`,
    description: `${battle.lp} vs ${battle.rp}. ${battle.total_votes_cached} votes. Cast yours!`,
    openGraph: {
      title: battle.title,
      description: `Vote: ${battle.lp} vs ${battle.rp}`,
      images: [`${API}/share/${battle.id}/og`],
    },
    twitter: {
      card: 'summary_large_image',
      title: battle.title,
      description: `Vote: ${battle.lp} vs ${battle.rp}`,
      images: [`${API}/share/${battle.id}/og`],
    },
  };
}
