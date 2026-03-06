'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fantasy, battles as battlesApi } from '../../../lib/api';
import type { League } from '../../../lib/api';
import type { FeedResponse } from '@card-battles/types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Trophy, Plus, X, Users, Zap, Crown, ChevronRight, Shield, CheckCircle, Swords } from 'lucide-react';

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: League['draftStatus'] }) {
  const map = {
    open:     { label: 'Open',     cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    drafting: { label: 'Drafting', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    active:   { label: 'Active',   cls: 'bg-[#6c47ff]/15 text-[#a78bfa] border-[#6c47ff]/30' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${cls}`}>{label}</span>
  );
}

// ── Pick slot ─────────────────────────────────────────────────────────────────
function PickSlots({ picks, max = 5 }: { picks: string[]; max?: number }) {
  return (
    <div className="flex gap-1 mt-2">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-6 h-8 rounded-md border flex items-center justify-center text-[8px] font-bold overflow-hidden ${
            i < picks.length
              ? 'border-[#6c47ff] bg-[#6c47ff]/20 text-[#a78bfa]'
              : 'border-[#1e1e2e] bg-[#12121a] text-[#374151]'
          }`}
        >
          {i < picks.length ? '✓' : '·'}
        </div>
      ))}
    </div>
  );
}

// ── League card ───────────────────────────────────────────────────────────────
function LeagueCard({
  league,
  joined,
  onJoin,
  onClick,
}: {
  league: League;
  joined: boolean;
  onJoin?: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4 cursor-pointer hover:border-[#6c47ff]/40 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-[#f59e0b] flex-shrink-0" />
            <h3 className="font-black text-white text-sm truncate">{league.name}</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#64748b]">
            <span className="flex items-center gap-1"><Users size={11}/> {league.members.length} member{league.members.length !== 1 ? 's' : ''}</span>
            <StatusBadge status={league.draftStatus} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!joined && onJoin && (
            <button
              onClick={e => { e.stopPropagation(); onJoin(); }}
              className="text-xs bg-[#6c47ff] text-white font-bold px-3 py-1.5 rounded-lg hover:bg-[#5a3de8] transition-colors"
            >
              Join
            </button>
          )}
          {joined && <CheckCircle size={16} className="text-green-400 flex-shrink-0" />}
          <ChevronRight size={16} className="text-[#374151]" />
        </div>
      </div>
    </div>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────────
function CreateLeagueModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const qc = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => fantasy.create(name.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fantasy-leagues'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4" onClick={onClose}>
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-[#f59e0b]" />
            <h3 className="font-black text-white">Create League</h3>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-white transition-colors"><X size={18}/></button>
        </div>
        <div>
          <label className="text-xs text-[#64748b] mb-1.5 block">League Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={40}
            placeholder="e.g. PSA 10 Dream Team"
            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]"
            onKeyDown={e => e.key === 'Enter' && name.trim() && mutate()}
          />
        </div>
        {error && <p className="text-xs text-red-400">{(error as { message?: string }).message}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#1e1e2e] text-[#64748b] text-sm font-semibold">Cancel</button>
          <button
            onClick={() => mutate()}
            disabled={isPending || !name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#6c47ff] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? <LoadingSpinner size="sm" /> : <><Plus size={14}/> Create</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Draft card modal ──────────────────────────────────────────────────────────
function DraftCardModal({ league, onClose }: { league: League; onClose: () => void }) {
  const qc = useQueryClient();
  const [pickedId, setPickedId] = useState<string | null>(null);

  const { data: feed } = useQuery({
    queryKey: ['battles-feed-draft'],
    queryFn: () => battlesApi.feed(),
  });

  const allCards = (feed as FeedResponse | undefined)?.items?.flatMap(b => [
    { id: b.left.assetId, name: b.left.playerName ?? b.left.title, img: b.left.imageUrl },
    { id: b.right.assetId, name: b.right.playerName ?? b.right.title, img: b.right.imageUrl },
  ]).filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i) ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (assetId: string) => fantasy.pick(league.id, assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fantasy-leagues'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={onClose}>
      <div
        className="flex-1 flex flex-col bg-[#0a0a0f] mt-16 rounded-t-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#6c47ff]" />
            <h3 className="font-black text-white">Draft a Card</h3>
            <span className="text-xs text-[#64748b]">for {league.name}</span>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-white"><X size={18}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <div className="grid grid-cols-2 gap-3">
            {allCards.map(card => (
              <button
                key={card.id}
                onClick={() => setPickedId(card.id)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                  pickedId === card.id ? 'border-[#6c47ff] scale-[1.02]' : 'border-[#1e1e2e] hover:border-[#374151]'
                }`}
              >
                <img src={card.img} alt={card.name} className="w-full aspect-[3/4] object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <p className="text-[10px] font-bold text-white truncate">{card.name}</p>
                </div>
                {pickedId === card.id && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#6c47ff] rounded-full flex items-center justify-center">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-[#1e1e2e]">
          <button
            onClick={() => pickedId && mutate(pickedId)}
            disabled={!pickedId || isPending}
            className="w-full py-3 rounded-xl bg-[#6c47ff] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isPending ? <LoadingSpinner size="sm" /> : <><Zap size={14}/> Draft Card</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── League detail view ────────────────────────────────────────────────────────
function LeagueDetail({ league, onBack }: { league: League; onBack: () => void }) {
  const [showDraft, setShowDraft] = useState(false);
  const qc = useQueryClient();

  const { data: feed } = useQuery({
    queryKey: ['battles-feed-draft'],
    queryFn: () => battlesApi.feed(),
  });

  const assetMap = Object.fromEntries(
    (feed as FeedResponse | undefined)?.items?.flatMap(b => [
      [b.left.assetId, { name: b.left.playerName ?? b.left.title, img: b.left.imageUrl }],
      [b.right.assetId, { name: b.right.playerName ?? b.right.title, img: b.right.imageUrl }],
    ]) ?? []
  );

  const myPicks = Object.values(league.picks).flat().length;
  const totalPicks = Object.values(league.picks).flat().length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-[#64748b] hover:text-white transition-colors">
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-white text-lg truncate">{league.name}</h1>
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <span>{league.members.length} members</span>
            <span>·</span>
            <StatusBadge status={league.draftStatus} />
            <span>·</span>
            <span>{totalPicks} picks total</span>
          </div>
        </div>
      </div>

      {/* Team picks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Team Picks</h2>
          <button
            onClick={() => setShowDraft(true)}
            className="text-xs bg-[#6c47ff] text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            <Zap size={11}/> Draft Card
          </button>
        </div>
        {Object.keys(league.picks).length === 0 ? (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 text-center">
            <Swords size={28} className="text-[#374151] mx-auto mb-2" />
            <p className="text-sm text-[#64748b]">No picks yet — be the first to draft!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(league.picks).map(([memberId, picks]) => (
              <div key={memberId} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={13} className="text-[#6c47ff]" />
                  <span className="text-xs font-bold text-white truncate">
                    {memberId === league.createdBy ? '👑 ' : ''}{memberId.slice(0, 8)}…
                  </span>
                  <span className="ml-auto text-[10px] text-[#64748b]">{picks.length}/5 picks</span>
                </div>
                <PickSlots picks={picks} />
                {picks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {picks.map((assetId, i) => {
                      const asset = assetMap[assetId];
                      return asset ? (
                        <div key={i} className="flex items-center gap-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1">
                          <img src={asset.img} alt={asset.name} className="w-5 h-7 object-cover rounded-sm" />
                          <span className="text-[10px] text-[#94a3b8] truncate max-w-[80px]">{asset.name}</span>
                        </div>
                      ) : (
                        <div key={i} className="text-[10px] text-[#374151] bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1">
                          {assetId.slice(0, 8)}…
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showDraft && (
        <DraftCardModal league={league} onClose={() => { setShowDraft(false); qc.invalidateQueries({ queryKey: ['fantasy-leagues'] }); }} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FantasyPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['fantasy-leagues'],
    queryFn: () => fantasy.leagues(),
    refetchInterval: 15000,
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => fantasy.join(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fantasy-leagues'] }),
  });

  if (selectedLeague) {
    // Find updated version from query data
    const updated = [...(data?.myLeagues ?? []), ...(data?.openLeagues ?? [])].find(l => l.id === selectedLeague.id) ?? selectedLeague;
    return (
      <div>
        <LeagueDetail league={updated} onBack={() => setSelectedLeague(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy size={22} className="text-[#f59e0b]" /> Fantasy
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">Draft card lineups · compete with friends</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#6c47ff] text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#6c47ff]/30"
        >
          <Plus size={15}/> Create
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-sm text-red-400">Failed to load leagues. Are you logged in?</p>
        </div>
      )}

      {data && (
        <>
          {/* My leagues */}
          <div>
            <h2 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Crown size={13} className="text-[#f59e0b]" /> My Leagues
              {data.myLeagues.length > 0 && <span className="text-[#6c47ff]">· {data.myLeagues.length}</span>}
            </h2>
            {data.myLeagues.length === 0 ? (
              <div className="bg-[#12121a] border border-[#1e1e2e] border-dashed rounded-2xl p-8 text-center">
                <Trophy size={32} className="text-[#374151] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#64748b] mb-1">No leagues yet</p>
                <p className="text-xs text-[#374151]">Create one or join an open league below</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 text-xs bg-[#6c47ff]/20 text-[#a78bfa] border border-[#6c47ff]/30 font-bold px-4 py-2 rounded-xl"
                >
                  + Create League
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.myLeagues.map(league => (
                  <LeagueCard
                    key={league.id}
                    league={league}
                    joined
                    onClick={() => setSelectedLeague(league)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Open leagues */}
          <div>
            <h2 className="text-xs font-semibold text-[#64748b] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap size={13} className="text-[#6c47ff]" /> Open Leagues
              {data.openLeagues.length > 0 && <span className="text-[#6c47ff]">· {data.openLeagues.length}</span>}
            </h2>
            {data.openLeagues.length === 0 ? (
              <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 text-center">
                <p className="text-sm text-[#64748b]">No open leagues to join right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.openLeagues.map(league => (
                  <LeagueCard
                    key={league.id}
                    league={league}
                    joined={false}
                    onJoin={() => joinMutation.mutate(league.id)}
                    onClick={() => setSelectedLeague(league)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="bg-gradient-to-br from-[#6c47ff]/10 to-[#a855f7]/5 border border-[#6c47ff]/20 rounded-2xl p-4">
            <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
              <Zap size={14} className="text-[#6c47ff]" /> How Fantasy Works
            </h3>
            <ol className="space-y-2">
              {[
                'Create or join a league',
                'Draft up to 5 battle cards',
                'Your cards earn points as battles resolve',
                'Most points at end of season wins 🏆',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-[#94a3b8]">
                  <span className="w-5 h-5 rounded-full bg-[#6c47ff]/20 text-[#a78bfa] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {showCreate && <CreateLeagueModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
