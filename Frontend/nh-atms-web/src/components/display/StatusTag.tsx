import type { ReactNode } from 'react';
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, MinusCircleFilled, StopFilled } from '@ant-design/icons';
import type { AtmStatusCd } from '@/domain/types';
import { ATM_STATUS_LABEL } from '@/domain/types';

export type Tone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export const ATM_STATUS_TONE: Record<AtmStatusCd, Tone> = { '00': 'success', '01': 'warning', '02': 'danger', '03': 'danger', '09': 'neutral' };
const ICON: Record<Tone, ReactNode> = { success: <CheckCircleFilled />, danger: <CloseCircleFilled />, warning: <ExclamationCircleFilled />, info: <ExclamationCircleFilled />, neutral: <MinusCircleFilled /> };

/** 상태 알약 태그 (시안 B: 정상/장애/통신 단절/미개국) */
export const StatusTag = ({ tone, children, icon = true, text }: { tone: Tone; children: ReactNode; icon?: boolean; text?: boolean }) => (
  <span className={`status-tag ${tone}${text ? ' text' : ''}`}>
    {icon && ICON[tone]}
    {children}
  </span>
);

export const AtmStatusTag = ({ status, text }: { status?: AtmStatusCd | string; text?: boolean }) => {
  const cd = (status ?? '00') as AtmStatusCd;
  const tone = ATM_STATUS_TONE[cd] ?? 'neutral';
  return (
    <StatusTag tone={tone} text={text}>
      {ATM_STATUS_LABEL[cd] ?? status}
    </StatusTag>
  );
};

/** 거래상태/결과 등 텍스트 기반 톤 매핑 */
export const toneOf = (v?: string): Tone => {
  if (!v) return 'neutral';
  if (/정상|완료|승인|성공|Y$|^O$/.test(v)) return 'success';
  if (/불능|실패|오류|장애|단절|취소불능|거부/.test(v)) return 'danger';
  if (/처리중|확인요망|경고|대기|진행/.test(v)) return 'warning';
  if (/취소/.test(v)) return 'neutral';
  return 'info';
};

export const ResultTag = ({ value }: { value?: string }) => (value ? <StatusTag tone={toneOf(value)} icon={false}>{value}</StatusTag> : <span className="muted">-</span>);

export const YnIcon = ({ value }: { value?: boolean | 'Y' | 'N' }) => {
  const on = value === true || value === 'Y';
  return on ? <CheckCircleFilled style={{ color: 'var(--success)' }} /> : <StopFilled style={{ color: '#c9d3df' }} />;
};
