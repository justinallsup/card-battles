'use client';
import { useEffect } from 'react';
import { X, Bell, CheckCheck } from 'lucide-react';
import { useNotificationStore, type AppNotification } from '../../../lib/notificationStore';

function NotificationItem({ n, onDismiss }: { n: AppNotification; onDismiss: (id: string) => void }) {
  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all ${
        !n.read
          ? 'bg-[#12121a] border-[#1e1e2e] border-l-2 border-l-[#6c47ff]'
          : 'bg-[#0d0d14] border-[#1a1a28]'
      }`}
    >
      {/* Icon */}
      <span className="text-xl flex-shrink-0 mt-0.5">{n.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!n.read ? 'text-[#f1f5f9] font-medium' : 'text-[#94a3b8]'}`}>
          {n.message}
        </p>
        <p className="text-xs text-[#64748b] mt-0.5">{n.timestamp}</p>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <span className="w-2 h-2 rounded-full bg-[#6c47ff] flex-shrink-0 mt-1.5"
          style={{ boxShadow: '0 0 6px rgba(108, 71, 255, 0.6)' }}
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

  // Mark all as read when page is visited
  useEffect(() => {
    const timer = setTimeout(() => markAllRead(), 1500);
    return () => clearTimeout(timer);
  }, [markAllRead]);

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
        {notifications.length > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-[#6c47ff] hover:text-[#a78bfa] transition-colors font-semibold"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <div className="text-center py-20 text-[#64748b]">
          <Bell size={44} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">You&apos;re all caught up!</p>
          <p className="text-sm mt-1 opacity-70">No notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <NotificationItem key={n.id} n={n} onDismiss={dismiss} />
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <p className="text-center text-xs text-[#374151] pt-2">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
