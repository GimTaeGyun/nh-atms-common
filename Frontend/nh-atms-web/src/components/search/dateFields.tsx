/**
 * 날짜 부품(신규, 설계 Q8) — 기간 빠른선택(오늘·1주·1개월·3개월), 년도 선택, 휴일 표시 달력.
 * 기존 날짜 부품(dateField·periodField·yearMonthField·dateSpinnerField·timeRangeField)은 fields.tsx·fieldsExt.tsx.
 * 값 규칙: 화면 안에서는 Dayjs, API 로 보낼 때 params.ts(ymdRange 등)로 'YYYYMMDD' 문자열. 년도만 'YYYY' 문자열 값.
 */
import { useMemo, useState } from 'react';
import { DatePicker } from 'antd';
import type { Rule } from 'antd/es/form';
import { dayjs, today, toYmd, validateRange, type Dayjs } from '@/utils/date';
import { holidayCellRender, useHolidays } from '@/hooks/useHolidays';
import type { ValueProps } from '@/types/common';
import type { SearchField } from './SearchForm';
import { VMSG } from '@/config/messages';

/* ---------- 기간 빠른선택 ---------- */
export interface RangePreset {
  label: string;
  /** 누를 때마다 오늘 기준으로 다시 계산 */
  value: () => [Dayjs, Dayjs];
}

/** 빠른선택 정의 — 끝은 오늘, 시작은 오늘에서 뺀 날(+1일: 오늘 포함 n일) */
const PRESET_DEFS: { label: string; from: () => Dayjs }[] = [
  { label: '오늘', from: () => today() },
  { label: '1주', from: () => today().subtract(1, 'week').add(1, 'day') },
  { label: '1개월', from: () => today().subtract(1, 'month').add(1, 'day') },
  { label: '3개월', from: () => today().subtract(3, 'month').add(1, 'day') },
];

/**
 * RangePicker `presets` 값. maxDays 를 주면 그보다 긴 빠른선택은 뺀다(예: 최대 31일이면 3개월 없음).
 * 예: `<DatePicker.RangePicker presets={rangePresets(31)} />`
 */
export const rangePresets = (maxDays?: number): RangePreset[] =>
  PRESET_DEFS.filter((p) => !maxDays || today().diff(p.from(), 'day') + 1 <= maxDays).map((p) => ({ label: p.label, value: () => [p.from(), today()] }));

/** 휴일 조회 범위: 기준 달 앞뒤로 넉넉히(최대 366일 제한 안쪽) */
const holidayWindow = (base: Dayjs, months: number): [string, string] => [toYmd(base.startOf('month').subtract(7, 'day'))!, toYmd(base.add(months - 1, 'month').endOf('month').add(7, 'day'))!];

/* ---------- 기간 선택(빠른선택 + 휴일 표시) ---------- */
export interface PresetRangePickerProps extends ValueProps<[Dayjs, Dayjs] | undefined> {
  /** 빠른선택 버튼(기본 true) */
  presets?: boolean;
  /** 최대 일수 — 빠른선택을 거른다(검증은 rangeField 의 rules) */
  maxDays?: number;
  /** 휴일 빨간 표시(TB_NMS_HDAY, 기본 false) */
  holidays?: boolean;
  allowClear?: boolean;
}

export const PresetRangePicker = ({ value, onChange, disabled, presets = true, maxDays, holidays = false, allowClear = false }: PresetRangePickerProps) => {
  const [panel, setPanel] = useState<Dayjs>(() => value?.[0] ?? today());
  const [from, to] = holidayWindow(panel, 2);
  const { days } = useHolidays(holidays ? from : undefined, holidays ? to : undefined);
  const presetItems = useMemo(() => (presets ? rangePresets(maxDays) : undefined), [presets, maxDays]);
  return (
    <DatePicker.RangePicker
      value={value}
      onChange={(r) => onChange?.(r && r[0] && r[1] ? [r[0], r[1]] : (undefined as never))}
      presets={presetItems}
      disabled={disabled}
      allowClear={allowClear}
      onPanelChange={(v) => v?.[0] && setPanel(v[0])}
      cellRender={holidays ? holidayCellRender(days) : undefined}
      style={{ width: '100%' }}
    />
  );
};

