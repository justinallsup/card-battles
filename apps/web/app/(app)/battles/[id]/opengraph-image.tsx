import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: { id: string } }) {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://card-battles-1.onrender.com/api/v1';
  let battle: {
    title?: string;
    left?: { playerName?: string; votes?: number };
    right?: { playerName?: string; votes?: number };
  } | null = null;
  try {
    const res = await fetch(`${API}/battles/${params.id}`, { next: { revalidate: 3600 } });
    battle = await res.json();
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#0a0a0f',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', color: '#6c47ff', fontSize: 28, fontWeight: 900, marginBottom: 16 }}>
          ⚔️ CARD BATTLES
        </div>
        <div
          style={{
            display: 'flex',
            color: 'white',
            fontSize: 42,
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: 32,
            maxWidth: 900,
          }}
        >
          {battle?.title || 'Head-to-Head Card Battle'}
        </div>
        <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 160,
                height: 224,
                background: '#1e1e2e',
                borderRadius: 12,
                border: '3px solid #6c47ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 14,
              }}
            >
              {battle?.left?.playerName || 'Card 1'}
            </div>
            <div style={{ color: '#94a3b8', marginTop: 8, fontSize: 18 }}>{battle?.left?.votes || 0} votes</div>
          </div>
          <div style={{ color: '#6c47ff', fontSize: 48, fontWeight: 900 }}>VS</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 160,
                height: 224,
                background: '#1e1e2e',
                borderRadius: 12,
                border: '3px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 14,
              }}
            >
              {battle?.right?.playerName || 'Card 2'}
            </div>
            <div style={{ color: '#94a3b8', marginTop: 8, fontSize: 18 }}>{battle?.right?.votes || 0} votes</div>
          </div>
        </div>
        <div style={{ color: '#64748b', fontSize: 20, marginTop: 32 }}>card-battles-web.vercel.app · Vote now!</div>
      </div>
    ),
    { ...size }
  );
}
