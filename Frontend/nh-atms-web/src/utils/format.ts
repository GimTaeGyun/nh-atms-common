/**
 * 표시 포맷 유틸 — 프로젝트 유일의 포맷 함수 모음.
 * 화면에서 로컬 재정의 금지(ESLint no-restricted-syntax 로 강제).
 */
import type { Nullable } from '@/types/common';

const DASH = '-';

/** YYYYMMDD → 'YYYY-MM-DD' (구분자 변경 시 여기만 수정) */
export const fmtDate = (d?: Nullable<string>, sep = '-'): string => {
  if (!d) return DASH;
  const s = String(d).replace(/\D/g, '');
  if (s.length < 8) return String(d);
  return `${s.slice(0, 4)}${sep}${s.slice(4, 6)}${sep}${s.slice(6, 8)}`;
};

/** HHMMSS(또는 HHMM) → 'HH:mm:ss' */
export const fmtTime = (t?: Nullable<string>, withSec = true): string => {
  if (!t) return DASH;
  const s = String(t).replace(/\D/g, '');
  if (s.length < 4) return String(t);
  const base = `${s.slice(0, 2)}:${s.slice(2, 4)}`;
  return withSec && s.length >= 6 ? `${base}:${s.slice(4, 6)}` : base;
};

/** YYYYMMDD + HHMMSS → 'YYYY-MM-DD HH:mm:ss' */
export const fmtDateTime = (d?: Nullable<string>, t?: Nullable<string>): string => {
  const ymd = fmtDate(d);
  if (ymd === DASH) return DASH;
  if (!t) return ymd;
  const hms = fmtTime(t);
  return hms === DASH ? ymd : `${ymd} ${hms}`;
};

/** 14자리 YYYYMMDDHHMMSS → 'YYYY-MM-DD HH:mm:ss' */
export const fmtDateTime14 = (v?: Nullable<string>): string => {
  if (!v) return DASH;
  const s = String(v).replace(/\D/g, '');
  return fmtDateTime(s.slice(0, 8), s.slice(8, 14));
};

/** 금액 콤마. null/undefined/'' → '-' , 0 → '0'. unit 은 뒤에(원), prefix 는 앞에(₩) 붙는다 */
export const fmtAmount = (v?: Nullable<number | string>, opts?: { unit?: string; prefix?: string; dash?: string }): string => {
  if (v === null || v === undefined || v === '') return opts?.dash ?? DASH;
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '')) : v;
  if (!Number.isFinite(n)) return String(v);
  const s = n.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  return `${opts?.prefix ?? ''}${s}${opts?.unit ?? ''}`;
};

/** 정수 콤마 (건수 등) */
export const fmtCount = (v?: Nullable<number>): string => (v === null || v === undefined ? DASH : v.toLocaleString('ko-KR'));

/** 퍼센트 (소수 1자리 기본) */
export const fmtPercent = (v?: Nullable<number>, digits = 1): string =>
  v === null || v === undefined || !Number.isFinite(v) ? DASH : `${v.toFixed(digits)}%`;

/** 사무소코드 + 기번 → '000080-001' (이름은 원본 그대로 fmtTermId) */
export const fmtTermId = (ofcCode?: Nullable<string>, mcnNo?: Nullable<string>): string => {
  if (!ofcCode && !mcnNo) return DASH;
  return `${ofcCode ?? ''}-${mcnNo ?? ''}`;
};

/** '[000080] 테크부문' 형태 사무소 라벨 (사무소명 = TB_OFC_REG_MGT.KANM) */
export const fmtOffice = (ofcCode?: Nullable<string>, kanm?: Nullable<string>): string => {
  if (!ofcCode) return DASH;
  return kanm ? `[${ofcCode}] ${kanm}` : `[${ofcCode}]`;
};

/** 전화번호 하이픈 */
export const fmtPhone = (v?: Nullable<string>): string => {
  if (!v) return DASH;
  const s = String(v).replace(/\D/g, '');
  if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4)}`;
  if (s.startsWith('02') && (s.length === 9 || s.length === 10)) return `${s.slice(0, 2)}-${s.slice(2, -4)}-${s.slice(-4)}`;
  if (s.length === 10 || s.length === 11) return `${s.slice(0, 3)}-${s.slice(3, -4)}-${s.slice(-4)}`;
  return String(v);
};

/** 바이트 → 사람이 읽는 크기 */
export const fmtBytes = (n?: Nullable<number>): string => {
  if (n === null || n === undefined) return DASH;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

/** 경과 시간 → 'n초 전 / n분 전 / n시간 전' */
export const fmtAgo = (ts?: Nullable<number>, now = Date.now()): string => {
  if (!ts) return DASH;
  const sec = Math.max(0, Math.round((now - ts) / 1000));
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
};

/** 초 → 'mm:ss' */
export const fmtMmSs = (totalSec: number): string => {
  const s = Math.max(0, Math.floor(totalSec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** 분 → 'n시간 m분' */
export const fmtDuration = (min?: Nullable<number>): string => {
  if (min === null || min === undefined) return DASH;
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
};

/** 코드와 명칭 → '명칭(코드)' */
export const fmtCodeName = (code?: Nullable<string>, name?: Nullable<string>): string => {
  if (!code) return DASH;
  return name ? `${name}(${code})` : code;
};

/** YYYYMMDD → 'MM-DD' (차트 축·좁은 셀) */
export const fmtMonthDay = (d?: Nullable<string>, sep = '-'): string => {
  const s = fmtDate(d, sep);
  return s === DASH ? DASH : s.slice(5);
};

/** 불리언/Y·N → 표시 문자. 기본 'Y'/'N'. 예: fmtBool(inside, '점내', '점외'), fmtBool(is365, 'O', 'X') */
export const fmtBool = (v?: Nullable<boolean | 'Y' | 'N' | string>, yes = 'Y', no = 'N'): string => (v === true || v === 'Y' ? yes : no);

/** 운영시간 'HH:mm ~ HH:mm' (둘 다 없으면 '-') */
export const fmtHoursRange = (start?: Nullable<string>, end?: Nullable<string>): string => {
  if (!start && !end) return DASH;
  return `${start ?? ''} ~ ${end ?? ''}`;
};

/** 숫자만 남기기 (코드·개인번호 입력 필터) */
export const digitsOnly = (s?: Nullable<string>): string => (s ? String(s).replace(/\D/g, '') : '');

export const DASH_TEXT = DASH;
