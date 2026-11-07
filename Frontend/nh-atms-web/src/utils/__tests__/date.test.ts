import { describe, expect, it } from 'vitest';
import { dayjs, fromYmd, timeOptions, toYmd, validateRange } from '@/utils/date';

describe('utils/date', () => {
  it('toYmd / fromYmd 왕복', () => {
    const d = dayjs('2026-03-19');
    expect(toYmd(d)).toBe('20260319');
    expect(fromYmd('20260319')?.format('YYYY-MM-DD')).toBe('2026-03-19');
    expect(fromYmd('bad')).toBeUndefined();
  });
  it('validateRange: 역순/상한', () => {
    const a = dayjs('2026-03-10');
    const b = dayjs('2026-03-19');
    expect(validateRange(b, a)).toMatch(/빠릅니다/);
    expect(validateRange(a, b, 7)).toMatch(/최대 7일/);
    expect(validateRange(a, b, 10)).toBeUndefined();
  });
  it('timeOptions: 30분 간격 + 23:59', () => {
    const opts = timeOptions(30);
    expect(opts[0]).toEqual({ value: '0000', label: '00:00' });
    expect(opts[opts.length - 1]).toEqual({ value: '2359', label: '23:59' });
    expect(opts).toHaveLength(49);
  });
});
