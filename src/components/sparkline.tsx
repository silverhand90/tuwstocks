import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type Props = {
  data: number[];
  color: string;
  width: number;
  height: number;
  fill?: boolean;
  id: string;
};

function buildPaths(data: number[], width: number, height: number, pad: number) {
  if (data.length < 2) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min || Math.max(Math.abs(max) * 0.01, 1);
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const step = innerW / (data.length - 1);

  let line = '';
  for (let i = 0; i < data.length; i++) {
    const x = pad + i * step;
    const y = pad + innerH * (1 - (data[i] - min) / span);
    line += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  const area = `${line.trim()} L${(pad + innerW).toFixed(2)},${height} L${pad.toFixed(2)},${height} Z`;
  return { line: line.trim(), area };
}

export function Sparkline({ data, color, width, height, fill = true, id }: Props) {
  const paths = buildPaths(data, width, height, 1.5);
  const gid = `spark-${id}`;
  if (!paths) return null;
  return (
    <Svg width={width} height={height}>
      {fill ? (
        <>
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={color} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          <Path d={paths.area} fill={`url(#${gid})`} />
        </>
      ) : null}
      <Path d={paths.line} stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
