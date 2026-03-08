'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { X, Image as ImageIcon, Swords, Upload, Link, Search, FileText, BookOpen, LayoutTemplate } from 'lucide-react';
import { getToken } from '../../../lib/api';
import { showToast } from '../../../components/ui/Toast';

const SPORTS = ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'other'];

const CATEGORIES = [
  { id: 'investment', label: 'Investment', emoji: '💰', description: 'Which will be worth more in 5 years?' },
  { id: 'coolest', label: 'Coolest', emoji: '😎', description: 'Which has the better look and design?' },
  { id: 'rarity', label: 'Rarity', emoji: '💎', description: 'Which is harder to find in top grade?' },
  { id: 'rookie', label: 'Rookie Impact', emoji: '⭐', description: 'Which rookie had more impact?' },
  { id: 'goat', label: 'GOAT Factor', emoji: '🐐', description: 'Which is more legendary overall?' },
  { id: 'nostalgia', label: 'Nostalgia', emoji: '🎞️', description: 'Which brings back more memories?' },
  { id: 'condition', label: 'Condition', emoji: '🔍', description: 'Which is in better condition?' },
  { id: 'pop', label: 'Pop Culture', emoji: '🌟', description: 'Which player has more cultural impact?' },
];

const DURATIONS = [
  { label: '24h', value: 86400 },
  { label: '48h', value: 172800 },
  { label: '72h', value: 259200 },
];

type InputMode = 'url' | 'upload' | 'search';

interface CardSearchResult {
  id: string;
  title: string;
  image_url: string;
  player_name: string;
  year: number;
  sport: string;
}

interface CardInput {
  imageUrl: string;
  imageBase64: string;
  mimeType: string;
  previewSrc: string;   // for displaying (either URL or data URL)
  title: string;
  playerName: string;
  sport: string;
  year?: string;
  setName?: string;
  variant?: string;
  grade?: string;
  certNumber?: string;
  mode: InputMode;
  existingAssetId?: string; // if selected from search
}

const emptyCard = (): CardInput => ({
  imageUrl: '',
  imageBase64: '',
  mimeType: '',
  previewSrc: '',
  title: '',
  playerName: '',
  sport: 'nfl',
  year: '',
  setName: '',
  variant: '',
  grade: '',
  certNumber: '',
  mode: 'url',
});

