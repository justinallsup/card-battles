export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-center p-8">
      <div className="text-8xl mb-6">⚔️</div>
      <h1 className="text-4xl font-black text-white mb-3">404</h1>
      <p className="text-[#64748b] text-lg mb-8">This battle doesn&apos;t exist.<br/>It may have ended or been removed.</p>
      <a href="/feed" className="px-6 py-3 bg-[#6c47ff] text-white font-bold rounded-xl hover:bg-[#5a38e0] transition-colors">
        Back to Feed
      </a>
    </div>
  );
}
