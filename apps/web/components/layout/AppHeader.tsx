'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';
import { useNotificationStore } from '../../lib/notificationStore';

export function AppHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotificationStore();

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#1e1e2e]"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 group">
          <span className="text-xl transition-transform duration-200 group-hover:scale-110">⚔️</span>
          <span className="font-black text-lg tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #6c47ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CARD
            </span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #6c47ff 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              BATTLES
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Search button — always visible */}
          <button
            onClick={() => router.push('/search')}
            className="text-[#64748b] hover:text-white transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {user ? (
            <>
              {/* Notifications bell */}
              <Link
                href="/notifications"
                className="text-[#64748b] hover:text-white transition-colors relative"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#ef4444] rounded-full border-2 border-[#0a0a0f] flex items-center justify-center"
                  >
                    <span
                      className="absolute inset-0 rounded-full bg-[#ef4444] animate-ping opacity-75"
                      style={{ animationDuration: '2s' }}
                    />
                  </span>
                )}
              </Link>
              <Link href={`/profile/${user.username}`}>
                <Avatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-[#64748b] hover:text-white transition-colors px-3 py-1.5">
                Log in
              </Link>
              <Link
                href="/register"
                className="text-sm text-white px-3 py-1.5 rounded-lg font-semibold transition-all hover:brightness-110 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6c47ff, #8b5cf6)',
                  boxShadow: '0 0 12px rgba(108, 71, 255, 0.25)',
                }}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
