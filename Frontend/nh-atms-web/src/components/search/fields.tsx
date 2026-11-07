/**
 * 공통 조회조건 컨트롤 — 전 화면에서 반복되는 조건(사무소/기번/시간/기간/공통코드)을
 * value/onChange 컨트롤 + SearchField 팩토리로 제공한다. [원본] nh-atms `components/search/fields.tsx`.
 * 필드 이름은 TO-BE 컬럼 camelCase(설계 Q5): 사무소 `ofcCode`, 기번 `mcnNo`.
 * 콤보 원천은 공통 조회 API(`/api/lookup/*`, api/endpoints/lookup.ts).
 */
import { useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, Select, Space } from 'antd';
import type { FormInstance } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useCodes } from '@/hooks/useCodes';
import { useMcns, useOffices } from '@/hooks/useLookup';
import { useAuthStore, selectOfcCode } from '@/stores/useAuthStore';
import { timeOptions, today } from '@/utils/date';
import { fmtOffice } from '@/utils/format';
import type { SearchField } from './SearchForm';
import { OfficeSearchModal } from './OfficeSearchModal';
import type { Office } from '@/domain/lookup';
import type { PeriodUnit, ValueProps } from '@/types/common';
import { VMSG } from '@/config/messages';

export type { ValueProps };

/** 사무소코드 6자리 정규화(앞자리 0 채움) — 서버 OfficeCode.norm 과 같은 규칙 */
export const normOfcCode = (v: string): string => (v ? v.replace(/\D/g, '').padStart(6, '0') : '');

/* ---------- 사무소 선택: 셀렉트([코드] 명) + 코드 직접입력 + 돋보기 팝업 ---------- */
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
    const hit = offices.find((o) => o.ofcCode === normOfcCode(code));
    if (hit) onChange?.(hit.ofcCode);
  };
  const select = (o: Office) => {
    onChange?.(o.ofcCode);
    setCode(o.ofcCode);
  };
  return (
    <>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          value={value || undefined}
          disabled={disabled}
          onChange={(v) => { onChange?.(v); setCode(v ?? ''); }}
          options={offices.map((o) => ({ value: o.ofcCode, label: fmtOffice(o.ofcCode, o.kanm) }))}
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
          aria-label="사무소코드"
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

/* ---------- 기번(기기): 사무소에 종속되는 셀렉트 ---------- */
/**
 * 기번 콤보 — 같은 폼의 사무소 칸(`officeField`, 기본 'ofcCode')을 보고 `GET /api/lookup/machines?ofcCode=` 로 채운다.
 * 사무소가 없으면 비활성. 목록에 없는 값은 비워 보인다. 라벨 '기번  코너명'.
 */
export const McnSelect = ({ value, onChange, disabled, form, officeField = 'ofcCode', allowAll = true, placeholder }: ValueProps<string | undefined> & { form: FormInstance; officeField?: string; allowAll?: boolean; placeholder?: string }) => {
  const ofcCode = Form.useWatch(officeField, form) as string | undefined;
  const { data: rows = [], isFetching } = useMcns(ofcCode);
  const options = useMemo(() => rows.map((m) => ({ value: m.mcnNo, label: m.instPstNm ? `${m.mcnNo}  ${m.instPstNm}` : m.mcnNo })), [rows]);
  const shown = options.some((o) => o.value === value) ? value : undefined;
  return <Select value={shown} onChange={onChange} options={options} loading={isFetching} allowClear={allowAll} placeholder={placeholder ?? (allowAll ? '전체' : '기번 선택')} disabled={disabled || !ofcCode} showSearch optionFilterProp="label" style={{ width: '100%' }} />;
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

/* ---------- 공통코드 셀렉트 (TB_CO_CODE 코드구분) ---------- */
export const CodeSelect = ({ value, onChange, disabled, codeType, allLabel = '전체', allowAll = true, placeholder }: ValueProps<string | undefined> & { codeType: string; allLabel?: string; allowAll?: boolean; placeholder?: string }) => {
  const { options, isFetching } = useCodes(codeType);
  const opts = allowAll ? [{ value: 'ALL', label: allLabel }, ...options] : options;
  return <Select value={value} onChange={onChange} options={opts} loading={isFetching} disabled={disabled} placeholder={placeholder} showSearch optionFilterProp="label" style={{ width: '100%' }} />;
};

/* ---------- SearchField 팩토리 ---------- */
/** 사무소 (이름 'ofcCode', 기본 필수). 기본값은 화면에서 `defaultValue: 내 사무소` 로 — useOfficeMcnFields 참고 */
export const officeField = (opts: Partial<SearchField> & { defaultValue?: string } = {}): SearchField => ({
  name: 'ofcCode',
  label: '사무소',
  type: 'custom',
  widthClass: 'long',
  required: true,
  render: () => <OfficeSelector allowEmpty={!opts.required && opts.required !== undefined} />,
  ...opts,
});

/** 기번 (이름 'mcnNo', 사무소 칸 종속 — officeField 이름을 바꿨으면 opts.officeField 로) */
export const mcnField = ({ officeField: ofcName = 'ofcCode', ...opts }: Partial<SearchField> & { officeField?: string } = {}): SearchField => ({
  name: 'mcnNo',
  label: '기번',
  type: 'custom',
  widthClass: 'normal',
  render: (form) => <McnSelect form={form} officeField={ofcName} />,
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
  label: '기간',
  type: 'custom',
  widthClass: 'range',
  required: true,
  rules: [{ validator: (_r, v?: PeriodValue) => (v?.range ? Promise.resolve() : Promise.reject(new Error(VMSG.required('기간')))) }],
  render: () => <PeriodPicker />,
  ...opts,
});

/** 공통코드 콤보 (기본값 'ALL' = 전체) */
export const codeField = (name: string, label: string, codeType: string, opts: Partial<SearchField> = {}): SearchField => ({
  name,
  label,
  type: 'custom',
  widthClass: 'normal',
  defaultValue: 'ALL',
  render: () => <CodeSelect codeType={codeType} />,
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
 * 가장 흔한 조건 묶음: 사무소(내 사무소 기본) + 기번 [+ 조회일자].
 * 훅이므로 컴포넌트 본문에서 호출한다. 예: `const fields = useOfficeMcnFields({ date: true })`
 */
export const useOfficeMcnFields = (opts: { date?: boolean | string; officeLabel?: string; mcn?: boolean; extra?: SearchField[] } = {}): SearchField[] => {
  const ofcCode = useAuthStore(selectOfcCode);
  const { date, officeLabel, mcn = true, extra } = opts;
  return useMemo(() => {
    const out: SearchField[] = [officeField({ defaultValue: ofcCode || undefined, ...(officeLabel ? { label: officeLabel } : {}) })];
    if (mcn) out.push(mcnField());
    if (date) out.push(dateField('date', typeof date === 'string' ? date : '조회일자'));
    return extra ? [...out, ...extra] : out;
  }, [ofcCode, date, officeLabel, mcn, extra]);
};
