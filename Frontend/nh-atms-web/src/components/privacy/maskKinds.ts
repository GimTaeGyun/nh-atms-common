import { maskAccount, maskCard, maskName, maskPhone } from '@/utils/mask';

/** 마스킹 대상 종류 */
export type MaskKind = 'account' | 'card' | 'name' | 'phone' | 'custom';

/** custom 기본 규칙: 전부 '*' */
const maskAll = (v: string): string => '*'.repeat(v.length);

/** 종류별 마스킹 적용 (custom 은 fn 우선) */
export const applyMask = (kind: MaskKind, value?: string | null, fn?: (v: string) => string): string => {
  if (value === null || value === undefined || value === '') return '-';
  const s = String(value);
  switch (kind) {
    case 'account':
      return maskAccount(s);
    case 'card':
      return maskCard(s);
    case 'name':
      return maskName(s);
    case 'phone':
      return maskPhone(s);
    default:
      return (fn ?? maskAll)(s);
  }
};
