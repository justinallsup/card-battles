'use client';
import { useState } from 'react';
import { showToast } from './ui/Toast';

export function PushNotificationSetup() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

  const enable = async () => {
    if (!('Notification' in window)) {
      showToast('Push notifications not supported in this browser', 'error');
      return;
    }
    setStatus('requesting');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setStatus('granted');
      try {
        await navigator.serviceWorker.register('/sw.js');
        const token = localStorage.getItem('cb_token');
        if (token) {
          await fetch(`${API}/me/push-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ subscription: { endpoint: 'demo', keys: {} } }),
          });
        }
        showToast('🔔 Push notifications enabled!', 'success');
      } catch {
        showToast('Could not register for push notifications', 'error');
      }
    } else {
      setStatus('denied');
      showToast('Push notifications blocked', 'error');
    }
  };

  if (status === 'granted') {
    return <span className="text-xs text-green-400">🔔 Notifications on</span>;
  }

  return (
    <button
      onClick={enable}
      disabled={status === 'requesting'}
      className="text-xs text-[#94a3b8] hover:text-white transition-colors disabled:opacity-50"
    >
      {status === 'requesting' ? 'Requesting...' : '🔔 Enable notifications'}
    </button>
  );
}
