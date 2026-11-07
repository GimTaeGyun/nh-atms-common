import type { ReactNode } from 'react';
import type { ColumnType, ColumnGroupType } from 'antd/es/table';
import { fmtAmount, fmtCount, fmtDate, fmtDateTime, fmtPercent, fmtTime } from '@/utils/format';
import type { ExcelColumn } from '@/utils/excel';
import { AtmStatusTag, ResultTag, YnIcon } from '@/components/display/StatusTag';
import { Stack } from '@/components/display/Stack';
import { ATM_STATUS_LABEL, type AtmStatusCd } from '@/domain/types';

/** 엑셀 추출 힌트: 함수면 그 값을, false 면 엑셀에서 제외(순번·버튼 컬럼) */
export type ExcelHint<T> = ((row: T) => unknown) | false;
/** excelTitle: 엑셀 머리글이 그리드 헤더와 다를 때(AS-IS 축약 헤더 등) */
export type Col<T> = ColumnType<T> & { excel?: ExcelHint<T>; excelTitle?: string };
export type ColGroup<T> = ColumnGroupType<T> & { children: (Col<T> | ColGroup<T>)[] };

/** 빈 값 표시(회색 '-') */
export const EMPTY_CELL = <span className="muted">-</span>;
const EMPTY = EMPTY_CELL;
const isEmpty = (v: unknown) => v === null || v === undefined || v === '';
/** 값이 있으면 render(v), 없으면 회색 '-' — 커스텀 render 안에서 쓴다 */
export const emptyOr = <V,>(v: V | null | undefined, render: (v: V) => ReactNode): ReactNode => (isEmpty(v) ? EMPTY : render(v as V));

/** 기본 컬럼: width 필수(G3 가로 스크롤 계산), ellipsis 기본 */
export const col = <T,>(title: string, dataIndex: keyof T | string, width: number, extra: Partial<Col<T>> = {}): Col<T> => ({
  title,
  dataIndex: dataIndex as string,
  width,
  ellipsis: true,
  ...extra,
});

export const centerCol = <T,>(title: string, dataIndex: keyof T | string, width: number, extra: Partial<Col<T>> = {}): Col<T> => col(title, dataIndex, width, { align: 'center', ...extra });

/** 빈 값이면 회색 '-' 로 표시하는 텍스트 컬럼 */
export const textCol = <T,>(title: string, dataIndex: keyof T | string, width: number, extra: Partial<Col<T>> = {}): Col<T> =>
  col(title, dataIndex, width, { render: (v: unknown) => (isEmpty(v) ? EMPTY : (v as ReactNode)), ...extra });

/** 금액 컬럼: 우측 정렬 + 콤마 */
export const amountCol = <T,>(title: string, dataIndex: keyof T | string, width = 110, extra: Partial<Col<T>> = {}): Col<T> =>
  col(title, dataIndex, width, { align: 'right', className: 'num', render: (v: unknown) => fmtAmount(v as number), ...extra });

export const countCol = <T,>(title: string, dataIndex: keyof T | string, width = 80, extra: Partial<Col<T>> = {}): Col<T> =>
  col(title, dataIndex, width, { align: 'right', className: 'num', render: (v: unknown) => fmtCount(v as number), ...extra });

export const percentCol = <T,>(title: string, dataIndex: keyof T | string, width = 90, extra: Partial<Col<T>> = {}): Col<T> =>
  col(title, dataIndex, width, { align: 'right', className: 'num', render: (v: unknown) => fmtPercent(v as number), ...extra });

export const dateCol = <T,>(title: string, dataIndex: keyof T | string, width = 100, extra: Partial<Col<T>> = {}): Col<T> =>
  col(title, dataIndex, width, { align: 'center', render: (v: unknown) => fmtDate(v as string), excel: (r) => fmtDate((r as Record<string, unknown>)[dataIndex as string] as string), ...extra });

export const timeCol = <T,>(title: string, dataIndex: keyof T | string, width = 80, extra: Partial<Col<T>> = {}): Col<T> =>
  col(title, dataIndex, width, { align: 'center', render: (v: unknown) => fmtTime(v as string), excel: (r) => fmtTime((r as Record<string, unknown>)[dataIndex as string] as string), ...extra });

/** 날짜+시간 두 필드를 합쳐 표시 */
export const dateTimeCol = <T,>(title: string, dateKey: keyof T, timeKey: keyof T, width = 150, extra: Partial<Col<T>> = {}): Col<T> => {
  const text = (r: T) => fmtDateTime(r[dateKey] as unknown as string, r[timeKey] as unknown as string);
  return { title, key: `${String(dateKey)}_${String(timeKey)}`, width, align: 'center', render: (_: unknown, r: T) => text(r), excel: text, ...extra };
};

