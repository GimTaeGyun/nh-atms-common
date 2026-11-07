/**
 * 공통 조회조건 컨트롤(확장) — 연월/시각/일자 이동/조회구분 조건을 value/onChange 컨트롤 + SearchField 팩토리로 제공한다.
 * [원본] nh-atms `components/search/fieldsExt.tsx` 에서 업무 전용(지역본부 하드코딩 목록·통계구분·사무소/지역 구분·
 * 용역 전체보기)을 뺐다. 지역은 SidoSelect(TB_CO_SIDO), 기기사는 VendorSelect(lookupFields.tsx) 를 쓴다.
 */
import { Button, DatePicker, Radio, Space, TimePicker } from 'antd';
import type { TimePickerProps } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { dayjs, DISPLAY_DATE, today, type Dayjs } from '@/utils/date';
import type { Option } from '@/types/common';
import type { SearchField } from './SearchForm';
import type { ValueProps } from '@/types/common';
import { VMSG } from '@/config/messages';

/* ---------- 연월 단일 (YYYY-MM) ---------- */
export const YearMonthPicker = ({ value, onChange, disabled, allowClear = false }: ValueProps<Dayjs | undefined> & { allowClear?: boolean }) => (
  <DatePicker picker="month" format="YYYY-MM" value={value} onChange={(d) => onChange?.(d ?? undefined)} disabled={disabled} allowClear={allowClear} style={{ width: '100%', minWidth: 104 }} />
);

/* ---------- 단일 시각 HH:mm (값은 'HHmm' 문자열) ---------- */
export const TimeSpin = ({ value, onChange, disabled, minuteStep = 1, placeholder = '시:분' }: ValueProps<string | undefined> & { minuteStep?: TimePickerProps['minuteStep']; placeholder?: string }) => {
  const d = value ? dayjs(value, 'HHmm', true) : undefined;
  return (
    <TimePicker
      format="HH:mm"
      minuteStep={minuteStep}
      value={d?.isValid() ? d : undefined}
      onChange={(t) => onChange?.(t ? t.format('HHmm') : undefined)}
      disabled={disabled}
      placeholder={placeholder}
      needConfirm={false}
      style={{ width: '100%', minWidth: 90 }}
    />
  );
};

/* ---------- 날짜 + 이전일/다음일 (예: '최대 10일 전까지') ---------- */
/** 선택 불가 일자 판정: 미래(allowFuture=false) 또는 오늘-maxDaysBack 이전 */
export const isDateOutOfRange = (d: Dayjs, maxDaysBack?: number, allowFuture = false): boolean => {
  const base = today();
  if (!allowFuture && d.isAfter(base, 'day')) return true;
  if (maxDaysBack !== undefined && d.isBefore(base.subtract(maxDaysBack, 'day'), 'day')) return true;
  return false;
};

export const DateSpinner = ({ value, onChange, disabled, maxDaysBack, allowFuture = false }: ValueProps<Dayjs | undefined> & { maxDaysBack?: number; allowFuture?: boolean }) => {
  const cur = value ?? today();
  const prev = cur.subtract(1, 'day');
  const next = cur.add(1, 'day');
  const out = (d: Dayjs) => isDateOutOfRange(d, maxDaysBack, allowFuture);
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Button icon={<LeftOutlined />} aria-label="이전일" disabled={disabled || out(prev)} onClick={() => onChange?.(prev)} />
      <DatePicker value={value} format={DISPLAY_DATE} onChange={(d) => d && onChange?.(d)} disabledDate={out} disabled={disabled} allowClear={false} style={{ flex: 1, minWidth: 110 }} />
      <Button icon={<RightOutlined />} aria-label="다음일" disabled={disabled || out(next)} onClick={() => onChange?.(next)} />
    </Space.Compact>
  );
};

/* ---------- 조회구분 토글 (범용) ---------- */
export type QueryModeOption = Option;
export const QueryModeRadio = ({ value, onChange, disabled, options }: ValueProps<string | undefined> & { options: QueryModeOption[] }) => (
  <Radio.Group optionType="button" buttonStyle="solid" options={options} value={value} onChange={(e) => onChange?.(e.target.value as string)} disabled={disabled} />
);

/* ---------- SearchField 팩토리 ---------- */
export const yearMonthField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'yyyymm',
  label: '기준월',
  type: 'custom',
  widthClass: 'code',
  required: true,
  defaultValue: today().startOf('month'),
  render: () => <YearMonthPicker />,
  ...opts,
});

export const timeField = ({ minuteStep, ...opts }: Partial<SearchField> & { minuteStep?: TimePickerProps['minuteStep'] } = {}): SearchField => ({
  name: 'time',
  label: '시각',
  type: 'custom',
  widthClass: 'code',
  render: () => <TimeSpin minuteStep={minuteStep} />,
  ...opts,
});

export const dateSpinnerField = ({ maxDaysBack, allowFuture, ...opts }: Partial<SearchField> & { maxDaysBack?: number; allowFuture?: boolean } = {}): SearchField => ({
  name: 'baseDate',
  label: '거래일자',
  type: 'custom',
  widthClass: 'normal',
  required: true,
  defaultValue: today(),
  rules: [{
    validator: (_r, v?: Dayjs) => {
      if (!v || !isDateOutOfRange(v, maxDaysBack, allowFuture)) return Promise.resolve();
      return Promise.reject(new Error(maxDaysBack !== undefined ? VMSG.daysBackMax(maxDaysBack) : VMSG.noFuture));
    },
  }],
  render: () => <DateSpinner maxDaysBack={maxDaysBack} allowFuture={allowFuture} />,
  ...opts,
});

export const queryModeField = (name: string, label: string, options: QueryModeOption[], opts: Partial<SearchField> = {}): SearchField => ({
  name,
  label,
  type: 'custom',
  widthClass: 'long',
  defaultValue: options[0]?.value,
  render: () => <QueryModeRadio options={options} />,
  ...opts,
});
