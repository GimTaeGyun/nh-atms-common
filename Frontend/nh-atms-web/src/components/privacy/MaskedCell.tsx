import { col, type Col } from '@/components/grid/columns';
import { MaskedText, type MaskedTextProps } from './MaskedText';
import type { MaskKind } from './maskKinds';

/** 그리드 셀용 마스킹 표시 (MaskedText 와 동일) */
export const MaskedCell = MaskedText;

interface MaskedColOptions<T> {
  /** 서버 마스킹 값 그대로 표시 */
  masked?: boolean;
  /** kind='custom' 마스킹 함수 */
  mask?: (v: string) => string;
  /** 행별 원문 열람 연결 (예: r => ({ revealed: u.valueOf(r.id), onReveal: () => u.unmask(r.id) })) */
  reveal?: (row: T) => Pick<MaskedTextProps, 'revealed' | 'onReveal'>;
  /** 컬럼 추가 속성 */
  extra?: Partial<Col<T>>;
}

/** 마스킹 컬럼 헬퍼: col() + MaskedText 렌더 */
export const maskedCol = <T,>(title: string, dataIndex: keyof T | string, kind: MaskKind, width = 140, opts: MaskedColOptions<T> = {}): Col<T> =>
  col<T>(title, dataIndex, width, {
    align: 'center',
    render: (v: unknown, r: T) => <MaskedText value={v === null || v === undefined ? null : String(v)} kind={kind} masked={opts.masked} mask={opts.mask} {...opts.reveal?.(r)} />,
    ...opts.extra,
  });
