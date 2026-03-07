'use client';
import Link from 'next/link';
import { MilestonesFeed } from '../../../components/milestones/MilestonesFeed';

export default function MilestonesPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/community" className="text-[#64748b] hover:text-white transition-colors text-sm">
            ← Back
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">🏅 Community Milestones</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Celebrating achievements across the Card Battles community
          </p>
        </div>

        {/* Feed */}
        <MilestonesFeed />
      </div>
    </div>
  );
}
