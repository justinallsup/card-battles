'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Swords, Plus, Trophy, User, Compass, X, BookMarked, Eye, Target, Calendar, Zap, Star, Medal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

// Explore drawer feature tiles
const EXPLORE_TILES = [
  { href: '/marketplace',  label: 'Marketplace',  icon: '🏪', desc: 'Buy & sell cards'    },
  { href: '/players',      label: 'Players',       icon: '🏅', desc: 'Player profiles'    },
  { href: '/scanner',      label: 'Card Scanner',  icon: '📸', desc: 'Scan & identify'    },
  { href: '/hall-of-fame', label: 'Hall of Fame',  icon: '🏛️', desc: 'Greatest cards ever' },
  { href: '/get-app',      label: 'Get the App',   icon: '📱', desc: 'Install PWA / app'  },
  { href: '/community',    label: 'Community',    icon: '🌐', desc: 'Social hub'          },
  { href: '/learn',        label: 'Learn',        icon: '📚', desc: 'Card grading guide'  },
  { href: '/pull-arena',   label: 'Pull Arena',    icon: '🎴', desc: 'Open card packs'    },
  { href: '/tournaments',  label: 'Tournaments',   icon: '🏆', desc: 'Bracket battles'    },
  { href: '/fantasy',      label: 'Fantasy',       icon: '🧙', desc: 'Build your team'    },
  { href: '/auctions',     label: 'Live Auctions', icon: '🔨', desc: 'Bid on graded cards' },
  { href: '/sets',         label: 'Card Sets',     icon: '🃏', desc: 'Browse collections'  },
  { href: '/analytics',   label: 'Analytics',     icon: '📊', desc: 'Your stats'          },
  { href: '/market',       label: 'Market',        icon: '📈', desc: 'Card prices'        },
  { href: '/compare',      label: 'Compare',       icon: '⚖️',  desc: 'Compare cards'      },
  { href: '/grader',       label: 'Card Grader',   icon: '🏅', desc: 'Simulate grading'   },
  { href: '/activity',     label: 'Activity',      icon: '📡', desc: 'Live feed'          },
  { href: '/daily-picks',  label: 'Daily Picks',   icon: '📅', desc: 'Today\'s picks'     },
  { href: '/collection',   label: 'Collection',    icon: '🎴', desc: 'Your saved cards'   },
  { href: '/watchlist',    label: 'Watchlist',     icon: '🔖', desc: 'Watched battles'    },
  { href: '/history',      label: 'Vote History',  icon: '🗳️', desc: 'Your votes'         },
  { href: '/alerts',       label: 'Price Alerts',  icon: '🔔', desc: 'Card price alerts'  },
  { href: '/trades',       label: 'Trades',         icon: '🔄', desc: 'Trade proposals'    },
  { href: '/portfolio',    label: 'Portfolio',      icon: '💼', desc: 'Collection value'   },
  { href: '/discover',     label: 'Discover',      icon: '🔍', desc: 'Find collectors'    },
  { href: '/search',       label: 'Search',        icon: '🔎', desc: 'Find anything'      },
  { href: '/pro',          label: 'Pro',           icon: '⭐', desc: 'Upgrade account'    },
];

