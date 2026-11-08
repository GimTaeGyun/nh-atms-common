import type { CSSProperties } from 'react';
import { InputNumber, type InputNumberProps } from 'antd';
import { digitsOnly, fmtAmount } from '@/utils/format';

/**
 * 금액 입력칸 — 치는 동안 `1234567` → `1,234,567` 로 보이고, 폼 값은 콤마 없는 **숫자**(number)다.
 * antd InputNumber 에 콤마 formatter·parser 를 붙인 것뿐이라 Form·rules(numRange 등)는 InputNumber 와 같게 쓴다.
 *
 *   formItem('amount', <AmountInput unit="원" placeholder="1 ~ 1억" />, RULES.amount)
 *
 *  - 정수 전용(precision 0). 소수가 필요한 칸(비율·점수)은 InputNumber 를 그대로 쓴다.
 *  - min 기본 0. 음수가 필요하면 min 을 직접 준다(예: min={-99999999}).
 *  - 폭 기본 100%, 글자는 오른쪽 정렬(표의 금액 칸과 같은 쪽).
 *  - 화면에서 formatter·parser 를 직접 쓰지 말고 이 부품을 쓴다.
 */
export interface AmountInputProps extends Omit<InputNumberProps<number>, 'formatter' | 'parser' | 'precision' | 'stringMode' | 'suffix' | 'styles'> {
  /** 칸 오른쪽 안에 붙는 단위 글자(예: '원') */
  unit?: string;
}

/** 칸에 보이는 글자: 숫자(또는 입력 중 문자열) → '1,234,567'. 빈 값은 '' */
export const toAmountText = (v?: number | string | null): string => {
  if (v === null || v === undefined || v === '') return '';
  if (v === '-') return '-';
  return fmtAmount(v, { dash: '' });
};

/**
 * 칸 글자 → 숫자 문자열(콤마·글자 제거, 앞의 '-' 만 유지). 빈 칸은 '' 로 돌려 값이 비게(null) 한다.
 * `Number('')` 는 0 이라 지운 칸이 0 으로 바뀌므로 숫자로 바꾸지 않는다 — InputNumber 가 안에서 바꾼다.
 */
export const fromAmountText = (s?: string): string => {
  const d = digitsOnly(s);
  const neg = (s ?? '').trim().startsWith('-');
  return d === '' ? (neg ? '-' : '') : `${neg ? '-' : ''}${d}`;
};

const RIGHT: CSSProperties = { textAlign: 'right' };

export const AmountInput = ({ unit, min = 0, style, ...rest }: AmountInputProps) => (
  <InputNumber<number>
    {...rest}
    min={min}
    precision={0}
    suffix={unit}
    style={{ width: '100%', ...style }}
    styles={{ input: RIGHT }}
    formatter={(v) => toAmountText(v)}
    // InputNumber 는 parser 결과 문자열을 숫자로 바꿔 쓴다(빈 문자열 → 값 비움). 타입만 number 로 맞춘다.
    parser={(s) => fromAmountText(s) as unknown as number}
  />
);
