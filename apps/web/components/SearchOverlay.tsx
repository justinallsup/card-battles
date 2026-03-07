'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Swords, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{battles:unknown[];players:unknown[]}>({battles:[], players:[]});
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults({battles:[], players:[]}); return; }
    const t = setTimeout(async () => {
      const [br, pr] = await Promise.all([
        fetch(`${API}/battles/search?q=${encodeURIComponent(query)}&limit=3`).then(r => r.json()).catch(() => ({items:[]})),
        fetch(`${API}/players?q=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => ({players:[]})),
      ]);
      setResults({ battles: (br as {items:unknown[]}).items || [], players: (pr as {players:unknown[]}).players?.slice(0,3) || [] });
    }, 200);
    return () => clearTimeout(t);
  }, [query, API]);

  if (!open) return (
    <button onClick={() => setOpen(true)} aria-label="Search (⌘K)" className="p-2 text-[#64748b] hover:text-white transition-colors">
      <Search size={18} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 border-b border-[#1e1e2e]">
          <Search size={18} className="text-[#64748b]" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search battles, players..." className="flex-1 bg-transparent text-white placeholder:text-[#475569] outline-none text-sm" />
          <button onClick={() => setOpen(false)} className="text-[#64748b] hover:text-white"><X size={16} /></button>
        </div>
        {(results.battles.length > 0 || results.players.length > 0) ? (
          <div className="p-2 max-h-80 overflow-y-auto">
            {results.battles.length > 0 && <>
              <div className="px-2 py-1 text-xs text-[#475569] font-semibold uppercase">Battles</div>
              {(results.battles as {id:string;title:string;totalVotesCached:number}[]).map(b => (
                <button key={b.id} onClick={() => { router.push(`/battles/${b.id}`); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#1e1e2e] text-left">
                  <Swords size={14} className="text-[#6c47ff] shrink-0" />
                  <span className="text-sm text-white truncate">{b.title}</span>
                  <span className="text-xs text-[#64748b] ml-auto shrink-0">{b.totalVotesCached} votes</span>
                </button>
              ))}
            </>}
            {results.players.length > 0 && <>
              <div className="px-2 py-1 text-xs text-[#475569] font-semibold uppercase mt-2">Players</div>
              {(results.players as {player_name:string;sport:string}[]).map((p, i) => (
                <button key={i} onClick={() => { router.push(`/players/${encodeURIComponent(p.player_name)}`); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#1e1e2e] text-left">
                  <User size={14} className="text-[#64748b] shrink-0" />
                  <span className="text-sm text-white">{p.player_name}</span>
                  <span className="text-xs text-[#64748b] ml-auto">{p.sport?.toUpperCase()}</span>
                </button>
              ))}
            </>}
          </div>
        ) : query ? (
          <div className="p-6 text-center text-sm text-[#475569]">No results for &ldquo;{query}&rdquo;</div>
        ) : (
          <div className="p-4 text-xs text-[#475569]">
            <div className="mb-2">Quick links:</div>
            {([['⚡ Blitz Battles','/blitz'],['🏛️ Hall of Fame','/hall-of-fame'],['📈 Market','/market'],['🏆 Leaderboard','/leaderboards']] as [string,string][]).map(([label, href]) => (
              <button key={href} onClick={() => { router.push(href); setOpen(false); setQuery(''); }}
                className="block w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#1e1e2e] text-[#94a3b8] hover:text-white transition-colors">
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="px-4 py-2 border-t border-[#1e1e2e] text-xs text-[#374151] flex justify-between">
          <span>⌘K to open</span><span>↵ to select · Esc to close</span>
        </div>
      </div>
    </div>
  );
}
