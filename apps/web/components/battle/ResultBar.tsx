interface ResultBarProps {
  leftPercent: number;
  rightPercent: number;
  userChoice: 'left' | 'right';
  category: string;
}

export function ResultBar({ leftPercent, rightPercent, userChoice, category }: ResultBarProps) {
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <span className={`font-bold tabular-nums w-8 text-right ${userChoice === 'left' ? 'text-[#6c47ff]' : 'text-[#64748b]'}`}>
          {Math.round(leftPercent)}%
        </span>
        <div className="flex-1 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#6c47ff] to-[#9b73ff]"
            style={{ width: `${leftPercent}%` }}
          />
        </div>
        <span className={`font-bold tabular-nums w-8 ${userChoice === 'right' ? 'text-[#6c47ff]' : 'text-[#64748b]'}`}>
          {Math.round(rightPercent)}%
        </span>
      </div>
    </div>
  );
}
