import { useMemo, type ReactNode } from 'react';
import { Table } from 'antd';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import { fmtAmount } from '@/utils/format';
import './gridExt.css';

export interface MatrixRowHeader {
  key: string;
  label: ReactNode;
  /** 행 그룹(연속된 같은 그룹은 병합 표시) */
  group?: string;
}

export interface MatrixColHeader {
  key: string;
  label: ReactNode;
  /** 2단 헤더 하위 컬럼 */
  children?: { key: string; label: ReactNode }[];
}

export type MatrixTone = 'danger' | 'warning';
type CellValue = ReactNode | number;

export interface MatrixGridProps {
  rowHeaders: MatrixRowHeader[];
  colHeaders: MatrixColHeader[];
  cell: (rowKey: string, colKey: string) => CellValue;
  /** row: 행 합계 컬럼(우측), col: 열 합계 행(하단) — 숫자 셀만 합산 */
  totals?: { row?: boolean; col?: boolean };
  rowHeaderWidth?: number;
  colWidth?: number;
  /** 행 헤더 컬럼 제목 (기본 '구분') */
  rowHeaderTitle?: ReactNode;
  groupTitle?: ReactNode;
  totalLabel?: string;
  highlight?: (rowKey: string, colKey: string, value: CellValue) => MatrixTone | undefined;
  height?: number;
  loading?: boolean;
  className?: string;
}

interface MatrixRow {
  key: string;
  header: MatrixRowHeader;
  /** 그룹 셀 병합 rowSpan */
  span: number;
  values: Map<string, CellValue>;
  total: number | undefined;
}

const TOTAL_KEY = '__total';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const show = (v: CellValue): ReactNode => (isNum(v) ? fmtAmount(v) : v);
const addNum = (acc: number | undefined, v: unknown) => (isNum(v) ? (acc ?? 0) + v : acc);

/**
 * 고정행 매트릭스 (집계·운영현황형 표).
 *  - 행 헤더(+선택적 그룹) 좌측 고정, 열 헤더 2단 지원
 *  - totals 로 행/열 숫자 합계, highlight 로 셀 강조(mx-danger/mx-warning)
 */
export function MatrixGrid({
  rowHeaders, colHeaders, cell, totals, rowHeaderWidth = 120, colWidth = 90, rowHeaderTitle = '구분', groupTitle = '그룹', totalLabel = '합계', highlight, height, loading, className,
}: MatrixGridProps) {
  const leaves = useMemo(() => colHeaders.flatMap((c) => (c.children?.length ? c.children : [c])), [colHeaders]);
  const hasGroup = rowHeaders.some((r) => r.group !== undefined);

  // 셀 값은 1회만 계산 (render/onCell/합계 공용)
  const data = useMemo<MatrixRow[]>(
    () =>
      rowHeaders.map((h, i) => {
        const values = new Map<string, CellValue>(leaves.map((l) => [l.key, cell(h.key, l.key)]));
        let span = 1;
        if (hasGroup) {
          if (i > 0 && rowHeaders[i - 1].group === h.group) span = 0;
          else while (i + span < rowHeaders.length && rowHeaders[i + span].group === h.group) span += 1;
        }
        return { key: h.key, header: h, span, values, total: [...values.values()].reduce<number | undefined>(addNum, undefined) };
      }),
    [rowHeaders, leaves, cell, hasGroup],
  );

  const colTotals = useMemo(() => {
    const m = new Map<string, number | undefined>(leaves.map((l) => [l.key, data.reduce<number | undefined>((acc, r) => addNum(acc, r.values.get(l.key)), undefined)]));
    m.set(TOTAL_KEY, data.reduce<number | undefined>((acc, r) => addNum(acc, r.total), undefined));
    return m;
  }, [leaves, data]);

  const leafCol = (key: string, label: ReactNode): ColumnType<MatrixRow> => ({
    key,
    title: label,
    width: colWidth,
    align: 'right',
    onCell: (r) => {
      const tone = highlight?.(r.key, key, r.values.get(key));
      return { className: ['num', tone ? `mx-${tone}` : ''].filter(Boolean).join(' ') };
    },
    render: (_: unknown, r) => show(r.values.get(key)),
  });

  const columns: ColumnsType<MatrixRow> = [
    ...(hasGroup
      ? [{ key: '__group', title: groupTitle, width: 90, fixed: 'left' as const, align: 'center' as const, className: 'mx-head', onCell: (r: MatrixRow) => ({ rowSpan: r.span }), render: (_: unknown, r: MatrixRow) => r.header.group }]
      : []),
    { key: '__row', title: rowHeaderTitle, width: rowHeaderWidth, fixed: 'left', className: 'mx-head', render: (_: unknown, r) => r.header.label },
    ...colHeaders.map((c) => (c.children?.length ? { key: c.key, title: c.label, children: c.children.map((ch) => leafCol(ch.key, ch.label)) } : leafCol(c.key, c.label))),
    ...(totals?.row ? [{ key: TOTAL_KEY, title: totalLabel, width: colWidth, align: 'right' as const, className: 'num mx-total', render: (_: unknown, r: MatrixRow) => fmtAmount(r.total) }] : []),
  ];

  const headCols = hasGroup ? 2 : 1;
  const width = (hasGroup ? 90 : 0) + rowHeaderWidth + (leaves.length + (totals?.row ? 1 : 0)) * colWidth;

  return (
    <div className={`data-grid matrix-grid${className ? ` ${className}` : ''}`}>
      <Table<MatrixRow>
        columns={columns}
        dataSource={data}
        rowKey="key"
        size="small"
        bordered
        loading={loading}
        pagination={false}
        tableLayout="fixed"
        scroll={{ x: width, y: height }}
        summary={
          totals?.col
            ? () => (
                <Table.Summary fixed={height !== undefined}>
                  <Table.Summary.Row className="mx-total-row">
                    <Table.Summary.Cell index={0} colSpan={headCols} align="center">
                      {totalLabel}
                    </Table.Summary.Cell>
                    {leaves.map((l, i) => (
                      <Table.Summary.Cell key={l.key} index={headCols + i} align="right" className="num">
                        {fmtAmount(colTotals.get(l.key))}
                      </Table.Summary.Cell>
                    ))}
                    {totals.row && (
                      <Table.Summary.Cell index={headCols + leaves.length} align="right" className="num mx-total">
                        {fmtAmount(colTotals.get(TOTAL_KEY))}
                      </Table.Summary.Cell>
                    )}
                  </Table.Summary.Row>
                </Table.Summary>
              )
            : undefined
        }
      />
    </div>
  );
}
