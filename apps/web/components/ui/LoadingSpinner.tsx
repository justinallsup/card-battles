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
    <div className="bg-[#12121a] rounded-2xl border border-[#1e1e2e] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="h-4 w-36 shimmer rounded-md" />
        <div className="h-4 w-16 shimmer rounded-md" />
      </div>
      {/* Cards */}
      <div className="flex gap-1 px-4 py-3 items-start">
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="w-full shimmer rounded-xl" style={{ aspectRatio: '3/4' }} />
          <div className="h-3 w-2/3 mx-auto shimmer rounded" />
        </div>
        <div className="flex items-center justify-center w-10 self-center flex-shrink-0">
          <div className="w-9 h-9 shimmer rounded-full" />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="w-full shimmer rounded-xl" style={{ aspectRatio: '3/4' }} />
          <div className="h-3 w-2/3 mx-auto shimmer rounded" />
        </div>
      </div>
      {/* Vote buttons */}
      <div className="flex gap-2 px-4 pb-4">
        {[1, 2].map(i => (
          <div key={i} className="flex-1 h-10 shimmer rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#12121a] rounded-xl border border-[#1e1e2e]">
      {/* Rank */}
      <div className="w-6 h-5 shimmer rounded" />
      {/* Avatar */}
      <div className="w-9 h-9 shimmer rounded-full flex-shrink-0" />
      {/* Name + stats */}
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-28 shimmer rounded" />
        <div className="h-3 w-20 shimmer rounded" />
      </div>
      {/* Score */}
      <div className="h-5 w-14 shimmer rounded" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-20 h-20 shimmer rounded-full" />
        <div className="h-5 w-32 shimmer rounded" />
        <div className="h-3.5 w-48 shimmer rounded" />
      </div>
      {/* Stats row */}
      <div className="flex gap-3 justify-center">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center gap-1 bg-[#12121a] rounded-xl px-6 py-3 border border-[#1e1e2e]">
            <div className="h-5 w-12 shimmer rounded" />
            <div className="h-3 w-10 shimmer rounded" />
          </div>
        ))}
      </div>
      {/* Card list placeholder */}
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 shimmer rounded-xl" />
      ))}
    </div>
  );
}
