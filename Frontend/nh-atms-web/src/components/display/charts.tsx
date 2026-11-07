/**
 * 경량 SVG 차트 — 라이브러리 없이 꺾은선/막대. (폐쇄망 반입 패키지 0, 17 학습가이드 2-5)
 * 대시보드·통계 화면의 추이/비율 표현용. 복잡한 차트가 필요해지면 recharts 도입을 별도 결정한다.
 */
import { useId, useMemo, useState } from 'react';
import { fmtCount, fmtPercent } from '@/utils/format';

export interface ChartPoint {
  label: string;
  value: number;
  /** x축 보조 라벨(요일 등) */
  sub?: string;
  tone?: 'default' | 'danger' | 'warning' | 'success';
}

interface LineProps {
  data: ChartPoint[];
  height?: number;
  unit?: string;
  color?: string;
  area?: boolean;
  yTicks?: number;
}

const niceMax = (max: number): number => {
  if (max <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
};

/**
 * 꺾은선 y축 최댓값 — 눈금 간격을 1·2·2.5·5×10ⁿ(최소 1, 정수)으로 잡아 건수 눈금이 정수로 떨어지게 한다.
 * (데이터가 없거나 작을 때 niceMax 로 잡으면 0.25 간격이 반올림돼 '0·0·1·1·1건' 처럼 보였다)
 */
export const niceAxisMax = (rawMax: number, ticks: number): number => {
  const raw = Math.max(rawMax, 1) / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  const step = Math.max(1, Math.ceil((n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow));
  return step * ticks;
};

export const SvgLineChart = ({ data, height = 220, unit = '건', color = 'var(--accent)', area = true, yTicks = 4 }: LineProps) => {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = height;
  const pad = { l: 44, r: 16, t: 14, b: 36 };
  const max = niceAxisMax(Math.max(...data.map((d) => d.value), 0), yTicks);
  const pts = useMemo(() => {
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    return data.map((d, i) => ({ x: pad.l + (data.length === 1 ? iw / 2 : (iw * i) / (data.length - 1)), y: pad.t + ih - (ih * d.value) / max, d }));
  }, [data, max, H, pad.l, pad.r, pad.t, pad.b]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = pts.length ? `${path} L${pts[pts.length - 1].x},${H - pad.b} L${pts[0].x},${H - pad.b} Z` : '';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="추이 차트" style={{ display: 'block', overflow: 'visible' }} onMouseLeave={() => setHover(null)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1d5fcf" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#1d5fcf" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (max * i) / yTicks;
        const y = pad.t + (H - pad.t - pad.b) - ((H - pad.t - pad.b) * i) / yTicks;
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#e6ebf2" strokeDasharray="3 4" />
            <text x={pad.l - 8} y={y + 4} fontSize="11" textAnchor="end" fill="#8a94a3">
              {fmtCount(Math.round(v))}
              {unit}
            </text>
          </g>
        );
      })}
      {area && <path d={areaPath} fill={`url(#${id}-g)`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i} onMouseEnter={() => setHover(i)}>
          <rect x={p.x - 20} y={pad.t} width={40} height={H - pad.t - pad.b} fill="transparent" />
          <circle cx={p.x} cy={p.y} r={hover === i ? 5 : 3.5} fill="#fff" stroke={color} strokeWidth="2" />
          <text x={p.x} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill={p.d.tone === 'danger' ? 'var(--danger)' : p.d.tone === 'warning' ? '#b26a00' : '#5f6b7a'}>
            {p.d.label}
            {p.d.sub ? ` (${p.d.sub})` : ''}
          </text>
          {hover === i && (
            <g>
              <rect x={p.x - 34} y={p.y - 32} width={68} height={22} rx={5} fill="#1f2a37" />
              <text x={p.x} y={p.y - 17} fontSize="11" textAnchor="middle" fill="#fff" fontWeight="700">
                {fmtCount(p.d.value)}
                {unit}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
};

interface BarProps {
  data: ChartPoint[];
  height?: number;
  unit?: string;
  max?: number;
  showValue?: boolean;
  /** 가로 막대 */
  horizontal?: boolean;
}

const TONE_COLOR = { default: 'var(--accent)', danger: 'var(--danger)', warning: 'var(--warning)', success: 'var(--success)' } as const;

export const SvgBarChart = ({ data, height = 200, unit = '', max: fixedMax, showValue = true, horizontal }: BarProps) => {
  const max = fixedMax ?? niceMax(Math.max(...data.map((d) => d.value), 1));
  if (horizontal) {
    const rowH = 26;
    const H = data.length * rowH + 8;
    const W = 600;
    const labelW = 110;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="막대 차트" style={{ display: 'block' }}>
        {data.map((d, i) => {
          const y = 4 + i * rowH;
          const w = ((W - labelW - 70) * d.value) / max;
          return (
            <g key={i}>
              <text x={labelW - 8} y={y + 16} fontSize="12" textAnchor="end" fill="#5f6b7a">{d.label}</text>
              <rect x={labelW} y={y + 4} width={W - labelW - 70} height={rowH - 10} rx={4} fill="#eef2f7" />
              <rect x={labelW} y={y + 4} width={Math.max(2, w)} height={rowH - 10} rx={4} fill={TONE_COLOR[d.tone ?? 'default']} />
              {showValue && <text x={labelW + w + 6} y={y + 16} fontSize="11" fill="#1f2a37" fontWeight="600">{fmtCount(d.value)}{unit}</text>}
            </g>
          );
        })}
      </svg>
    );
  }
  const W = 600;
  const H = height;
  const pad = { l: 12, r: 12, t: 22, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const bw = Math.min(46, (iw / Math.max(1, data.length)) * 0.6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="막대 차트" style={{ display: 'block' }}>
      <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="#dee1e6" />
      {data.map((d, i) => {
        const cx = pad.l + (iw * (i + 0.5)) / data.length;
        const h = (ih * d.value) / max;
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={H - pad.b - h} width={bw} height={h} rx={4} fill={TONE_COLOR[d.tone ?? 'default']} />
            {showValue && <text x={cx} y={H - pad.b - h - 6} fontSize="11" textAnchor="middle" fill="#1f2a37" fontWeight="600">{fmtCount(d.value)}{unit}</text>}
            <text x={cx} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill="#5f6b7a">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

/** 가동률 등 0~100% 수평 바 (그리드 셀용) */
export const PercentBar = ({ value, warnBelow = 95 }: { value?: number | null; warnBelow?: number }) => {
  if (value === null || value === undefined) return <span className="muted">-</span>;
  const tone = value < warnBelow ? 'var(--danger)' : value < 99 ? 'var(--warning)' : 'var(--success)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: '#eef2f7', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: tone }} />
      </div>
      <span className="num" style={{ width: 46, fontWeight: 600 }}>{fmtPercent(value)}</span>
    </div>
  );
};
