'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, User, Bell, AlertTriangle, LogOut, Trash2, Check, X, Palette, Info, Star } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getToken } from '../../../lib/api';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { PushNotificationSetup } from '../../../components/PushNotificationSetup';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface MeData {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  created_at?: string;
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, iconColor, children }: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1e1e2e]">
        <Icon size={15} className={iconColor} />
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

// ── Read-only field ─────────────────────────────────────────────────────────────
function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#64748b] block mb-1">{label}</label>
      <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-[#94a3b8]">
        {value ?? '—'}
      </div>
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange, label, desc }: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        {desc && <p className="text-xs text-[#64748b] mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
          enabled ? 'bg-[#6c47ff]' : 'bg-[#1e1e2e]'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ── Delete confirmation modal ──────────────────────────────────────────────────
function DeleteModal({ onClose }: { onClose: () => void }) {
  const [confirmed, setConfirmed] = useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#12121a] border border-[#ef4444]/30 rounded-2xl w-full max-w-sm p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#ef4444]">
            <AlertTriangle size={16} />
            <h3 className="font-black text-white">Delete Account</h3>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-white"><X size={16} /></button>
        </div>
        <p className="text-sm text-[#94a3b8]">
          This action is permanent and cannot be undone. All your battles, votes, and data will be deleted.
        </p>
        <div>
          <label className="text-xs text-[#64748b] block mb-1.5">
            Type <span className="text-white font-mono">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmed}
            onChange={e => setConfirmed(e.target.value)}
            placeholder="DELETE"
            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#ef4444]"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#1e1e2e] text-[#64748b] text-sm font-semibold">
            Cancel
          </button>
          <button
            disabled={confirmed !== 'DELETE'}
            className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
        <p className="text-[10px] text-[#374151] text-center">Demo mode: account deletion is simulated</p>
      </div>
    </div>
  );
}

// ── Main settings page ─────────────────────────────────────────────────────────
const SPORTS = [
  { id: 'nfl', label: 'NFL', emoji: '🏈' },
  { id: 'nba', label: 'NBA', emoji: '🏀' },
  { id: 'mlb', label: 'MLB', emoji: '⚾' },
];

