import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20 text-center gap-3', className)}>
      <div className="w-16 h-16 rounded-full bg-[#12121a] border border-[#1e1e2e] flex items-center justify-center">
        <Icon size={28} className="text-[#374151]" />
      </div>
      <div>
        <p className="font-bold text-[#64748b]">{title}</p>
        {description && <p className="text-sm text-[#374151] mt-1">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
