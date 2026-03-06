export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`w-5 h-5 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin ${className ?? ''}`} />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner className="w-8 h-8" />
    </div>
  );
}

export function BattleCardSkeleton() {
  return (
    <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] overflow-hidden animate-pulse">
      <div className="h-8 bg-[#1e1e2e] m-4 rounded" />
      <div className="flex gap-3 p-4">
        <div className="flex-1 aspect-[3/4] bg-[#1e1e2e] rounded-xl" />
        <div className="flex items-center justify-center w-8 text-[#374151] font-bold text-sm">VS</div>
        <div className="flex-1 aspect-[3/4] bg-[#1e1e2e] rounded-xl" />
      </div>
      <div className="flex gap-2 p-4 pt-0">
        {[1,2,3].map(i => (
          <div key={i} className="flex-1 h-10 bg-[#1e1e2e] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
