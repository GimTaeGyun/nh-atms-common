import { describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { today, type Dayjs } from '@/utils/date';
import { DateSpinner, QueryModeRadio, TimeSpin, YearMonthPicker, isDateOutOfRange, yearMonthField } from '@/components/search/fieldsExt';

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

describe('TimeSpin / QueryModeRadio / YearMonthPicker', () => {
  it('TimeSpin: HHmm 값을 HH:mm 로 표시', () => {
    wrap(<TimeSpin value="0930" />);
    expect(screen.getByDisplayValue('09:30')).toBeInTheDocument();
  });

  it('QueryModeRadio: 고른 값으로 onChange', async () => {
    const onChange = vi.fn();
    wrap(<QueryModeRadio value="A" onChange={onChange} options={[{ value: 'A', label: '가' }, { value: 'B', label: '나' }]} />);
    await userEvent.click(screen.getByText('나'));
    expect(onChange).toHaveBeenCalledWith('B');
  });

  it('YearMonthPicker 는 YYYY-MM 으로 보이고, yearMonthField 기본값은 이번 달 1일', () => {
    wrap(<YearMonthPicker value={today().startOf('month')} />);
    expect(screen.getByDisplayValue(today().format('YYYY-MM'))).toBeInTheDocument();
    expect((yearMonthField().defaultValue as Dayjs).format('YYYYMMDD')).toBe(today().startOf('month').format('YYYYMMDD'));
  });
});
