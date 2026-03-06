'use client';
import Link from 'next/link';
import { Swords, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';

export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#1e1e2e]">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/feed" className="flex items-center gap-2">
          <Swords size={22} className="text-[#6c47ff]" />
          <span className="font-black text-lg tracking-tight text-white">
            CARD<span className="text-[#6c47ff]">BATTLES</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button className="text-[#64748b] hover:text-white transition-colors">
                <Bell size={20} />
              </button>
              <Link href={`/profile/${user.username}`}>
                <Avatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-[#64748b] hover:text-white transition-colors px-3 py-1.5">
                Log in
              </Link>
              <Link href="/register" className="text-sm bg-[#6c47ff] hover:bg-[#5a35ee] text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
