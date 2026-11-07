/**
 * 공통 조회 API(`/api/lookup/*`) 콤보 — 설계 §6.2 "콤보". 모두 단독 컴포넌트 + `xxxField()` 팩토리 두 가지로 쓴다.
 *  - 종속 콤보(사무소 → 인원·코너, 기기사 → 모델, 시도 → 시군)는 같은 폼의 상위 칸을 `Form.useWatch` 로 본다.
 *    폼 밖에서 쓰거나 상위 값을 직접 줄 때는 `ofcCode`·`vendCode`·`sidoCode` 프롭으로 넘긴다(프롭이 우선).
 *  - 값이 비면(undefined) '전체' — API 파라미터에서 빠진다(compactParams).
 *  - 상위 값이 바뀌어 목록에 없는 값은 비워 보인다(폼 값은 그대로, 조회 때 서버가 거름).
 *    폼 값까지 비우려면 `clearOnParentChange` 를 준다(인원·코너·모델·시군) — 안 보이는 값이 조회조건·저장 본문에 남지 않는다.
 * 인원·모델·있는 값·사용여부 콤보는 [신규](설계 Q8, 원본에 공통 부품 없음). 코너 콤보는 원본 화면 로컬 두 벌을 공통으로 올렸다.
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Form, Select } from 'antd';
import type { FormInstance } from 'antd';
import { useCorners, useDistinct, useModels, usePersons, useSido, useSigun, useSrcs, useVendors } from '@/hooks/useLookup';
import type { DistinctTarget, Model, Vendor } from '@/domain/lookup';
import type { Option, ValueProps } from '@/types/common';
import type { SearchField } from './SearchForm';

/** '[코드] 이름' — 이름이 없으면 코드만 */
export const codeNameLabel = (code: string, name?: string | null): string => (name ? `[${code}] ${name}` : code);

/** 기기사 라벨 — vendNm 이 있으면 '[코드] 이름', 없으면 코드만(원천 잠정 Q6) */
export const vendorLabel = (v: Vendor): string => codeNameLabel(v.vendCode, v.vendNm);

interface LookupSelectProps extends ValueProps<string | undefined> {
  /** true(기본): 비우기 가능 + 빈 값 = 전체 */
  allowAll?: boolean;
  placeholder?: string;
}

/** 종속 콤보 공통 프롭 */
interface ChildSelectProps extends LookupSelectProps {
  form?: FormInstance;
  /** true: 상위 값(사무소·기기사·시도)이 바뀌면 고른 값을 비운다(onChange(undefined)). 기본 false = 비워 보이기만 */
  clearOnParentChange?: boolean;
}

/**
 * 상위 값이 바뀌면 값을 비운다 — clearOnParentChange 일 때만.
 * 빈 상위 값 → 첫 값은 "바뀜"으로 치지 않는다(Form.useWatch 는 첫 그림에서 undefined 를 준 뒤 초기값을 준다 — 수정 폼의 초기값을 지우지 않게).
 */
const useClearOnParentChange = (enabled: boolean | undefined, parent: string | undefined, value: string | undefined, onChange: ((v: string | undefined) => void) | undefined) => {
  const prev = useRef(parent);
  useEffect(() => {
    const before = prev.current;
    if (before === parent) return;
    prev.current = parent;
    if (enabled && before && value !== undefined && value !== '') onChange?.(undefined);
  }, [enabled, parent, value, onChange]);
};

/** 폼 칸 값을 보고(Form.useWatch) 그 값으로 그린다 */
const Watched = ({ form, field, render }: { form?: FormInstance; field: string; render: (parent: string | undefined) => ReactNode }) => (
  <>{render(Form.useWatch(field, form) as string | undefined)}</>
);

/**
 * 종속 콤보의 상위 값: 프롭이 있으면 프롭, 없으면 폼 칸(Form.useWatch).
 * 프롭을 줄 때는 useWatch 를 부르지 않는다 — 폼 밖에서 쓰면 antd 가 'Can not find FormContext' 경고를 내기 때문(컴포넌트를 나눠 훅 순서를 지킨다).
 */
const WithParent = ({ explicit, form, field, render }: { explicit: string | undefined; form?: FormInstance; field: string; render: (parent: string | undefined) => ReactNode }) =>
  explicit !== undefined ? <>{render(explicit)}</> : <Watched form={form} field={field} render={render} />;