function ExploreDrawer({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-[#1e1e2e] pb-safe"
        style={{
          background: '#12121a',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#374151]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-[#6c47ff]" />
            <h2 className="text-base font-black text-white">Explore</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center text-[#64748b] hover:text-white transition-colors"
            aria-label="Close explore menu"
          >
            <X size={15} />
          </button>
        </div>

        {/* Grid of tiles */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {EXPLORE_TILES.map(tile => {
            const active = pathname === tile.href || pathname.startsWith(tile.href + '/');
            return (
              <Link
                key={tile.href}
                href={tile.href}
                onClick={onClose}
                className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border transition-all"
                style={active
                  ? { background: 'rgba(108,71,255,0.12)', borderColor: 'rgba(108,71,255,0.4)' }
                  : { background: '#0a0a0f', borderColor: '#1e1e2e' }
                }
              >
                <span className="text-2xl leading-none">{tile.icon}</span>
                <div className="text-center">
                  <p className="text-xs font-bold text-white">{tile.label}</p>
                  <p className="text-[9px] text-[#64748b] mt-0.5">{tile.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [exploreOpen, setExploreOpen] = useState(false);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user?.username) {
      router.push(`/profile/${user.username}`);
    } else {
      router.push('/login');
    }
  };

  const navItems = [
    { href: '/feed',         label: 'Feed',    icon: Swords,  key: 'feed' },
    { href: '/leaderboards', label: 'Battles', icon: Trophy,  key: 'leaderboards' },
    { href: '/create',       label: 'Create',  icon: Plus,    key: 'create', accent: true },
    { key: 'explore',        label: 'Explore', icon: Compass, action: () => setExploreOpen(true) },
    { key: 'profile',        label: 'Profile', icon: User,    action: handleProfileClick },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-t border-[#1e1e2e]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around px-2">
          {navItems.map(({ href, label, icon: Icon, accent, key, action }) => {
            const active = href ? (pathname === href || pathname.startsWith(href + '/')) : false;
            const isProfileActive = key === 'profile' && user?.username && (pathname === `/profile/${user.username}` || pathname.startsWith('/profile/'));
            const isExploreActive = key === 'explore' && ['/pull-arena','/tournaments','/fantasy','/market','/compare','/activity','/daily-picks','/collection','/watchlist','/search','/notifications','/pro','/history','/alerts','/grader','/auctions','/sets','/analytics','/community','/learn','/marketplace','/players','/scanner','/hall-of-fame','/get-app','/trades','/portfolio','/discover','/calculator','/bracket'].some(p => pathname.startsWith(p));

            if (accent) {
              return (
                <Link key={key} href={href!}
                  className="flex flex-col items-center gap-1 py-3 px-3 min-w-0 flex-1 relative"
                >
                  <div
                    className="w-14 h-14 -mt-7 rounded-full flex items-center justify-center border-4 border-[#0a0a0f] animate-bounce-create"
                    style={{
                      background: 'linear-gradient(135deg, #6c47ff 0%, #8b5cf6 50%, #a78bfa 100%)',
                      boxShadow: '0 0 20px rgba(108, 71, 255, 0.6), 0 0 40px rgba(108, 71, 255, 0.3), 0 4px 12px rgba(0,0,0,0.4)',
                    }}
                  >
                    <Icon size={22} className="text-white drop-shadow-sm" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#6c47ff] mt-1">{label}</span>
                </Link>
              );
            }

            const isActive = active || isProfileActive || isExploreActive;

            const content = (
              <>
                <div className="relative">
                  <Icon
                    size={22}
                    className={cn('transition-colors', isActive ? 'text-[#6c47ff]' : 'text-[#64748b]')}
                  />
                </div>
                <span className={cn('text-[10px] font-medium', isActive ? 'text-[#6c47ff]' : 'text-[#64748b]')}>
                  {label}
                </span>
                {isActive && (
                  <span
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6c47ff] animate-nav-dot"
                    style={{ boxShadow: '0 0 4px rgba(108, 71, 255, 0.8)' }}
                  />
                )}
              </>
            );

            if (action) {
              return (
                <button
                  key={key}
                  onClick={action}
                  aria-label={label}
                  className="flex flex-col items-center gap-1 py-3 px-3 min-w-0 flex-1 transition-colors relative"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={key}
                href={href!}
                aria-label={label}
                className="flex flex-col items-center gap-1 py-3 px-3 min-w-0 flex-1 transition-colors relative"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Explore drawer */}
      {exploreOpen && <ExploreDrawer onClose={() => setExploreOpen(false)} />}
    </>
  );
}
