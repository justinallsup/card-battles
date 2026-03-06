/**
 * Simple in-memory notification store using React context + localStorage.
 * No external dependencies — just useState + a module-level signal.
 */
import { useState, useEffect, useCallback } from 'react';

export interface AppNotification {
  id: string;
  icon: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'cb_notifications_read';

// Hardcoded demo notifications
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    icon: '🗳️',
    message: 'Someone voted on your Mahomes vs Brady battle',
    timestamp: '2h ago',
    read: false,
  },
  {
    id: 'n2',
    icon: '🏆',
    message: 'Your battle ended — Mahomes wins with 73% of votes!',
    timestamp: '5h ago',
    read: false,
  },
  {
    id: 'n3',
    icon: '👤',
    message: 'slabmaster started following you',
    timestamp: '1d ago',
    read: false,
  },
  {
    id: 'n4',
    icon: '🔥',
    message: 'Your pull got 50 reactions!',
    timestamp: '2d ago',
    read: true,
  },
  {
    id: 'n5',
    icon: '⚔️',
    message: 'New battle challenge: rookiehunter wants to battle you',
    timestamp: 'just now',
    read: false,
  },
];

// Module-level singleton state (persists across re-renders without zustand)
let _notifications: AppNotification[] = (() => {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  try {
    const readIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return INITIAL_NOTIFICATIONS.map(n => ({ ...n, read: readIds.includes(n.id) ? true : n.read }));
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
})();

let _listeners: Array<() => void> = [];

function notifyListeners() {
  _listeners.forEach(fn => fn());
}

function persistRead() {
  if (typeof window === 'undefined') return;
  const readIds = _notifications.filter(n => n.read).map(n => n.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
}

export function useNotificationStore() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const fn = () => forceUpdate(x => x + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  }, []);

  const notifications = _notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  const dismiss = useCallback((id: string) => {
    _notifications = _notifications.filter(n => n.id !== id);
    persistRead();
    notifyListeners();
  }, []);

  const markAllRead = useCallback(() => {
    _notifications = _notifications.map(n => ({ ...n, read: true }));
    persistRead();
    notifyListeners();
  }, []);

  const markRead = useCallback((id: string) => {
    _notifications = _notifications.map(n => n.id === id ? { ...n, read: true } : n);
    persistRead();
    notifyListeners();
  }, []);

  return { notifications, unreadCount, dismiss, markAllRead, markRead };
}
