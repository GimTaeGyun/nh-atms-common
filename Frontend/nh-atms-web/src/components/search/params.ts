/**
 * SearchForm values → API 파라미터 매퍼. 화면마다 반복되던 `v.ofcCode as string`, 기간 풀기 등을 한 곳에.
 * 필드 팩토리(fields.tsx·fieldsExt.tsx·lookupFields.tsx·dateFields.tsx)의 name 규약과 쌍을 이룬다.
 * 파라미터 이름 = API 계약(TO-BE 컬럼 camelCase).
 */
import type { Dayjs } from 'dayjs';
import { toYmd } from '@/utils/date';
import type { Ymd } from '@/types/api';
import type { PeriodUnit } from '@/types/common';
import type { PeriodValue, TimeRangeValue } from './fields';

type Values = Record<string, unknown>;

/** officeField + mcnField → { ofcCode, mcnNo? } */
export const ofcMcnParams = (v: Values): { ofcCode: string; mcnNo?: string } => ({ ofcCode: v.ofcCode as string, mcnNo: (v.mcnNo as string | undefined) || undefined });

/** type:'datePicker' 필드 → YYYYMMDD */
export const ymdOf = (v: unknown): Ymd => toYmd(v as Dayjs) ?? '';

/** type:'rangePicker'·rangeField 또는 [from,to] 튜플 → { fromDate, toDate } */
export const ymdRange = (v: unknown): { fromDate: Ymd; toDate: Ymd } => {
  const [from, to] = (v as [Dayjs?, Dayjs?] | undefined) ?? [];
  return { fromDate: toYmd(from) ?? '', toDate: toYmd(to) ?? '' };
};

/** yearField(Dayjs) → 'YYYY' */
export const yearOf = (v: unknown): string => ((v as Dayjs | undefined)?.isValid?.() ? (v as Dayjs).format('YYYY') : '');

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

/** '전체' 값(ALL·빈 값)을 undefined 로 — 서버에 조건을 안 보낼 때 */
export const allToUndef = (v: unknown): string | undefined => (v === undefined || v === null || v === '' || v === 'ALL' || v === '전체' ? undefined : String(v));

/** '전체' 라벨 값을 'ALL' 로 (셀렉트의 전체 옵션) */
export const allOr = (v: unknown, def = 'ALL'): string => (v === undefined || v === null || v === '' || v === '전체' ? def : String(v));
