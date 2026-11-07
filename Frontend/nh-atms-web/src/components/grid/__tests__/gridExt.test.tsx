import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { EditableGrid, type EditableColumn, type EditableGridHandle } from '@/components/grid/EditableGrid';
import { MatrixGrid } from '@/components/grid/MatrixGrid';
import { ReconcileGrid, pairMismatch } from '@/components/grid/ReconcileGrid';
import { STATUS_BIT_GROUPS, StatusBitsPanel, UNCLASSIFIED_GROUP_TITLE, resolveStatusBits } from '@/components/grid/StatusBitsPanel';

interface Code { id: string; name: string; useYn: string }
const codeCols: EditableColumn<Code>[] = [
  { title: '코드', dataIndex: 'id', width: 80 },
  { title: '코드명', dataIndex: 'name', width: 160, editable: { type: 'input', rules: [{ required: true, message: '코드명을 입력하세요.' }] } },
  { title: '사용', dataIndex: 'useYn', width: 70, editable: { type: 'check', checkValues: ['Y', 'N'] } },
];
const codes: Code[] = [
  { id: 'A1', name: '현금', useYn: 'Y' },
  { id: 'A2', name: '수표', useYn: 'N' },
];
const rowOf = (text: string) => screen.getByText(text).closest('tr') as HTMLElement;

describe('EditableGrid', () => {
  it('셀 편집 → getChanges().updated + cell-dirty', async () => {
    const ref = createRef<EditableGridHandle<Code>>();
    render(<ConfigProvider><EditableGrid<Code> ref={ref} columns={codeCols} rows={codes} rowKey="id" /></ConfigProvider>);
    const input = screen.getByDisplayValue('현금');
    fireEvent.change(input, { target: { value: '현금(원화)' } });
    await waitFor(() => expect(input.closest('td')).toHaveClass('cell-dirty'));
    const ch = ref.current!.getChanges();
    expect(ch.updated).toEqual([{ id: 'A1', name: '현금(원화)', useYn: 'Y' }]);
    expect(ch.added).toHaveLength(0);
    expect(ch.deleted).toHaveLength(0);
    expect(screen.getByText(/변경/).textContent).toContain('1');
    // 원복하면 변경 아님
    fireEvent.change(input, { target: { value: '현금' } });
    await waitFor(() => expect(ref.current!.getChanges().updated).toHaveLength(0));
  });

  it('행추가/행삭제/취소 + 저장 콜백', async () => {
    const ref = createRef<EditableGridHandle<Code>>();
    const onSave = vi.fn();
    render(<ConfigProvider><EditableGrid<Code> ref={ref} columns={codeCols} rows={codes} rowKey="id" onSave={onSave} newRow={() => ({ useYn: 'Y' })} /></ConfigProvider>);
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '행추가' }));
    await waitFor(() => expect(ref.current!.getChanges().added).toEqual([{ name: undefined, useYn: 'Y' }]));

    fireEvent.click(within(rowOf('A2')).getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: '행삭제' }));
    await waitFor(() => expect(rowOf('A2')).toHaveClass('row-deleted'));
    expect(ref.current!.getChanges().deleted).toEqual([codes[1]]);

    // 필수값 누락 → 저장 안 됨
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.getByText('코드명을 입력하세요.')).toBeInTheDocument());
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(ref.current!.hasChanges()).toBe(false));
    expect(rowOf('A2')).not.toHaveClass('row-deleted');
  });

  it('validate — 필수 규칙 실패/성공', async () => {
    const ref = createRef<EditableGridHandle<Code>>();
    render(<ConfigProvider><EditableGrid<Code> ref={ref} columns={codeCols} rows={codes} rowKey="id" /></ConfigProvider>);
    let ok = true;
    await act(async () => {
      ok = await ref.current!.validate();
    });
    expect(ok).toBe(true);
    fireEvent.change(screen.getByDisplayValue('수표'), { target: { value: '' } });
    await act(async () => {
      ok = await ref.current!.validate();
    });
    expect(ok).toBe(false);
  });

  it('readOnly — 편집 컨트롤/버튼 비활성', () => {
    render(<ConfigProvider><EditableGrid<Code> columns={codeCols} rows={codes} rowKey="id" readOnly /></ConfigProvider>);
    expect(screen.queryByDisplayValue('현금')).toBeNull();
    expect(screen.getByText('현금')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '행추가' })).toBeDisabled();
  });
});