/** 공통 Select 모양 */
const LookupSelect = ({ value, onChange, disabled, allowAll = true, placeholder, options, loading, ariaLabel }: LookupSelectProps & { options: Option[]; loading?: boolean; ariaLabel?: string }) => {
  const shown = value !== undefined && value !== '' && options.some((o) => o.value === value) ? value : undefined;
  return (
    <Select
      value={shown}
      onChange={(v?: string) => onChange?.(v ?? undefined)}
      options={options}
      loading={loading}
      allowClear={allowAll}
      placeholder={placeholder ?? (allowAll ? '전체' : '선택')}
      disabled={disabled}
      showSearch
      optionFilterProp="label"
      aria-label={ariaLabel}
      style={{ width: '100%' }}
    />
  );
};

/* ---------- 기기사 ---------- */
/** 기기사 콤보 — `GET /api/lookup/vendors`. 라벨: vendNm 이 있으면 '[코드] 이름', 없으면 코드 */
export const VendorSelect = (p: LookupSelectProps) => {
  const { data = [], isFetching } = useVendors();
  const options = useMemo(() => data.map((v) => ({ value: v.vendCode, label: vendorLabel(v) })), [data]);
  return <LookupSelect {...p} options={options} loading={isFetching} ariaLabel="기기사" />;
};

/* ---------- 기종(SRC) ---------- */
/** 기종 콤보 — `GET /api/lookup/srcs` (TB_NMS_SRC). 라벨 '[SRC] 이름'. `vendCode` 를 주면 그 업체 기종만 */
export const SrcSelect = ({ vendCode, ...p }: LookupSelectProps & { vendCode?: string }) => {
  const { data = [], isFetching } = useSrcs(vendCode);
  const options = useMemo(() => data.map((r) => ({ value: r.src, label: codeNameLabel(r.src, r.srcNm) })), [data]);
  return <LookupSelect {...p} options={options} loading={isFetching} ariaLabel="기종" />;
};

/* ---------- 모델 (기기사 종속) ---------- */
/** 모델 콤보 값의 구분자 — 기기구분을 고정하지 않았을 때 값 = '<mcnType>:<modelCode>' */
export const MODEL_VALUE_SEP = ':';

/**
 * 모델 1건 → 콤보 값. TB_CO_MODEL 의 PK 는 VEND_CODE+MCN_TYPE+MODEL_CODE 3개라 기기사만 정해서는 MODEL_CODE 가 겹칠 수 있다.
 *  - 기기구분 고정(mcnTypeFixed=true): MODEL_CODE 만 (예 'A1')
 *  - 고정 안 함: '<mcnType>:<modelCode>' (예 '01:A1')
 */
export const modelValueOf = (m: Pick<Model, 'mcnType' | 'modelCode'>, mcnTypeFixed: boolean): string =>
  mcnTypeFixed ? m.modelCode : `${m.mcnType}${MODEL_VALUE_SEP}${m.modelCode}`;

/** 콤보 값 → { mcnType, modelCode }. 구분자가 없으면(기기구분 고정 값) modelCode 만. 빈 값이면 둘 다 undefined */
export const parseModelValue = (v: string | null | undefined): { mcnType?: string; modelCode?: string } => {
  if (!v) return {};
  const i = v.indexOf(MODEL_VALUE_SEP);
  return i < 0 ? { modelCode: v } : { mcnType: v.slice(0, i), modelCode: v.slice(i + 1) };
};

/**
 * 모델 콤보 — 기기사(폼 칸 `vendorField`, 기본 'vendCode' 또는 `vendCode` 프롭)에 종속. `GET /api/lookup/models?vendCode=&mcnType=`
 *
 * **값 규칙(PK 3개)**: `mcnType` 프롭을 주면(기기구분 고정) 값 = MODEL_CODE, 라벨 '[모델코드] 모델명'.
 * 주지 않으면 같은 기기사 안에서 MODEL_CODE 가 기기구분마다 겹칠 수 있으므로 값 = '<mcnType>:<modelCode>',
 * 라벨 '[기기구분:모델코드] 모델명'. 서버에 보낼 때는 {@link parseModelValue} 로 나눈다.
 */
export const ModelSelect = ({ form, vendorField = 'vendCode', vendCode, ...p }: ChildSelectProps & { vendorField?: string; vendCode?: string; mcnType?: string }) => (
  <WithParent explicit={vendCode} form={form} field={vendorField} render={(parent) => <ModelSelectBody {...p} parent={parent} />} />
);

const ModelSelectBody = ({ parent, mcnType, clearOnParentChange, ...p }: Omit<ChildSelectProps, 'form'> & { parent?: string; mcnType?: string }) => {
  useClearOnParentChange(clearOnParentChange, parent, p.value, p.onChange);
  const fixed = !!mcnType;
  const { data = [], isFetching } = useModels({ vendCode: parent, mcnType });
  const options = useMemo(
    () =>
      data.map((m) => {
        const value = modelValueOf(m, fixed);
        return { value, label: codeNameLabel(value, m.modelNm) };
      }),
    [data, fixed],
  );
  return <LookupSelect {...p} disabled={p.disabled || !parent} options={options} loading={isFetching} ariaLabel="모델" />;
};

