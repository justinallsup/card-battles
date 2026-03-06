'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-center p-8">
      <div className="text-6xl mb-6">💥</div>
      <h2 className="text-2xl font-black text-white mb-3">Something went wrong</h2>
      <p className="text-[#64748b] mb-8 max-w-sm">{error.message || 'An unexpected error occurred'}</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[#6c47ff] text-white font-bold rounded-xl hover:bg-[#5a38e0] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
