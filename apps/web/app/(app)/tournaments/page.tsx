'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Plus, X, ChevronRight } from 'lucide-react';
import { BackButton } from '../../../components/ui/BackButton';

type Tournament = {
  id: string;
  name: string;
  sport: string;
  status: 'open' | 'active' | 'complete';
  participants: string[];
  bracket: Record<string, string>;
  createdAt: string;
};

const SPORT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  nfl: { bg: 'rgba(5,150,105,0.15)', text: '#34d399', label: '🏈 NFL' },
  nba: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24', label: '🏀 NBA' },
  mlb: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', label: '⚾ MLB' },
  mixed: { bg: 'rgba(108,71,255,0.15)', text: '#a78bfa', label: '🎯 Mixed' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', label: 'Open' },
  active: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: '🔴 Active' },
  complete: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', label: 'Complete' },
};

// Placeholder battle data for the bracket visualization
const PLACEHOLDER_MATCHUPS = [
  { left: 'Mahomes', right: 'Brady', sport: 'nfl' },
  { left: 'Allen', right: 'Burrow', sport: 'nfl' },
  { left: 'Lamar', right: 'Hurts', sport: 'nfl' },
  { left: 'Herbert', right: 'Stroud', sport: 'nfl' },
];

function BracketMatchCard({
  left,
  right,
  round,
  winner,
  isWinner,
}: {
  left: string;
  right: string;
  round: string;
  winner?: string;
  isWinner?: boolean;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden border transition-all"
      style={{
        background: '#12121a',
        borderColor: isWinner ? 'rgba(108,71,255,0.5)' : '#1e1e2e',
        boxShadow: isWinner ? '0 0 12px rgba(108,71,255,0.2)' : 'none',
        minWidth: '130px',
      }}
    >
      <div className="px-2 py-0.5 border-b border-[#1e1e2e]">
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#374151]">{round}</span>
      </div>
      <div className="divide-y divide-[#1e1e2e]">
        <div
          className="px-3 py-2 flex items-center gap-2"
          style={{ background: winner === left ? 'rgba(108,71,255,0.1)' : 'transparent' }}
        >
          {winner === left && <div className="w-1.5 h-1.5 rounded-full bg-[#6c47ff] flex-shrink-0" />}
          <span
            className="text-xs font-bold truncate"
            style={{ color: winner === left ? '#a78bfa' : '#94a3b8' }}
          >
            {left}
          </span>
        </div>
        <div
          className="px-3 py-2 flex items-center gap-2"
          style={{ background: winner === right ? 'rgba(108,71,255,0.1)' : 'transparent' }}
        >
          {winner === right && <div className="w-1.5 h-1.5 rounded-full bg-[#6c47ff] flex-shrink-0" />}
          <span
            className="text-xs font-bold truncate"
            style={{ color: winner === right ? '#a78bfa' : '#94a3b8' }}
          >
            {right}
          </span>
        </div>
      </div>
    </div>
  );
}

