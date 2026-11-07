export interface Option<V = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export type Nullable<T> = T | null | undefined;

/** value/onChange 제어 컴포넌트 공통 프롭 (조회조건 커스텀 컨트롤·폼 컨트롤) */
export interface ValueProps<T> {
  value?: T;
  onChange?: (v: T) => void;
  disabled?: boolean;
}

/** 기간 단위 일별/월별 */
export type PeriodUnit = 'DAY' | 'MONTH';
