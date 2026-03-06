import { cn } from '../../lib/utils';

interface StatPillProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatPill({ label, value, className }: StatPillProps) {
  return (
    <div className={cn('flex items-center gap-2 bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-1.5', className)}>
      <span className="text-xs text-[#64748b]">{label}</span>
      <span className="text-sm font-bold text-[#f1f5f9]">{value}</span>
    </div>
  );
}
