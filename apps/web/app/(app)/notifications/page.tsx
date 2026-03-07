'use client';
import { useEffect, useState, useMemo } from 'react';
import { X, Bell, CheckCheck, Settings, Filter } from 'lucide-react';
import { useNotificationStore, type AppNotification } from '../../../lib/notificationStore';
import Link from 'next/link';

type Category = 'all' | 'battles' | 'social' | 'system';

const CATEGORY_ICONS: Record<string, Category> = {
  '⚔️': 'battles',
  '🗳️': 'battles',
  '🏆': 'battles',
  '📅': 'battles',
  '👤': 'social',
  '🔥': 'social',
  '👋': 'social',
  '⭐': 'social',
  '🎉': 'system',
  '🔔': 'system',
  '💎': 'system',
  '📢': 'system',
};

function getCategory(n: AppNotification): Category {
  for (const [icon, cat] of Object.entries(CATEGORY_ICONS)) {
    if (n.icon === icon || n.message.startsWith(icon)) return cat;
  }
  // Detect by content
  const msg = n.message.toLowerCase();
  if (msg.includes('battle') || msg.includes('vote') || msg.includes('pick')) return 'battles';
  if (msg.includes('follow') || msg.includes('reaction') || msg.includes('joined')) return 'social';
  return 'system';
}

// Build contextual notifications from localStorage
function buildContextualNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const extra: AppNotification[] = [];
    const now = Date.now();

    // Check for daily picks voted
    const picksSeen = localStorage.getItem('cb_dailypicks_seen');
    if (picksSeen) {
      extra.push({
        id: 'ctx_picks',
        icon: '📅',
        message: '⚔️ Today\'s Daily Picks are live — vote now to keep your streak going!',
        timestamp: 'today',
        read: false,
      });
    }

    // Check for recent vote history in localStorage
    const voteHistory = localStorage.getItem('cb_recent_votes');
    if (voteHistory) {
      try {
        const votes = JSON.parse(voteHistory) as Array<{ title: string; choice: string; time: number }>;
        const recent = votes.filter(v => now - v.time < 7200000); // last 2h
        for (const v of recent.slice(0, 2)) {
          extra.push({
            id: `ctx_vote_${v.time}`,
            icon: '⚔️',
            message: `${v.title} — you voted ${v.choice === 'left' ? 'LEFT' : 'RIGHT'}. Results coming soon!`,
            timestamp: new Date(v.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
          });
        }
      } catch {}
    }

    return extra;
  } catch {
    return [];
  }
}

function NotificationItem({ n, onDismiss, category }: {
  n: AppNotification;
  onDismiss: (id: string) => void;
  category: Category;
}) {
  const catColors: Record<Category, string> = {
    all: '#6c47ff',
    battles: '#6c47ff',
    social: '#22c55e',
    system: '#f59e0b',
  };

  const cat = getCategory(n);
  const color = catColors[cat];

  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all ${
        !n.read
          ? 'bg-[#12121a] border-[#1e1e2e]'
          : 'bg-[#0d0d14] border-[#1a1a28]'
      }`}
      style={!n.read ? { borderLeftColor: color, borderLeftWidth: '2px' } : {}}
    >
      {/* Icon */}
      <span className="text-xl flex-shrink-0 mt-0.5">{n.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!n.read ? 'text-[#f1f5f9] font-medium' : 'text-[#94a3b8]'}`}>
          {n.message}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-[#64748b]">{n.timestamp}</p>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${color}20`, color }}
          >
            {cat}
          </span>
        </div>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
          style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      )}

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(n.id)}
        className="flex-shrink-0 text-[#374151] hover:text-[#64748b] transition-colors p-0.5 -mr-1"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, dismiss, markAllRead } = useNotificationStore();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [contextual, setContextual] = useState<AppNotification[]>([]);

  // Load contextual notifications on mount
  useEffect(() => {
    setContextual(buildContextualNotifications());
  }, []);

  // Mark all as read when page is visited
  useEffect(() => {
    const timer = setTimeout(() => markAllRead(), 1500);
    return () => clearTimeout(timer);
  }, [markAllRead]);

  const allNotifications = useMemo(() => {
    // Merge store notifications with contextual ones (dedup by id)
    const storeIds = new Set(notifications.map(n => n.id));
    const merged = [
      ...contextual.filter(n => !storeIds.has(n.id)),
      ...notifications,
    ];
    return merged;
  }, [notifications, contextual]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return allNotifications;
    return allNotifications.filter(n => getCategory(n) === activeCategory);
  }, [allNotifications, activeCategory]);

  const categories: Array<{ key: Category; label: string; icon: string }> = [
    { key: 'all', label: 'All', icon: '📋' },
    { key: 'battles', label: 'Battles', icon: '⚔️' },
    { key: 'social', label: 'Social', icon: '👥' },
    { key: 'system', label: 'System', icon: '🔧' },
  ];

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-bold text-white bg-[#6c47ff] px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {allNotifications.length > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-[#6c47ff] hover:text-[#a78bfa] transition-colors font-semibold"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center text-[#64748b] hover:text-white transition-colors"
            title="Notification preferences"
          >
            <Settings size={14} />
          </Link>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={activeCategory === cat.key
              ? { background: '#6c47ff', color: 'white' }
              : { background: '#12121a', border: '1px solid #1e1e2e', color: '#64748b' }
            }
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
        <div className="flex-shrink-0 flex items-center gap-1 text-[9px] text-[#374151] ml-auto">
          <Filter size={10} />
          <span>Filter</span>
        </div>
      </div>

      {/* Preference link */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#1e1e2e]"
        style={{ background: '#0d0d14' }}
      >
        <p className="text-xs text-[#64748b]">Manage what you get notified about</p>
        <Link href="/settings" className="text-xs font-semibold text-[#6c47ff] hover:text-[#a78bfa] transition-colors">
          Preferences →
        </Link>
      </div>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#64748b]">
          <Bell size={44} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">
            {activeCategory === 'all' ? 'You\'re all caught up!' : `No ${activeCategory} notifications`}
          </p>
          <p className="text-sm mt-1 opacity-70">
            {activeCategory === 'all' ? 'No notifications right now.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <NotificationItem
              key={n.id}
              n={n}
              onDismiss={dismiss}
              category={getCategory(n)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-xs text-[#374151] pt-2">
          {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'all' ? ` in ${activeCategory}` : ''}
        </p>
      )}
    </div>
  );
}
