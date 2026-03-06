'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { X, Image as ImageIcon, Swords, Upload, Link } from 'lucide-react';
import { getToken } from '../../../lib/api';

const SPORTS = ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'other'];

const CATEGORIES = [
  { id: 'investment', label: '📈 Investment' },
  { id: 'coolest', label: '🔥 Coolest' },
  { id: 'rarity', label: '💎 Rarest' },
];

const DURATIONS = [
  { label: '24h', value: 86400 },
  { label: '48h', value: 172800 },
  { label: '72h', value: 259200 },
];

type InputMode = 'url' | 'upload';

interface CardInput {
  imageUrl: string;
  imageBase64: string;
  mimeType: string;
  previewSrc: string;   // for displaying (either URL or data URL)
  title: string;
  playerName: string;
  sport: string;
  mode: InputMode;
}

const emptyCard = (): CardInput => ({
  imageUrl: '',
  imageBase64: '',
  mimeType: '',
  previewSrc: '',
  title: '',
  playerName: '',
  sport: 'nfl',
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

  const clearImage = () => onChange({ ...card, imageUrl: '', imageBase64: '', mimeType: '', previewSrc: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // Extract base64 portion (after "data:image/xxx;base64,")
      const base64 = dataUrl.split(',')[1] ?? '';
      onChange({ ...card, imageBase64: base64, mimeType: file.type, previewSrc: dataUrl, imageUrl: '' });
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url: string) => {
    onChange({ ...card, imageUrl: url, previewSrc: url, imageBase64: '', mimeType: '' });
  };

  return (
    <div className="flex-1 space-y-3">
      <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest">{label}</p>

      {/* Preview */}
      <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-[#1e1e2e] overflow-hidden bg-[#0d0d18] flex items-center justify-center relative">
        {card.previewSrc ? (
          <>
            <img src={card.previewSrc} alt={card.title} className="w-full h-full object-cover" />
            <button
              onClick={clearImage}
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
            <p className="text-xs">{card.mode === 'url' ? 'Paste URL below' : 'Click to upload'}</p>
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
          <Link size={11} /> Paste URL
        </button>
        <button
          onClick={() => onChange({ ...card, mode: 'upload' })}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold transition-all ${
            card.mode === 'upload' ? 'bg-[#6c47ff]/20 text-[#6c47ff]' : 'text-[#64748b]'
          }`}
        >
          <Upload size={11} /> Upload
        </button>
      </div>

      {/* URL input or file input */}
      {card.mode === 'url' ? (
        <input
          type="url"
          placeholder="Image URL (https://...)"
          value={card.imageUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
        />
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
      )}

      {/* Card fields */}
      <input
        type="text"
        placeholder="Card title *"
        value={card.title}
        onChange={(e) => onChange({ ...card, title: e.target.value })}
        className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
      />
      <input
        type="text"
        placeholder="Player name"
        value={card.playerName}
        onChange={(e) => onChange({ ...card, playerName: e.target.value })}
        className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
      />
      <select
        value={card.sport}
        onChange={(e) => onChange({ ...card, sport: e.target.value })}
        className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#6c47ff] transition-colors"
      >
        {SPORTS.map((s) => (
          <option key={s} value={s}>{s.toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

async function uploadAsset(card: CardInput): Promise<{ id: string }> {
  const token = getToken();
  const body: Record<string, string | undefined> = {
    title: card.title,
    sport: card.sport,
    playerName: card.playerName,
  };

  if (card.imageBase64) {
    body.imageBase64 = card.imageBase64;
    body.mimeType = card.mimeType || 'image/jpeg';
  } else {
    body.imageUrl = card.imageUrl || `https://placehold.co/400x560/6c47ff/ffffff?text=${encodeURIComponent(card.title)}`;
  }

  const res = await fetch(`${BASE_URL}/assets/upload`, {
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
  const [left, setLeft] = useState<CardInput>(emptyCard());
  const [right, setRight] = useState<CardInput>(emptyCard());
  const [battleTitle, setBattleTitle] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>(['investment', 'coolest', 'rarity']);
  const [duration, setDuration] = useState(86400);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [createdId, setCreatedId] = useState('');

  const toggleCat = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!left.title.trim()) return setError('Enter a title for the left card');
    if (!right.title.trim()) return setError('Enter a title for the right card');
    if (selectedCats.length === 0) return setError('Select at least one category');

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

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-xl font-black text-white">Create Battle ⚔️</h1>
        <p className="text-sm text-[#64748b] mt-1">Set up two cards and let the community decide</p>
      </div>

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
        <label className="text-xs font-bold text-[#64748b] uppercase tracking-widest block mb-2">Vote Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCat(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all
                ${selectedCats.includes(cat.id)
                  ? 'bg-[#6c47ff]/15 border-[#6c47ff] text-[#6c47ff]'
                  : 'bg-[#12121a] border-[#1e1e2e] text-[#64748b] hover:border-[#374151]'}`}
            >
              {cat.label}
            </button>
          ))}
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

      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        loading={submitting}
        disabled={submitting || !left.title.trim() || !right.title.trim()}
      >
        ⚔️ Publish Battle
      </Button>
    </div>
  );
}
