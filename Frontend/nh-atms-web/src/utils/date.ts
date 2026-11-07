import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { VMSG } from '@/config/messages';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('ko');

export const YMD = 'YYYYMMDD';
export const HMS = 'HHmmss';
export const DISPLAY_DATE = 'YYYY-MM-DD';
export const DISPLAY_DATETIME = 'YYYY-MM-DD HH:mm:ss';

export const today = (): Dayjs => dayjs().startOf('day');
export const toYmd = (d?: Dayjs | null): string | undefined => (d ? d.format(YMD) : undefined);
export const toHms = (d?: Dayjs | null): string | undefined => (d ? d.format(HMS) : undefined);
export const fromYmd = (s?: string | null): Dayjs | undefined => {
  if (!s) return undefined;
  const d = dayjs(String(s).replace(/\D/g, '').slice(0, 8), YMD, true);
  return d.isValid() ? d : undefined;
};
export const nowYmd = (): string => dayjs().format(YMD);
export const nowHms = (): string => dayjs().format(HMS);
export const nowDisplay = (): string => dayjs().format(DISPLAY_DATETIME);
/** 현재 시각 'HH:mm:ss' (헤더 시계·메시지라인 타임스탬프) */
export const nowClock = (): string => dayjs().format('HH:mm:ss');

/** 기간 상한 검증 (AS-IS: 최대 7일/10일/30일 등). 초과 시 메시지 반환 */
export const validateRange = (from?: Dayjs | null, to?: Dayjs | null, maxDays?: number): string | undefined => {
  if (!from || !to) return undefined;
  if (to.isBefore(from, 'day')) return VMSG.periodOrder;
  if (maxDays && to.diff(from, 'day') + 1 > maxDays) return VMSG.periodMax(maxDays);
  return undefined;
};

/** n일 전 ~ 오늘 */
export const lastDays = (n: number): [Dayjs, Dayjs] => [today().subtract(n - 1, 'day'), today()];

/** 시:분 옵션 (00:00 ~ 23:59, step 분) */
export const timeOptions = (stepMin = 30): { value: string; label: string }[] => {
  const out: { value: string; label: string }[] = [];
  for (let m = 0; m < 24 * 60; m += stepMin) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    out.push({ value: `${hh}${mm}`, label: `${hh}:${mm}` });
  }
  out.push({ value: '2359', label: '23:59' });
  return out;
};

export { dayjs };
export type { Dayjs };
