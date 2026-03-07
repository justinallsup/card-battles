'use client';
import { useEffect, useState } from 'react';

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info'; };

// Simple module-level store
const listeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

export function showToast(message: string, type: Toast['type'] = 'info') {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, type }];
  listeners.forEach(l => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(l => l(toasts));
  }, 3000);
}

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.push(setItems);
    return () => {
      const i = listeners.indexOf(setItems);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  if (!items.length) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {items.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm transition-all ${
            t.type === 'success' ? 'bg-[#22c55e]/90 text-white' :
            t.type === 'error' ? 'bg-[#ef4444]/90 text-white' :
            'bg-[#12121a]/90 text-white border border-[#1e1e2e]'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