/* ---------- 인원 (사무소 종속) ---------- */
/** 인원 콤보 — 사무소(폼 칸 `officeField`, 기본 'ofcCode' 또는 `ofcCode` 프롭)에 종속. 라벨 '[개인번호] 성명' */
export const PersonSelect = ({ form, officeField = 'ofcCode', ofcCode, ...p }: ChildSelectProps & { officeField?: string; ofcCode?: string }) => (
  <WithParent explicit={ofcCode} form={form} field={officeField} render={(parent) => <PersonSelectBody {...p} parent={parent} />} />
);

const PersonSelectBody = ({ parent, clearOnParentChange, ...p }: Omit<ChildSelectProps, 'form'> & { parent?: string }) => {
  useClearOnParentChange(clearOnParentChange, parent, p.value, p.onChange);
  const { data = [], isFetching } = usePersons({ ofcCode: parent });
  const options = useMemo(() => data.map((r) => ({ value: r.perNo, label: codeNameLabel(r.perNo, r.name) })), [data]);
  return <LookupSelect {...p} disabled={p.disabled || !parent} options={options} loading={isFetching} ariaLabel="인원" />;
};

/* ---------- 코너 (사무소 종속) ---------- */
/** 코너(설치장소) 콤보 — 사무소에 종속. 라벨 '[코너코드] 코너명'. 원본 screens/outsrc 의 화면 로컬 두 벌을 공통으로 올림 */
export const CornerSelect = ({ form, officeField = 'ofcCode', ofcCode, ...p }: ChildSelectProps & { officeField?: string; ofcCode?: string }) => (
  <WithParent explicit={ofcCode} form={form} field={officeField} render={(parent) => <CornerSelectBody {...p} parent={parent} />} />
);

const CornerSelectBody = ({ parent, clearOnParentChange, ...p }: Omit<ChildSelectProps, 'form'> & { parent?: string }) => {
  useClearOnParentChange(clearOnParentChange, parent, p.value, p.onChange);
  const { data = [], isFetching } = useCorners(parent);
  const options = useMemo(() => data.map((c) => ({ value: c.instPstCode, label: codeNameLabel(c.instPstCode, c.instPstNm) })), [data]);
  return <LookupSelect {...p} disabled={p.disabled || !parent} options={options} loading={isFetching} ariaLabel="코너" />;
};

/* ---------- 있는 값 ---------- */
/** 있는 값 콤보 — 코드표가 없는 컬럼(기기유형 등)의 실제 값 목록. `GET /api/lookup/distinct/{target}` (허용 목록만) */
export const DistinctSelect = ({ target, ...p }: LookupSelectProps & { target: DistinctTarget }) => {
  const { data = [], isFetching } = useDistinct(target);
  const options = useMemo(() => data.map((d) => ({ value: d.value, label: d.value })), [data]);
  return <LookupSelect {...p} options={options} loading={isFetching} ariaLabel={target} />;
};

/* ---------- 시도 · 시군 ---------- */
/** 시도 콤보 — `GET /api/lookup/sido` (TB_CO_SIDO). 원본의 지역 하드코딩 목록을 대신한다 */
export const SidoSelect = (p: LookupSelectProps) => {
  const { data = [], isFetching } = useSido();
  const options = useMemo(() => data.map((s) => ({ value: s.sidoCode, label: s.sidoNm ?? s.sidoCode })), [data]);
  return <LookupSelect {...p} options={options} loading={isFetching} ariaLabel="시도" />;
};

/** 시군 콤보 — 시도(폼 칸 `sidoField`, 기본 'sidoCode' 또는 `sidoCode` 프롭)에 종속 */
export const SigunSelect = ({ form, sidoField = 'sidoCode', sidoCode, ...p }: ChildSelectProps & { sidoField?: string; sidoCode?: string }) => (
  <WithParent explicit={sidoCode} form={form} field={sidoField} render={(parent) => <SigunSelectBody {...p} parent={parent} />} />
);

const SigunSelectBody = ({ parent, clearOnParentChange, ...p }: Omit<ChildSelectProps, 'form'> & { parent?: string }) => {
  useClearOnParentChange(clearOnParentChange, parent, p.value, p.onChange);
  const { data = [], isFetching } = useSigun(parent);
  const options = useMemo(() => data.map((s) => ({ value: s.sigunCode, label: s.sigunNm ?? s.sigunCode })), [data]);
  return <LookupSelect {...p} disabled={p.disabled || !parent} options={options} loading={isFetching} ariaLabel="시군" />;
};

