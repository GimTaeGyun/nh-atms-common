import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { SearchForm, SPAN_TABLE, packRows, type SearchField } from '@/components/search/SearchForm';

const fields: SearchField[] = [
  { name: 'a', label: '사무소', type: 'input', widthClass: 'long' },
  { name: 'b', label: '기번', type: 'input', widthClass: 'normal' },
  { name: 'c', label: '기간', type: 'input', widthClass: 'range' },
  { name: 'd', label: '업체', type: 'input', widthClass: 'normal' },
  { name: 'e', label: '구분', type: 'input', widthClass: 'normal' },
  { name: 'f', label: '추가', type: 'input', widthClass: 'normal' },
  { name: 'g', label: '상세', type: 'input', widthClass: 'normal', advanced: true },
];

describe('SearchForm', () => {
  it('packRows: 24칸 greedy 패킹, newRow 강제 줄바꿈', () => {
    const items = fields.map((f, index) => ({ field: f, span: SPAN_TABLE.M[f.widthClass!], index }));
    const rows = packRows(items.slice(0, 6));
    expect(rows.every((r) => r.reduce((s, p) => s + p.span, 0) <= 24)).toBe(true);
    const forced = packRows([items[0], { ...items[1], field: { ...items[1].field, newRow: true } }]);
    expect(forced).toHaveLength(2);
  });

  it('2행 초과분과 advanced 필드는 상세 필터로 접히고, 펼치면 보인다', async () => {
    const onSearch = vi.fn();
    render(
      <ConfigProvider>
        <SearchForm fields={fields} onSearch={onSearch} band="S" />
      </ConfigProvider>,
    );
    expect(screen.getByText('필터 펼침')).toBeInTheDocument();
    expect(screen.getByText('상세')).not.toBeVisible();
    await userEvent.click(screen.getByText('필터 펼침'));
    expect(screen.getByText('상세')).toBeVisible();
  });

  it('Enter → 조회 1회, 조회 버튼 클릭 → onSearch 호출', async () => {
    const onSearch = vi.fn();
    render(
      <ConfigProvider>
        <SearchForm fields={fields.slice(0, 2)} onSearch={onSearch} />
      </ConfigProvider>,
    );
    const input = screen.getAllByRole('textbox')[0];
    await userEvent.type(input, 'abc{Enter}');
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch.mock.calls[0][0]).toMatchObject({ a: 'abc' });
    await userEvent.click(screen.getByRole('button', { name: /조회/ }));
    expect(onSearch).toHaveBeenCalledTimes(2);
  });
});

describe('checkField', () => {
  it('단일 체크박스를 렌더하고 값은 boolean', async () => {
    const { checkField } = await import('@/components/search/fields');
    const onSearch = vi.fn();
    render(<SearchForm fields={[checkField('flag', '전체보기')]} onSearch={onSearch} />);
    const box = screen.getByRole('checkbox', { name: '전체보기' });
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    fireEvent.click(screen.getByRole('button', { name: /조회/ }));
    await waitFor(() => expect(onSearch).toHaveBeenCalled());
    expect(onSearch.mock.calls[0][0].flag).toBe(true);
  });
});
