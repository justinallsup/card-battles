'use client';

interface DonutChartProps {
  leftPct: number;
  rightPct: number;
  leftColor?: string;
  rightColor?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function DonutChart({
  leftPct,
  rightPct,
  leftColor = '#6c47ff',
  rightColor = '#374151',
  size = 120,
  strokeWidth = 14,
  label,
}: DonutChartProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  const leftDash = (leftPct / 100) * circ;
  const rightDash = (rightPct / 100) * circ;
  // Gap between segments
  const gap = 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#1e1e2e"
            strokeWidth={strokeWidth}
          />
          {/* Left side arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={leftColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${Math.max(0, leftDash - gap)} ${circ}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.7s ease-out' }}
          />
          {/* Right side arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={rightColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${Math.max(0, rightDash - gap)} ${circ}`}
            strokeDashoffset={-(leftDash + gap)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.7s ease-out, stroke-dashoffset 0.7s ease-out' }}
          />
        </svg>
        {/* Center label */}
        {label && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide text-center px-1 leading-tight">
              {label}
            </span>
          </div>
        )}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: leftColor }} />
          <span className="text-[#94a3b8]">{leftPct}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: rightColor }} />
          <span className="text-[#94a3b8]">{rightPct}%</span>
        </span>
      </div>
    </div>
  );
}
