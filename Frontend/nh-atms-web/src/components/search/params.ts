/**
 * SearchForm values → API 파라미터 매퍼. 화면마다 반복되던 `v.officeCd as string`, 기간 풀기 등을 한 곳에.
 * 필드 팩토리(fields.tsx·fieldsExt.tsx)의 name 규약과 쌍을 이룬다.
 */
import type { Dayjs } from 'dayjs';
import { toYmd } from '@/utils/date';
import type { Ymd } from '@/types/api';
import type { PeriodUnit, TotalFlag } from '@/types/common';
import type { DateRangeTotalValue, PeriodValue, TimeRangeValue } from './fields';

type Values = Record<string, unknown>;

/** officeField + atmField → { officeCd, termId } */
export const officeAtmParams = (v: Values): { officeCd: string; termId?: string } => ({ officeCd: v.officeCd as string, termId: (v.termId as string | undefined) || undefined });

/** type:'datePicker' 필드 → YYYYMMDD */
export const ymdOf = (v: unknown): Ymd => toYmd(v as Dayjs) ?? '';

/** type:'rangePicker' 또는 [from,to] 튜플 → { fromDate, toDate } */
export const ymdRange = (v: unknown): { fromDate: Ymd; toDate: Ymd } => {
  const [from, to] = (v as [Dayjs?, Dayjs?] | undefined) ?? [];
  return { fromDate: toYmd(from) ?? '', toDate: toYmd(to) ?? '' };
};

/** dateTotalField(합계후/합계전) → { fromDate, fromTotal, toDate, toTotal } */
export const totalRangeParams = (v: unknown): { fromDate: Ymd; fromTotal: TotalFlag; toDate: Ymd; toTotal: TotalFlag } => {
  const p = (v as DateRangeTotalValue | undefined) ?? { fromTotal: 'AFTER', toTotal: 'BEFORE' };
  return { fromDate: toYmd(p.from) ?? '', fromTotal: p.fromTotal, toDate: toYmd(p.to) ?? '', toTotal: p.toTotal };
};

/** periodField(일별/월별 + 범위) → { unit, fromDate, toDate } */
export const periodParams = (v: unknown): { unit: PeriodUnit; fromDate: Ymd; toDate: Ymd } => {
  const p = (v as PeriodValue | undefined) ?? { unit: 'DAY' };
  const [from, to] = p.range ?? [];
  return { unit: p.unit, fromDate: toYmd(from) ?? '', toDate: toYmd(to) ?? '' };
};

/** timeRangeField → { fromTime, toTime } (HHmm) */
export const timeParams = (v: unknown): { fromTime: string; toTime: string } => {
  const t = (v as TimeRangeValue | undefined) ?? { from: '0000', to: '2359' };
  return { fromTime: t.from, toTime: t.to };
};

/** '전체' 라벨 값을 'ALL' 로 (AS-IS 셀렉트의 전체 옵션) */
export const allOr = (v: unknown, def = 'ALL'): string => (v === undefined || v === null || v === '' || v === '전체' ? def : String(v));
