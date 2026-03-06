'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, Plus, Trophy, Target, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { href: '/feed',        label: 'Feed',    icon: Swords  },
  { href: '/leaderboards', label: 'Ranks',  icon: Target  },
  { href: '/create',      label: 'Create',  icon: Plus,   accent: true },
  { href: '/fantasy',     label: 'Fantasy', icon: Trophy  },
  { href: '/profile',     label: 'Profile', icon: User    },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-t border-[#1e1e2e]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-3 px-3 min-w-0 flex-1 transition-colors',
                accent && 'relative',
              )}
            >
              {accent ? (
                <div className="w-12 h-12 -mt-6 bg-[#6c47ff] rounded-full flex items-center justify-center shadow-lg shadow-[#6c47ff]/40 border-4 border-[#0a0a0f]">
                  <Icon size={20} className="text-white" />
                </div>
              ) : (
                <Icon
                  size={22}
                  className={cn(
                    'transition-colors',
                    active ? 'text-[#6c47ff]' : 'text-[#64748b]'
                  )}
                />
              )}
              <span className={cn(
                'text-[10px] font-medium',
                accent ? 'text-[#64748b] mt-1' : active ? 'text-[#6c47ff]' : 'text-[#64748b]'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
