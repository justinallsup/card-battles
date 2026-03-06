export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl animate-pulse">⚔️</div>
        <div className="text-[#6c47ff] font-bold tracking-wider text-sm uppercase">Loading...</div>
      </div>
    </div>
  );
}
