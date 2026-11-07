import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { EditableGrid, type EditableColumn, type EditableGridHandle } from '@/components/grid/EditableGrid';
import { MatrixGrid } from '@/components/grid/MatrixGrid';

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
