'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, Plus, Trophy, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { href: '/feed', label: 'Battles', Icon: Swords },
  { href: '/create', label: 'Create', Icon: Plus },
  { href: '/leaderboards', label: 'Leaderboard', Icon: Trophy },
  { href: '/profile/me', label: 'Profile', Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#12121a]/95 backdrop-blur-md border-t border-[#1e1e2e]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative',
                isActive ? 'text-[#6c47ff]' : 'text-[#64748b] hover:text-[#94a3b8]'
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{label}</span>
              {isActive && (
                <span 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6c47ff]"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
