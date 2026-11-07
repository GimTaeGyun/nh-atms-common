/**
 * 공통 조회조건 컨트롤 — 전 화면에서 반복되는 AS-IS 조건(사무소/기번/합계후전 기간/시간/코드)을
 * value/onChange 컨트롤 + SearchField 팩토리로 제공한다. (마스터플랜 §5.1 common/search)
 */
import { useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, Select, Space } from 'antd';
import type { FormInstance } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useAtms, useCodes, useOffices } from '@/hooks/useCodes';
import { useAuthStore, selectOfficeCd } from '@/stores/useAuthStore';
import { timeOptions, today } from '@/utils/date';
import { fmtOffice } from '@/utils/format';
import type { SearchField } from './SearchForm';
import { OfficeSearchModal } from './OfficeSearchModal';
import type { Office } from '@/domain/types';
import type { PeriodUnit, TotalFlag, ValueProps } from '@/types/common';
import { VMSG } from '@/config/messages';

export type { ValueProps };

/* ---------- 사무소 선택: 셀렉트([코드] 명) + 코드 직접입력 + 돋보기 ---------- */
export const OfficeSelector = ({ value, onChange, disabled, allowEmpty }: ValueProps<string | undefined> & { allowEmpty?: boolean }) => {
  const { data: offices = [] } = useOffices();
  const [code, setCode] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setCode(value ?? '');
  }
  const apply = () => {
    const hit = offices.find((o) => o.officeCd === code.padStart(6, '0'));
    if (hit) onChange?.(hit.officeCd);
  };
  const select = (o: Office) => {
    onChange?.(o.officeCd);
    setCode(o.officeCd);
  };
  return (
    <>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          value={value}
          disabled={disabled}
          onChange={(v) => { onChange?.(v); setCode(v ?? ''); }}
          options={offices.map((o) => ({ value: o.officeCd, label: fmtOffice(o.officeCd, o.officeName) }))}
          showSearch
          optionFilterProp="label"
          allowClear={allowEmpty}
          placeholder={allowEmpty ? '-- 사무소검색 --' : '사무소 선택'}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Input
          value={code}
          maxLength={6}
          placeholder="코드"
          disabled={disabled}
          style={{ width: 66, textAlign: 'center' }}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onBlur={apply}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              apply();
            }
          }}
        />
        <Button icon={<SearchOutlined />} onClick={() => setOpen(true)} disabled={disabled} aria-label="사무소 검색" />
      </Space.Compact>
      <OfficeSearchModal open={open} onClose={() => setOpen(false)} onSelect={select} />
    </>
  );
};

/* ---------- 기번: 사무소에 종속되는 셀렉트 ---------- */
export const AtmSelect = ({ value, onChange, disabled, form, officeField = 'officeCd', allowAll = true }: ValueProps<string | undefined> & { form: FormInstance; officeField?: string; allowAll?: boolean }) => {
  const officeCd = Form.useWatch(officeField, form) as string | undefined;
  const { data: atms = [], isFetching } = useAtms(officeCd);
  const options = useMemo(() => atms.map((a) => ({ value: a.termId, label: `${a.termId}  ${a.modelName}` })), [atms]);
  const shown = options.some((o) => o.value === value) ? value : undefined;
  return <Select value={shown} onChange={onChange} options={options} loading={isFetching} allowClear={allowAll} placeholder={allowAll ? '전체' : '기번 선택'} disabled={disabled || !officeCd} showSearch optionFilterProp="label" style={{ width: '100%' }} />;
};

/* ---------- 거래일자 From/To + 합계후/합계전 ---------- */
export interface DateRangeTotalValue {
  from?: Dayjs;
  fromTotal: TotalFlag;
  to?: Dayjs;
  toTotal: TotalFlag;
}
const TOTAL_OPTS = [{ value: 'AFTER', label: '합계후' }, { value: 'BEFORE', label: '합계전' }];
export const DateRangeWithTotal = ({ value, onChange, disabled }: ValueProps<DateRangeTotalValue | undefined>) => {
  const v: DateRangeTotalValue = value ?? { fromTotal: 'AFTER', toTotal: 'BEFORE' };
  const set = (patch: Partial<DateRangeTotalValue>) => onChange?.({ ...v, ...patch });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
      <DatePicker value={v.from} onChange={(d) => set({ from: d ?? undefined })} disabled={disabled} style={{ flex: 1, minWidth: 104 }} allowClear={false} />
      <Select value={v.fromTotal} onChange={(t) => set({ fromTotal: t })} options={TOTAL_OPTS} disabled={disabled} style={{ width: 84 }} />
      <span className="muted">~</span>
      <DatePicker value={v.to} onChange={(d) => set({ to: d ?? undefined })} disabled={disabled} style={{ flex: 1, minWidth: 104 }} allowClear={false} />
      <Select value={v.toTotal} onChange={(t) => set({ toTotal: t })} options={TOTAL_OPTS} disabled={disabled} style={{ width: 84 }} />
    </div>
  );
};

/* ---------- 시간 범위 (HH:mm select) ---------- */
export interface TimeRangeValue {
  from: string;
  to: string;
}
export const TimeRangeSelect = ({ value, onChange, disabled, step = 30 }: ValueProps<TimeRangeValue | undefined> & { step?: number }) => {
  const opts = useMemo(() => timeOptions(step), [step]);
  const v = value ?? { from: '0000', to: '2359' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
      <Select value={v.from} onChange={(t) => onChange?.({ ...v, from: t })} options={opts} disabled={disabled} style={{ flex: 1 }} showSearch />
      <span className="muted">~</span>
      <Select value={v.to} onChange={(t) => onChange?.({ ...v, to: t })} options={opts} disabled={disabled} style={{ flex: 1 }} showSearch />
    </div>
  );
};

