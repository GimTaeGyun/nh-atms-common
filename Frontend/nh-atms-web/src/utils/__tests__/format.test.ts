import { describe, expect, it } from 'vitest';
import { fmtAmount, fmtDate, fmtDateTime, fmtOffice, fmtPhone, fmtTermId, fmtAgo, fmtMmSs, fmtPercent } from '@/utils/format';

describe('utils/format', () => {
  it('fmtDate: YYYYMMDD → YYYY-MM-DD, 구분자 변경, 비정상 입력', () => {
    expect(fmtDate('20260319')).toBe('2026-03-19');
    expect(fmtDate('20260319', '/')).toBe('2026/03/19');
    expect(fmtDate('')).toBe('-');
    expect(fmtDate(undefined)).toBe('-');
    expect(fmtDate('2026')).toBe('2026');
  });
  it('fmtDateTime: 시각 결합', () => {
    expect(fmtDateTime('20260319', '091533')).toBe('2026-03-19 09:15:33');
    expect(fmtDateTime('20260319')).toBe('2026-03-19');
    expect(fmtDateTime(null, '091533')).toBe('-');
  });
  it('fmtAmount: 콤마, 0, null, 문자열', () => {
    expect(fmtAmount(1234567)).toBe('1,234,567');
    expect(fmtAmount(0)).toBe('0');
    expect(fmtAmount(null)).toBe('-');
    expect(fmtAmount('1,000')).toBe('1,000');
    expect(fmtAmount(50000, { unit: '원' })).toBe('50,000원');
  });
  it('fmtTermId / fmtOffice / fmtPhone', () => {
    expect(fmtTermId('000080', '001')).toBe('000080-001');
    expect(fmtTermId()).toBe('-');
    expect(fmtOffice('000080', '테크부문')).toBe('[000080] 테크부문');
    expect(fmtPhone('0221317804')).toBe('02-2131-7804');
    expect(fmtPhone('01012345678')).toBe('010-1234-5678');
  });
  it('fmtAgo / fmtMmSs / fmtPercent', () => {
    const now = 1_000_000;
    expect(fmtAgo(now - 24_000, now)).toBe('24초 전');
    expect(fmtAgo(now - 5 * 60_000, now)).toBe('5분 전');
    expect(fmtMmSs(59 * 60 + 12)).toBe('59:12');
    expect(fmtPercent(98.64)).toBe('98.6%');
  });
});
