import { cn } from '../../lib/utils';

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLORS = [
  'bg-purple-600', 'bg-blue-600', 'bg-green-600',
  'bg-pink-600', 'bg-orange-600', 'bg-teal-600',
];

function getColor(username: string) {
  let hash = 0;
  for (const c of username) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Avatar({ username, avatarUrl, size = 'md', className }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();
  const color = getColor(username);

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0',
      size === 'sm' && 'w-7 h-7 text-xs',
      size === 'md' && 'w-9 h-9 text-sm',
      size === 'lg' && 'w-14 h-14 text-xl',
      !avatarUrl && color,
      className
    )}>
      {avatarUrl
        ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
        : <span className="text-white">{initials}</span>
      }
    </div>
  );
}
