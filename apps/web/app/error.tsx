'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Root error:', error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-center p-8">
      <div className="text-6xl mb-6">💥</div>
      <h2 className="text-2xl font-black text-white mb-3">Something went wrong</h2>
      <p className="text-[#64748b] mb-8 max-w-sm text-sm">{error.message || 'An unexpected error occurred'}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#6c47ff] text-white font-bold rounded-xl hover:bg-[#5a38e0] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-[#1e1e2e] text-[#94a3b8] font-semibold rounded-xl hover:text-white hover:border-[#6c47ff]/40 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