export default function SettingsPage() {
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bioInitialized, setBioInitialized] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sports prefs from localStorage
  const [sportPrefs, setSportPrefs] = useState<string[]>(['nfl', 'nba', 'mlb']);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cb_sports_prefs');
      if (stored) {
        try { setSportPrefs(JSON.parse(stored)); } catch {}
      }
    }
  }, []);

  const toggleSport = (id: string) => {
    setSportPrefs((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      if (typeof window !== 'undefined') {
        localStorage.setItem('cb_sports_prefs', JSON.stringify(next));
      }
      return next;
    });
  };

  const [notifications, setNotifications] = useState({
    battleResults: true,
    newFollowers: true,
    voteMilestones: false,
    dailyPicks: true,
  });

  const { data: me, isLoading } = useQuery<MeData>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    },
    enabled: !!authUser,
  });

  // Initialize bio/avatar from me data once
  if (me && !bioInitialized) {
    setBio(me.bio ?? '');
    setAvatarUrl(me.avatar_url ?? '');
    setBioInitialized(true);
  }

  const updateProfile = useMutation({
    mutationFn: async () => {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({ bio, avatarUrl }),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => {
      // Error is displayed inline via updateProfile.isError
    },
  });

  if (!authUser) {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  const handleLogout = () => {
    if (typeof logout === 'function') logout();
    router.push('/login');
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#6c47ff]/15 flex items-center justify-center">
          <Settings size={18} className="text-[#6c47ff]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Settings</h1>
          <p className="text-xs text-[#64748b]">Manage your account and preferences</p>
        </div>
      </div>

      {/* Account section */}
      <Section title="Account" icon={User} iconColor="text-[#3b82f6]">
        <ReadOnlyField label="Username" value={me?.username} />
        <ReadOnlyField label="Email" value={me?.email} />
        <ReadOnlyField
          label="Member since"
          value={me?.created_at
            ? new Date(me.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : undefined
          }
        />
      </Section>

      {/* Profile section */}
      <Section title="Profile" icon={User} iconColor="text-[#6c47ff]">
        <div>
          <label className="text-xs font-semibold text-[#64748b] block mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Tell the world about your card collection…"
            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#374151] resize-none focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
          <p className="text-[10px] text-[#374151] mt-1 text-right">{bio.length}/200</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#64748b] block mb-1">Avatar URL</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#374151] focus:outline-none focus:border-[#6c47ff] transition-colors"
          />
        </div>
        <button
          onClick={() => updateProfile.mutate()}
          disabled={updateProfile.isPending}
          className="w-full py-2.5 rounded-xl bg-[#6c47ff] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
        >
          {updateProfile.isPending ? (
            <LoadingSpinner className="w-4 h-4" />
          ) : saved ? (
            <><Check size={14} /> Saved!</>
          ) : (
            'Save Profile'
          )}
        </button>
        {updateProfile.isError && (
          <p className="text-xs text-[#ef4444] text-center">Failed to save profile. Please try again.</p>
        )}
      </Section>

      {/* Notifications section */}
      <Section title="Notifications" icon={Bell} iconColor="text-[#f59e0b]">
        <Toggle
          label="Battle results"
          desc="Get notified when your battles end"
          enabled={notifications.battleResults}
          onChange={() => toggleNotif('battleResults')}
        />
        <Toggle
          label="New followers"
          desc="When someone follows you"
          enabled={notifications.newFollowers}
          onChange={() => toggleNotif('newFollowers')}
        />
        <Toggle
          label="Vote milestones"
          desc="When your battles hit vote milestones"
          enabled={notifications.voteMilestones}
          onChange={() => toggleNotif('voteMilestones')}
        />
        <Toggle
          label="Daily picks"
          desc="Reminders for daily picks"
          enabled={notifications.dailyPicks}
          onChange={() => toggleNotif('dailyPicks')}
        />
        <p className="text-[10px] text-[#374151]">Notification preferences are saved locally (demo mode)</p>
        <div className="pt-2 border-t border-[#1e1e2e]">
          <p className="text-xs font-semibold text-[#94a3b8] mb-2">Browser Push Notifications</p>
          <PushNotificationSetup />
        </div>
      </Section>

      {/* Preferences section */}
      <Section title="Sport Preferences" icon={Star} iconColor="text-[#22c55e]">
        <p className="text-xs text-[#64748b] mb-2">Choose which sports appear in your feed.</p>
        <div className="flex gap-3">
          {SPORTS.map((sport) => {
            const active = sportPrefs.includes(sport.id);
            return (
              <button
                key={sport.id}
                onClick={() => toggleSport(sport.id)}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-xs font-bold"
                style={active
                  ? { background: 'rgba(108,71,255,0.12)', borderColor: '#6c47ff', color: 'white' }
                  : { background: '#0a0a0f', borderColor: '#1e1e2e', color: '#64748b' }}
              >
                <span className="text-xl">{sport.emoji}</span>
                {sport.label}
                {active && <span className="text-[10px] text-[#a78bfa]">✓</span>}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-[#374151] mt-1">Preferences saved to your browser.</p>
      </Section>

      {/* Appearance section */}
      <Section title="Appearance" icon={Palette} iconColor="text-[#a78bfa]">
        <div className="flex items-center justify-between gap-3 py-1">
          <div>
            <p className="text-sm text-white font-medium">Dark Mode</p>
            <p className="text-xs text-[#64748b] mt-0.5">Card Battles is always dark — it's who we are</p>
          </div>
          <div
            className="relative w-10 h-6 rounded-full bg-[#6c47ff] cursor-not-allowed opacity-80"
            title="Dark mode is always enabled"
          >
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white shadow" />
            <span className="sr-only">Dark mode (always on)</span>
          </div>
        </div>
        <p className="text-[10px] text-[#374151]">Light mode not available — embrace the dark side 🌑</p>
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone" icon={AlertTriangle} iconColor="text-[#ef4444]">
        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl border border-[#1e1e2e] text-[#64748b] text-sm font-semibold flex items-center justify-center gap-2 hover:border-[#374151] hover:text-white transition-colors"
          >
            <LogOut size={15} /> Log Out
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2.5 rounded-xl border border-[#ef4444]/30 text-[#ef4444] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#ef4444]/10 transition-colors"
          >
            <Trash2 size={15} /> Delete Account
          </button>
        </div>
      </Section>

      {/* About section */}
      <Section title="About" icon={Info} iconColor="text-[#64748b]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#94a3b8]">Version</span>
          <span className="text-sm text-white font-mono font-bold">0.1.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#94a3b8]">Build</span>
          <span className="text-sm text-[#374151] font-mono">weekend-sprint</span>
        </div>
        <div className="pt-1 flex gap-4">
          <Link href="/privacy" className="text-xs text-[#6c47ff] hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-xs text-[#6c47ff] hover:underline">Terms of Service</Link>
          <Link href="/feed" className="text-xs text-[#6c47ff] hover:underline">Back to Feed</Link>
        </div>
        <p className="text-[10px] text-[#374151]">© 2026 CardBattles. For demo purposes only.</p>
      </Section>

      {showDeleteModal && <DeleteModal onClose={() => setShowDeleteModal(false)} />}
    </div>
  );
}
