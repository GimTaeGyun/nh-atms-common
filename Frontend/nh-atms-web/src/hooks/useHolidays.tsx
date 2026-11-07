import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { lookupApi, lookupKeys } from '@/api/endpoints/lookup';
import type { Holiday } from '@/domain/lookup';

/**
 * 휴일(TB_NMS_HDAY) — 날짜 부품에 휴일을 **표시만** 한다(영업일 계산은 현업 확인 H-068 대기).
 * 휴일 판정: HDAY_YN='Y' (값의 뜻은 정본 속성명 기준, 잠정).
 */
export const isHolidayRow = (h: Holiday): boolean => h.hdayYn === 'Y';

/** from~to(YYYYMMDD, 최대 366일) 휴일 → Set<YYYYMMDD>. 범위가 없으면 호출하지 않는다 */
export const useHolidays = (from?: string, to?: string) => {
  const query = useQuery({
    queryKey: lookupKeys.holidays(from ?? '', to ?? ''),
    queryFn: () => lookupApi.holidays(from!, to!),
    enabled: !!from && !!to,
    staleTime: 60 * 60_000,
  });
  const days = new Set((query.data ?? []).filter(isHolidayRow).map((h) => h.hdayDt));
  return { ...query, days, isHoliday: (ymd: string) => days.has(ymd) };
};

/**
 * DatePicker/RangePicker `cellRender` 만들기 — 휴일 날짜 칸에 `holiday-cell` 클래스(빨간 글자)를 입힌다.
 * 예: `const { days } = useHolidays(from, to); <DatePicker cellRender={holidayCellRender(days)} />`
 */
export const holidayCellRender =
  (days: Set<string>) =>
  (current: string | number | Dayjs, info: { type: string; originNode: ReactNode }): ReactNode => {
    if (info.type !== 'date' || typeof current !== 'object') return info.originNode;
    const ymd = current.format('YYYYMMDD');
    if (!days.has(ymd)) return info.originNode;
    return (
      <div className="holiday-cell" title="휴일" data-holiday={ymd}>
        {info.originNode}
      </div>
    );
  };
