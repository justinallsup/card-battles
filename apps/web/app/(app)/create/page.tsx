'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { assets as assetsApi, battles as battlesApi } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Upload, X } from 'lucide-react';
import type { CardAsset } from '@card-battles/types';

const CATEGORIES = [
  { id: 'investment', label: '📈 Investment' },
  { id: 'coolest', label: '🔥 Coolest' },
  { id: 'rarity', label: '💎 Rarest' },
  { id: 'long_term_hold', label: '📊 Long Hold' },
];

const DURATIONS = [
  { label: '1 Hour', value: 3600 },
  { label: '6 Hours', value: 21600 },
  { label: '24 Hours', value: 86400 },
  { label: '48 Hours', value: 172800 },
];

interface CardSlot {
  asset: CardAsset | null;
  title: string;
  uploading: boolean;
}

function UploadSlot({
  slot,
  label,
  onFile,
  onTitleChange,
  onClear,
}: {
  slot: CardSlot;
  label: string;
  onFile: (file: File) => void;
  onTitleChange: (t: string) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 space-y-2">
      <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">{label}</p>

      <div
        onClick={() => !slot.asset && ref.current?.click()}
        className={`relative aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden
          ${slot.asset ? 'border-[#6c47ff]/40 cursor-default' : 'border-[#1e1e2e] hover:border-[#6c47ff]/40'}`}
      >
        {slot.uploading && (
          <div className="absolute inset-0 bg-[#0a0a0f]/80 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#6c47ff] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {slot.asset ? (
          <>
            <img src={slot.asset.imageUrl} alt={slot.asset.title} className="w-full h-full object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 w-7 h-7 bg-[#0a0a0f]/80 rounded-full flex items-center justify-center text-[#ef4444] hover:bg-[#ef4444]/20"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <Upload size={24} className="text-[#374151] mb-2" />
            <p className="text-xs text-[#374151]">Upload card image</p>
          </>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </div>

      <input
        type="text"
        placeholder="Card title (e.g. Mahomes 2017 Prizm RC)"
        value={slot.title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]"
      />
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const [left, setLeft] = useState<CardSlot>({ asset: null, title: '', uploading: false });
  const [right, setRight] = useState<CardSlot>({ asset: null, title: '', uploading: false });
  const [title, setTitle] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>(['investment', 'coolest', 'rarity']);
  const [duration, setDuration] = useState(86400);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (side: 'left' | 'right', file: File) => {
    const setter = side === 'left' ? setLeft : setRight;
    const slot = side === 'left' ? left : right;
    setter((s) => ({ ...s, uploading: true }));
    try {
      const asset = await assetsApi.upload(file, { title: slot.title || file.name });
      setter((s) => ({ ...s, asset, uploading: false }));
    } catch {
      setter((s) => ({ ...s, uploading: false }));
      setError('Upload failed. Check your connection.');
    }
  };

  const toggleCat = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!left.asset || !right.asset) return setError('Upload both card images');
    if (!left.title.trim() || !right.title.trim()) return setError('Enter titles for both cards');
    if (selectedCats.length === 0) return setError('Select at least one category');

    setError('');
    setSubmitting(true);
    try {
      const battle = await battlesApi.create({
        title: title || `${left.title.split(' ')[0]} vs ${right.title.split(' ')[0]}`,
        leftAssetId: left.asset.id,
        rightAssetId: right.asset.id,
        categories: selectedCats,
        durationSeconds: duration,
      });
      router.push(`/battles/${battle.id}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to create battle');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white">Create Battle ⚔️</h1>
        <p className="text-sm text-[#64748b] mt-1">Upload two cards and let the community decide</p>
      </div>

      {/* Card uploads */}
      <div className="flex gap-3">
        <UploadSlot
          slot={left}
          label="Left Card"
          onFile={(f) => handleUpload('left', f)}
          onTitleChange={(t) => setLeft((s) => ({ ...s, title: t }))}
          onClear={() => setLeft({ asset: null, title: '', uploading: false })}
        />
        <div className="flex items-center justify-center w-8 text-[#374151] font-black text-sm">VS</div>
        <UploadSlot
          slot={right}
          label="Right Card"
          onFile={(f) => handleUpload('right', f)}
          onTitleChange={(t) => setRight((s) => ({ ...s, title: t }))}
          onClear={() => setRight({ asset: null, title: '', uploading: false })}
        />
      </div>

      {/* Battle title */}
      <div>
        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-2">
          Battle Title (optional)
        </label>
        <input
          type="text"
          placeholder="e.g. GOAT Rookie Debate"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]"
        />
      </div>

      {/* Categories */}
      <div>
        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-2">
          Vote Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCat(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all
                ${selectedCats.includes(cat.id)
                  ? 'bg-[#6c47ff]/15 border-[#6c47ff] text-[#6c47ff]'
                  : 'bg-[#12121a] border-[#1e1e2e] text-[#64748b] hover:border-[#374151]'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide block mb-2">
          Duration
        </label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all
                ${duration === d.value
                  ? 'bg-[#6c47ff]/15 border-[#6c47ff] text-[#6c47ff]'
                  : 'bg-[#12121a] border-[#1e1e2e] text-[#64748b] hover:border-[#374151]'
                }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-[#ef4444] text-center">{error}</p>}

      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        loading={submitting}
        disabled={!left.asset || !right.asset}
      >
        ⚔️ Publish Battle
      </Button>
    </div>
  );
}
