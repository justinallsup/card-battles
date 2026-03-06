import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function generateBattleMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API}/battles/${params.id}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'Card Battle ⚔️' };
    const battle = await res.json();
    return {
      title: `${battle.title} | Card Battles ⚔️`,
      description: `Vote on this card battle — ${battle.totalVotesCached} votes so far! Who wins?`,
      openGraph: {
        title: battle.title,
        description: `${battle.left?.playerName} vs ${battle.right?.playerName} — vote now!`,
        type: 'website',
        images: [`${API}/share/${params.id}/og`],
      },
      twitter: {
        card: 'summary_large_image',
        title: battle.title,
        description: `${battle.left?.playerName} vs ${battle.right?.playerName}`,
        images: [`${API}/share/${params.id}/og`],
      },
    };
  } catch {
    return { title: 'Card Battle ⚔️' };
  }
}