/* ---------- 사용여부 ---------- */
/** 사용여부 옵션 — 값 ''(전체) / 'Y' / 'N'. '' 는 API 파라미터에서 빠진다 */
export const YN_OPTIONS: Option[] = [
  { value: 'Y', label: '사용(Y)' },
  { value: 'N', label: '미사용(N)' },
];

/** 사용여부 콤보 — 고정 옵션(전체/사용/미사용). allowAll=false 면 Y/N 만 */
export const YnSelect = ({ value, onChange, disabled, allowAll = true, placeholder }: LookupSelectProps) => {
  const options = allowAll ? [{ value: '', label: '전체' }, ...YN_OPTIONS] : YN_OPTIONS;
  return <Select value={value ?? (allowAll ? '' : undefined)} onChange={(v: string) => onChange?.(v)} options={options} disabled={disabled} placeholder={placeholder ?? '선택'} aria-label="사용여부" style={{ width: '100%' }} />;
};

/* ---------- SearchField 팩토리 ---------- */
export const vendorField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'vendCode',
  label: '기기사',
  type: 'custom',
  widthClass: 'normal',
  render: () => <VendorSelect />,
  ...opts,
});

/** 모델 칸 — 값 규칙은 ModelSelect(기기구분 고정 안 하면 '<mcnType>:<modelCode>', parseModelValue 로 나눔) */
export const modelField = ({ vendorField: vName = 'vendCode', mcnType, clearOnParentChange, ...opts }: Partial<SearchField> & { vendorField?: string; mcnType?: string; clearOnParentChange?: boolean } = {}): SearchField => ({
  name: 'modelCode',
  label: '모델',
  type: 'custom',
  widthClass: 'normal',
  render: (form) => <ModelSelect form={form} vendorField={vName} mcnType={mcnType} clearOnParentChange={clearOnParentChange} />,
  ...opts,
});

/** 인원 칸 — clearOnParentChange 를 주면 사무소가 바뀔 때 고른 인원을 비운다 */
export const personField = ({ officeField: oName = 'ofcCode', clearOnParentChange, ...opts }: Partial<SearchField> & { officeField?: string; clearOnParentChange?: boolean } = {}): SearchField => ({
  name: 'perNo',
  label: '인원',
  type: 'custom',
  widthClass: 'normal',
  render: (form) => <PersonSelect form={form} officeField={oName} clearOnParentChange={clearOnParentChange} />,
  ...opts,
});

/** 코너 칸 — clearOnParentChange 를 주면 사무소가 바뀔 때 고른 코너를 비운다 */
export const cornerField = ({ officeField: oName = 'ofcCode', clearOnParentChange, ...opts }: Partial<SearchField> & { officeField?: string; clearOnParentChange?: boolean } = {}): SearchField => ({
  name: 'instPstCode',
  label: '코너',
  type: 'custom',
  widthClass: 'normal',
  render: (form) => <CornerSelect form={form} officeField={oName} clearOnParentChange={clearOnParentChange} />,
  ...opts,
});

/** 기종 칸 — `GET /api/lookup/srcs` */
export const srcField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'src',
  label: '기종',
  type: 'custom',
  widthClass: 'normal',
  render: () => <SrcSelect />,
  ...opts,
});

export const distinctField = (name: string, label: string, target: DistinctTarget, opts: Partial<SearchField> = {}): SearchField => ({
  name,
  label,
  type: 'custom',
  widthClass: 'normal',
  render: () => <DistinctSelect target={target} />,
  ...opts,
});

export const sidoField = (opts: Partial<SearchField> = {}): SearchField => ({
  name: 'sidoCode',
  label: '시도',
  type: 'custom',
  widthClass: 'normal',
  render: () => <SidoSelect />,
  ...opts,
});

export const sigunField = ({ sidoField: sName = 'sidoCode', clearOnParentChange, ...opts }: Partial<SearchField> & { sidoField?: string; clearOnParentChange?: boolean } = {}): SearchField => ({
  name: 'sigunCode',
  label: '시군',
  type: 'custom',
  widthClass: 'normal',
  render: (form) => <SigunSelect form={form} sidoField={sName} clearOnParentChange={clearOnParentChange} />,
  ...opts,
});

/** 사용여부 (기본값 'Y' — 기본 조회는 사용 중인 것만. 전체로 시작하려면 defaultValue: '') */
export const ynField = (name = 'useYn', label = '사용여부', opts: Partial<SearchField> = {}): SearchField => ({
  name,
  label,
  type: 'custom',
  widthClass: 'code',
  defaultValue: 'Y',
  render: () => <YnSelect />,
  ...opts,
});
