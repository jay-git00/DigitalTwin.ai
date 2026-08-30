"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  data: number[];         // cycle time readings
  color: string;
  height?: number;
  width?: number;
}

export default function Sparkline({ data, color, height = 24, width = 56 }: Props) {
  if (!data.length) return <div style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const lastX = width;
        const lastV = data[data.length - 1];
        const lastY = height - ((lastV - min) / range) * height;
        return <circle cx={lastX} cy={lastY} r="2" fill={color} />;
      })()}
    </svg>
  );
}
