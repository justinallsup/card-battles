'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bell, Trash2, Info, Plus, TrendingUp, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getToken } from '../../../lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const KNOWN_PLAYERS = [
  'Patrick Mahomes', 'Tom Brady', 'LeBron James', 'Michael Jordan',
  'Victor Wembanyama', 'Shohei Ohtani', 'Mike Trout', 'Luka Doncic',
  'Stephen Curry', 'Josh Allen', 'Lamar Jackson', 'Giannis Antetokounmpo',
  'Nikola Jokic', 'Anthony Edwards',
];

const VALUATIONS: Record<string, number> = {
  'Patrick Mahomes': 280, 'Tom Brady': 520, 'LeBron James': 1400, 'Michael Jordan': 15000,
  'Victor Wembanyama': 180, 'Shohei Ohtani': 380, 'Mike Trout': 780, 'Luka Doncic': 460,
  'Stephen Curry': 340, 'Josh Allen': 210, 'Lamar Jackson': 195, 'Giannis Antetokounmpo': 165,
  'Nikola Jokic': 220, 'Anthony Edwards': 310,
};

interface PriceAlert {
  id: string;
  userId: string;
  playerName: string;
  targetPrice: number;
  direction: 'above' | 'below';
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('below');
  const [autocomplete, setAutocomplete] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? getToken() : null;

