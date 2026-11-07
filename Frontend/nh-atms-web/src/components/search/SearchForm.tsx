import React, { useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { Button, Checkbox, Col, DatePicker, Form, Input, Radio, Row, Select } from 'antd';
import type { FormInstance } from 'antd';
import type { Rule } from 'antd/es/form';
import { DownOutlined, ReloadOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
// 시안(2026-10-21 p.5): 라디오는 일반 원형, 버튼은 '조회' 하나(보조 버튼은 그 위에 세로), '필터 펼침/접기' 링크는 조회 버튼 왼쪽
import { useContentBand, type Band } from '@/hooks/useContentBand';
import type { Option } from '@/types/common';
import { VMSG } from '@/config/messages';

/* ===================== 타입 ===================== */

/** 필드 폭 클래스: code(~160px) / normal(~220) / long(~300) / range(~340) / wide(행 절반) */
export type WidthClass = 'code' | 'normal' | 'long' | 'range' | 'wide';
export type SearchFieldType = 'input' | 'select' | 'datePicker' | 'rangePicker' | 'radio' | 'checkbox' | 'custom';

export type SearchOption = Option<string | number | boolean>;

export interface SearchField {
  name: string;
  label: string;
  type: SearchFieldType;
  widthClass?: WidthClass;
  /** 밴드별 span 강제 지정 (1..24) */
  span?: Partial<Record<Band, number>>;
  placeholder?: string;
  options?: SearchOption[];
  allowClear?: boolean;
  defaultValue?: unknown;
  required?: boolean;
  rules?: Rule[];
  disabled?: boolean;
  tooltip?: string;
  /** 항상 "상세 필터" 그룹 */
  advanced?: boolean;
  /** 이 필드부터 새 행 */
  newRow?: boolean;
  /** type === 'custom': value/onChange 를 받는 단일 컨트롤을 반환 */
  render?: (form: FormInstance) => ReactNode;
  componentProps?: Record<string, unknown>;
  /** Form.Item 의 valuePropName (checkbox 단일 등) */
  valuePropName?: string;
  /** 라벨 없이 컨트롤만 (체크박스처럼 컨트롤에 글자가 있는 경우 label='' 과 동일) */
  noLabel?: boolean;
}

export interface SearchFormProps {
  fields: SearchField[];
  onSearch: (values: Record<string, unknown>) => void;
  onReset?: () => void;
  form?: FormInstance;
  loading?: boolean;
  /** 보조 버튼(조회 버튼 위에 세로로 쌓임 — 시안) */
  extraButtons?: ReactNode;
  /** 항상 보이는 행 수 (기본 2). 초과분은 상세 필터로 */
  maxRows?: number;
  band?: Band;
  searchText?: string;
  /** 초기화 버튼. 시안에 없어 기본 숨김(2026-11-03 결정) */
  showReset?: boolean;
  colon?: boolean;
  labelStyle?: CSSProperties;
  /** 조건 패널 안 안내문(우측 상단) */
  note?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** 처음부터 상세 필터 펼침 */
  defaultExpanded?: boolean;
}

/* ===================== 밴드 / span ===================== */

/** 밴드별 Col span (24 등분). 08_프론트_반응형_제안 §3.2 표 */
export const SPAN_TABLE: Record<Band, Record<WidthClass, number>> = {
  S: { code: 6, normal: 8, long: 12, range: 12, wide: 12 },
  M: { code: 5, normal: 6, long: 8, range: 8, wide: 12 },
  L: { code: 4, normal: 4, long: 6, range: 6, wide: 12 },
};

const DEFAULT_CLASS_BY_TYPE: Record<SearchFieldType, WidthClass> = { input: 'normal', select: 'normal', custom: 'normal', datePicker: 'code', rangePicker: 'range', radio: 'long', checkbox: 'long' };

const resolveSpan = (field: SearchField, band: Band): number => {
  const override = field.span?.[band];
  const span = override ?? SPAN_TABLE[band][field.widthClass ?? DEFAULT_CLASS_BY_TYPE[field.type]];
  return Math.min(24, Math.max(1, Math.round(span)));
};

interface PackedField {
  field: SearchField;
  span: number;
  index: number;
}

/** 24 칸 기준 greedy 패킹: 남은 칸보다 큰 필드(또는 newRow)는 다음 행으로 */
export const packRows = (items: PackedField[]): PackedField[][] => {
  const rows: PackedField[][] = [];
  let current: PackedField[] = [];
  let used = 0;
  for (const item of items) {
    if (current.length > 0 && (used + item.span > 24 || item.field.newRow)) {
      rows.push(current);
      current = [];
      used = 0;
    }
    current.push(item);
    used += item.span;
  }
  if (current.length > 0) rows.push(current);
  return rows;
};

/* ===================== 컨트롤 ===================== */

const renderControl = (field: SearchField, form: FormInstance): ReactNode => {
  const extra = field.componentProps ?? {};
  const common = { disabled: field.disabled };
  switch (field.type) {
    case 'input':
      return <Input placeholder={field.placeholder} allowClear {...common} {...extra} />;
    case 'select':
      return <Select placeholder={field.placeholder ?? '전체'} allowClear={field.allowClear !== false} options={field.options} style={{ width: '100%' }} {...common} {...extra} />;
    case 'datePicker':
      return <DatePicker placeholder={field.placeholder} style={{ width: '100%', minWidth: 104 }} {...common} {...extra} />;
    case 'rangePicker':
      return <DatePicker.RangePicker style={{ width: '100%' }} {...common} {...extra} />;
    case 'radio':
      return <Radio.Group options={field.options as never} {...common} {...extra} />;
    case 'checkbox': {
      // 단일 체크박스(checkField): options 없이 valuePropName='checked' 면 Checkbox 하나, 아니면 Checkbox.Group
      if (!field.options && field.valuePropName === 'checked') {
        const { children, ...rest } = extra as { children?: ReactNode };
        return <Checkbox {...common} {...rest}>{children}</Checkbox>;
      }
      return <Checkbox.Group options={field.options as never} {...common} {...extra} />;
    }
    case 'custom': {
      if (field.render) return field.render(form);
      const rest = Object.fromEntries(Object.entries(extra).filter(([k]) => k !== 'noStyle'));
      return <Input {...common} {...rest} />;
    }
    default:
      return <Input {...common} {...extra} />;
  }
};

/* ===================== 컴포넌트 ===================== */

/**
 * 조회조건 폼 (시안 2026-10-21): 흰 패널 + 라벨 칸, 2행 고정 + '필터 펼침 ∨' 링크(조회 버튼 왼쪽), 조회 버튼 우측 고정, 밴드별 span,
 * Enter→조회(IME/Select/DatePicker 예외), 접힌 상세 필드 값·검증 보존, 검증 실패 시 자동 펼침.
 */
export const SearchForm: React.FC<SearchFormProps> = ({
  fields, onSearch, onReset, form: externalForm, loading = false, extraButtons, maxRows = 2, band: forcedBand, searchText = '조회', showReset = false, colon = false, labelStyle, note, className, style, defaultExpanded = false,
}) => {
  const [form] = Form.useForm(externalForm);
  const rootRef = useRef<HTMLDivElement>(null);
  const { band, width } = useContentBand(rootRef, forcedBand);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const packed: PackedField[] = fields.map((field, index) => ({ field, span: resolveSpan(field, band), index }));
  const basicRows = packRows(packed.filter((p) => !p.field.advanced));
  const visibleRows = basicRows.slice(0, Math.max(0, maxRows));
  const overflow = basicRows.slice(Math.max(0, maxRows)).flat();
  const advancedItems = [...overflow, ...packed.filter((p) => p.field.advanced)].sort((a, b) => a.index - b.index);
  const hasAdvanced = advancedItems.length > 0;

  const initialValues: Record<string, unknown> = {};
  for (const f of fields) if (f.defaultValue !== undefined) initialValues[f.name] = f.defaultValue;

  const handleFinish = (values: Record<string, unknown>) => {
    if (loading) return;
    onSearch(values);
  };
  const handleFinishFailed = ({ errorFields }: { errorFields: { name: (string | number)[] }[] }) => {
    if (expanded || !hasAdvanced) return;
    const names = new Set(advancedItems.map((p) => p.field.name));
    if (errorFields.some((e) => names.has(String(e.name[0])))) setExpanded(true);
  };
  const handleReset = () => {
    form.resetFields();
    onReset?.();
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
    const target = e.target as HTMLElement | null;
    if (!target || target.tagName === 'TEXTAREA') return;
    if (target.closest('button, a, [role="button"]')) return;
    if (target.closest('.ant-select-open, .ant-picker, .ant-picker-dropdown')) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    if (!loading) form.submit();
  };

  const renderItem = ({ field, span }: PackedField, hidden: boolean) => {
    const rules: Rule[] = [...(field.required ? [{ required: true, message: VMSG.required(field.label) } satisfies Rule] : []), ...(field.rules ?? [])];
    const noStyle = field.type === 'custom' && field.componentProps?.noStyle === true;
    const showLabel = !field.noLabel && field.label !== '';
    return (
      <Col key={field.name} span={span} style={hidden ? { display: 'none' } : undefined}>
        <Form.Item
          name={field.name}
          label={showLabel ? <span style={{ whiteSpace: 'nowrap', ...labelStyle }}>{field.label}</span> : undefined}
          messageVariables={{ label: field.label }}
          rules={rules.length > 0 ? rules : undefined}
          required={field.required}
          tooltip={field.tooltip}
          hidden={hidden}
          noStyle={noStyle || undefined}
          valuePropName={field.valuePropName}
        >
          {renderControl(field, form)}
        </Form.Item>
      </Col>
    );
  };

  const visibleNodes: ReactNode[] = [];
  visibleRows.forEach((row, i) => {
    const used = row.reduce((sum, p) => sum + p.span, 0);
    const needBreak = i < visibleRows.length - 1 || hasAdvanced;
    row.forEach((p) => visibleNodes.push(renderItem(p, false)));
    if (needBreak && used < 24) visibleNodes.push(<Col key={`__fill-${i}`} span={24 - used} aria-hidden />);
  });

  return (
    <div ref={rootRef} className={className ? `search-panel ${className}` : 'search-panel'} style={style} data-band={band} data-width={width ?? undefined}>
      <Form form={form} layout="horizontal" size="middle" labelCol={{ flex: 'none' }} wrapperCol={{ flex: '1 1 0' }} labelWrap={false} colon={colon} initialValues={initialValues} onFinish={handleFinish} onFinishFailed={handleFinishFailed} onKeyDown={handleKeyDown} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          {note && <div className="page-note info" style={{ margin: '0 0 6px' }}>{note}</div>}
          <Row gutter={[12, 8]}>
            {visibleNodes}
            {advancedItems.map((p) => renderItem(p, !expanded))}
          </Row>
        </div>
        <div className="search-actions">
          {extraButtons}
          <div className="search-actions-row">
            {hasAdvanced && (
              <button type="button" className="search-toggle" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
                {expanded ? <>필터 접기 <UpOutlined /></> : <>필터 펼침 <DownOutlined /></>}
              </button>
            )}
            {showReset && <Button icon={<ReloadOutlined />} onClick={handleReset}>초기화</Button>}
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading} className="search-btn">
              {searchText}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};