/* ---------- 기간 단위(일별/월별) + 범위 ---------- */
export interface PeriodValue {
  unit: PeriodUnit;
  range?: [Dayjs, Dayjs];
}
export const PeriodPicker = ({ value, onChange, disabled }: ValueProps<PeriodValue | undefined>) => {
  const v: PeriodValue = value ?? { unit: 'DAY' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
      <Select value={v.unit} onChange={(unit) => onChange?.({ ...v, unit })} options={[{ value: 'DAY', label: '일별' }, { value: 'MONTH', label: '월별' }]} disabled={disabled} style={{ width: 80 }} />
      <DatePicker.RangePicker value={v.range} onChange={(r) => onChange?.({ ...v, range: r && r[0] && r[1] ? [r[0], r[1]] : undefined })} picker={v.unit === 'MONTH' ? 'month' : 'date'} disabled={disabled} style={{ flex: 1 }} allowClear={false} />
    </div>
  );
};

/* ---------- 공통코드 셀렉트 ---------- */
export const CodeSelect = ({ value, onChange, disabled, groupCd, allLabel = '전체', allowAll = true, placeholder }: ValueProps<string | undefined> & { groupCd: string; allLabel?: string; allowAll?: boolean; placeholder?: string }) => {
  const { options, isFetching } = useCodes(groupCd);
  const opts = allowAll ? [{ value: 'ALL', label: allLabel }, ...options] : options;
  return <Select value={value} onChange={onChange} options={opts} loading={isFetching} disabled={disabled} placeholder={placeholder} style={{ width: '100%' }} />;
};

/* ---------- SearchField 팩토리 ---------- */
export const officeField = (opts: Partial<SearchField> & { defaultValue?: string } = {}): SearchField => ({
  name: 'officeCd',
  label: '사무소',
  type: 'custom',
  widthClass: 'long',
  required: true,
  render: () => <OfficeSelector allowEmpty={!opts.required && opts.required !== undefined} />,
  ...opts,
});

export const atmField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'termId',
  label: '기번',
  type: 'custom',
  widthClass: 'normal',
  render: (form) => <AtmSelect form={form} officeField={(opts as { officeField?: string }).officeField ?? 'officeCd'} />,
  ...opts,
});

export const dateTotalField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'period',
  label: '거래일자',
  type: 'custom',
  widthClass: 'wide',
  required: true,
  rules: [{ validator: (_r, v?: DateRangeTotalValue) => (v?.from && v?.to ? Promise.resolve() : Promise.reject(new Error(VMSG.required('거래일자')))) }],
  render: () => <DateRangeWithTotal />,
  ...opts,
});

export const timeRangeField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'time',
  label: '시간',
  type: 'custom',
  widthClass: 'long',
  defaultValue: { from: '0000', to: '2359' },
  render: () => <TimeRangeSelect />,
  ...opts,
});

export const periodField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'period',
  label: '거래일자',
  type: 'custom',
  widthClass: 'range',
  required: true,
  rules: [{ validator: (_r, v?: PeriodValue) => (v?.range ? Promise.resolve() : Promise.reject(new Error(VMSG.required('기간')))) }],
  render: () => <PeriodPicker />,
  ...opts,
});

export const codeField = (name: string, label: string, groupCd: string, opts: Partial<SearchField> = {}): SearchField => ({
  name,
  label,
  type: 'custom',
  widthClass: 'normal',
  defaultValue: 'ALL',
  render: () => <CodeSelect groupCd={groupCd} />,
  ...opts,
});

/** 단일 체크박스 조건 (라벨 없이 컨트롤 안에 글자) — `v[name] === true` */
export const checkField = (name: string, text: string, opts: Partial<SearchField> = {}): SearchField => ({
  name,
  label: '',
  type: 'checkbox',
  widthClass: 'normal',
  valuePropName: 'checked',
  defaultValue: false,
  componentProps: { children: text },
  ...opts,
});

/** 단일 날짜 조건 (기본 오늘, 필수) */
export const dateField = (name = 'date', label = '조회일자', opts: Partial<SearchField> = {}): SearchField => ({
  name,
  label,
  type: 'datePicker',
  required: true,
  defaultValue: today(),
  ...opts,
});

/**
 * 가장 흔한 조건 묶음: 사무소(로그인 사무소 기본) + 기번 [+ 조회일자].
 * 훅이므로 컴포넌트 본문에서 호출한다. 예: `const fields = useOfficeAtmFields({ date: true })`
 */
export const useOfficeAtmFields = (opts: { date?: boolean | string; officeLabel?: string; atm?: boolean; extra?: SearchField[] } = {}): SearchField[] => {
  const officeCd = useAuthStore(selectOfficeCd);
  const { date, officeLabel, atm = true, extra } = opts;
  return useMemo(() => {
    const out: SearchField[] = [officeField({ defaultValue: officeCd, ...(officeLabel ? { label: officeLabel } : {}) })];
    if (atm) out.push(atmField());
    if (date) out.push(dateField('date', typeof date === 'string' ? date : '조회일자'));
    return extra ? [...out, ...extra] : out;
  }, [officeCd, date, officeLabel, atm, extra]);
};
