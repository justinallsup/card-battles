import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Card Battle';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: { id: string } }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

  let title = 'Card Battle ⚔️';
  let leftName = 'Left Card';
  let rightName = 'Right Card';
  let votes = 0;

  try {
    const res = await fetch(`${apiBase}/battles/${params.id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const battle = await res.json();
      title = battle.title ?? title;
      leftName = battle.left?.playerName ?? battle.left?.title ?? leftName;
      rightName = battle.right?.playerName ?? battle.right?.title ?? rightName;
      votes = battle.totalVotesCached ?? 0;
    }
  } catch {}

  return new ImageResponse(
    (
      <div style={{
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 100%)',
        fontFamily: 'Arial Black, Arial, sans-serif',
        alignItems: 'center', justifyContent: 'center', padding: '48px',
      }}>
        {/* Logo */}
        <div style={{ fontSize: 28, color: '#6c47ff', fontWeight: 900, letterSpacing: 4, marginBottom: 16 }}>
          ⚔️ CARDBATTLES
        </div>

        {/* Title */}
        <div style={{ fontSize: 22, color: '#94a3b8', marginBottom: 40, textAlign: 'center' }}>
          {title}
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', gap: 40, alignItems: 'center', width: '100%', justifyContent: 'center' }}>
          <div style={{
            flex: 1, maxWidth: 440, background: '#12121a', border: '2px solid #1e1e2e',
            borderRadius: 20, padding: '48px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9' }}>{leftName}</div>
          </div>

          <div style={{
            width: 64, height: 64, borderRadius: 32, background: '#1e1e2e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#64748b',
          }}>VS</div>

          <div style={{
            flex: 1, maxWidth: 440, background: '#12121a', border: '2px solid #1e1e2e',
            borderRadius: 20, padding: '48px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9' }}>{rightName}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, fontSize: 18, color: '#64748b' }}>
          {votes.toLocaleString()} votes • cardbattles.app
        </div>
      </div>
    ),
    { ...size }
  );
}