function CardSlot({
  label,
  card,
  onChange,
}: {
  label: string;
  card: CardInput;
  onChange: (c: CardInput) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CardSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const BASE_URL_SEARCH = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3333/api/v1');

  const clearImage = () => onChange({ ...card, imageUrl: '', imageBase64: '', mimeType: '', previewSrc: '', existingAssetId: undefined });

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (card.mode === 'upload') setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (card.mode !== 'upload') return;
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      onChange({
        ...card,
        imageBase64: b64.split(',')[1] || '',
        mimeType: file.type,
        previewSrc: b64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleUrlChange = (url: string) => {
    onChange({ ...card, imageUrl: url, previewSrc: url, imageBase64: '', mimeType: '', existingAssetId: undefined });
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE_URL_SEARCH}/cards/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchResults(data.cards || []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
  };

  const handleSelectCard = (result: CardSearchResult) => {
    onChange({
      ...card,
      imageUrl: result.image_url,
      previewSrc: result.image_url,
      imageBase64: '',
      mimeType: '',
      title: result.title,
      playerName: result.player_name || '',
      sport: result.sport || 'nfl',
      existingAssetId: result.id,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="flex-1 space-y-3">
      <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest">{label}</p>

      {/* Preview */}
      <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-[#1e1e2e] overflow-hidden bg-[#0d0d18] flex items-center justify-center relative">
        {card.previewSrc ? (
          <>
            <img src={card.previewSrc} alt={card.title || `${label} card preview`} className="w-full h-full object-cover" />
            <button
              onClick={clearImage}
              aria-label="Remove image"
              className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <div
            className="text-center text-[#374151] cursor-pointer w-full h-full flex flex-col items-center justify-center"
            onClick={() => card.mode === 'upload' && fileInputRef.current?.click()}
          >
            <ImageIcon size={28} className="mx-auto mb-2" />
            <p className="text-xs">{card.mode === 'url' ? 'Paste URL below' : card.mode === 'search' ? 'Search below' : 'Click to upload'}</p>
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-[#0a0a0f] rounded-lg p-1 border border-[#1e1e2e]">
        <button
          onClick={() => onChange({ ...card, mode: 'url' })}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold transition-all ${
            card.mode === 'url' ? 'bg-[#6c47ff]/20 text-[#6c47ff]' : 'text-[#64748b]'
          }`}
        >
          <Link size={11} /> URL
        </button>
        <button
          onClick={() => onChange({ ...card, mode: 'upload' })}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold transition-all ${
            card.mode === 'upload' ? 'bg-[#6c47ff]/20 text-[#6c47ff]' : 'text-[#64748b]'
          }`}
        >
          <Upload size={11} /> Upload
        </button>
        <button
          onClick={() => onChange({ ...card, mode: 'search' })}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold transition-all ${
            card.mode === 'search' ? 'bg-[#6c47ff]/20 text-[#6c47ff]' : 'text-[#64748b]'
          }`}
        >
          <Search size={11} /> Search
        </button>
      </div>

      {/* URL input or file input or search */}
      {card.mode === 'url' ? (
        <input
          type="url"
          placeholder="Image URL (https://...)"
          value={card.imageUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
        />
      ) : card.mode === 'upload' ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-[#12121a] border border-[#1e1e2e] border-dashed rounded-lg px-3 py-2 text-xs text-[#64748b] flex items-center justify-center gap-2 hover:border-[#6c47ff] hover:text-[#6c47ff] transition-colors"
          >
            <Upload size={13} />
            {card.imageBase64 ? 'Replace image' : 'Choose image file'}
          </button>
        </>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#374151]" />
            <input
              type="text"
              placeholder="Search cards by player or title..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg pl-8 pr-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
            />
          </div>
          {searching && <p className="text-[10px] text-[#64748b] text-center">Searching…</p>}
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map(result => (
                <button
                  key={result.id}
                  onClick={() => handleSelectCard(result)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#6c47ff]/50 transition-colors text-left"
                >
                  <img src={result.image_url} alt={result.player_name || result.title} className="w-8 h-10 object-cover rounded flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-white truncate">{result.player_name || result.title}</p>
                    <p className="text-[9px] text-[#64748b] truncate">{result.year} · {result.sport?.toUpperCase()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-[10px] text-[#64748b] text-center">No cards found for &quot;{searchQuery}&quot;</p>
          )}
        </div>
      )}

      {/* Card fields */}
      <div>
        <label htmlFor={`${label}-title`} className="sr-only">Card title</label>
        <input
          id={`${label}-title`}
          type="text"
          placeholder="Card title *"
          value={card.title}
          onChange={(e) => onChange({ ...card, title: e.target.value })}
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
        />
      </div>
      <div>
        <label htmlFor={`${label}-player`} className="sr-only">Player name</label>
        <input
          id={`${label}-player`}
          type="text"
          placeholder="Player name"
          value={card.playerName}
          onChange={(e) => onChange({ ...card, playerName: e.target.value })}
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
        />
      </div>
      <div>
        <label htmlFor={`${label}-sport`} className="sr-only">Sport</label>
        <select
          id={`${label}-sport`}
          value={card.sport}
          onChange={(e) => onChange({ ...card, sport: e.target.value })}
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#6c47ff] transition-colors"
        >
          {SPORTS.map((s) => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`${label}-year`} className="sr-only">Year</label>
          <input
            id={`${label}-year`}
            type="text"
            placeholder="Year (e.g., 2000)"
            value={card.year || ''}
            onChange={(e) => onChange({ ...card, year: e.target.value })}
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
        </div>
        <div>
          <label htmlFor={`${label}-grade`} className="sr-only">Grade</label>
          <input
            id={`${label}-grade`}
            type="text"
            placeholder="Grade (PSA 10)"
            value={card.grade || ''}
            onChange={(e) => onChange({ ...card, grade: e.target.value })}
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${label}-setName`} className="sr-only">Set Name</label>
        <input
          id={`${label}-setName`}
          type="text"
          placeholder="Set name (e.g., Topps Chrome)"
          value={card.setName || ''}
          onChange={(e) => onChange({ ...card, setName: e.target.value })}
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`${label}-variant`} className="sr-only">Variant</label>
          <input
            id={`${label}-variant`}
            type="text"
            placeholder="Variant (Refractor)"
            value={card.variant || ''}
            onChange={(e) => onChange({ ...card, variant: e.target.value })}
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
        </div>
        <div>
          <label htmlFor={`${label}-certNumber`} className="sr-only">Cert Number</label>
          <input
            id={`${label}-certNumber`}
            type="text"
            placeholder="Cert #"
            value={card.certNumber || ''}
            onChange={(e) => onChange({ ...card, certNumber: e.target.value })}
            className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3333/api/v1');

// ── Battle Templates ──────────────────────────────────────────────────────────

interface BattleTemplate {
  id: string;
  name: string;
  leftPlayer: string;
  rightPlayer: string;
  category: string;
  description: string;
  leftCardId?: string;
  leftImageUrl?: string;
  rightCardId?: string;
  rightImageUrl?: string;
}

function TemplateCard({
  template,
  onUse,
}: {
  template: BattleTemplate;
  onUse: (t: BattleTemplate) => void;
}) {
  const placeholderLeft = `https://placehold.co/200x280/6c47ff/ffffff?text=${encodeURIComponent(template.leftPlayer.split(' ').slice(-1)[0])}`;
  const placeholderRight = `https://placehold.co/200x280/8b5cf6/ffffff?text=${encodeURIComponent(template.rightPlayer.split(' ').slice(-1)[0])}`;

  return (
    <div
      className="rounded-2xl border border-[#1e1e2e] overflow-hidden"
      style={{ background: '#12121a' }}
    >
      {/* Side-by-side images */}
      <div className="relative flex h-28">
        <div className="w-1/2 overflow-hidden">
          <img
            src={template.leftImageUrl || placeholderLeft}
            alt={template.leftPlayer}
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="w-1/2 overflow-hidden">
          <img
            src={template.rightImageUrl || placeholderRight}
            alt={template.rightPlayer}
            className="w-full h-full object-cover object-top"
          />
        </div>
        {/* VS badge */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white border-2 border-[#0a0a0f]"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
          >
            VS
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <p className="text-sm font-black text-white">{template.name}</p>
          <p className="text-xs text-[#64748b] mt-0.5">{template.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-[#64748b]">
            <span className="text-white font-semibold">{template.leftPlayer}</span>
            {' vs '}
            <span className="text-white font-semibold">{template.rightPlayer}</span>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: template.category === 'investment' ? 'rgba(34,197,94,0.15)' : template.category === 'coolest' ? 'rgba(251,191,36,0.15)' : 'rgba(139,92,246,0.15)',
              color: template.category === 'investment' ? '#22c55e' : template.category === 'coolest' ? '#fbbf24' : '#a78bfa',
            }}
          >
            {template.category === 'investment' ? '💰' : template.category === 'coolest' ? '🔥' : '💎'} {template.category}
          </span>
        </div>
        <button
          onClick={() => onUse(template)}
          className="w-full py-2.5 rounded-xl text-xs font-black transition-all"
          style={{
            background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
            color: 'white',
          }}
        >
          <LayoutTemplate size={12} className="inline mr-1.5" />
          Use Template
        </button>
      </div>
    </div>
  );
}

function TemplatesTab({ onSelectTemplate }: { onSelectTemplate: (t: BattleTemplate) => void }) {
  const [templates, setTemplates] = useState<BattleTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/battle-templates`)
      .then(r => r.json())
      .then(data => {
        setTemplates(data.templates ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl border border-[#1e1e2e] bg-[#12121a] overflow-hidden animate-pulse">
            <div className="h-28 bg-[#1e1e2e]" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-[#1e1e2e] rounded w-3/4" />
              <div className="h-3 bg-[#1e1e2e] rounded w-full" />
              <div className="h-8 bg-[#1e1e2e] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#64748b]">
        Pick a template to pre-fill both cards and battle settings instantly.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {templates.map(t => (
          <TemplateCard key={t.id} template={t} onUse={onSelectTemplate} />
        ))}
      </div>
    </div>
  );
}

async function uploadAsset(card: CardInput): Promise<{ id: string }> {
  // If card was selected from search (has an existing asset ID), skip upload
  if (card.existingAssetId) {
    return { id: card.existingAssetId };
  }

  const token = getToken();
  
  // If uploading a file, use FormData
  if (card.imageBase64) {
    const formData = new FormData();
    
    // Convert base64 to blob
    const byteString = atob(card.imageBase64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: card.mimeType || 'image/jpeg' });
    const filename = card.title ? `${card.title.replace(/[^a-z0-9]/gi, '_')}.jpg` : 'card.jpg';
    
    formData.append('image', blob, filename);
    formData.append('title', card.title || 'Untitled Card');
    formData.append('sport', card.sport);
    if (card.playerName) formData.append('playerName', card.playerName);
    if (card.year) formData.append('year', card.year);
    if (card.setName) formData.append('setName', card.setName);
    if (card.variant) formData.append('variant', card.variant);
    if (card.grade) formData.append('grade', card.grade);
    if (card.certNumber) formData.append('certNumber', card.certNumber);

    const res = await fetch(`${BASE_URL}/assets/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  }
  
  // For URL-based cards, use JSON API
  const body: Record<string, string | undefined> = {
    title: card.title,
    sport: card.sport,
    playerName: card.playerName,
    year: card.year,
    setName: card.setName,
    variant: card.variant,
    grade: card.grade,
    certNumber: card.certNumber,
    imageUrl: card.imageUrl || `https://placehold.co/400x560/6c47ff/ffffff?text=${encodeURIComponent(card.title)}`,
  };

  const res = await fetch(`${BASE_URL}/assets/create-from-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

async function createBattle(data: {
  title: string;
  leftAssetId: string;
  rightAssetId: string;
  categories: string[];
  durationSeconds: number;
}): Promise<{ id: string }> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/battles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create battle' }));
    throw new Error(err.error || 'Failed to create battle');
  }
  return res.json();
}

export default function CreatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manual' | 'templates'>('manual');
  const [left, setLeft] = useState<CardInput>(emptyCard());
  const [right, setRight] = useState<CardInput>(emptyCard());
  const [battleTitle, setBattleTitle] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>(['investment', 'coolest']);
  const [duration, setDuration] = useState(86400);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [createdId, setCreatedId] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [drafts, setDrafts] = useState<Array<{ id: string; title?: string; createdAt: string; updatedAt: string; categories: string[] }>>([]);
  const [draftCount, setDraftCount] = useState(0);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  // Load draft count on mount
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${BASE_URL}/me/drafts`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(data => {
      setDraftCount(data.total ?? 0);
    }).catch(() => {});
  }, []);

  const loadDrafts = async () => {
    setLoadingDrafts(true);
    const token = getToken();
    if (!token) { showToast('Log in to view drafts', 'info'); setLoadingDrafts(false); return; }
    try {
      const r = await fetch(`${BASE_URL}/me/drafts`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      setDrafts(data.drafts ?? []);
    } catch { showToast('Failed to load drafts', 'error'); }
    setLoadingDrafts(false);
  };

  const handleSaveDraft = async () => {
    const token = getToken();
    if (!token) { showToast('Log in to save drafts', 'info'); return; }
    setSavingDraft(true);
    try {
      const r = await fetch(`${BASE_URL}/me/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: battleTitle || `${left.playerName || left.title} vs ${right.playerName || right.title}`,
          sport: left.sport,
          categories: selectedCats,
          leftAssetId: left.existingAssetId,
          rightAssetId: right.existingAssetId,
        }),
      });
      if (r.ok) {
        setDraftCount(c => c + 1);
        showToast('📝 Draft saved!', 'success');
      }
    } catch { showToast('Failed to save draft', 'error'); }
    setSavingDraft(false);
  };

  const handleOpenDrafts = async () => {
    await loadDrafts();
    setShowDraftModal(true);
  };

  const handleLoadDraft = (draft: { id: string; title?: string; categories: string[] }) => {
    setBattleTitle(draft.title ?? '');
    setSelectedCats(draft.categories);
    setShowDraftModal(false);
    showToast('Draft loaded!', 'success');
  };

  const handleDeleteDraft = async (draftId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${BASE_URL}/me/drafts/${draftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      setDraftCount(c => Math.max(0, c - 1));
      showToast('Draft deleted', 'success');
    } catch { showToast('Failed to delete draft', 'error'); }
  };

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => {
      if (prev.includes(id)) {
        // Don't allow deselecting if only 2 remain
        if (prev.length <= 2) return prev;
        return prev.filter((c) => c !== id);
      } else {
        // Don't allow selecting more than 4
        if (prev.length >= 4) return prev;
        return [...prev, id];
      }
    });
  };

  const handleSubmit = async () => {
    if (!left.title.trim()) return setError('Enter a title for the left card');
    if (!right.title.trim()) return setError('Enter a title for the right card');
    if (selectedCats.length < 2) return setError('Select at least 2 categories');

    setError('');
    setSubmitting(true);
    try {
      const [leftAsset, rightAsset] = await Promise.all([
        uploadAsset(left),
        uploadAsset(right),
      ]);

      const title = battleTitle.trim() ||
        `${left.playerName || left.title.split(' ')[0]} vs ${right.playerName || right.title.split(' ')[0]}`;

      const battle = await createBattle({
        title,
        leftAssetId: leftAsset.id,
        rightAssetId: rightAsset.id,
        categories: selectedCats,
        durationSeconds: duration,
      });

      setCreatedId(battle.id);
      setStep('success');
      setTimeout(() => router.push(`/battles/${battle.id}`), 1500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="w-20 h-20 rounded-full bg-[#6c47ff]/20 flex items-center justify-center animate-pulse">
          <Swords size={36} className="text-[#6c47ff]" />
        </div>
        <h2 className="text-2xl font-black text-white">Battle Created! ⚔️</h2>
        <p className="text-[#64748b]">Redirecting to your battle…</p>
        <Button onClick={() => router.push(`/battles/${createdId}`)}>View Battle</Button>
      </div>
    );
  }

  // Handle selecting a template
  const handleSelectTemplate = (t: BattleTemplate) => {
    setLeft({
      imageUrl: t.leftImageUrl || '',
      previewSrc: t.leftImageUrl || '',
      imageBase64: '',
      mimeType: '',
      title: t.leftPlayer,
      playerName: t.leftPlayer,
      sport: 'nfl',
      mode: 'url',
      existingAssetId: t.leftCardId,
    });
    setRight({
      imageUrl: t.rightImageUrl || '',
      previewSrc: t.rightImageUrl || '',
      imageBase64: '',
      mimeType: '',
      title: t.rightPlayer,
      playerName: t.rightPlayer,
      sport: 'nfl',
      mode: 'url',
      existingAssetId: t.rightCardId,
    });
    setBattleTitle(t.name);
    setSelectedCats([t.category]);
    setActiveTab('manual');
    showToast(`✅ Template loaded: ${t.name}`, 'success');
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-xl font-black text-white">Create Battle ⚔️</h1>
        <p className="text-sm text-[#64748b] mt-1">Set up two cards and let the community decide</p>
      </div>

      {/* Tab switcher: Manual vs Templates */}
      <div className="flex gap-1 bg-[#0a0a0f] rounded-xl p-1 border border-[#1e1e2e]">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'manual' ? 'bg-[#6c47ff]/20 text-[#6c47ff] border border-[#6c47ff]/30' : 'text-[#64748b]'
          }`}
        >
          <Swords size={14} /> Manual
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'templates' ? 'bg-[#6c47ff]/20 text-[#6c47ff] border border-[#6c47ff]/30' : 'text-[#64748b]'
          }`}
        >
          <LayoutTemplate size={14} /> Templates
        </button>
      </div>

      {/* Templates tab */}
      {activeTab === 'templates' && (
        <TemplatesTab onSelectTemplate={handleSelectTemplate} />
      )}

      {/* Manual tab */}
      {activeTab === 'manual' && (<>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {[
          { n: 1, label: 'Cards' },
          { n: 2, label: 'Details' },
          { n: 3, label: 'Review' },
          { n: 4, label: 'Launch' },
        ].map((s, i, arr) => {
          // Determine step completion
          const done1 = left.title.trim() && right.title.trim();
          const done2 = done1 && selectedCats.length > 0;
          const done3 = done2;
          const active =
            s.n === 1 ? true :
            s.n === 2 ? !!done1 :
            s.n === 3 ? !!done2 :
            !!done3;
          return (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                  style={active
                    ? { background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', color: 'white' }
                    : { background: '#1e1e2e', color: '#374151' }
                  }
                >
                  {s.n}
                </div>
                <p className="text-[9px] mt-1" style={{ color: active ? '#a78bfa' : '#374151' }}>{s.label}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="h-px flex-1 mb-4 mx-1 transition-all" style={{ background: !!done1 && i === 0 || !!done2 && i === 1 || !!done3 && i >= 2 ? '#6c47ff' : '#1e1e2e' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Live Preview */}
      {(left.previewSrc || right.previewSrc || left.title || right.title) && (
        <div
          className="rounded-xl border border-[#1e1e2e] p-4"
          style={{ background: '#12121a' }}
        >
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-3">⚡ Live Preview</p>
          <div className="flex items-center gap-3">
            {/* Left card */}
            <div className="flex-1 text-center">
              <div className="w-20 aspect-[3/4] mx-auto rounded-xl overflow-hidden border border-[#252535] bg-[#0a0a0f]">
                {left.previewSrc ? (
                  <img src={left.previewSrc} alt={left.playerName || left.title || 'Left card'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#374151] text-xs text-center p-2 leading-tight">
                    {left.title || 'Left Card'}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[#94a3b8] mt-1.5 truncate font-semibold">{left.playerName || left.title || 'Left'}</p>
            </div>

            {/* VS badge */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', color: 'white', boxShadow: '0 0 12px rgba(108,71,255,0.4)' }}
            >
              VS
            </div>

            {/* Right card */}
            <div className="flex-1 text-center">
              <div className="w-20 aspect-[3/4] mx-auto rounded-xl overflow-hidden border border-[#252535] bg-[#0a0a0f]">
                {right.previewSrc ? (
                  <img src={right.previewSrc} alt={right.playerName || right.title || 'Right card'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#374151] text-xs text-center p-2 leading-tight">
                    {right.title || 'Right Card'}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[#94a3b8] mt-1.5 truncate font-semibold">{right.playerName || right.title || 'Right'}</p>
            </div>
          </div>
          {(battleTitle || (left.playerName && right.playerName)) && (
            <p className="text-center text-xs font-bold text-white mt-3 truncate">
              {battleTitle || `${left.playerName} vs ${right.playerName}`}
            </p>
          )}
        </div>
      )}

      {/* Card slots */}
      <div className="flex gap-3">
        <CardSlot label="Left Card" card={left} onChange={setLeft} />
        <div className="flex items-center justify-center w-8 shrink-0 pt-8">
          <span className="text-[#374151] font-black text-sm">VS</span>
        </div>
        <CardSlot label="Right Card" card={right} onChange={setRight} />
      </div>

      {/* Battle title */}
      <div>
        <label className="text-xs font-bold text-[#64748b] uppercase tracking-widest block mb-2">
          Battle Title <span className="text-[#374151] font-normal normal-case">(optional — auto-generated)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. GOAT Rookie Debate 🐐"
          value={battleTitle}
          onChange={(e) => setBattleTitle(e.target.value)}
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
        />
      </div>

      {/* Categories */}
      <div>
        <label className="text-xs font-bold text-[#64748b] uppercase tracking-widest block mb-1">Vote Categories</label>
        <p className="text-[10px] text-[#64748b] mb-2">Select 2–4 categories · {selectedCats.length}/4 selected</p>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCats.includes(cat.id);
            const atMax = selectedCats.length >= 4 && !isSelected;
            return (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.id)}
                disabled={atMax}
                className={`p-3 rounded-xl border-2 text-left transition-all disabled:opacity-40 ${
                  isSelected
                    ? 'bg-[#6c47ff]/15 border-[#6c47ff]'
                    : 'bg-[#12121a] border-[#1e1e2e] hover:border-[#374151]'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className={`text-xs font-bold ${isSelected ? 'text-[#a78bfa]' : 'text-[#94a3b8]'}`}>
                    {cat.label}
                  </span>
                </div>
                <p className="text-[9px] text-[#64748b] leading-tight">{cat.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="text-xs font-bold text-[#64748b] uppercase tracking-widest block mb-2">Duration</label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all
                ${duration === d.value
                  ? 'bg-[#6c47ff]/15 border-[#6c47ff] text-[#6c47ff]'
                  : 'bg-[#12121a] border-[#1e1e2e] text-[#64748b] hover:border-[#374151]'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg px-4 py-3 text-sm text-[#ef4444]">
          {error}
        </div>
      )}

      {/* Draft actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSaveDraft}
          disabled={savingDraft}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'rgba(108,71,255,0.08)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.2)' }}
        >
          <FileText size={14} />
          {savingDraft ? 'Saving…' : 'Save Draft'}
        </button>
        <button
          onClick={handleOpenDrafts}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all relative"
          style={{ background: 'rgba(108,71,255,0.08)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.2)' }}
        >
          <BookOpen size={14} />
          Drafts
          {draftCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#6c47ff' }}>
              {draftCount}
            </span>
          )}
        </button>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        loading={submitting}
        disabled={submitting || !left.title.trim() || !right.title.trim()}
      >
        ⚔️ Publish Battle
      </Button>

      {/* Draft modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={() => setShowDraftModal(false)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-[#1e1e2e] overflow-hidden"
            style={{ background: '#12121a', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText size={14} className="text-[#6c47ff]" /> Your Drafts</h3>
              <button onClick={() => setShowDraftModal(false)} className="text-[#64748b] hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {loadingDrafts && <p className="text-center text-[#64748b] text-sm py-4">Loading…</p>}
              {!loadingDrafts && drafts.length === 0 && (
                <p className="text-center text-[#64748b] text-sm py-4">No drafts saved yet</p>
              )}
              {drafts.map(draft => (
                <div key={draft.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#1e1e2e] bg-[#0a0a0f]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{draft.title || 'Untitled Draft'}</p>
                    <p className="text-[10px] text-[#64748b] mt-0.5">{new Date(draft.updatedAt).toLocaleDateString()} · {draft.categories.join(', ')}</p>
                  </div>
                  <button
                    onClick={() => handleLoadDraft(draft)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    style={{ background: 'rgba(108,71,255,0.15)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.3)' }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="px-2 py-1.5 rounded-lg text-xs transition-colors text-[#ef4444] hover:bg-[#ef4444]/10"
                    title="Delete draft"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </>)}
    </div>
  );
}
