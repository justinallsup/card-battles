'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { console.error('App error:', error.message); }, [error]);
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">💥</div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-[#64748b] text-sm mb-6">{error.message || 'An unexpected error occurred'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#6c47ff] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#5a38e0] transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/feed')}
            className="border border-[#1e1e2e] text-[#94a3b8] px-4 py-2 rounded-xl text-sm hover:text-white hover:border-[#6c47ff]/40 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
