import { describe, expect, it } from 'vitest';
import type { FormInstance } from 'antd';
import type { Rule, RuleObject } from 'antd/es/form';
import { today } from '@/utils/date';
import { afterField, check, dateRange, digits, gteField, maxLen, numRange, phone, req, reqSelect, when } from '../rules';

/** 규칙 하나를 값에 대해 실행 — 통과면 undefined, 실패면 메시지 */
const run = async (rule: Rule, value: unknown, fields: Record<string, unknown> = {}): Promise<string | undefined> => {
  const form = { getFieldValue: (n: string) => fields[n] } as unknown as FormInstance;
  const r: RuleObject = typeof rule === 'function' ? rule(form) : rule;
  if (r.validator) {
    try {
      await r.validator(r, value, () => undefined);
      return undefined;
    } catch (e) {
      return (e as Error).message;
    }
  }
  if (r.pattern) return value === undefined || value === '' || r.pattern.test(String(value)) ? undefined : String(r.message);
  return undefined;
};

describe('utils/rules', () => {
  it('req·reqSelect: VMSG 문구(조사 자동), 글자·숫자·날짜·배열 모두 판정', async () => {
    expect(req('기번')).toMatchObject({ required: true, message: '기번을 입력하세요.' });
    expect(reqSelect('구분')).toMatchObject({ required: true, message: '구분을 선택하세요.' });
    for (const blank of [undefined, null, '', '   ', []]) expect(await run(req('a'), blank)).toBe('a을(를) 입력하세요.');
    for (const filled of ['x', 0, 12, today(), ['A'], false]) expect(await run(req('a'), filled)).toBeUndefined();
    expect(maxLen(10)).toMatchObject({ max: 10, message: '10자 이내로 입력하세요.' });
  });

  it('when 은 조건이 참일 때만 규칙을 돌려준다', () => {
    expect(when(false, req('a'))).toEqual([]);
    expect(when(true, req('a'), maxLen(3))).toHaveLength(2);
  });

  it('digits: 정확히 n자리 숫자, 빈값은 통과', async () => {
    expect(await run(digits(3), '012')).toBeUndefined();
    expect(await run(digits(3), '')).toBeUndefined();
    expect(await run(digits(3), '12')).toBe('숫자 3자리로 입력하세요.');
    expect(await run(digits(3), '12a')).toBe('숫자 3자리로 입력하세요.');
  });

  it('phone: 숫자와 - 만, 9~13자리', async () => {
    expect(await run(phone(), '02-1234-5678')).toBeUndefined();
    expect(await run(phone(), '01012345678')).toBeUndefined();
    expect(await run(phone(), undefined)).toBeUndefined();
    expect(await run(phone(), '1234')).toMatch(/전화번호 형식/);
    expect(await run(phone(), '02-1234-56a8')).toMatch(/전화번호 형식/);
  });

  it('numRange: 범위 밖이면 오류, 빈값은 통과', async () => {
    expect(await run(numRange(0, 10), 5)).toBeUndefined();
    expect(await run(numRange(0, 10), null)).toBeUndefined();
    expect(await run(numRange(0, 10), 11)).toBe('0 ~ 10 사이로 입력하세요.');
    expect(await run(numRange(1), 0)).toBe('1 이상으로 입력하세요.');
    expect(await run(numRange(undefined, 5), 6)).toBe('5 이하로 입력하세요.');
  });

  it('afterField: 상대 칸 날짜보다 앞서면 오류(같은 날 허용, orSame:false 면 같은 날도 오류)', async () => {
    const start = today();
    const rule = afterField('start', '종료일 오류');
    expect(await run(rule, start.add(1, 'day'), { start })).toBeUndefined();
    expect(await run(rule, start, { start })).toBeUndefined();
    expect(await run(rule, start.subtract(1, 'day'), { start })).toBe('종료일 오류');
    expect(await run(rule, start.subtract(1, 'day'), {})).toBeUndefined();
    expect(await run(afterField('start', 'x', { orSame: false }), start, { start })).toBe('x');
  });

  it('gteField: 상대 칸 숫자보다 작으면 오류', async () => {
    const rule = gteField('keep', '삭제 < 보관');
    expect(await run(rule, 24, { keep: 12 })).toBeUndefined();
    expect(await run(rule, 12, { keep: 12 })).toBeUndefined();
    expect(await run(rule, 6, { keep: 12 })).toBe('삭제 < 보관');
  });

  it('dateRange: 종료<시작, 최대 기간 초과', async () => {
    const d = today();
    expect(await run(dateRange(7), [d.subtract(6, 'day'), d])).toBeUndefined();
    expect(await run(dateRange(7), [d.subtract(7, 'day'), d])).toBe('조회 기간은 최대 7일까지 가능합니다.');
    expect(await run(dateRange(), [d, d.subtract(1, 'day')])).toBe('종료일이 시작일보다 빠릅니다.');
  });

  it('check: 화면 고유 검사(메시지 반환 = 오류)', async () => {
    const rule = check<string>((v, get) => (v === get('other') ? '같을 수 없습니다' : undefined));
    expect(await run(rule, 'a', { other: 'a' })).toBe('같을 수 없습니다');
    expect(await run(rule, 'a', { other: 'b' })).toBeUndefined();
  });
});
