'use client';
import { useEffect, useState } from 'react';

type Badge = { id: string; name: string; icon: string; description: string; earned: boolean };

export function AchievementUnlock({ badges }: { badges: Badge[] }) {
  const [showing, setShowing] = useState<Badge | null>(null);

  useEffect(() => {
    const seenCount = parseInt(localStorage.getItem('cb_badges_seen') || '0');
    const earned = badges.filter(b => b.earned);
    const newBadges = earned.slice(seenCount);
    if (newBadges.length > 0) {
      setShowing(newBadges[0]);
    }
  }, [badges]);

  const dismiss = () => {
    const earned = badges.filter(b => b.earned);
    localStorage.setItem('cb_badges_seen', String(earned.length));
    setShowing(null);
  };

  if (!showing) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="bg-[#12121a] border border-[#6c47ff] rounded-2xl p-8 text-center max-w-sm mx-4 relative overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 0 60px rgba(108,71,255,0.3)' }}
      >
        {/* Confetti dots */}
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: (['#6c47ff', '#fbbf24', '#22c55e', '#ef4444'] as string[])[i % 4],
              top: `${(i * 17 + 5) % 100}%`,
              left: `${(i * 23 + 8) % 100}%`,
              animation: `confetti-fall ${1 + (i % 3) * 0.3}s ease-in forwards`,
              opacity: 0.7,
            }}
          />
        ))}

        {/* Badge icon */}
        <div className="text-6xl mb-4 relative z-10">{showing.icon}</div>

        {/* Labels */}
        <div className="text-xs text-[#6c47ff] font-bold uppercase tracking-widest mb-2 relative z-10">
          🏆 Achievement Unlocked!
        </div>
        <div className="text-xl font-bold text-white mb-2 relative z-10">{showing.name}</div>
        <div className="text-sm text-[#94a3b8] mb-6 relative z-10">{showing.description}</div>

        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="bg-[#6c47ff] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#5534e0] transition-colors relative z-10"
        >
          Awesome! 🎉
        </button>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(40px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
