/** 합계 (null/undefined 는 0) */
export const sumBy = <T,>(rows: T[], pick: (r: T) => number | null | undefined): number => rows.reduce((acc, r) => acc + (pick(r) ?? 0), 0);

/** 평균 (빈 배열은 0) */
export const avgBy = <T,>(rows: T[], pick: (r: T) => number | null | undefined): number => (rows.length ? sumBy(rows, pick) / rows.length : 0);
