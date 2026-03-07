'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Settings, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';
import { useNotificationStore } from '../../lib/notificationStore';
import { useState, useRef, useEffect } from 'react';
import { SearchOverlay } from '../SearchOverlay';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface RankInfo { name: string; icon: string; color: string; }

function useUserRank(loggedIn: boolean) {
  const [rank, setRank] = useState<RankInfo | null>(null);
  useEffect(() => {
    if (!loggedIn) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('cb_access_token') : null;
    if (!token) return;
    fetch(`${BASE_URL}/me/rank`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((d: { currentRank?: RankInfo }) => { if (d.currentRank) setRank(d.currentRank); })
      .catch(() => {});
  }, [loggedIn]);
  return rank;
}

function UserDropdown({ username, avatarUrl, onClose }: {
  username: string;
  avatarUrl?: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleLogout = () => {
    onClose();
    if (typeof logout === 'function') logout();
    router.push('/login');
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[#1e1e2e] overflow-hidden z-50 shadow-xl"
      style={{ background: '#12121a', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
    >
      <div className="px-3 py-2.5 border-b border-[#1e1e2e]">
        <p className="text-xs font-bold text-white truncate">@{username}</p>
        <p className="text-[10px] text-[#64748b]">Card Collector</p>
      </div>

      <div className="py-1">
        <Link
          href={`/profile/${username}`}
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#94a3b8] hover:text-white hover:bg-[#1e1e2e] transition-colors"
        >
          <User size={14} className="text-[#6c47ff]" />
          Profile
        </Link>
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#94a3b8] hover:text-white hover:bg-[#1e1e2e] transition-colors"
        >
          <Settings size={14} className="text-[#6c47ff]" />
          Settings
        </Link>
      </div>

      <div className="py-1 border-t border-[#1e1e2e]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function AppHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [apiOk, setApiOk] = useState(true);
  const rank = useUserRank(!!user);

  useEffect(() => {
    const check = () => fetch(`${BASE_URL.replace('/api/v1', '')}/health`)
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

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
          {/* Connection status dot */}
          <div
            className={`w-2 h-2 rounded-full ${apiOk ? 'bg-green-400' : 'bg-red-400'}`}
            title={apiOk ? 'Connected' : 'Disconnected'}
          />
        </Link>

        <div className="flex items-center gap-3">
          {/* Search overlay button — Cmd+K */}
          <SearchOverlay />

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

              {/* Avatar with dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 group"
                  aria-label="User menu"
                >
                  {rank && (
                    <Link href="/rank" onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black shrink-0 hover:opacity-80 transition-opacity"
                      style={{ borderColor: rank.color + '50', background: rank.color + '15', color: rank.color }}
                    >
                      <span>{rank.icon}</span>
                      <span className="hidden sm:inline">{rank.name}</span>
                    </Link>
                  )}
                  <Avatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
                  <ChevronDown
                    size={12}
                    className="text-[#64748b] group-hover:text-white transition-colors"
                    style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  />
                </button>

                {dropdownOpen && (
                  <UserDropdown
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    onClose={() => setDropdownOpen(false)}
                  />
                )}
              </div>
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
