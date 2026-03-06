import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'sponsored';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide',
      variant === 'default' && 'bg-[#1e1e2e] text-[#64748b]',
      variant === 'accent' && 'bg-[#6c47ff]/20 text-[#6c47ff]',
      variant === 'success' && 'bg-[#22c55e]/20 text-[#22c55e]',
      variant === 'warning' && 'bg-[#f59e0b]/20 text-[#f59e0b]',
      variant === 'danger' && 'bg-[#ef4444]/20 text-[#ef4444]',
      variant === 'sponsored' && 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30',
      className
    )}>
      {children}
    </span>
  );
}
