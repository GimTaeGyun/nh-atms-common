import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { DataGrid } from '@/components/grid/DataGrid';
import { amountCol, centerCol, sumWidth, group } from '@/components/grid/columns';

interface Row { id: string; name: string; amt: number }
const columns = [centerCol<Row>('ID', 'id', 80), group<Row>('그룹', [centerCol<Row>('이름', 'name', 120), amountCol<Row>('금액', 'amt', 100)])];

describe('DataGrid', () => {
  it('컬럼 폭 합계(그룹 포함)', () => {
    expect(sumWidth(columns as never)).toBe(300);
  });
  it('조회 전 안내문 / 조회 후 빈 결과 문구', () => {
    const { rerender } = render(<ConfigProvider><DataGrid<Row> columns={columns} rows={[]} rowKey="id" searched={false} /></ConfigProvider>);
    expect(screen.getByText(/조회 조건을 입력하고/)).toBeInTheDocument();
    rerender(<ConfigProvider><DataGrid<Row> columns={columns} rows={[]} rowKey="id" searched /></ConfigProvider>);
    expect(screen.getByText('검색된 데이터가 없습니다.')).toBeInTheDocument();
  });
  it('금액 컬럼 콤마 렌더 + 서버 페이징 총건수', () => {
    render(<ConfigProvider><DataGrid<Row> columns={columns} rows={[{ id: '1', name: 'A', amt: 1234567 }]} rowKey="id" pagination={{ page: 1, size: 20, total: 57, onChange: () => undefined }} /></ConfigProvider>);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
    expect(screen.getByText('총 57건')).toBeInTheDocument();
  });
});
