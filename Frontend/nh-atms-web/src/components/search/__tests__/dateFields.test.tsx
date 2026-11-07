import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { HolidayDatePicker, PresetRangePicker, YearPicker, rangeField, rangePresets, yearField, holidayDateField } from '@/components/search/dateFields';
import { SearchForm } from '@/components/search/SearchForm';
import { ymdRange } from '@/components/search/params';
import { today, dayjs } from '@/utils/date';
import { VMSG } from '@/config/messages';
import { holidaysOf } from '@/mocks/data/lookup';

describe('기간 빠른선택', () => {
  it('오늘·1주·1개월·3개월, 끝은 오늘, maxDays 를 넘는 것은 뺀다', () => {
    const all = rangePresets();
    expect(all.map((p) => p.label)).toEqual(['오늘', '1주', '1개월', '3개월']);
    const [from, to] = all[1].value();
    expect(to.isSame(today(), 'day')).toBe(true);
    expect(to.diff(from, 'day') + 1).toBe(7);
    expect(rangePresets(31).map((p) => p.label)).toEqual(['오늘', '1주', '1개월']); // 1개월은 언제나 31일 이하
    expect(rangePresets(7).map((p) => p.label)).toEqual(['오늘', '1주']);
  });

  it('달력에 빠른선택 버튼이 보이고 누르면 그 기간으로 바뀐다', async () => {
    const onChange = vi.fn();
    renderWithProviders(<PresetRangePicker value={[today(), today()]} onChange={onChange} />);
    fireEvent.mouseDown(screen.getAllByRole('textbox')[0]);
    fireEvent.click(screen.getAllByRole('textbox')[0]);
    fireEvent.click(await screen.findByText('1주'));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const [from, to] = onChange.mock.calls[0][0] as [dayjs.Dayjs, dayjs.Dayjs];
    expect(to.diff(from, 'day') + 1).toBe(7);
  });

  it('rangeField: 최대 일수를 넘으면 조회가 막히고 문구를 보인다, 안 넘으면 ymdRange 로 YYYYMMDD', async () => {
    const onSearch = vi.fn();
    const { unmount } = renderWithProviders(<SearchForm fields={[rangeField({ maxDays: 3, defaultValue: [today().subtract(9, 'day'), today()] })]} onSearch={onSearch} />);
    fireEvent.click(screen.getByRole('button', { name: /조회/ }));
    expect(await screen.findByText(VMSG.periodMax(3))).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
    unmount();
    renderWithProviders(<SearchForm fields={[rangeField({ maxDays: 31 })]} onSearch={onSearch} />);
    fireEvent.click(screen.getByRole('button', { name: /조회/ }));
    await waitFor(() => expect(onSearch).toHaveBeenCalled());
    expect(ymdRange((onSearch.mock.calls[0][0] as Record<string, unknown>).period)).toEqual({ fromDate: today().format('YYYYMMDD'), toDate: today().format('YYYYMMDD') });
  });
});

describe('년도', () => {
  it("YearPicker 값은 'YYYY' 문자열, yearField 기본은 올해", async () => {
    const onChange = vi.fn();
    renderWithProviders(<YearPicker value="2025" onChange={onChange} />);
    expect(screen.getByDisplayValue('2025')).toBeInTheDocument();
    expect(yearField().defaultValue).toBe(today().format('YYYY'));
    expect(yearField().name).toBe('year');
  });
});

describe('휴일 표시', () => {
  it('목 휴일 표: 토·일·고정 공휴일 HDAY_YN=Y', () => {
    const rows = holidaysOf('20261225', '20261227');
    expect(rows.map((r) => [r.hdayDt, r.hdayYn])).toEqual([['20261225', 'Y'], ['20261226', 'Y'], ['20261227', 'Y']]);
    expect(holidaysOf('20261104', '20261104')[0].hdayYn).toBe('N');
  });

  it('HolidayDatePicker: 달력을 열면 그 달 휴일 칸에 holiday-cell 표시', async () => {
    const base = dayjs('20261201', 'YYYYMMDD');
    const { baseElement } = renderWithProviders(<HolidayDatePicker value={base} />);
    fireEvent.mouseDown(screen.getByRole('textbox'));
    fireEvent.click(screen.getByRole('textbox'));
    await waitFor(() => expect(baseElement.querySelector('[data-holiday="20261225"]')).not.toBeNull(), { timeout: 3000 });
    expect(baseElement.querySelector('[data-holiday="20261224"]')).toBeNull();
    expect(holidayDateField().type).toBe('custom');
  });
});
