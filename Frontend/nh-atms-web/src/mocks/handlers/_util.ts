import { HttpResponse, delay, type DefaultBodyType } from 'msw';
import type { PageResult } from '@/types/api';
import { dayjs } from '@/utils/date';

/* 목 핸들러 공통 — 응답 봉투·페이징·지연·파라미터 기본값. 모든 handlers/*.ts 가 이것만 쓴다 */

/** 성공 봉투 — message 는 백엔드 응답코드 테이블(api-messages.tsv)과 같은 문구일 때만 넣는다(넣으면 화면이 그대로 띄운다). 조회는 null */
export const ok = <T,>(data: T, message: string | null = null) => HttpResponse.json({ success: true, message, code: '0000', data });
export const fail = (status: number, message: string, code = 'E9999') => HttpResponse.json({ success: false, message, code, data: null as DefaultBodyType }, { status });

export const q = (req: Request) => new URL(req.url).searchParams;
export const num = (v: string | null, def: number) => (v && Number.isFinite(Number(v)) ? Number(v) : def);
export const paginate = <T,>(rows: T[], sp: URLSearchParams): PageResult<T> => {
  const page = Math.max(1, num(sp.get('page'), 1));
  const size = Math.max(1, num(sp.get('size'), 20));
  const totalCount = rows.length;
  return { content: rows.slice((page - 1) * size, page * size), totalCount, page, size, totalPages: Math.max(1, Math.ceil(totalCount / size)) };
};
/** 실서버 느낌의 지연(120~400ms). 고정 지연이 필요하면 msw 의 delay(ms) */
export const LATENCY = () => delay(Math.round(120 + Math.random() * 280));
export { delay };

/** 기본 사무소(목 고정 사용자 소속, data/lookup.ts MY_OFC_CODE 와 같음) */
export const DEFAULT_OFFICE = '000080';
export const spOffice = (sp: URLSearchParams, key = 'ofcCode'): string => sp.get(key) ?? DEFAULT_OFFICE;
/** YYYYMMDD 파라미터, 없으면 오늘 */
export const spDate = (sp: URLSearchParams, key = 'date'): string => sp.get(key) ?? dayjs().format('YYYYMMDD');
/** 빈 문자열/없음 → undefined */
export const spOpt = (sp: URLSearchParams, key: string): string | undefined => sp.get(key) ?? undefined;
/** from~to 날짜 범위를 하루씩 돌며 rows 를 모은다 */
export const eachDay = <T,>(from: string, to: string, gen: (ymd: string) => T[]): T[] => {
  const out: T[] = [];
  let d = dayjs(from, 'YYYYMMDD');
  const end = dayjs(to, 'YYYYMMDD');
  while (!d.isAfter(end)) { out.push(...gen(d.format('YYYYMMDD'))); d = d.add(1, 'day'); }
  return out;
};
