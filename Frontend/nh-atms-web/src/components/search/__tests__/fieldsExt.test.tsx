import { describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { today, type Dayjs } from '@/utils/date';
import { SearchForm } from '@/components/search/SearchForm';
import {
  DateSpinner, OutsrcAllCheck, REGIONS, RegionMultiSelect, StatTypeRadio, TimeSpin, UnitScopeSelect,
  isDateOutOfRange, outsrcAllField, unitScopeField, validateUnitScope, type UnitScopeValue,
} from '@/components/search/fieldsExt';

const wrap = (ui: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ConfigProvider>{ui}</ConfigProvider>
    </QueryClientProvider>,
  );

/** 상태를 보유하는 제어형 래퍼 */
const Controlled = <T,>({ initial, children, spy }: { initial: T; spy?: (v: T) => void; children: (value: T, onChange: (v: T) => void) => ReactNode }) => {
  const [v, setV] = useState<T>(initial);
  return <>{children(v, (nv) => { setV(nv); spy?.(nv); })}</>;
};

describe('DateSpinner', () => {
  it('이전일/다음일 버튼은 1일씩 이동한다', async () => {
    const spy = vi.fn<(v: Dayjs | undefined) => void>();
    const base = today().subtract(3, 'day');
    wrap(<Controlled<Dayjs | undefined> initial={base} spy={spy}>{(v, on) => <DateSpinner value={v} onChange={on} />}</Controlled>);
    await userEvent.click(screen.getByRole('button', { name: '이전일' }));
    expect(spy.mock.calls[0][0]!.isSame(base.subtract(1, 'day'), 'day')).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: '다음일' }));
    expect(spy.mock.calls[1][0]!.isSame(base, 'day')).toBe(true);
  });

  it('오늘이면 다음일 비활성(미래 금지), maxDaysBack 경계면 이전일 비활성', () => {
    const { unmount } = wrap(<DateSpinner value={today()} />);
    expect(screen.getByRole('button', { name: '다음일' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '이전일' })).toBeEnabled();
    unmount();
    wrap(<DateSpinner value={today().subtract(10, 'day')} maxDaysBack={10} />);
    expect(screen.getByRole('button', { name: '이전일' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음일' })).toBeEnabled();
  });

  it('isDateOutOfRange: 미래/최대 n일 전 초과 판정, allowFuture 허용', () => {
    expect(isDateOutOfRange(today().add(1, 'day'))).toBe(true);
    expect(isDateOutOfRange(today().add(1, 'day'), undefined, true)).toBe(false);
    expect(isDateOutOfRange(today().subtract(10, 'day'), 10)).toBe(false);
    expect(isDateOutOfRange(today().subtract(11, 'day'), 10)).toBe(true);
    expect(isDateOutOfRange(today().subtract(100, 'day'))).toBe(false);
  });
});

describe('UnitScopeSelect', () => {
  it('사무소 ↔ 지역 전환 시 대상 컨트롤이 교체된다', async () => {
    const spy = vi.fn<(v: UnitScopeValue | undefined) => void>();
    wrap(<Controlled<UnitScopeValue | undefined> initial={{ scope: 'OFFICE' }} spy={spy}>{(v, on) => <UnitScopeSelect value={v} onChange={on} />}</Controlled>);
    expect(screen.getByRole('button', { name: '사무소 검색' })).toBeInTheDocument();
    expect(screen.queryByText('■ 지역본부선택 ■')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('지역'));
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ scope: 'REGION' }));
    expect(screen.getByText('■ 지역본부선택 ■')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '사무소 검색' })).not.toBeInTheDocument();
  });

  it('validateUnitScope: 사무소 필수 / 지역 1개 이상', () => {
    expect(validateUnitScope({ scope: 'OFFICE' })).toBe('사무소를 선택하세요.');
    expect(validateUnitScope({ scope: 'OFFICE', officeCd: '000080' })).toBeUndefined();
    expect(validateUnitScope({ scope: 'REGION', regions: [] })).toBe('지역본부를 1개 이상 선택하세요.');
    expect(validateUnitScope({ scope: 'REGION', regions: ['SEOUL'] })).toBeUndefined();
  });

  it('unitScopeField: 지역 미선택 시 조회가 막힌다', async () => {
    const onSearch = vi.fn();
    wrap(<SearchForm fields={[unitScopeField({ defaultValue: { scope: 'REGION' } })]} onSearch={onSearch} />);
    await userEvent.click(screen.getByRole('button', { name: /조회/ }));
    expect(await screen.findByText('지역본부를 1개 이상 선택하세요.')).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });
});

describe('StatTypeRadio', () => {
  it('수수료 선택 시 onChange(FEE)', async () => {
    const onChange = vi.fn();
    wrap(<StatTypeRadio value="VOLUME" onChange={onChange} />);
    await userEvent.click(screen.getByText('수수료'));
    expect(onChange).toHaveBeenCalledWith('FEE');
  });
});

describe('RegionMultiSelect', () => {
  it('전체 선택 → 전 지역, 선택 해제 → 빈 배열', async () => {
    const onChange = vi.fn();
    wrap(<RegionMultiSelect value={[]} onChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('button', { name: '전체 선택' }));
    expect(onChange).toHaveBeenLastCalledWith(REGIONS.map((r) => r.value));
    await userEvent.click(screen.getByRole('button', { name: '선택 해제' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});

describe('TimeSpin / OutsrcAllCheck', () => {
  it('TimeSpin: HHmm 값을 HH:mm 로 표시', () => {
    wrap(<TimeSpin value="0930" />);
    expect(screen.getByDisplayValue('09:30')).toBeInTheDocument();
  });

  it('outsrcAllField: 체크 시 boolean true 로 조회', async () => {
    const onSearch = vi.fn();
    wrap(<SearchForm fields={[outsrcAllField()]} onSearch={onSearch} />);
    await userEvent.click(screen.getByRole('checkbox', { name: '용역관리 대상기기 전체보기' }));
    await userEvent.click(screen.getByRole('button', { name: /조회/ }));
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ outsrcAll: true })));
  });

  it('OutsrcAllCheck: onChange(boolean)', async () => {
    const onChange = vi.fn();
    wrap(<OutsrcAllCheck value={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
