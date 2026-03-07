'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Swords, Plus, Trophy, User, Compass, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

// ── Explore drawer feature tiles organised by category ──────────────────────
const EXPLORE_CATEGORIES = [
  {
    label: 'Compete',
    tiles: [
      { href: '/leaderboards', label: 'Battles',     icon: '⚔️',  desc: 'Active card battles'  },
      { href: '/tournaments',  label: 'Tournaments', icon: '🏆',  desc: 'Bracket battles'      },
      { href: '/bracket',      label: 'Bracket',     icon: '📊',  desc: 'Build a bracket'      },
      { href: '/daily-picks',  label: 'Daily Picks', icon: '📅',  desc: "Today's picks"        },
      { href: '/events',       label: 'Events',      icon: '🎉',  desc: 'Limited-time battles' },
      { href: '/multi-battles',label: 'Best of 3',   icon: '⚔️',  desc: '3-round series'       },
      { href: '/series',       label: 'Battle Series', icon: '📺', desc: 'Recurring battles'     },
    ],
  },
  {
    label: 'Collect',
    tiles: [
      { href: '/pull-arena',   label: 'Pull Arena',  icon: '📦',  desc: 'Open card packs'      },
      { href: '/collection',   label: 'Collection',  icon: '🎴',  desc: 'Your saved cards'     },
      { href: '/wishlist',     label: 'Wishlist',    icon: '💝',  desc: 'Cards you want'       },
      { href: '/marketplace',  label: 'Marketplace', icon: '🏪',  desc: 'Buy & sell cards'     },
      { href: '/trades',       label: 'Trades',      icon: '🔄',  desc: 'Trade proposals'      },
      { href: '/auctions',     label: 'Auctions',    icon: '🔨',  desc: 'Bid on graded cards'  },
      { href: '/sets',         label: 'Card Sets',   icon: '🃏',  desc: 'Browse collections'   },
    ],
  },
  {
    label: 'Research',
    tiles: [
      { href: '/market',       label: 'Market',      icon: '📈',  desc: 'Card prices'          },
      { href: '/grader',       label: 'Grader',      icon: '🏅',  desc: 'Simulate grading'     },
      { href: '/compare',      label: 'Compare',     icon: '⚖️',   desc: 'Compare cards'        },
      { href: '/calculator',   label: 'Calculator',  icon: '💰',  desc: 'Card ROI estimator'   },
      { href: '/history',      label: 'Price Hist.', icon: '📉',  desc: 'Price history'        },
    ],
  },
  {
    label: 'Community',
    tiles: [
      { href: '/feed',         label: 'Feed',        icon: '📡',  desc: 'Live feed'            },
      { href: '/leaderboards', label: 'Leaderboard', icon: '🥇',  desc: 'Top voters'           },
      { href: '/community',    label: 'Community',   icon: '🌐',  desc: 'Social hub'           },
      { href: '/discover',     label: 'Discover',    icon: '🔍',  desc: 'Find collectors'      },
      { href: '/hall-of-fame', label: 'Hall of Fame', icon: '🏛️', desc: 'Greatest cards ever'  },
      { href: '/rank',         label: 'Rank',        icon: '🏆',  desc: 'Your collector rank'  },
      { href: '/predictions',  label: 'Predictions', icon: '🔮',  desc: 'Forecast battles'     },
      { href: '/multi-battles',label: 'Best of 3',   icon: '⚔️',  desc: '3-round battle series'},
      { href: '/digest',       label: 'Digest',      icon: '📧',  desc: 'Weekly email digest'   },
    ],
  },
  {
    label: 'Creator',
    tiles: [
      { href: '/earnings',     label: 'Earnings',    icon: '💵',  desc: 'Creator revenue'      },
      { href: '/analytics',    label: 'Analytics',   icon: '📊',  desc: 'Your stats'           },
      { href: '/create',       label: 'New Battle',  icon: '⚔️',  desc: 'Start a battle'       },
    ],
  },
  {
    label: 'Tools',
    tiles: [
      { href: '/scanner',      label: 'Scanner',     icon: '📸',  desc: 'Scan & identify'      },
      { href: '/news',         label: 'News',        icon: '📰',  desc: 'Latest card news'     },
      { href: '/analytics',    label: 'Analytics',   icon: '📊',  desc: 'Your stats'           },
      { href: '/portfolio',    label: 'Portfolio',   icon: '💼',  desc: 'Collection value'     },
      { href: '/learn',        label: 'Learn',       icon: '📚',  desc: 'Card grading guide'   },
      { href: '/condition',    label: 'Condition',   icon: '🔍',  desc: 'Check card condition' },
    ],
  },
];

// Quick-action items for long-press menu
const QUICK_ACTIONS = [
  { href: '/create',       label: 'Create',     icon: '⚔️' },
  { href: '/marketplace',  label: 'Market',     icon: '🏪' },
  { href: '/leaderboards', label: 'Leaderboard', icon: '🥇' },
];

// All explore paths for active detection
const ALL_EXPLORE_PATHS = EXPLORE_CATEGORIES.flatMap(c => c.tiles.map(t => t.href));