/** 순번 컬럼 (서버 페이징 오프셋 반영). 엑셀 제외 */
export const indexCol = <T,>(page = 1, size = 20, width = 56, extra: Partial<Col<T>> = {}): Col<T> => ({
  title: '순번',
  key: '__idx',
  width,
  align: 'center',
  fixed: 'left',
  render: (_: unknown, __: T, i: number) => (page - 1) * size + i + 1,
  excel: false,
  ...extra,
});

/** Y/N 아이콘 컬럼 (boolean 또는 'Y'|'N'). 엑셀은 Y/N 문자 */
export const ynCol = <T,>(title: string, dataIndex: keyof T | string, width = 60, extra: Partial<Col<T>> & { pick?: (r: T) => boolean | 'Y' | 'N' | undefined } = {}): Col<T> => {
  const { pick, ...rest } = extra;
  const val = (v: unknown, r: T) => (pick ? pick(r) : (v as boolean | 'Y' | 'N' | undefined));
  return col(title, dataIndex, width, {
    align: 'center',
    render: (v: unknown, r: T) => <YnIcon value={val(v, r)} />,
    excel: (r) => { const x = val((r as Record<string, unknown>)[dataIndex as string], r); return x === true || x === 'Y' ? 'Y' : 'N'; },
    ...rest,
  });
};

/** 거래상태/결과 태그 컬럼 */
export const resultCol = <T,>(title: string, dataIndex: keyof T | string, width = 90, extra: Partial<Col<T>> = {}): Col<T> =>
  centerCol(title, dataIndex, width, { render: (v: unknown) => <ResultTag value={v as string} />, ...extra });

/** 기기 상태 태그 컬럼 (00/01/02/03/09). text=true 면 알약 배경 없이 글자만. 엑셀은 상태명 */
export const atmStatusCol = <T,>(title: string, dataIndex: keyof T | string, width = 90, extra: Partial<Col<T>> & { text?: boolean } = {}): Col<T> => {
  const { text, ...rest } = extra;
  return centerCol(title, dataIndex, width, {
    render: (v: unknown) => <AtmStatusTag status={v as string} text={text} />,
    excel: (r) => { const v = (r as Record<string, unknown>)[dataIndex as string] as AtmStatusCd; return ATM_STATUS_LABEL[v] ?? String(v ?? ''); },
    ...rest,
  });
};

/** 다단(2~3줄) 복합 셀 컬럼. 엑셀은 ' / ' 로 이어 붙임 */
export const stackCol = <T,>(title: string, width: number, lines: (r: T) => (string | number | undefined | null)[], extra: Partial<Col<T>> = {}): Col<T> => ({
  title,
  key: title,
  width,
  ellipsis: true,
  render: (_: unknown, r: T) => { const ls = lines(r).filter((l) => l !== undefined && l !== null && l !== ''); return ls.length ? <Stack lines={ls} /> : EMPTY; },
  excel: (r) => lines(r).filter((l) => l !== undefined && l !== null && l !== '').join(' / '),
  ...extra,
});

/** 그룹 헤더 */
export const group = <T,>(title: string, children: (Col<T> | ColGroup<T>)[]): ColGroup<T> => ({ title, children });

/** 컬럼 폭 합계 (scroll.x 자동 계산) */
export const sumWidth = <T,>(columns: (Col<T> | ColGroup<T>)[]): number =>
  columns.reduce((acc, c) => {
    if ('children' in c && c.children) return acc + sumWidth(c.children as (Col<T> | ColGroup<T>)[]);
    const w = (c as Col<T>).width;
    return acc + (typeof w === 'number' ? w : 120);
  }, 0);

/**
 * 그리드 컬럼 정의 → 엑셀 컬럼. 화면마다 엑셀 컬럼 목록을 따로 쓰지 않는다.
 *  - 그룹 헤더는 평탄화(제목은 '그룹 제목' 접두 없이 그대로)
 *  - `excel` 힌트가 함수면 그 값, false 면 제외, 없으면 dataIndex 원값
 *  - dataIndex 도 excel 도 없는 컬럼(버튼 등)은 제외
 */
export const excelColumnsOf = <T extends object>(columns: (Col<T> | ColGroup<T>)[]): ExcelColumn<T>[] => {
  const out: ExcelColumn<T>[] = [];
  const walk = (cs: (Col<T> | ColGroup<T>)[]) => {
    for (const c of cs) {
      if ('children' in c && c.children) { walk(c.children as (Col<T> | ColGroup<T>)[]); continue; }
      const leaf = c as Col<T>;
      if (leaf.excel === false) continue;
      const title = leaf.excelTitle ?? (typeof leaf.title === 'string' ? leaf.title : String(leaf.key ?? leaf.dataIndex ?? ''));
      if (typeof leaf.excel === 'function') out.push({ title, key: leaf.excel });
      else if (leaf.dataIndex !== undefined) out.push({ title, key: String(leaf.dataIndex) as keyof T });
    }
  };
  walk(columns);
  return out;
};
