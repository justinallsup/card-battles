'use client';

interface BarChartDataPoint {
  hour: number;
  leftVotes: number;
  rightVotes: number;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  leftColor?: string;
  rightColor?: string;
  width?: number;
  height?: number;
}

export function BarChart({
  data,
  leftColor = '#6c47ff',
  rightColor = '#374151',
  width = 300,
  height = 80,
}: BarChartProps) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map(d => Math.max(d.leftVotes, d.rightVotes, 1)));
  const barGroupWidth = width / data.length;
  const barPad = 2;
  const barW = Math.max(1, (barGroupWidth - barPad * 3) / 2);
  const chartH = height - 20; // reserve bottom for labels

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((frac) => (
        <line
          key={frac}
          x1={0}
          y1={chartH * (1 - frac)}
          x2={width}
          y2={chartH * (1 - frac)}
          stroke="#1e1e2e"
          strokeWidth={0.5}
          strokeDasharray="3,3"
        />
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const x = i * barGroupWidth;
        const leftH = (d.leftVotes / maxVal) * chartH;
        const rightH = (d.rightVotes / maxVal) * chartH;
        const leftX = x + barPad;
        const rightX = leftX + barW + barPad;

        return (
          <g key={i}>
            {/* Left bar */}
            <rect
              x={leftX}
              y={chartH - leftH}
              width={barW}
              height={leftH}
              rx={2}
              fill={leftColor}
              opacity={0.85}
            />
            {/* Right bar */}
            <rect
              x={rightX}
              y={chartH - rightH}
              width={barW}
              height={rightH}
              rx={2}
              fill={rightColor}
              opacity={0.85}
            />
            {/* Hour label */}
            <text
              x={x + barGroupWidth / 2}
              y={chartH + 14}
              textAnchor="middle"
              fill="#374151"
              fontSize={8}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {d.hour}h
            </text>
          </g>
        );
      })}
    </svg>
  );
}
