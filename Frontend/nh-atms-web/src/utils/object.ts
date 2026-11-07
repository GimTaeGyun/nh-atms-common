/** 값이 '비어있지 않음': undefined/null/''/빈 배열이 아님 */
export const isNonEmpty = (v: unknown): boolean => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);

/** undefined/null/'' 값을 제거한 객체 — 쿼리 파라미터·부분 갱신(merge)에 공통 사용 */
export const compactParams = <T extends object>(params: T): Partial<T> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (isNonEmpty(v)) out[k] = v;
  }
  return out as Partial<T>;
};
