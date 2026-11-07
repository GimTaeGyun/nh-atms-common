import type { ReactNode } from 'react';
import { fmtCount } from '@/utils/format';
import type { Tone } from './StatusTag';
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, MinusCircleFilled } from '@ant-design/icons';

const TONE_ICON: Record<Tone, ReactNode> = {
  success: <CheckCircleFilled style={{ color: 'var(--success)' }} />,
  danger: <CloseCircleFilled style={{ color: 'var(--danger)' }} />,
  warning: <ExclamationCircleFilled style={{ color: 'var(--warning)' }} />,
  info: <ExclamationCircleFilled style={{ color: 'var(--info)' }} />,
  neutral: <MinusCircleFilled style={{ color: 'var(--neutral)' }} />,
};

interface Props {
  label: ReactNode;
  value: number | string | null | undefined;
  unit?: string;
  tone?: Tone;
  /** 전일 대비 증감 */
  delta?: number;
  /** 증가가 좋은 지표인지 (장애 수는 false) */
  deltaGoodWhenUp?: boolean;
  sub?: ReactNode;
  hero?: boolean;
  right?: ReactNode;
  onClick?: () => void;
}

/** KPI 카드 (시안 B 대시보드) */
export const KpiCard = ({ label, value, unit = '대', tone, delta, deltaGoodWhenUp = true, sub, hero, right, onClick }: Props) => {
  const deltaCls = delta === undefined || delta === 0 ? 'flat' : (delta > 0) === deltaGoodWhenUp ? 'up' : 'down';
  return (
    <div className={`kpi-card${hero ? ' kpi-hero' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined} role={onClick ? 'button' : undefined}>
      <div className="kpi-head">
        <span className="lbl">
          {tone && TONE_ICON[tone]}
          {label}
        </span>
        {delta !== undefined && <span className={`delta ${deltaCls}`}>{delta > 0 ? `+${delta}` : delta === 0 ? '±0' : delta}</span>}
        {right}
      </div>
      <div className="kpi-value">
        {typeof value === 'number' ? fmtCount(value) : value ?? '-'}
        {unit && <small>{unit}</small>}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
};
