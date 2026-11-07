import { describe, expect, it } from 'vitest';
import { niceAxisMax } from '../display/charts';

const ticksOf = (max: number, n = 4) => Array.from({ length: n + 1 }, (_, i) => (max * i) / n);

describe('niceAxisMax (꺾은선 y축)', () => {
  it('데이터가 없거나 작아도 눈금이 정수로 떨어진다', () => {
    expect(ticksOf(niceAxisMax(0, 4))).toEqual([0, 1, 2, 3, 4]);
    expect(ticksOf(niceAxisMax(1, 4))).toEqual([0, 1, 2, 3, 4]);
    expect(ticksOf(niceAxisMax(7, 4))).toEqual([0, 2, 4, 6, 8]);
  });

  it('큰 값은 기존처럼 보기 좋은 단위로 올린다', () => {
    expect(niceAxisMax(84, 4)).toBe(100);
    expect(niceAxisMax(100, 4)).toBe(100);
    expect(niceAxisMax(130, 4)).toBe(200);
  });

  it('모든 눈금이 정수다', () => {
    for (const raw of [0, 1, 3, 9, 10, 11, 23, 57, 99, 101, 999, 4812]) {
      ticksOf(niceAxisMax(raw, 4)).forEach((t) => expect(Number.isInteger(t)).toBe(true));
      expect(niceAxisMax(raw, 4)).toBeGreaterThanOrEqual(raw);
    }
  });
});