  const fetchAlerts = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${BASE_URL}/me/price-alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { alerts: PriceAlert[] };
        setAlerts(data.alerts || []);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    setMounted(true);
    fetchAlerts();
  }, [fetchAlerts]);

  const handlePlayerInput = (val: string) => {
    setPlayerName(val);
    if (val.length > 1) {
      const matches = KNOWN_PLAYERS.filter(p => p.toLowerCase().includes(val.toLowerCase()));
      setAutocomplete(matches.slice(0, 5));
    } else {
      setAutocomplete([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError('Please log in to create alerts'); return; }
    if (!playerName || !targetPrice) { setError('All fields required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/me/price-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ playerName, targetPrice: Number(targetPrice), direction }),
      });
      if (res.ok) {
        setPlayerName(''); setTargetPrice(''); setDirection('below');
        setShowForm(false);
        await fetchAlerts();
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error || 'Failed to create alert');
      }
    } catch { setError('Network error'); }
    setSubmitting(false);
  };

  const deleteAlert = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/me/price-alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  const estimatedPrice = (name: string) => VALUATIONS[name] ?? null;

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6c47ff]/10 border border-[#6c47ff]/20 flex items-center justify-center">
            <Bell size={18} className="text-[#6c47ff]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Price Alerts</h1>
            <p className="text-xs text-[#64748b]">Monitor card prices in real-time</p>
          </div>
        </div>
        {mounted && token && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#6c47ff] text-white text-xs font-bold rounded-xl hover:bg-[#5a38e0] transition-colors"
          >
            <Plus size={14} />
            Add Alert
          </button>
        )}
      </div>

      {/* Demo notice */}
      <div className="bg-[#12121a] border border-[#6c47ff]/20 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-[#6c47ff] flex-shrink-0" />
          <p className="text-xs font-bold text-white">How Price Alerts Work</p>
        </div>
        <ul className="space-y-1.5 text-xs text-[#94a3b8]">
          <li>• Set a target price for any card (above or below current market value)</li>
          <li>• Alerts are checked against simulated market prices when you visit this page</li>
          <li>• Triggered alerts are highlighted — price hit your target!</li>
          <li className="text-[#64748b] italic">• Demo mode: prices are simulated. In production, real-time market data would be used.</li>
        </ul>
      </div>

      {/* Add Alert Form */}
      {showForm && (
        <div className="bg-[#12121a] border border-[#6c47ff]/30 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white">Create Price Alert</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <label className="block text-xs text-[#64748b] mb-1">Player Name</label>
              <input
                type="text"
                value={playerName}
                onChange={e => handlePlayerInput(e.target.value)}
                placeholder="e.g. Patrick Mahomes"
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#6c47ff]/50"
              />
              {autocomplete.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 bg-[#12121a] border border-[#1e1e2e] rounded-xl mt-1 overflow-hidden shadow-lg">
                  {autocomplete.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setPlayerName(p); setAutocomplete([]); }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#1e1e2e] transition-colors"
                    >
                      {p}
                      {VALUATIONS[p] && (
                        <span className="text-[#64748b] text-xs ml-2">~${VALUATIONS[p].toLocaleString()}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#64748b] mb-1">Target Price ($)</label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={e => setTargetPrice(e.target.value)}
                  placeholder="e.g. 250"
                  min={1}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#6c47ff]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-[#64748b] mb-1">Alert Direction</label>
                <div className="flex rounded-xl overflow-hidden border border-[#1e1e2e]">
                  <button
                    type="button"
                    onClick={() => setDirection('below')}
                    className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1 ${direction === 'below' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#0a0a0f] text-[#64748b]'}`}
                  >
                    <TrendingDown size={12} /> Below
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('above')}
                    className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1 ${direction === 'above' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#0a0a0f] text-[#64748b]'}`}
                  >
                    <TrendingUp size={12} /> Above
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-[#ef4444]">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#6c47ff] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#5a38e0] disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Alert'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                className="px-4 py-2.5 border border-[#1e1e2e] rounded-xl text-sm text-[#64748b] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Not logged in */}
      {!token && mounted && (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 text-center space-y-3">
          <p className="text-3xl">🔐</p>
          <p className="text-white font-bold">Sign in to use Price Alerts</p>
          <Link href="/login" className="inline-block px-5 py-2.5 bg-[#6c47ff] text-white text-sm font-bold rounded-xl hover:bg-[#5a38e0] transition-colors">
            Sign In
          </Link>
        </div>
      )}

      {/* Alerts list */}
      {mounted && token && !loading && alerts.length === 0 && !showForm && (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-10 text-center space-y-3">
          <p className="text-4xl">🔔</p>
          <p className="text-white font-bold text-lg">No alerts set</p>
          <p className="text-[#64748b] text-sm">Click "Add Alert" to monitor card prices.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6c47ff] text-white text-sm font-bold rounded-xl hover:bg-[#5a38e0] transition-colors mt-2"
          >
            <Plus size={14} /> Create First Alert
          </button>
        </div>
      )}

      {mounted && token && alerts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-[#64748b]">
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''} · {alerts.filter(a => a.triggered).length} triggered
          </p>

          {alerts.map((alert) => {
            const currentEst = estimatedPrice(alert.playerName);
            const isTriggered = alert.triggered;
            return (
              <div
                key={alert.id}
                className={`bg-[#12121a] border rounded-2xl p-4 flex items-center gap-4 transition-colors ${
                  isTriggered
                    ? alert.direction === 'below'
                      ? 'border-[#22c55e]/30 bg-[#22c55e]/5'
                      : 'border-[#ef4444]/30 bg-[#ef4444]/5'
                    : 'border-[#1e1e2e]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isTriggered
                    ? alert.direction === 'below' ? 'bg-[#22c55e]/10' : 'bg-[#ef4444]/10'
                    : 'bg-[#6c47ff]/10'
                }`}>
                  {isTriggered
                    ? <CheckCircle size={18} className={alert.direction === 'below' ? 'text-[#22c55e]' : 'text-[#ef4444]'} />
                    : <AlertCircle size={18} className="text-[#6c47ff]" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white truncate">{alert.playerName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alert.direction === 'below'
                        ? 'bg-[#22c55e]/20 text-[#22c55e]'
                        : 'bg-[#ef4444]/20 text-[#ef4444]'
                    }`}>
                      {alert.direction === 'below' ? '↓ Below' : '↑ Above'} ${alert.targetPrice.toLocaleString()}
                    </span>
                  </div>

                  {currentEst && (
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      Est. current price:{' '}
                      <span className="font-bold text-white">${currentEst.toLocaleString()}</span>
                    </p>
                  )}

                  {isTriggered ? (
                    <p className={`text-xs font-bold mt-0.5 ${alert.direction === 'below' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      🎯 Price hit your target!{alert.triggeredAt ? ` (${formatDate(alert.triggeredAt)})` : ''}
                    </p>
                  ) : (
                    <p className="text-[10px] text-[#374151] mt-1">Set {formatDate(alert.createdAt)}</p>
                  )}
                </div>

                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="w-8 h-8 rounded-xl border border-[#1e1e2e] flex items-center justify-center text-[#64748b] hover:text-[#ef4444] hover:border-[#ef4444]/30 transition-colors flex-shrink-0"
                  title="Remove alert"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