function haptic(ms = 10) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch {}
  }
}

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
          maxHeight: '85vh',
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

        {/* Categorised tiles */}
        <div className="p-4 space-y-5">
          {EXPLORE_CATEGORIES.map(category => (
            <div key={category.label}>
              <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-2">{category.label}</p>
              <div className="grid grid-cols-3 gap-2">
                {category.tiles.map(tile => {
                  const active = pathname === tile.href || pathname.startsWith(tile.href + '/');
                  return (
                    <Link
                      key={tile.href}
                      href={tile.href}
                      onClick={onClose}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all"
                      style={active
                        ? { background: 'rgba(108,71,255,0.12)', borderColor: 'rgba(108,71,255,0.4)' }
                        : { background: '#0a0a0f', borderColor: '#1e1e2e' }
                      }
                    >
                      <span className="text-xl leading-none">{tile.icon}</span>
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-white">{tile.label}</p>
                        <p className="text-[9px] text-[#64748b] mt-0.5 leading-tight">{tile.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Quick-action popup for long-press on Explore
function QuickActionMenu({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-[#1e1e2e] overflow-hidden"
        style={{ background: '#12121a', boxShadow: '0 -4px 24px rgba(0,0,0,0.6)', width: 200 }}
      >
        <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest px-4 pt-3 pb-1">Quick Actions</p>
        {QUICK_ACTIONS.map(a => (
          <Link
            key={a.href}
            href={a.href}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1e1e2e] transition-colors"
          >
            <span className="text-lg">{a.icon}</span>
            <span className="text-sm font-semibold text-white">{a.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  // Long-press detection for Explore button
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const handleExplorePointerDown = useCallback(() => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      haptic(30);
      setQuickMenuOpen(true);
    }, 500);
  }, []);

  const handleExplorePointerUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!longPressTriggered.current) {
      haptic();
      setExploreOpen(true);
    }
  }, []);

  const handleExplorePointerCancel = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    haptic();
    if (user?.username) {
      router.push(`/profile/${user.username}`);
    } else {
      router.push('/login');
    }
  };

  // Swipe gesture on nav bar to cycle main sections
  const swipeStartX = useRef<number | null>(null);
  const MAIN_SECTIONS = ['/feed', '/leaderboards', user?.username ? `/profile/${user.username}` : '/login'];

  const handleNavTouchStart = useCallback((e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
  }, []);

  const handleNavTouchEnd = useCallback((e: React.TouchEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (Math.abs(dx) < 60) { swipeStartX.current = null; return; }

    const currentIdx = MAIN_SECTIONS.findIndex(s => pathname.startsWith(s));
    const base = currentIdx === -1 ? 0 : currentIdx;
    const nextIdx = dx < 0
      ? Math.min(base + 1, MAIN_SECTIONS.length - 1)
      : Math.max(base - 1, 0);
    if (nextIdx !== base) {
      haptic();
      router.push(MAIN_SECTIONS[nextIdx]);
    }
    swipeStartX.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router, user]);

  const navItems = [
    { href: '/feed',         label: 'Feed',    icon: Swords,  key: 'feed' },
    { href: '/leaderboards', label: 'Battles', icon: Trophy,  key: 'leaderboards' },
    { href: '/create',       label: 'Create',  icon: Plus,    key: 'create', accent: true },
    { key: 'explore',        label: 'Explore', icon: Compass  },
    { key: 'profile',        label: 'Profile', icon: User     },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-t border-[#1e1e2e]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onTouchStart={handleNavTouchStart}
        onTouchEnd={handleNavTouchEnd}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around px-2">
          {navItems.map(({ href, label, icon: Icon, accent, key }) => {
            const active = href ? (pathname === href || pathname.startsWith(href + '/')) : false;
            const isProfileActive = key === 'profile' && user?.username &&
              (pathname === `/profile/${user.username}` || pathname.startsWith('/profile/'));
            const isExploreActive = key === 'explore' && ALL_EXPLORE_PATHS.some(p => pathname.startsWith(p));

            if (accent) {
              return (
                <Link
                  key={key}
                  href={href!}
                  onClick={() => haptic()}
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

            // Explore button with long-press
            if (key === 'explore') {
              return (
                <button
                  key={key}
                  onPointerDown={handleExplorePointerDown}
                  onPointerUp={handleExplorePointerUp}
                  onPointerCancel={handleExplorePointerCancel}
                  aria-label={label}
                  className="flex flex-col items-center gap-1 py-3 px-3 min-w-0 flex-1 transition-colors relative select-none"
                >
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
                </button>
              );
            }

            // Profile button
            if (key === 'profile') {
              return (
                <button
                  key={key}
                  onClick={handleProfileClick}
                  aria-label={label}
                  className="flex flex-col items-center gap-1 py-3 px-3 min-w-0 flex-1 transition-colors relative"
                >
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
                </button>
              );
            }

            // Regular link nav item
            return (
              <Link
                key={key}
                href={href!}
                aria-label={label}
                onClick={() => haptic()}
                className="flex flex-col items-center gap-1 py-3 px-3 min-w-0 flex-1 transition-colors relative"
              >
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
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Explore drawer */}
      {exploreOpen && <ExploreDrawer onClose={() => setExploreOpen(false)} />}

      {/* Long-press quick-action menu */}
      {quickMenuOpen && <QuickActionMenu onClose={() => setQuickMenuOpen(false)} />}
    </>
  );
}
