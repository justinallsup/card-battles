'use client';
import { useEffect, useState } from 'react';
import { formatTimeLeft } from '../../lib/utils';

export function BattleTimer({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState(() => formatTimeLeft(endsAt));

  useEffect(() => {
    const id = setInterval(() => setLabel(formatTimeLeft(endsAt)), 10_000);
    return () => clearInterval(id);
  }, [endsAt]);

  const isUrgent = new Date(endsAt).getTime() - Date.now() < 3_600_000;

  return (
    <span className={`text-xs font-semibold tabular-nums ${isUrgent ? 'text-[#ef4444]' : 'text-[#64748b]'}`}>
      ⏱ {label}
    </span>
  );
}
