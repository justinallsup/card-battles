'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getToken } from '../../../lib/api';
import { showToast } from '../../../components/ui/Toast';
import { X, Search, Plus, Store, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { RarityBadge, getRarityTier } from '../../../components/ui/RarityBadge';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  cardId: string;
  playerName: string;
  imageUrl: string;
  title: string;
  year: number;
  askingPrice: number;
  condition: string;
  grade: number | null;
  description: string;
  status: 'active' | 'sold' | 'removed';
  createdAt: string;
}

interface CardResult {
  id: string;
  title: string;
  image_url: string;
  player_name: string;
  year: number;
  sport: string;
}

function conditionBadge(condition: string) {
  const isPSA10 = condition === 'PSA 10';
  const isPSA9 = condition === 'PSA 9';
  const isPSA8 = condition.startsWith('PSA 8');
  const isOtherPSA = condition.startsWith('PSA');
  if (isPSA10) return { bg: 'rgba(251,191,36,0.15)', color: '#f59e0b', border: 'rgba(251,191,36,0.4)', label: 'PSA 10' };
  if (isPSA9) return { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: 'rgba(148,163,184,0.4)', label: 'PSA 9' };
  if (isPSA8) return { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.4)', label: condition };
  if (isOtherPSA) return { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', border: 'rgba(99,102,241,0.3)', label: condition };
  return { bg: 'rgba(100,116,139,0.15)', color: '#64748b', border: 'rgba(100,116,139,0.4)', label: condition };
}

function formatPrice(p: number) {
  if (p >= 1000) return `$${(p / 1000).toFixed(1)}k`;
  return `$${p}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── List a Card Modal ──────────────────────────────────────────────────────────
function ListCardModal({ onClose, onListed }: { onClose: () => void; onListed: (l: Listing) => void }) {
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CardResult[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardResult | null>(null);
  const [askingPrice, setAskingPrice] = useState('');
  const [condition, setCondition] = useState('PSA 10');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const CONDITIONS = ['PSA 10', 'PSA 9', 'PSA 8', 'PSA 7', 'Raw NM', 'Raw EX', 'Raw VG'];

  const searchCards = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const r = await fetch(`${BASE}/cards/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setResults((data.cards || data.items || []).slice(0, 8));
    } catch {}
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedCard) errs.card = 'Select a card first';
    const price = Number(askingPrice);
    if (!askingPrice || isNaN(price) || price <= 0) errs.price = 'Enter a valid price';
    if (price > 1000000) errs.price = 'Price too high';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/marketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ cardId: selectedCard!.id, askingPrice: Number(askingPrice), condition, description }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      const listing = await res.json();
      showToast('Card listed successfully!', 'success');
      onListed(listing as Listing);
      onClose();
    } catch (e: unknown) {
      showToast((e as Error).message || 'Failed to list card', 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-[#1e1e2e] overflow-hidden"
        style={{ background: '#12121a', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <Store size={16} className="text-[#6c47ff]" />
            <h3 className="text-sm font-bold text-white">List a Card for Sale</h3>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {step === 'search' ? (
            <>
              <div>
                <label className="text-xs text-[#64748b] font-semibold uppercase tracking-wider mb-1.5 block">Search for a card</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                  <input
                    autoFocus
                    value={query}
                    onChange={e => { setQuery(e.target.value); searchCards(e.target.value); }}
                    placeholder="e.g. Mahomes, LeBron, Ohtani…"
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]"
                  />
                </div>
                {errors.card && <p className="text-xs text-[#ef4444] mt-1">{errors.card}</p>}
              </div>

              {results.length > 0 && (
                <div className="space-y-2">
                  {results.map(card => (
                    <button
                      key={card.id}
                      onClick={() => { setSelectedCard(card); setStep('form'); setErrors({}); }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#1e1e2e] hover:border-[#6c47ff]/40 transition-all text-left"
                      style={{ background: '#0a0a0f' }}
                    >
                      <img src={card.image_url} alt={card.player_name} className="w-12 h-16 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{card.player_name}</p>
                        <p className="text-xs text-[#64748b]">{card.year} · {card.sport?.toUpperCase()}</p>
                        <p className="text-[10px] text-[#374151] truncate">{card.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query && results.length === 0 && (
                <p className="text-center text-sm text-[#64748b] py-4">No cards found</p>
              )}
            </>
          ) : (
            <>
              {/* Selected card summary */}
              {selectedCard && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[#6c47ff]/30 bg-[#6c47ff]/5">
                  <img src={selectedCard.image_url} alt={selectedCard.player_name} className="w-10 h-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{selectedCard.player_name}</p>
                    <p className="text-xs text-[#64748b]">{selectedCard.year}</p>
                  </div>
                  <button onClick={() => { setSelectedCard(null); setStep('search'); }} className="text-[#64748b] hover:text-white transition-colors text-xs">Change</button>
                </div>
              )}

              {/* Price */}
              <div>
                <label className="text-xs text-[#64748b] font-semibold uppercase tracking-wider mb-1.5 block">Asking Price ($)</label>
                <input
                  type="number"
                  min="1"
                  value={askingPrice}
                  onChange={e => { setAskingPrice(e.target.value); setErrors(prev => ({ ...prev, price: '' })); }}
                  placeholder="e.g. 250"
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff]"
                  style={errors.price ? { borderColor: '#ef4444' } : {}}
                />
                {errors.price && <p className="text-xs text-[#ef4444] mt-1">{errors.price}</p>}
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs text-[#64748b] font-semibold uppercase tracking-wider mb-1.5 block">Condition</label>
                <div className="relative">
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    className="w-full appearance-none bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#6c47ff] pr-8"
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-[#64748b] font-semibold uppercase tracking-wider mb-1.5 block">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, 300))}
                  placeholder="Ships in top loader + team bag. No scratches."
                  rows={3}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] resize-none"
                />
                <p className="text-[10px] text-[#374151] text-right">{description.length}/300</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', boxShadow: '0 0 20px rgba(108,71,255,0.3)' }}
              >
                {submitting ? 'Listing…' : '🏷️ List Card for Sale'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Listing Card ───────────────────────────────────────────────────────────────
function ListingCard({ listing, onContact }: { listing: Listing; onContact: (id: string) => void }) {
  const badge = conditionBadge(listing.condition);
  return (
    <div
      className="rounded-2xl border border-[#1e1e2e] overflow-hidden transition-all hover:border-[#6c47ff]/30"
      style={{ background: '#12121a' }}
    >
      <div className="relative">
        <img src={listing.imageUrl} alt={listing.playerName} className="w-full aspect-[3/4] object-cover" />
        <div
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black"
          style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
        >
          {badge.label}
        </div>
        <div
          className="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl text-sm font-black"
          style={{ background: 'rgba(0,0,0,0.8)', color: '#22c55e', backdropFilter: 'blur(4px)' }}
        >
          {formatPrice(listing.askingPrice)}
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <p className="text-sm font-bold text-white truncate">{listing.playerName}</p>
          <p className="text-xs text-[#64748b]">{listing.year}</p>
          <div className="mt-1">
            <RarityBadge tier={getRarityTier(listing.playerName, listing.year)} size="sm" />
          </div>
        </div>
        <p className="text-[10px] text-[#64748b] truncate">{listing.title}</p>
        {listing.description && (
          <p className="text-[10px] text-[#94a3b8] line-clamp-2">{listing.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#6c47ff] to-[#a78bfa] flex items-center justify-center text-[8px] font-bold text-white">
              {listing.sellerName[0].toUpperCase()}
            </div>
            <span className="text-[10px] text-[#64748b]">@{listing.sellerName}</span>
          </div>
          <span className="text-[9px] text-[#374151]">{formatDate(listing.createdAt)}</span>
        </div>
        <button
          onClick={() => onContact(listing.id)}
          className="w-full py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'rgba(108,71,255,0.1)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.25)' }}
        >
          💬 Contact Seller
        </button>
      </div>
    </div>
  );
}

// ── Shimmer Loader ─────────────────────────────────────────────────────────────
function ListingShimmer() {
  return (
    <div className="rounded-2xl border border-[#1e1e2e] overflow-hidden" style={{ background: '#12121a' }}>
      <div className="w-full aspect-[3/4] bg-[#1e1e2e] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#1e1e2e] rounded animate-pulse w-3/4" />
        <div className="h-3 bg-[#1e1e2e] rounded animate-pulse w-1/2" />
        <div className="h-8 bg-[#1e1e2e] rounded animate-pulse" />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [showModal, setShowModal] = useState(false);

  const loadListings = async (s = sort) => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/marketplace?sort=${s}`);
      const data = await r.json();
      setListings(data.listings || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { document.title = 'Marketplace | Card Battles'; }, []);

  useEffect(() => { loadListings(); }, [sort]);

  const handleContact = async (id: string) => {
    if (!user) { showToast('Log in to contact sellers', 'info'); return; }
    try {
      await fetch(`${BASE}/marketplace/${id}/contact`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      showToast('Message sent! (Demo mode — messages are not real)', 'success');
    } catch {
      showToast('Failed to send message', 'error');
    }
  };

  const SORT_TABS = [
    { key: 'newest', label: 'Newest' },
    { key: 'price_asc', label: 'Price ↑' },
    { key: 'price_desc', label: 'Price ↓' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">🏪 Marketplace</h1>
          <p className="text-xs text-[#64748b] mt-0.5">Buy &amp; sell trading cards</p>
        </div>
        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)', boxShadow: '0 0 12px rgba(108,71,255,0.3)' }}
          >
            <Plus size={14} /> List a Card
          </button>
        )}
      </div>

      {/* Demo disclaimer */}
      <div
        className="px-4 py-2.5 rounded-xl text-xs text-[#f59e0b] border"
        style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}
      >
        ⚠️ This is a simulated marketplace for demo purposes. No real transactions occur.
      </div>

      {/* Sort tabs */}
      <div className="flex rounded-xl overflow-hidden border border-[#1e1e2e]" style={{ background: '#0a0a0f' }}>
        {SORT_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSort(tab.key)}
            className="flex-1 py-2.5 text-xs font-bold transition-all"
            style={sort === tab.key
              ? { background: 'rgba(108,71,255,0.15)', color: '#a78bfa', borderBottom: '2px solid #6c47ff' }
              : { color: '#64748b' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listings grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <ListingShimmer key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="text-5xl">🏪</div>
          <p className="text-white font-bold">No listings yet</p>
          <p className="text-[#64748b] text-sm">Be the first to list a card!</p>
          {user && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
            >
              List a Card
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {listings.map(l => <ListingCard key={l.id} listing={l} onContact={handleContact} />)}
        </div>
      )}

      {/* Not logged in CTA */}
      {!user && (
        <div
          className="rounded-xl p-4 text-center border border-[#1e1e2e] space-y-2"
          style={{ background: '#12121a' }}
        >
          <p className="text-sm font-bold text-white">Want to sell your cards?</p>
          <p className="text-xs text-[#64748b]">Log in to list cards on the marketplace</p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)' }}
          >
            Log In
          </Link>
        </div>
      )}

      {showModal && (
        <ListCardModal
          onClose={() => setShowModal(false)}
          onListed={newListing => setListings(prev => [newListing, ...prev])}
        />
      )}
    </div>
  );
}
