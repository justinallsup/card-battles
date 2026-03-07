'use client';
import { useState, useEffect } from 'react';
import { getToken } from '../../../lib/api';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { BackButton } from '../../../components/ui/BackButton';
import { History, Clock, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface VoteRow {
  category: string;
  choice: string;
  voted_at: string;
  battle_id: string;
  title: string;
  status: string;
  total_votes_cached: number;
  ends_at: string;
  result: unknown;
  left_img: string;
  left_player: string;
  right_img: string;
  right_player: string;
}

interface BattleGroup {
  battle_id: string;
  title: string;
  status: string;
  total_votes_cached: number;
  ends_at: string;
  result: unknown;
  left_img: string;
  left_player: string;
  right_img: string;
  right_player: string;
  votes: { category: string; choice: string; voted_at: string }[];
  latestVotedAt: string;
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

function formatTimeRemaining(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return `Ends in ${d}d`;
  if (h > 0) return `Ends in ${h}h`;
  const m = Math.floor(diff / 60_000);
  return `Ends in ${m}m`;
}

function BattleHistoryCard({ group }: { group: BattleGroup }) {
  const isLive = group.status === 'live';
  const hasEnded = !isLive;

  return (
    <Link href={`/battles/${group.battle_id}`} className="block">
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4 space-y-3 hover:border-[#6c47ff]/30 transition-all">
        {/* Card previews + title */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-10 h-14 rounded-lg overflow-hidden border border-[#252535]">
              <img
                src={group.left_img}
                alt={group.left_player}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    `https://placehold.co/80x112/12121a/6c47ff?text=${encodeURIComponent(group.left_player?.[0] ?? '?')}`;
                }}
              />
            </div>
            <div className="text-[#6c47ff] text-xs font-bold">VS</div>
            <div className="w-10 h-14 rounded-lg overflow-hidden border border-[#252535]">
              <img
                src={group.right_img}
                alt={group.right_player}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    `https://placehold.co/80x112/12121a/6c47ff?text=${encodeURIComponent(group.right_player?.[0] ?? '?')}`;
                }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">{group.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isLive ? 'bg-green-500/10 text-green-400' : 'bg-[#1e1e2e] text-[#64748b]'}`}>
                {isLive ? '🟢 Live' : '⚡ Ended'}
              </span>
              <span className="text-[10px] text-[#64748b]">
                {hasEnded ? formatTimeAgo(group.ends_at) : formatTimeRemaining(group.ends_at)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-[#64748b]">
              <Users size={10} />
              <span>{group.total_votes_cached?.toLocaleString() ?? 0} votes</span>
            </div>
          </div>

          <ArrowRight size={14} className="text-[#374151] flex-shrink-0 mt-1" />
        </div>

        {/* Votes cast */}
        <div className="border-t border-[#1e1e2e] pt-3">
          <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-semibold mb-2">Your votes</p>
          <div className="flex flex-wrap gap-1.5">
            {group.votes.map((v) => (
              <div
                key={v.category}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border"
                style={{
                  background: v.choice === 'left' ? 'rgba(108,71,255,0.1)' : 'rgba(239,68,68,0.1)',
                  borderColor: v.choice === 'left' ? 'rgba(108,71,255,0.3)' : 'rgba(239,68,68,0.3)',
                  color: v.choice === 'left' ? '#a78bfa' : '#f87171',
                }}
              >
                <span>{v.choice === 'left' ? group.left_player : group.right_player}</span>
                <span className="text-[#374151]">in</span>
                <span className="capitalize text-[#94a3b8]">{v.category}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#374151] mt-1.5 flex items-center gap-1">
            <Clock size={9} />
            Voted {formatTimeAgo(group.latestVotedAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function VoteHistoryPage() {
  const [groups, setGroups] = useState<BattleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Please log in to view your vote history.');
      setLoading(false);
      return;
    }

    fetch(`${BASE_URL}/me/vote-history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const votes: VoteRow[] = data.votes ?? [];
        // Group by battle
        const map = new Map<string, BattleGroup>();
        for (const v of votes) {
          if (!map.has(v.battle_id)) {
            map.set(v.battle_id, {
              battle_id: v.battle_id,
              title: v.title,
              status: v.status,
              total_votes_cached: v.total_votes_cached,
              ends_at: v.ends_at,
              result: v.result,
              left_img: v.left_img,
              left_player: v.left_player,
              right_img: v.right_img,
              right_player: v.right_player,
              votes: [],
              latestVotedAt: v.voted_at,
            });
          }
          const group = map.get(v.battle_id)!;
          group.votes.push({ category: v.category, choice: v.choice, voted_at: v.voted_at });
          if (new Date(v.voted_at) > new Date(group.latestVotedAt)) {
            group.latestVotedAt = v.voted_at;
          }
        }
        setGroups(Array.from(map.values()));
      })
      .catch(() => setError('Failed to load vote history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 pb-2">
      <BackButton />
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#6c47ff]/10 border border-[#6c47ff]/20 flex items-center justify-center">
          <History size={18} className="text-[#6c47ff]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Vote History</h1>
          <p className="text-xs text-[#64748b]">Battles you&apos;ve participated in</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      ) : error ? (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 text-center space-y-3">
          <p className="text-3xl">🔐</p>
          <p className="text-white font-bold">{error}</p>
          <Link href="/login" className="inline-block px-4 py-2 bg-[#6c47ff] text-white text-sm font-bold rounded-xl">
            Log In
          </Link>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-10 text-center space-y-3">
          <p className="text-4xl">🗳️</p>
          <p className="text-white font-bold text-lg">No votes yet</p>
          <p className="text-[#64748b] text-sm">You haven&apos;t voted on any battles yet — head to the feed!</p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6c47ff] text-white text-sm font-bold rounded-xl hover:bg-[#5a38e0] transition-colors mt-2"
          >
            Go to Feed <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#64748b]">
            {groups.length} battle{groups.length !== 1 ? 's' : ''} voted on
          </p>
          <div className="space-y-3">
            {groups.map((group) => (
              <BattleHistoryCard key={group.battle_id} group={group} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
