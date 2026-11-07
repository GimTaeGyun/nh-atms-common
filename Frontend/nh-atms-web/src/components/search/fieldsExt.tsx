/**
 * 공통 조회조건 컨트롤(확장) — AS-IS 화면 분석에서 반복되는 지역본부/연월/시각/일자 이동/통계·조회구분/
 * 사무소·지역 구분/업체/용역 전체보기 조건을 value/onChange 컨트롤 + SearchField 팩토리로 제공한다.
 * (마스터플랜 §5.1 common/search, fields.tsx 와 같은 규약)
 */
import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { Button, Checkbox, DatePicker, Divider, Radio, Select, Space, TimePicker } from 'antd';
import type { TimePickerProps } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { dayjs, DISPLAY_DATE, today, type Dayjs } from '@/utils/date';
import type { Option } from '@/types/common';
import type { SearchField } from './SearchForm';
import { CodeSelect, OfficeSelector } from './fields';
import type { ValueProps } from '@/types/common';
import { VMSG } from '@/config/messages';

/* ---------- 지역본부 다중선택 (AS-IS 5031 '■ 지역본부선택 ■') ---------- */
/** 지역본부 기본 목록 (코드는 화면·API 간 고정값) */
export const REGIONS: Option[] = [
  { value: 'HQ', label: '본부' },
  { value: 'SEOUL', label: '서울' },
  { value: 'SEOUL_GN', label: '서울-강남' },
  { value: 'SEOUL_JA', label: '서울-중앙' },
  { value: 'SEOUL_GB', label: '서울-강북' },
  { value: 'SEOUL_GS', label: '서울-강서' },
  { value: 'BUSAN', label: '부산' },
  { value: 'DAEGU', label: '대구' },
  { value: 'INCHEON', label: '인천' },
  { value: 'GWANGJU', label: '광주' },
  { value: 'DAEJEON', label: '대전' },
  { value: 'ULSAN', label: '울산' },
  { value: 'SEJONG', label: '세종' },
  { value: 'GYEONGGI', label: '경기' },
  { value: 'GANGWON', label: '강원' },
  { value: 'CHUNGBUK', label: '충북' },
  { value: 'CHUNGNAM', label: '충남' },
  { value: 'JEONBUK', label: '전북' },
  { value: 'JEONNAM', label: '전남' },
  { value: 'GYEONGBUK', label: '경북' },
  { value: 'GYEONGNAM', label: '경남' },
  { value: 'JEJU', label: '제주' },
];

export const RegionMultiSelect = ({ value, onChange, disabled, options = REGIONS, placeholder = '■ 지역본부선택 ■' }: ValueProps<string[] | undefined> & { options?: Option[]; placeholder?: string }) => {
  const all = useMemo(() => options.map((o) => String(o.value)), [options]);
  // 드롭다운 상단 일괄 버튼 — mousedown 기본동작을 막아 드롭다운이 닫히지 않게 한다
  const popupRender = (menu: ReactElement) => (
    <>
      <Space size={4} style={{ padding: '2px 8px' }}>
        <Button size="small" type="link" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange?.(all)}>전체 선택</Button>
        <Button size="small" type="link" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange?.([])}>선택 해제</Button>
      </Space>
      <Divider style={{ margin: '4px 0' }} />
      {menu}
    </>
  );
  return (
    <Select
      mode="multiple"
      value={value}
      onChange={(v: string[]) => onChange?.(v)}
      options={options}
      disabled={disabled}
      maxTagCount="responsive"
      placeholder={placeholder}
      optionFilterProp="label"
      popupRender={popupRender}
      allowClear
      style={{ width: '100%' }}
    />
  );
};

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

/* ---------- 날짜 + 이전일/다음일 (AS-IS 2301 '최대 10일 전까지') ---------- */
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

/* ---------- 통계구분: 거래량/수수료 ---------- */
export type StatType = 'VOLUME' | 'FEE';
export const STAT_TYPE_OPTIONS: { value: StatType; label: string }[] = [
  { value: 'VOLUME', label: '거래량' },
  { value: 'FEE', label: '수수료' },
];
export const StatTypeRadio = ({ value, onChange, disabled }: ValueProps<StatType | undefined>) => (
  <Radio.Group optionType="button" buttonStyle="solid" options={STAT_TYPE_OPTIONS} value={value} onChange={(e) => onChange?.(e.target.value as StatType)} disabled={disabled} />
);

/* ---------- 조회구분 토글 (범용) ---------- */
export type QueryModeOption = Option;
export const QueryModeRadio = ({ value, onChange, disabled, options }: ValueProps<string | undefined> & { options: QueryModeOption[] }) => (
  <Radio.Group optionType="button" buttonStyle="solid" options={options} value={value} onChange={(e) => onChange?.(e.target.value as string)} disabled={disabled} />
);

