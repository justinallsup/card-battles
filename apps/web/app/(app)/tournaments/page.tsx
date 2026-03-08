'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Plus, X, ChevronRight, Search, Check } from 'lucide-react';
import { BackButton } from '../../../components/ui/BackButton';
import { showToast } from '../../../components/ui/Toast';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3333/api/v1');

type Tournament = { id: string; name: string; sport: string; status: 'open'|'active'|'complete'; participants: string[]; bracket: Record<string,string>; createdAt: string; type?: string; };
type Participant = { username: string; cardName: string; seeded: number; };
type MatchupData = { left: string; right: string; leftCard: string; rightCard: string; leftRecord?: string; rightRecord?: string; winner?: string; };

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
const TYPE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  single_elimination: { label: '🏆 Single Elimination', bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
  round_robin: { label: '🔄 Round Robin', bg: 'rgba(96,165,250,0.12)', text: '#60a5fa' },
  lightning: { label: '⚡ Lightning', bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
};
const PRIZES = [
  { place: '🥇 1st', prize: 'Pro Subscription (1 year)', color: '#fbbf24' },
  { place: '🥈 2nd', prize: 'Card Battles Swag Pack', color: '#94a3b8' },
  { place: '🥉 3rd', prize: 'Profile Badge', color: '#f97316' },
];

const QF_MATCHUPS: MatchupData[] = [
  { left: 'cardking', right: 'packripper', leftCard: "Mahomes '17 Prizm", rightCard: "Brady '00 Bowman", leftRecord: '3-0', rightRecord: '2-1', winner: 'cardking' },
  { left: 'slabmaster', right: 'gradegod', leftCard: "Allen '18 Prizm Auto", rightCard: "LeBron '03 Chrome", leftRecord: '2-1', rightRecord: '2-1' },
  { left: 'rookiehunter', right: 'user5', leftCard: "Wemby '23 Prizm Auto", rightCard: "Luka '18 Prizm", leftRecord: '3-0', rightRecord: '1-2', winner: 'rookiehunter' },
  { left: 'TBD', right: 'TBD', leftCard: 'TBD', rightCard: 'TBD', leftRecord: '-', rightRecord: '-' },
];
const SF_MATCHUPS: MatchupData[] = [
  { left: 'cardking', right: 'TBD', leftCard: "Mahomes '17 Prizm", rightCard: 'TBD' },
  { left: 'rookiehunter', right: 'TBD', leftCard: "Wemby '23 Prizm Auto", rightCard: 'TBD' },
];
const FINAL_MATCHUP: MatchupData = { left: 'TBD', right: 'TBD', leftCard: 'TBD', rightCard: 'TBD' };

function BracketSlot({ username, cardName, record, winner, isTBD }: { username: string; cardName: string; record?: string; winner?: boolean; isTBD?: boolean }) {
  return (
    <div className="px-3 py-2 flex items-center gap-2" style={{ background: winner ? 'rgba(108,71,255,0.12)' : 'transparent' }}>
      {winner && <div className="w-1.5 h-1.5 rounded-full bg-[#6c47ff] flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold truncate" style={{ color: isTBD ? '#374151' : winner ? '#a78bfa' : '#94a3b8' }}>{isTBD ? 'TBD' : username}</p>
        {!isTBD && <p className="text-[9px] text-[#475569] truncate">{cardName}</p>}
      </div>
      {record && !isTBD && <span className="text-[9px] text-[#475569] flex-shrink-0">{record}</span>}
    </div>
  );
}

function BracketMatchCard({ round, matchup, isActive }: { round: string; matchup: MatchupData; isActive?: boolean }) {
  return (
    <div className="rounded-xl overflow-hidden border transition-all" style={{ background: '#12121a', borderColor: isActive ? 'rgba(108,71,255,0.5)' : '#1e1e2e', boxShadow: isActive ? '0 0 12px rgba(108,71,255,0.2)' : 'none', minWidth: 160 }}>
      <div className="px-2 py-0.5 border-b border-[#1e1e2e]"><span className="text-[9px] font-bold uppercase tracking-widest text-[#374151]">{round}</span></div>
      <div className="divide-y divide-[#1e1e2e]">
        <BracketSlot username={matchup.left} cardName={matchup.leftCard} record={matchup.leftRecord} winner={!!matchup.winner && matchup.winner === matchup.left && matchup.left !== 'TBD'} isTBD={matchup.left === 'TBD'} />
        <BracketSlot username={matchup.right} cardName={matchup.rightCard} record={matchup.rightRecord} winner={!!matchup.winner && matchup.winner === matchup.right && matchup.right !== 'TBD'} isTBD={matchup.right === 'TBD'} />
      </div>
    </div>
  );
}

function BracketView({ tournament }: { tournament: Tournament }) {
  const isComplete = tournament.status === 'complete';
  const finalData: MatchupData = isComplete
    ? { left: 'cardking', right: 'rookiehunter', leftCard: "Mahomes '17 Prizm", rightCard: "Wemby '23 Prizm Auto", winner: 'cardking' }
    : FINAL_MATCHUP;
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start gap-4 min-w-[580px] py-4">
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#374151] mb-1 text-center">Quarterfinals</div>
          {QF_MATCHUPS.map((m, i) => <BracketMatchCard key={i} round="QF" matchup={m} isActive={!!m.winner} />)}
        </div>
        <div className="flex flex-col justify-around pt-8" style={{ height: 370 }}>
          {[0,1].map(i => <div key={i} className="flex items-center" style={{ height: 80 }}><div className="w-4 border-t-2 border-[#1e1e2e]" /><ChevronRight size={12} className="text-[#374151]" /></div>)}
        </div>
        <div className="flex flex-col gap-20 pt-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#374151] mb-1 text-center">Semifinals</div>
          {SF_MATCHUPS.map((m, i) => <BracketMatchCard key={i} round="SF" matchup={m} />)}
        </div>
        <div className="flex items-center" style={{ marginTop: 90 }}><div className="w-4 border-t-2 border-[#1e1e2e]" /><ChevronRight size={12} className="text-[#374151]" /></div>
        <div style={{ marginTop: 70 }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#374151] mb-2 text-center">🏆 Final</div>
          <BracketMatchCard round="FINAL" matchup={finalData} isActive={!!finalData.winner} />
          {finalData.winner && <div className="mt-2 text-center"><span className="text-xs font-black" style={{ color: '#fbbf24' }}>👑 Champion: {finalData.winner}</span></div>}
        </div>
      </div>
    </div>
  );
}

function EnterTournamentModal({ tournamentId, onClose }: { tournamentId: string; onClose: () => void }) {
  const [cardSearch, setCardSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(false);
  const SAMPLE_CARDS = ['Patrick Mahomes 2017 Prizm RC PSA 10','Tom Brady 2000 Bowman Chrome RC','LeBron James 2003 Topps Chrome RC','Victor Wembanyama 2023 Prizm Auto','Luka Doncic 2018 Prizm RC','Josh Allen 2018 Prizm Rookie Auto','Shohei Ohtani 2018 Topps RC','Caitlin Clark 2024 Parkside Auto'];
  const filtered = cardSearch ? SAMPLE_CARDS.filter(c => c.toLowerCase().includes(cardSearch.toLowerCase())) : SAMPLE_CARDS;
  const handleEnter = async () => {
    if (!selectedCard) return;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('cb_token') : null;
    await fetch(`${API}/tournaments/${tournamentId}/enter`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token||''}` }, body: JSON.stringify({ cardId: selectedCard }) }).catch(()=>{});
    setLoading(false); setEntered(true);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2"><Trophy size={15} className="text-[#fbbf24]" /><h3 className="text-sm font-bold text-white">Enter Tournament</h3></div>
          <button onClick={onClose} className="text-[#64748b] hover:text-white"><X size={16} /></button>
        </div>
        {entered ? (
          <div className="p-8 text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <p className="text-lg font-black text-white">You&apos;re entered!</p>
            <p className="text-sm text-[#94a3b8]"><span className="text-[#a78bfa] font-semibold">{selectedCard}</span> has been registered.</p>
            <p className="text-xs text-[#475569]">Good luck in the tournament!</p>
            <button onClick={onClose} className="mt-2 w-full py-2.5 rounded-xl bg-[#6c47ff] text-white text-sm font-bold">Close</button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <p className="text-xs text-[#94a3b8]">Pick which card to enter:</p>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
              <input value={cardSearch} onChange={e=>setCardSearch(e.target.value)} placeholder="Search your cards..." className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]" />
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filtered.map(card => (
                <button key={card} onClick={()=>setSelectedCard(card)} className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all border" style={selectedCard===card?{background:'rgba(108,71,255,0.15)',borderColor:'#6c47ff',color:'#a78bfa'}:{background:'#0a0a0f',borderColor:'#1e1e2e',color:'#94a3b8'}}>
                  <div className="flex items-center justify-between"><span className="truncate">{card}</span>{selectedCard===card&&<Check size={13} className="flex-shrink-0 ml-2" />}</div>
                </button>
              ))}
            </div>
            <button onClick={handleEnter} disabled={!selectedCard||loading} className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', color: 'white' }}>
              {loading ? 'Entering...' : selectedCard ? 'Confirm Entry' : 'Select a card first'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantsPanel({ tournamentId }: { tournamentId: string }) {
  const { data } = useQuery<{ participants: Participant[]; total: number }>({
    queryKey: ['tournament-participants', tournamentId],
    queryFn: async () => { const res = await fetch(`${API}/tournaments/${tournamentId}/participants`); return res.json(); },
    staleTime: 30_000,
  });
  const participants = data?.participants ?? [];
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Participants ({participants.length})</p>
      {participants.map((p, i) => (
        <div key={p.username} className="flex items-center gap-3 p-3 rounded-xl border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: i===0?'rgba(251,191,36,0.2)':'rgba(108,71,255,0.15)', color: i===0?'#fbbf24':'#a78bfa' }}>{p.seeded}</div>
          <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white">@{p.username}</p><p className="text-[10px] text-[#475569] truncate">{p.cardName}</p></div>
          {i===0&&<span className="text-[10px] text-[#fbbf24]">👑 #1 Seed</span>}
        </div>
      ))}
    </div>
  );
}

function TournamentCard({ tournament, onSelect, isSelected }: { tournament: Tournament&{type?:string}; onSelect: ()=>void; isSelected: boolean }) {
  const sport = SPORT_COLORS[tournament.sport]||SPORT_COLORS.mixed;
  const status = STATUS_STYLES[tournament.status]||STATUS_STYLES.open;
  const typeKey = tournament.type||'single_elimination';
  const typeBadge = TYPE_BADGES[typeKey]||TYPE_BADGES.single_elimination;
  return (
    <button onClick={onSelect} className="w-full text-left rounded-xl border p-4 transition-all hover:border-[#6c47ff]/40" style={{ background: isSelected?'rgba(108,71,255,0.08)':'#12121a', borderColor: isSelected?'rgba(108,71,255,0.5)':'#1e1e2e' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0"><p className="font-bold text-white text-sm truncate">{tournament.name}</p><p className="text-[11px] text-[#64748b] mt-0.5">{new Date(tournament.createdAt).toLocaleDateString()}</p></div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sport.bg, color: sport.text }}>{sport.label}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.text }}>{status.label}</span>
        </div>
      </div>
      <div className="mt-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: typeBadge.bg, color: typeBadge.text }}>{typeBadge.label}</span></div>
    </button>
  );
}

function CreateTournamentModal({ onClose }: { onClose: ()=>void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [sport, setSport] = useState('nfl');
  const [type, setType] = useState('single_elimination');
  const mutation = useMutation({
    mutationFn: async (data: { name:string; sport:string; type:string }) => {
      const token = typeof window!=='undefined'?localStorage.getItem('cb_token'):null;
      const res = await fetch(`${API}/tournaments`, { method:'POST', headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})}, body:JSON.stringify(data) });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: ()=>{ qc.invalidateQueries({queryKey:['tournaments']}); showToast('Tournament created! 🏆','success'); onClose(); },
    onError: ()=>showToast('Log in to create a tournament','error'),
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2"><Trophy size={15} className="text-[#6c47ff]" /><h3 className="text-sm font-bold text-white">Create Tournament</h3></div>
          <button onClick={onClose} className="text-[#64748b] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div><label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block mb-1.5">Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. NBA GOAT Bracket 2026" className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#6c47ff]/50" /></div>
          <div><label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block mb-1.5">Format</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(TYPE_BADGES).map(([key, info]) => <button key={key} onClick={()=>setType(key)} className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all border" style={type===key?{background:info.bg,color:info.text,borderColor:info.text+'60'}:{background:'transparent',color:'#64748b',borderColor:'#1e1e2e'}}>{info.label}</button>)}
            </div>
          </div>
          <div><label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block mb-1.5">Sport</label>
            <div className="flex gap-2">
              {(['nfl','nba','mlb','mixed'] as const).map(s => { const info=SPORT_COLORS[s]; return <button key={s} onClick={()=>setSport(s)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all border" style={sport===s?{background:info.bg,color:info.text,borderColor:info.text+'40'}:{background:'transparent',color:'#64748b',borderColor:'#1e1e2e'}}>{info.label}</button>; })}
            </div>
          </div>
          <button onClick={()=>mutation.mutate({name,sport,type})} disabled={!name.trim()||mutation.isPending} className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50" style={{ background:'linear-gradient(135deg,#6c47ff,#8b5cf6)',color:'white' }}>
            {mutation.isPending?'Creating...':'Create Tournament'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEnter, setShowEnter] = useState(false);
  const [activeTab, setActiveTab] = useState<'bracket'|'participants'|'prizes'>('bracket');

  const { data, isLoading } = useQuery<{ tournaments: Tournament[] }>({
    queryKey: ['tournaments'],
    queryFn: async () => { const res = await fetch(`${API}/tournaments`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 30_000,
  });

  const tournaments = data?.tournaments ?? [];
  const typedTournaments = tournaments.map((t, i) => ({ ...t, type: (['single_elimination','round_robin','lightning'] as const)[i%3] }));
  const typedSelected = typedTournaments.find(t=>t.id===(selectedId||typedTournaments[0]?.id))||typedTournaments[0];

  const tabStyle = (tab: string) => activeTab===tab
    ? { color:'#a78bfa', borderBottom:'2px solid #6c47ff', background:'rgba(108,71,255,0.08)' }
    : { color:'#64748b' };

  return (
    <div className="space-y-4">
      <BackButton />
      <div className="relative rounded-2xl overflow-hidden px-6 py-7 text-center" style={{ background:'linear-gradient(135deg,#0f0721 0%,#12121a 40%,#0a0a0f 100%)',border:'1px solid rgba(108,71,255,0.2)' }}>
        <h1 className="text-2xl font-black text-white mb-1 flex items-center justify-center gap-2"><Trophy size={24} className="text-[#fbbf24]" /> Tournaments</h1>
        <p className="text-sm text-[#64748b]">Bracket battles for the ultimate card showdown.</p>
      </div>

      <div className="flex justify-end">
        <button onClick={()=>setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background:'linear-gradient(135deg,#6c47ff,#8b5cf6)',color:'white' }}>
          <Plus size={15} /> Create Tournament
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider px-1">All Tournaments ({typedTournaments.length})</h2>
            {typedTournaments.map(t => (
              <TournamentCard key={t.id} tournament={t} onSelect={()=>{setSelectedId(t.id);setActiveTab('bracket');}} isSelected={selectedId?selectedId===t.id:t===typedTournaments[0]} />
            ))}
          </div>

          {typedSelected && (
            <div className="rounded-xl border border-[#1e1e2e] overflow-hidden" style={{ background:'#12121a' }}>
              <div className="px-4 py-3 border-b border-[#1e1e2e]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-black text-white">{typedSelected.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:(SPORT_COLORS[typedSelected.sport]||SPORT_COLORS.mixed).bg, color:(SPORT_COLORS[typedSelected.sport]||SPORT_COLORS.mixed).text }}>{(SPORT_COLORS[typedSelected.sport]||SPORT_COLORS.mixed).label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:(STATUS_STYLES[typedSelected.status]||STATUS_STYLES.open).bg, color:(STATUS_STYLES[typedSelected.status]||STATUS_STYLES.open).text }}>{(STATUS_STYLES[typedSelected.status]||STATUS_STYLES.open).label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:(TYPE_BADGES[typedSelected.type||'single_elimination']||TYPE_BADGES.single_elimination).bg, color:(TYPE_BADGES[typedSelected.type||'single_elimination']||TYPE_BADGES.single_elimination).text }}>{(TYPE_BADGES[typedSelected.type||'single_elimination']||TYPE_BADGES.single_elimination).label}</span>
                    </div>
                  </div>
                  <button onClick={()=>setShowEnter(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0" style={{ background:'linear-gradient(135deg,#6c47ff,#8b5cf6)',color:'white' }}>
                    <Trophy size={12} /> Enter
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#1e1e2e]">
                {(['bracket','participants','prizes'] as const).map(tab => (
                  <button key={tab} onClick={()=>setActiveTab(tab)} className="flex-1 py-2 text-xs font-bold transition-all" style={tabStyle(tab)}>
                    {tab==='bracket'?'🏆 Bracket':tab==='participants'?'👥 Players':'🎁 Prizes'}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab==='bracket' && (
                  <>
                    {typedSelected.status==='open' && (
                      <div className="text-center py-8 text-[#64748b]">
                        <div className="text-4xl mb-3">🎯</div>
                        <p className="font-semibold text-white">Tournament is open for registration</p>
                        <p className="text-sm mt-1">Bracket will be revealed when it starts</p>
                        <button onClick={()=>setShowEnter(true)} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background:'linear-gradient(135deg,#6c47ff,#8b5cf6)',color:'white' }}>Enter Now</button>
                      </div>
                    )}                    {(typedSelected.status==='active'||typedSelected.status==='complete') && <BracketView tournament={typedSelected} />}
                  </>
                )}

                {activeTab==='participants' && <ParticipantsPanel tournamentId={typedSelected.id} />}

                {activeTab==='prizes' && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Tournament Prizes</p>
                    {PRIZES.map(p => (
                      <div key={p.place} className="flex items-center gap-3 p-3 rounded-xl border border-[#1e1e2e]" style={{ background:'#0a0a0f' }}>
                        <span className="text-2xl">{p.place.split(' ')[0]}</span>
                        <div className="flex-1">
                          <p className="text-xs font-bold" style={{ color:p.color }}>{p.place}</p>
                          <p className="text-sm text-white font-semibold">{p.prize}</p>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-[#374151] text-center mt-4">Prizes awarded after tournament completion (Demo)</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateTournamentModal onClose={()=>setShowCreate(false)} />}
      {showEnter && typedSelected && <EnterTournamentModal tournamentId={typedSelected.id} onClose={()=>setShowEnter(false)} />}
    </div>
  );
}