function BracketView({ tournament }: { tournament: Tournament }) {
  // Build a visual 8-player single-elimination bracket
  // Round of 8 (4 matches) → Semis (2) → Final (1)
  const qf = PLACEHOLDER_MATCHUPS;
  const semis = [
    { left: 'Mahomes', right: 'Allen', winner: tournament.status === 'active' ? 'Mahomes' : undefined },
    { left: 'Lamar', right: 'Herbert', winner: tournament.status === 'active' ? 'Lamar' : undefined },
  ];
  const final = {
    left: 'Mahomes',
    right: 'Lamar',
    winner: tournament.status === 'complete' ? 'Mahomes' : undefined,
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-center gap-4 min-w-[520px] py-4">
        {/* Quarterfinals */}
        <div className="flex flex-col gap-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#374151] mb-1 text-center">
            Quarterfinals
          </div>
          {qf.map((m, i) => (
            <BracketMatchCard key={i} left={m.left} right={m.right} round="QF" />
          ))}
        </div>

        {/* Connector lines to semis */}
        <div className="flex flex-col justify-around h-full gap-0">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col justify-center" style={{ height: '128px' }}>
              <div className="flex items-center">
                <div className="w-4 border-t-2 border-[#1e1e2e]" />
                <ChevronRight size={12} className="text-[#374151]" />
              </div>
            </div>
          ))}
        </div>

        {/* Semifinals */}
        <div className="flex flex-col gap-16">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#374151] mb-1 text-center">
            Semifinals
          </div>
          {semis.map((m, i) => (
            <BracketMatchCard
              key={i}
              left={m.left}
              right={m.right}
              round="SF"
              winner={m.winner}
              isWinner={!!m.winner}
            />
          ))}
        </div>

        {/* Connector lines to final */}
        <div className="flex flex-col justify-center" style={{ height: '280px' }}>
          <div className="flex items-center">
            <div className="w-4 border-t-2 border-[#1e1e2e]" />
            <ChevronRight size={12} className="text-[#374151]" />
          </div>
        </div>

        {/* Final */}
        <div className="flex flex-col justify-center" style={{ height: '280px' }}>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#374151] mb-2 text-center">
              🏆 Final
            </div>
            <BracketMatchCard
              left={final.left}
              right={final.right}
              round="FINAL"
              winner={final.winner}
              isWinner={!!final.winner}
            />
            {final.winner && (
              <div className="mt-2 text-center">
                <span className="text-xs font-black" style={{ color: '#fbbf24' }}>
                  👑 Winner: {final.winner}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TournamentCard({
  tournament,
  onSelect,
  isSelected,
}: {
  tournament: Tournament;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const sport = SPORT_COLORS[tournament.sport] || SPORT_COLORS.mixed;
  const status = STATUS_STYLES[tournament.status] || STATUS_STYLES.open;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl border p-4 transition-all hover:border-[#6c47ff]/40"
      style={{
        background: isSelected ? 'rgba(108,71,255,0.08)' : '#12121a',
        borderColor: isSelected ? 'rgba(108,71,255,0.5)' : '#1e1e2e',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{tournament.name}</p>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            {new Date(tournament.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: sport.bg, color: sport.text }}
          >
            {sport.label}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>
      </div>
    </button>
  );
}

function CreateTournamentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [sport, setSport] = useState('nfl');

  const mutation = useMutation({
    mutationFn: async (data: { name: string; sport: string }) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cb_access_token') : null;
      const res = await fetch('http://localhost:8000/api/v1/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create tournament');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tournaments'] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[#1e1e2e] overflow-hidden"
        style={{ background: '#12121a' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-[#6c47ff]" />
            <h3 className="text-sm font-bold text-white">Create Tournament</h3>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block mb-1.5">
              Tournament Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NBA GOAT Bracket 2026"
              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#6c47ff]/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block mb-1.5">
              Sport
            </label>
            <div className="flex gap-2">
              {(['nfl', 'nba', 'mlb', 'mixed'] as const).map((s) => {
                const info = SPORT_COLORS[s];
                return (
                  <button
                    key={s}
                    onClick={() => setSport(s)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all border"
                    style={{
                      background: sport === s ? info.bg : 'transparent',
                      color: sport === s ? info.text : '#64748b',
                      borderColor: sport === s ? info.text + '40' : '#1e1e2e',
                    }}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => mutation.mutate({ name, sport })}
            disabled={!name.trim() || mutation.isPending}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', color: 'white' }}
          >
            {mutation.isPending ? 'Creating...' : 'Create Tournament'}
          </button>
          {mutation.isError && (
            <p className="text-xs text-[#ef4444] text-center">
              Log in to create a tournament
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery<{ tournaments: Tournament[] }>({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/api/v1/tournaments');
      if (!res.ok) throw new Error('Failed to fetch tournaments');
      return res.json();
    },
    staleTime: 30_000,
  });

  const tournaments = data?.tournaments ?? [];
  const selectedTournament = tournaments.find((t) => t.id === selectedId) || tournaments[0];

  return (
    <div className="space-y-4">
      <BackButton />
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden px-6 py-7 text-center"
        style={{
          background: 'linear-gradient(135deg, #0f0721 0%, #12121a 40%, #0a0a0f 100%)',
          border: '1px solid rgba(108, 71, 255, 0.2)',
        }}
      >
        <div className="relative">
          <h1 className="text-2xl font-black text-white mb-1 flex items-center justify-center gap-2">
            <Trophy size={24} className="text-[#fbbf24]" />
            Tournaments
          </h1>
          <p className="text-sm text-[#64748b]">
            Single-elimination brackets for the ultimate card showdown.
          </p>
        </div>
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', color: 'white' }}
        >
          <Plus size={15} />
          Create Tournament
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
          {/* Tournament list */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider px-1">
              All Tournaments ({tournaments.length})
            </h2>
            {tournaments.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                onSelect={() => setSelectedId(t.id)}
                isSelected={(selectedId ? selectedId === t.id : t === tournaments[0])}
              />
            ))}
          </div>

          {/* Bracket view */}
          {selectedTournament && (
            <div
              className="rounded-xl border border-[#1e1e2e] overflow-hidden"
              style={{ background: '#12121a' }}
            >
              <div className="px-4 py-3 border-b border-[#1e1e2e]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-white">{selectedTournament.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: (SPORT_COLORS[selectedTournament.sport] || SPORT_COLORS.mixed).bg,
                          color: (SPORT_COLORS[selectedTournament.sport] || SPORT_COLORS.mixed).text,
                        }}
                      >
                        {(SPORT_COLORS[selectedTournament.sport] || SPORT_COLORS.mixed).label}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: (STATUS_STYLES[selectedTournament.status] || STATUS_STYLES.open).bg,
                          color: (STATUS_STYLES[selectedTournament.status] || STATUS_STYLES.open).text,
                        }}
                      >
                        {(STATUS_STYLES[selectedTournament.status] || STATUS_STYLES.open).label}
                      </span>
                    </div>
                  </div>
                  <Trophy size={20} className="text-[#fbbf24] opacity-60" />
                </div>
              </div>

              <div className="p-4">
                {selectedTournament.status === 'open' && (
                  <div className="text-center py-8 text-[#64748b]">
                    <div className="text-4xl mb-3">🎯</div>
                    <p className="font-semibold text-white">Tournament is open for registration</p>
                    <p className="text-sm mt-1">Bracket will be revealed when it starts</p>
                  </div>
                )}
                {(selectedTournament.status === 'active' || selectedTournament.status === 'complete') && (
                  <BracketView tournament={selectedTournament} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateTournamentModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
