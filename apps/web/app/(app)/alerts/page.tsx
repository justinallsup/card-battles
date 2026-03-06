'use client';
import { useState, useEffect } from 'react';
import { Bell, BellOff, Trash2, Info } from 'lucide-react';
import Link from 'next/link';

interface PriceAlert {
  cardId: string;
  playerName: string;
  threshold: number;
  set: number;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('cb_alerts');
      setAlerts(raw ? JSON.parse(raw) : []);
    } catch {
      setAlerts([]);
    }
  }, []);

  const removeAlert = (cardId: string) => {
    const updated = alerts.filter((a) => a.cardId !== cardId);
    localStorage.setItem('cb_alerts', JSON.stringify(updated));
    setAlerts(updated);
  };

  const clearAll = () => {
    localStorage.removeItem('cb_alerts');
    setAlerts([]);
  };

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#6c47ff]/10 border border-[#6c47ff]/20 flex items-center justify-center">
          <Bell size={18} className="text-[#6c47ff]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Price Alerts</h1>
          <p className="text-xs text-[#64748b]">Get notified when card prices drop</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#12121a] border border-[#6c47ff]/20 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-[#6c47ff] flex-shrink-0" />
          <p className="text-xs font-bold text-white">How Price Alerts Work</p>
        </div>
        <ul className="space-y-1.5 text-xs text-[#94a3b8]">
          <li>• Set a target price threshold for any PSA 10 card</li>
          <li>• We monitor market valuations across major platforms</li>
          <li>• When a card drops below your threshold, you&apos;ll be notified</li>
          <li className="text-[#64748b] italic">• Email notifications will be sent in production. Demo saves locally.</li>
        </ul>
        <Link
          href="/feed"
          className="inline-block text-[10px] text-[#6c47ff] hover:underline mt-1"
        >
          Set alerts from battle pages →
        </Link>
      </div>

      {/* Alerts list */}
      {!mounted ? null : alerts.length === 0 ? (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-10 text-center space-y-3">
          <p className="text-4xl">🔔</p>
          <p className="text-white font-bold text-lg">No alerts set</p>
          <p className="text-[#64748b] text-sm">
            Browse battles and set price alerts on cards you&apos;re watching.
          </p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6c47ff] text-white text-sm font-bold rounded-xl hover:bg-[#5a38e0] transition-colors mt-2"
          >
            Browse Battles
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#64748b]">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''} active
            </p>
            <button
              onClick={clearAll}
              className="text-[10px] text-[#ef4444]/70 hover:text-[#ef4444] transition-colors font-semibold"
            >
              Clear all
            </button>
          </div>

          {alerts.map((alert) => (
            <div
              key={alert.cardId}
              className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[#6c47ff]/10 border border-[#6c47ff]/20 flex items-center justify-center flex-shrink-0">
                <Bell size={16} className="text-[#6c47ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{alert.playerName}</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Alert when PSA 10 drops below{' '}
                  <span className="font-bold text-[#6c47ff]">${alert.threshold.toLocaleString()}</span>
                </p>
                <p className="text-[10px] text-[#374151] mt-1">Set {formatDate(alert.set)}</p>
              </div>
              <button
                onClick={() => removeAlert(alert.cardId)}
                className="w-8 h-8 rounded-xl border border-[#1e1e2e] flex items-center justify-center text-[#64748b] hover:text-[#ef4444] hover:border-[#ef4444]/30 transition-colors flex-shrink-0"
                title="Remove alert"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
