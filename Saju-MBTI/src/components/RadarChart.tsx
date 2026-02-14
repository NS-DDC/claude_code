'use client';

import { motion } from 'framer-motion';

interface RadarChartProps {
  data: {
    재물운: number;
    연애운: number;
    건강운: number;
    명예운: number;
    학업운: number;
  };
  size?: number;
}

export default function RadarChart({ data, size = 300 }: RadarChartProps) {
  const keys = Object.keys(data) as (keyof typeof data)[];
  const values = Object.values(data);
  const numPoints = keys.length;

  // SVG viewBox 중심점
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 40;

  // 각 포인트의 좌표 계산
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const r = (radius * value) / 100;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  };

  // 라벨 위치 계산
  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const r = radius + 25;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  };

  // 배경 그리드 (5단계)
  const gridLevels = [20, 40, 60, 80, 100];

  // 데이터 포인트들을 연결한 경로
  const dataPath = values
    .map((value, index) => {
      const point = getPoint(index, value);
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    })
    .join(' ') + ' Z';

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 배경 그리드 */}
        {gridLevels.map((level, i) => {
          const gridPath = Array.from({ length: numPoints }, (_, index) => {
            const point = getPoint(index, level);
            return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
          }).join(' ') + ' Z';

          return (
            <path
              key={i}
              d={gridPath}
              fill="none"
              stroke="rgba(255, 215, 0, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* 축 라인 */}
        {keys.map((_, index) => {
          const endPoint = getPoint(index, 100);
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="rgba(255, 215, 0, 0.2)"
              strokeWidth="1"
            />
          );
        })}

        {/* 데이터 영역 (애니메이션) */}
        <motion.path
          d={dataPath}
          fill="rgba(255, 215, 0, 0.3)"
          stroke="#FFD700"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* 데이터 포인트 */}
        {values.map((value, index) => {
          const point = getPoint(index, value);
          return (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#FFD700"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
            />
          );
        })}

        {/* 라벨 */}
        {keys.map((key, index) => {
          const labelPoint = getLabelPoint(index);
          return (
            <text
              key={index}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#4A4A4A"
              fontSize="14"
              fontWeight="600"
            >
              {key}
            </text>
          );
        })}

        {/* 값 표시 */}
        {values.map((value, index) => {
          const point = getPoint(index, value);
          return (
            <text
              key={`value-${index}`}
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              fill="#FFD700"
              fontSize="12"
              fontWeight="bold"
            >
              {value}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
