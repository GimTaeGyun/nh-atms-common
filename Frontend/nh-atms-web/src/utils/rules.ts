import type { Rule } from 'antd/es/form';
import { VMSG } from '@/config/messages';
import { validateRange, type Dayjs } from './date';

/**
 * 입력 검증 규칙 모음 — antd Form 의 `rules` 에 그대로 넣는다(02-dev-guide §4.3).
 *
 *   const RULES = {
 *     mcnNo: [req('기번'), digits(3)],
 *     endDate: [req('종료일'), afterField('startDate', VMSG.after('종료일', '시작일'))],
 *   } satisfies Record<string, Rule[]>;
 *   <Form.Item name="mcnNo" rules={RULES.mcnNo}>…
 *   const v = await form.validateFields();   // 저장 버튼은 이 한 줄
 *
 * 문구는 config/messages.ts 의 VMSG 에서 가져온다(조사 자동·마침표 통일, 02 §7). 화면 고유 문구도 VMSG 에 먼저 찾아 쓴다.
 * 다른 칸을 보는 규칙(afterField·gteField)을 쓴 칸에는 `dependencies={['상대칸']}` 를 같이 준다.
 */

const ok = () => Promise.resolve();
const fail = (msg: string) => Promise.reject(new Error(msg));
const isEmpty = (v: unknown) => v === undefined || v === null || v === '';

/** 빈값 판정: undefined·null·''·공백만 있는 글자·빈 배열 */
const isBlank = (v: unknown) => isEmpty(v) || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

/**
 * 필수 — 글자·숫자·날짜·셀렉트·다중선택 어디에나 쓴다. 공백만 넣은 글자, 빈 배열도 막는다.
 * (antd 의 `whitespace: true` 는 규칙을 '글자 전용'으로 바꿔 날짜·숫자 칸이 항상 실패하므로 validator 로 판정한다)
 */
const requiredRule = (message: string): Rule => ({ required: true, message, validator: (_r, v: unknown) => (isBlank(v) ? fail(message) : ok()) });

/** 필수 입력 */
export const req = (label: string): Rule => requiredRule(VMSG.required(label));

/** 필수 선택(셀렉트·라디오·체크 묶음) */
export const reqSelect = (label: string): Rule => requiredRule(VMSG.select(label));

/** 조건부 규칙 — 조건이 참일 때만 규칙을 건다. 예: `when(isDept, req('부서코드'))` */
export const when = (cond: boolean, ...rules: Rule[]): Rule[] => (cond ? rules : []);

/** 글자 수 상한 */
export const maxLen = (n: number): Rule => ({ type: 'string', max: n, message: VMSG.maxLength(n) });

/**
 * DB 저장 바이트 수 — 서버 공통 `DbBytes.length` 와 같은 규칙.
 * 잠정 Q-07: 은행 DB 문자셋 KO16MSWIN949 기준 ASCII 1바이트, 그 밖(한글 등) 2바이트. 서로게이트 쌍(이모지)은 글자 하나 = 2바이트.
 * 컬럼 길이가 BYTE 인지 CHAR 인지 정본에 없어 BYTE 로 가정 — 현업 답이 오면 여기와 서버 DbBytes 만 고친다.
 */
export const byteLength = (s: string | null | undefined): number => {
  let n = 0;
  for (const ch of s ?? '') n += (ch.codePointAt(0) ?? 0) < 0x80 ? 1 : 2;
  return n;
};

/** 바이트 상한(VARCHAR2(n) 칸에 한글을 넣을 때). 빈값은 통과 — 필수는 req 로 따로 */
export const maxBytes = (n: number): Rule => ({
  validator: (_r, v?: string | null) => (byteLength(v) > n ? fail(VMSG.maxBytes(n)) : ok()),
});

/** Input·TextArea 의 `count` — 글자 수 대신 바이트로 세어 'n / max' 표시(넘으면 빨갛게, 잘라내지 않음). 예: `<Input count={byteCount(200)} />` */
export const byteCount = (max: number) => ({ show: true, max, strategy: byteLength });

/** 숫자 정확히 n자리(코드·기번 등). 빈값은 통과 — 필수는 req 로 따로 */
export const digits = (n: number): Rule => ({ pattern: new RegExp(`^\\d{${n}}$`), message: VMSG.digits(n) });

/** 숫자만(자리수 무관) */
export const numeric = (): Rule => ({ pattern: /^\d+$/, message: VMSG.numeric });

/** 전화·팩스: 숫자와 '-' 만, 9~13자리 숫자 */
export const phone = (): Rule => ({
  validator: (_r, v?: string) => {
    if (isEmpty(v)) return ok();
    const s = String(v);
    const n = s.replace(/-/g, '');
    return /^[\d-]+$/.test(s) && n.length >= 9 && n.length <= 13 ? ok() : fail(VMSG.phone);
  },
});

/** 숫자 범위(InputNumber). min/max 중 필요한 쪽만 */
export const numRange = (min?: number, max?: number): Rule => ({
  validator: (_r, v?: number | null) => {
    if (isEmpty(v)) return ok();
    const n = Number(v);
    if (Number.isNaN(n)) return fail(VMSG.number);
    if (min !== undefined && n < min) return fail(max !== undefined ? VMSG.between(min, max) : VMSG.minInput(min));
    if (max !== undefined && n > max) return fail(min !== undefined ? VMSG.between(min, max) : VMSG.maxInput(max));
    return ok();
  },
});

/** 날짜가 다른 칸 날짜보다 앞서면 오류(같은 날은 허용, `{ orSame: false }` 면 같은 날도 오류). 칸에 `dependencies={[other]}` */
export const afterField = (other: string, message: string, opts: { orSame?: boolean } = {}): Rule => ({ getFieldValue }) => ({
  validator: (_r, v?: Dayjs | null) => {
    const base = getFieldValue(other) as Dayjs | null | undefined;
    if (!v || !base) return ok();
    const bad = opts.orSame === false ? !v.isAfter(base) : v.isBefore(base);
    return bad ? fail(message) : ok();
  },
});

/** 숫자가 다른 칸 숫자보다 작으면 오류(같으면 허용). 칸에 `dependencies={[other]}` */
export const gteField = (other: string | (string | number)[], message: string): Rule => ({ getFieldValue }) => ({
  validator: (_r, v?: number | null) => {
    const base = getFieldValue(other) as number | null | undefined;
    if (isEmpty(v) || isEmpty(base)) return ok();
    return Number(v) < Number(base) ? fail(message) : ok();
  },
});

/** RangePicker 값([시작, 종료]) — 종료 < 시작이면 오류, maxDays 를 주면 기간 상한도 검사 */
export const dateRange = (maxDays?: number): Rule => ({
  validator: (_r, v?: [Dayjs | null, Dayjs | null] | null) => {
    const msg = v ? validateRange(v[0], v[1], maxDays) : undefined;
    return msg ? fail(msg) : ok();
  },
});

/** 화면 고유 검사 — 메시지를 돌려주면 오류, undefined 면 통과. 예: `check((v) => v === '000' ? '000 은 쓸 수 없습니다.' : undefined)` */
export const check = <T = unknown>(fn: (value: T, getFieldValue: (name: string | (string | number)[]) => unknown) => string | undefined): Rule => ({ getFieldValue }) => ({
  validator: (_r, v: T) => {
    const msg = fn(v, getFieldValue);
    return msg ? fail(msg) : ok();
  },
});
