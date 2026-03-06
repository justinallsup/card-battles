'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, Plus, Trophy, Activity, User } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { href: '/feed',         label: 'Feed',     icon: Swords   },
  { href: '/leaderboards', label: 'Ranks',    icon: Trophy   },
  { href: '/create',       label: 'Create',   icon: Plus,    accent: true },
  { href: '/activity',     label: 'Activity', icon: Activity },
  { href: '/profile',      label: 'Profile',  icon: User     },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-t border-[#1e1e2e]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-3 px-3 min-w-0 flex-1 transition-colors relative',
                accent && 'relative',
              )}
            >
              {accent ? (
                <>
                  {/* Glow backdrop */}
                  <div
                    className="w-14 h-14 -mt-7 rounded-full flex items-center justify-center border-4 border-[#0a0a0f] animate-bounce-create"
                    style={{
                      background: 'linear-gradient(135deg, #6c47ff 0%, #8b5cf6 50%, #a78bfa 100%)',
                      boxShadow: '0 0 20px rgba(108, 71, 255, 0.6), 0 0 40px rgba(108, 71, 255, 0.3), 0 4px 12px rgba(0,0,0,0.4)',
                    }}
                  >
                    <Icon size={22} className="text-white drop-shadow-sm" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#6c47ff] mt-1">
                    {label}
                  </span>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Icon
                      size={22}
                      className={cn(
                        'transition-colors',
                        active ? 'text-[#6c47ff]' : 'text-[#64748b]'
                      )}
                    />
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium',
                    active ? 'text-[#6c47ff]' : 'text-[#64748b]'
                  )}>
                    {label}
                  </span>
                  {/* Active indicator dot */}
                  {active && (
                    <span
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6c47ff] animate-nav-dot"
                      style={{ boxShadow: '0 0 4px rgba(108, 71, 255, 0.8)' }}
                    />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