describe('MatrixGrid', () => {
  it('행/열 합계 + 2단 헤더 + 강조', () => {
    const data: Record<string, Record<string, number>> = { r1: { a: 1, b: 2, c: 1000 }, r2: { a: 3, b: 4, c: 2000 } };
    const { container } = render(
      <ConfigProvider>
        <MatrixGrid
          rowHeaders={[{ key: 'r1', label: '서울', group: '수도권' }, { key: 'r2', label: '경기', group: '수도권' }]}
          colHeaders={[{ key: 'g', label: '365기기', children: [{ key: 'a', label: '점내' }, { key: 'b', label: '점외' }] }, { key: 'c', label: '공과금' }]}
          cell={(r, c) => data[r][c]}
          totals={{ row: true, col: true }}
          highlight={(_r, _c, v) => (typeof v === 'number' && v >= 2000 ? 'danger' : undefined)}
        />
      </ConfigProvider>,
    );
    expect(screen.getByText('365기기')).toBeInTheDocument();
    expect(screen.getByText('1,003')).toBeInTheDocument(); // r1 행 합계
    expect(screen.getByText('2,007')).toBeInTheDocument(); // r2 행 합계
    expect(screen.getByText('3,000')).toBeInTheDocument(); // c 열 합계
    expect(screen.getByText('3,010')).toBeInTheDocument(); // 총합계
    expect(screen.getByText('2,000').closest('td')).toHaveClass('mx-danger');
    expect(screen.getAllByText('수도권')).toHaveLength(1); // 그룹 병합
    expect(container.querySelector('.mx-total-row')).not.toBeNull();
  });
});

interface Recon { termId: string; nhCash?: number; coCash?: number; nhCnt: number; coCnt: number }
describe('ReconcileGrid', () => {
  const rows: Recon[] = [
    { termId: 'T001', nhCash: 1000, coCash: 1000, nhCnt: 1, coCnt: 1 },
    { termId: 'T002', nhCash: 2000, coCash: 1500, nhCnt: 2, coCnt: 2 },
    { termId: 'T003', nhCash: 300, coCash: undefined, nhCnt: 3, coCnt: 3 },
  ];
  const pairs = [
    { key: 'cash', title: '현금', ours: (r: Recon) => r.nhCash, theirs: (r: Recon) => r.coCash },
    { key: 'cnt', title: '건수', ours: (r: Recon) => r.nhCnt, theirs: (r: Recon) => r.coCnt },
  ];

  it('pairMismatch', () => {
    expect(pairMismatch(1, 1)).toBe(false);
    expect(pairMismatch(undefined, undefined)).toBe(false);
    expect(pairMismatch(1, undefined)).toBe(true);
    expect(pairMismatch(100, 101, 1)).toBe(false);
  });

  it('불일치 건수 + 불일치만 보기 + 합계', async () => {
    render(<ConfigProvider><ReconcileGrid<Recon> rows={rows} rowKey="termId" keyColumns={[{ title: '기번', dataIndex: 'termId', width: 80 }]} pairs={pairs} /></ConfigProvider>);
    expect(screen.getByText(/불일치/, { selector: '.ge-summary' }).textContent).toMatch(/불일치\s*2\s*건 \/ 전체 3건/);
    expect(rowOf('T002')).toHaveClass('row-mismatch');
    expect(rowOf('T001')).not.toHaveClass('row-mismatch');
    expect(screen.getByText('500').closest('td')).toHaveClass('diff-pos');
    expect(screen.getByText('3,300')).toBeInTheDocument(); // 농협 현금 합계
    expect(screen.getByText('2,500')).toBeInTheDocument(); // 업체 현금 합계

    fireEvent.click(screen.getByRole('switch', { name: '불일치만 보기' }));
    await waitFor(() => expect(screen.queryByText('T001')).toBeNull());
    expect(screen.getByText('T002')).toBeInTheDocument();
    expect(screen.getByText('T003')).toBeInTheDocument();
  });
});

describe('StatusBitsPanel', () => {
  it('기본 7그룹 + 켜진 비트 강조 + 미분류', () => {
    render(<ConfigProvider><StatusBitsPanel bits={{ '제한거래.입금': true, '매체걸림.카드': false, 통신단절: true, 걸림: true }} /></ConfigProvider>);
    for (const g of STATUS_BIT_GROUPS) expect(screen.getByRole('region', { name: g.title })).toBeInTheDocument();
    const limit = screen.getByRole('region', { name: '제한거래' });
    expect(limit).toHaveClass('on');
    expect(within(limit).getByText('입금')).toHaveClass('bit-on-label');
    expect(within(limit).getByText('지급')).not.toHaveClass('bit-on-label');
    expect(screen.getByRole('region', { name: '매체걸림' })).toHaveClass('on'); // 별칭 '걸림'
    expect(screen.getByRole('region', { name: '모듈장애' })).not.toHaveClass('on');
    const etc = screen.getByRole('region', { name: UNCLASSIFIED_GROUP_TITLE });
    expect(within(etc).getByText('통신단절')).toHaveClass('bit-on-label');
    expect(screen.getAllByRole('checkbox').every((c) => (c as HTMLInputElement).disabled)).toBe(true);
  });

  it('미분류 없으면 그룹 7개', () => {
    expect(resolveStatusBits({ '기타.SW장애': true })).toHaveLength(7);
  });
});