/** 기간 검증 규칙 — 순서 + 최대 일수(maxDays) [+ 필수]. Form.Item rules 에 그대로(SearchForm 은 required 를 따로 검사하므로 required=false) */
export const rangeRules = (label: string, maxDays?: number, required = true): Rule[] => [
  {
    validator: (_r, v?: [Dayjs?, Dayjs?]) => {
      if (!v?.[0] || !v?.[1]) return required ? Promise.reject(new Error(VMSG.required(label))) : Promise.resolve();
      const msg = validateRange(v[0], v[1], maxDays);
      return msg ? Promise.reject(new Error(msg)) : Promise.resolve();
    },
  },
];

/**
 * 기간 조건 — 빠른선택(오늘·1주·1개월·3개월) + 최대 일수 검증 + (선택) 휴일 표시.
 * 값은 [Dayjs, Dayjs], API 파라미터는 `ymdRange(v.period)` → { fromDate, toDate }.
 * 예: `rangeField({ maxDays: 31 })`, `rangeField({ name: 'wrtDate', label: '작성일', maxDays: 366, defaultValue: lastDays(30) })`
 */
export const rangeField = ({ presets = true, maxDays, holidays = false, ...opts }: Partial<SearchField> & { presets?: boolean; maxDays?: number; holidays?: boolean } = {}): SearchField => {
  const label = opts.label ?? '기간';
  return {
    name: 'period',
    label,
    type: 'custom',
    widthClass: 'range',
    defaultValue: [today(), today()],
    required: true,
    // 필수 검사는 SearchForm 의 required 가 한다 → 여기서는 순서·최대 일수만
    rules: rangeRules(label, maxDays, false),
    render: () => <PresetRangePicker presets={presets} maxDays={maxDays} holidays={holidays} />,
    ...opts,
  };
};

/* ---------- 년도 ---------- */
/** 년도 선택 — 값은 'YYYY' 문자열(API 파라미터에 그대로) */
export const YearPicker = ({ value, onChange, disabled, allowClear = false }: ValueProps<string | undefined> & { allowClear?: boolean }) => {
  const d = value ? dayjs(value, 'YYYY', true) : undefined;
  return <DatePicker picker="year" format="YYYY" value={d?.isValid() ? d : undefined} onChange={(v) => onChange?.(v ? v.format('YYYY') : undefined)} disabled={disabled} allowClear={allowClear} style={{ width: '100%', minWidth: 90 }} />;
};

/** 년도 조건 (이름 'year', 기본 올해 'YYYY', 필수) */
export const yearField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'year',
  label: '년도',
  type: 'custom',
  widthClass: 'code',
  required: true,
  defaultValue: today().format('YYYY'),
  render: () => <YearPicker />,
  ...opts,
});

/* ---------- 휴일 표시 단일 날짜 ---------- */
/** 단일 날짜 + 휴일 빨간 표시. 보이는 달이 바뀌면 그 달의 휴일을 읽는다(TB_NMS_HDAY, 표시만) */
export const HolidayDatePicker = ({ value, onChange, disabled, allowClear = false }: ValueProps<Dayjs | undefined> & { allowClear?: boolean }) => {
  const [panel, setPanel] = useState<Dayjs>(() => value ?? today());
  const [from, to] = holidayWindow(panel, 1);
  const { days } = useHolidays(from, to);
  return (
    <DatePicker
      value={value}
      onChange={(d) => onChange?.(d ?? undefined)}
      onPanelChange={(v) => v && setPanel(v)}
      cellRender={holidayCellRender(days)}
      disabled={disabled}
      allowClear={allowClear}
      style={{ width: '100%', minWidth: 104 }}
    />
  );
};

/** 단일 날짜 조건 + 휴일 표시 (기본 오늘, 필수) */
export const holidayDateField = (name = 'date', label = '조회일자', opts: Partial<SearchField> = {}): SearchField => ({
  name,
  label,
  type: 'custom',
  widthClass: 'code',
  required: true,
  defaultValue: today(),
  render: () => <HolidayDatePicker />,
  ...opts,
});