/* ---------- 사무소/지역 구분 + 대상 컨트롤 교체 (AS-IS 5031) ---------- */
export type UnitScope = 'OFFICE' | 'REGION';
export interface UnitScopeValue {
  scope: UnitScope;
  officeCd?: string;
  regions?: string[];
}
const SCOPE_OPTS = [{ value: 'OFFICE', label: '사무소' }, { value: 'REGION', label: '지역' }];
export const UnitScopeSelect = ({ value, onChange, disabled, regionOptions }: ValueProps<UnitScopeValue | undefined> & { regionOptions?: Option[] }) => {
  const v: UnitScopeValue = value ?? { scope: 'OFFICE' };
  // 구분 전환 시 반대쪽 입력값은 유지(되돌아왔을 때 복원) — 조회 시에는 scope 기준으로만 사용
  const set = (patch: Partial<UnitScopeValue>) => onChange?.({ ...v, ...patch });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
      <Radio.Group optionType="button" buttonStyle="solid" options={SCOPE_OPTS} value={v.scope} onChange={(e) => set({ scope: e.target.value as UnitScope })} disabled={disabled} style={{ flex: 'none' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {v.scope === 'OFFICE'
          ? <OfficeSelector value={v.officeCd} onChange={(officeCd) => set({ officeCd })} disabled={disabled} />
          : <RegionMultiSelect value={v.regions} onChange={(regions) => set({ regions })} disabled={disabled} options={regionOptions} />}
      </div>
    </div>
  );
};

/** UnitScopeValue 필수 검증: 사무소면 사무소코드, 지역이면 1개 이상 */
export const validateUnitScope = (v?: UnitScopeValue): string | undefined => {
  if (!v) return VMSG.select('조회단위');
  if (v.scope === 'OFFICE' && !v.officeCd) return VMSG.select('사무소');
  if (v.scope === 'REGION' && !v.regions?.length) return VMSG.selectAtLeastOne('지역본부');
  return undefined;
};

/* ---------- 용역업체/제조사 (공통코드 VENDOR) ---------- */
export const VendorSelect = ({ value, onChange, disabled, groupCd = 'VENDOR', allowAll = true, placeholder = '업체 선택' }: ValueProps<string | undefined> & { groupCd?: string; allowAll?: boolean; placeholder?: string }) => (
  <CodeSelect value={value} onChange={onChange} disabled={disabled} groupCd={groupCd} allowAll={allowAll} placeholder={placeholder} />
);

/* ---------- 용역관리 대상기기 전체보기 (단일 체크, 값 boolean) ---------- */
export const OutsrcAllCheck = ({ value, onChange, disabled, text = '용역관리 대상기기 전체보기' }: ValueProps<boolean | undefined> & { text?: string }) => (
  <Checkbox checked={!!value} onChange={(e) => onChange?.(e.target.checked)} disabled={disabled}>{text}</Checkbox>
);

/* ---------- SearchField 팩토리 ---------- */
export const regionField = ({ regionOptions, ...opts }: Partial<SearchField> & { regionOptions?: Option[] } = {}): SearchField => ({
  name: 'regions',
  label: '지역본부',
  type: 'custom',
  widthClass: 'long',
  render: () => <RegionMultiSelect options={regionOptions} />,
  ...opts,
});

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

export const statTypeField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'statType',
  label: '통계구분',
  type: 'custom',
  widthClass: 'normal',
  defaultValue: 'VOLUME',
  render: () => <StatTypeRadio />,
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

export const unitScopeField = ({ regionOptions, ...opts }: Partial<SearchField> & { regionOptions?: Option[] } = {}): SearchField => ({
  name: 'unit',
  label: '조회단위',
  type: 'custom',
  widthClass: 'wide',
  required: true,
  defaultValue: { scope: 'OFFICE' } satisfies UnitScopeValue,
  rules: [{
    validator: (_r, v?: UnitScopeValue) => {
      const msg = validateUnitScope(v);
      return msg ? Promise.reject(new Error(msg)) : Promise.resolve();
    },
  }],
  render: () => <UnitScopeSelect regionOptions={regionOptions} />,
  ...opts,
});

export const vendorField = ({ groupCd, ...opts }: Partial<SearchField> & { groupCd?: string } = {}): SearchField => ({
  name: 'vendorCd',
  label: '업체',
  type: 'custom',
  widthClass: 'normal',
  defaultValue: 'ALL',
  render: () => <VendorSelect groupCd={groupCd} />,
  ...opts,
});

/** 컨트롤 자체가 boolean value/onChange 를 받으므로 valuePropName 불필요. 라벨은 체크박스 글자로 대체 */
export const outsrcAllField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'outsrcAll',
  label: '용역관리 대상기기 전체보기',
  type: 'custom',
  widthClass: 'long',
  noLabel: true,
  defaultValue: false,
  render: () => <OutsrcAllCheck />,
  ...opts,
});
