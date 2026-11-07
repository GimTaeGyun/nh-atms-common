import { useMemo, useState, type ReactNode } from 'react';
import { Pagination, Select, Table, type TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import { EMPTY_RESULT_TEXT, PAGE_SIZE_OPTIONS } from '@/config/constants';
import { fmtCount } from '@/utils/format';
import { sumWidth } from './columns';

/** 조회 전 안내문 */
export const BEFORE_SEARCH_TEXT = '조회 조건을 입력하고 [조회]를 누르세요.';
const showTotal = (t: number) => `총 ${fmtCount(t)}건`;

export type GridGrade = 'G1' | 'G2' | 'G3';

export interface DataGridProps<T extends object> {
  columns: ColumnsType<T>;
  rows: T[];
  rowKey: keyof T | ((row: T) => string);
  loading?: boolean;
  /** 조회 전 상태면 안내 문구 변경 */
  searched?: boolean;
  /** 그리드 등급(08 §3.1). G1 폭 100% / G2 폭 100%+최소폭 / G3 항상 가로 스크롤 */
  grade?: GridGrade;
  /** 세로 스크롤 높이(px). 없으면 내용만큼 */
  height?: number;
  /** 서버 페이징 */
  pagination?: { page: number; size: number; total: number; onChange: (page: number, size: number) => void } | false;
  /** 클라이언트 페이징 크기 (pagination 미지정 시). 0 이면 페이징 없음 */
  clientPageSize?: number;
  rowSelection?: TableRowSelection<T>;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  rowClassName?: (row: T, index: number) => string;
  /** 선택 강조할 행 키(단일 또는 복수). rowKey 결과와 비교 */
  selectedKey?: string | string[] | null;
  /** 선택 강조 판정을 직접(코너 단위 선택 등) */
  isSelected?: (row: T) => boolean;
  summary?: TableProps<T>['summary'];
  emptyText?: ReactNode;
  size?: 'small' | 'middle';
  /** 세로 줄. 시안(2026-10-21)은 가로 줄만이라 기본 false. 그룹 헤더·숫자 많은 표는 true */
  bordered?: boolean;
  /** 빈 상태에서도 테이블 헤더 표시 (기본 true) */
  showHeaderWhenEmpty?: boolean;
  footer?: ReactNode;
  /** 페이지 줄 왼쪽 칸(시안: '조회일자 : 2026-09-17'). 없으면 '총 N건' */
  footLeft?: ReactNode;
  className?: string;
  /**
   * 컬럼 헤더 클릭 정렬(현업 회신 2026-10-30 No 19 "라이브러리가 지원하면 적용, 새마을과 동일하게"). 기본 true.
   * dataIndex 가 있는 리프 컬럼에 값 기준 정렬을 붙인다(문자/숫자). 서버 페이징이면 **현재 페이지 안**에서만 정렬된다(새마을과 같음).
   * 컬럼에 `sorter` 가 이미 있으면 그대로, `sorter: false` 면 제외.
   */
  sortable?: boolean;
}

/** 리프 컬럼에 기본 정렬기 부여 */
const cmp = (a: unknown, b: unknown): number => {
  const na = a === null || a === undefined || a === '';
  const nb = b === null || b === undefined || b === '';
  if (na && nb) return 0;
  if (na) return 1;
  if (nb) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'ko', { numeric: true });
};
const withSorters = <T,>(cols: ColumnsType<T>): ColumnsType<T> =>
  cols.map((c) => {
    if ('children' in c && Array.isArray(c.children)) return { ...c, children: withSorters(c.children as ColumnsType<T>) } as typeof c;
    const col = c as typeof c & { dataIndex?: unknown; sorter?: unknown };
    if (col.sorter !== undefined || typeof col.dataIndex !== 'string') return c;
    const key = col.dataIndex;
    return { ...c, sorter: (x: T, y: T) => cmp((x as Record<string, unknown>)[key], (y as Record<string, unknown>)[key]), showSorterTooltip: false } as typeof c;
  });

/**
 * 데이터 그리드 — antd Table 래퍼.
 *  - 컬럼 폭 합으로 scroll.x 자동 계산, 고정 컬럼/그룹헤더/합계행은 antd 내장 기능 사용(추가 라이브러리 없음)
 *  - 서버 페이징(pagination) 또는 클라이언트 페이징(clientPageSize). 페이지 줄은 시안대로 왼쪽 안내 / 가운데 페이지 / 오른쪽 'N개씩 보기'
 *  - 빈 결과: '검색된 데이터가 없습니다.'(AS-IS 문구), 조회 전: 안내문
 */
export function DataGrid<T extends object>({
  columns, rows, rowKey, loading, searched = true, grade = 'G2', height, pagination, clientPageSize = 20, rowSelection, onRowClick, onRowDoubleClick, rowClassName, selectedKey, isSelected, summary, emptyText, size = 'small', bordered = false, footer, footLeft, className, sortable = true,
}: DataGridProps<T>) {
  const sortedColumns = useMemo(() => (sortable ? withSorters(columns) : columns), [columns, sortable]);
  const totalWidth = useMemo(() => sumWidth(columns as never), [columns]);
  const scroll = useMemo(() => {
    const x = grade === 'G1' ? undefined : grade === 'G2' ? Math.max(totalWidth, 0) : totalWidth;
    return { x: x && x > 0 ? x : undefined, y: height };
  }, [grade, totalWidth, height]);

  const empty = <div className="grid-empty">{emptyText ?? (searched ? EMPTY_RESULT_TEXT : BEFORE_SEARCH_TEXT)}</div>;
  const keyOf = (r: T): string => (typeof rowKey === 'function' ? rowKey(r) : String(r[rowKey]));
  const selected = (r: T): boolean => (isSelected ? isSelected(r) : selectedKey === undefined || selectedKey === null ? false : Array.isArray(selectedKey) ? selectedKey.includes(keyOf(r)) : keyOf(r) === selectedKey);
  const isServer = pagination !== undefined && pagination !== false;
  // 클라이언트 페이징: antd Table 의 페이저는 숨기고 상태만 공유한다(정렬은 전체 행 기준 유지)
  const [client, setClient] = useState({ page: 1, size: clientPageSize });
  const clientPages = Math.max(1, Math.ceil(rows.length / Math.max(1, client.size)));
  const clientPage = Math.min(client.page, clientPages);
  const paged = isServer
    ? { page: pagination.page, size: pagination.size, total: pagination.total, onChange: pagination.onChange }
    : clientPageSize === 0
      ? null
      : { page: clientPage, size: client.size, total: rows.length, onChange: (page: number, size: number) => setClient({ page, size }) };

  return (
    <div className={`data-grid${className ? ` ${className}` : ''}`}>
      <Table<T>
        columns={sortedColumns}
        dataSource={rows}
        rowKey={rowKey as never}
        loading={loading}
        size={size}
        bordered={bordered}
        sticky={height === undefined ? { offsetHeader: 0 } : undefined}
        scroll={scroll}
        tableLayout={grade === 'G1' ? 'auto' : 'fixed'}
        rowSelection={rowSelection}
        summary={summary}
        locale={{ emptyText: empty }}
        pagination={isServer || clientPageSize === 0 ? false : { current: clientPage, pageSize: client.size, total: rows.length, style: { display: 'none' } }}
        onRow={(record) => ({
          onClick: onRowClick ? () => onRowClick(record) : undefined,
          onDoubleClick: onRowDoubleClick ? () => onRowDoubleClick(record) : undefined,
        })}
        rowClassName={(r, i) => [rowClassName?.(r, i), onRowClick || onRowDoubleClick ? 'row-clickable' : '', selected(r) ? 'ant-table-row-selected' : ''].filter(Boolean).join(' ')}
      />
      {paged && paged.total > 0 && (
        <div className="grid-foot">
          <div className="gf-left">{footLeft ?? showTotal(paged.total)}</div>
          <Pagination current={paged.page} pageSize={paged.size} total={paged.total} onChange={paged.onChange} showSizeChanger={false} itemRender={itemRender} />
          <Select className="gf-size" size="small" value={paged.size} onChange={(s) => paged.onChange(1, s)} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: Number(n), label: `${n}개씩 보기` }))} aria-label="페이지 크기" />
        </div>
      )}
      {footer}
    </div>
  );
}

const itemRender: NonNullable<TableProps<object>['pagination'] & object>['itemRender'] = (_page, type, original) => {
  if (type === 'prev') return <a style={{ padding: '0 6px' }}>‹ 이전</a>;
  if (type === 'next') return <a style={{ padding: '0 6px' }}>다음 ›</a>;
  return original;
};
