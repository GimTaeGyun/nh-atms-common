import { useEffect, useImperativeHandle, useMemo, useState, type Key, type ReactNode, type Ref } from 'react';
import { Button, Checkbox, DatePicker, Form, Input, InputNumber, Select, Table } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { Rule } from 'antd/es/form';
import type { ColumnType } from 'antd/es/table';
import { YMD, dayjs, fromYmd, toYmd, type Dayjs } from '@/utils/date';
import { fmtAmount, fmtDate } from '@/utils/format';
import type { GridGrade } from './DataGrid';
import { sumWidth } from './columns';
import './gridExt.css';

export type EditType = 'input' | 'number' | 'select' | 'date' | 'check';

export interface EditableConfig<T = never> {
  type: EditType;
  /**
   * 행별 잠금 — true 를 돌려주면 그 행의 이 칸은 편집하지 않고 값만 보인다.
   * 예: 기존 행의 키 칸 잠금 `disabled: (_row, isNew) => !isNew` (새로 추가한 행만 입력)
   */
  disabled?: (row: T, isNew: boolean) => boolean;
  /** 잠긴 칸에 마우스를 올렸을 때 안내(title) */
  disabledTitle?: string;
  /** select 옵션 */
  options?: { label: ReactNode; value: string | number }[];
  rules?: Rule[];
  /** date 저장 포맷 (기본 YYYYMMDD — AS-IS 문자열 날짜) */
  valueFormat?: string;
  /** check 저장값 [체크, 해제] (기본 [true, false]) */
  checkValues?: [unknown, unknown];
  placeholder?: string;
}

/** 편집 컬럼 정의 — antd 컬럼 + editable */
export interface EditableColumn<T> extends ColumnType<T> {
  editable?: EditableConfig<T>;
}

export interface EditableChanges<T> {
  added: T[];
  updated: T[];
  deleted: T[];
}

export interface EditableGridHandle<T> {
  /** 추가/수정/삭제 행 */
  getChanges: () => EditableChanges<T>;
  /** 편집 셀 검증 (삭제 행 제외) */
  validate: () => Promise<boolean>;
  /** 편집 내용 전부 취소 */
  reset: () => void;
  /** 행 추가 — 임시 키 반환 */
  addRow: (init?: Partial<T>) => string;
  hasChanges: () => boolean;
}

export interface EditableGridProps<T extends object> {
  columns: EditableColumn<T>[];
  rows: T[];
  rowKey: keyof T | ((row: T) => string);
  ref?: Ref<EditableGridHandle<T>>;
  /** 저장 — 검증 통과 시 호출. 지정 시 [저장] 버튼 표시 */
  onSave?: (changes: EditableChanges<T>) => void | Promise<void>;
  readOnly?: boolean;
  /** 툴바 버튼·편집 권한(기본 모두 true, readOnly 가 우선). 화면은 usePermission 값을 넘긴다 — 예 canAdd={perm.canReg} */
  canAdd?: boolean;
  /** 기존 행 셀 편집(수정) 가능 — false 면 기존 행은 값만 보인다(추가 행은 canAdd 로 편집) */
  canUpdate?: boolean;
  /** [행삭제]·행 체크 가능 */
  canDelete?: boolean;
  /** [저장] 가능 */
  canSave?: boolean;
  /** 새 행 기본값 */
  newRow?: () => Partial<T>;
  grade?: GridGrade;
  height?: number;
  loading?: boolean;
  /** 내장 툴바 표시 (기본 true) */
  toolbar?: boolean;
  toolbarExtra?: ReactNode;
  className?: string;
}

type Values = Record<string, Record<string, unknown>>;
interface Entry<T> {
  key: string;
  row: T;
  added: boolean;
  deleted: boolean;
}

const TEMP_PREFIX = '__new_';
let tempSeq = 0;

const fieldOf = <T,>(c: EditableColumn<T>): string => {
  const di = c.dataIndex;
  if (Array.isArray(di)) return di.join('.');
  return String(di ?? c.key ?? '');
};
const get = (row: unknown, f: string): unknown => (row as Record<string, unknown>)[f];
const norm = (v: unknown) => (v === null || v === undefined || v === '' ? '' : v);
const same = (a: unknown, b: unknown) => Object.is(norm(a), norm(b));

/** 셀 표시값 (편집 불가 상태) */
const display = <T,>(c: EditableColumn<T>, v: unknown, row: T, i: number): ReactNode => {
  if (c.render) return c.render(v, row, i) as ReactNode;
  const ed = c.editable;
  if (!ed) return v === null || v === undefined || v === '' ? '' : String(v);
  if (ed.type === 'check') return <Checkbox checked={v === (ed.checkValues?.[0] ?? true)} disabled />;
  if (v === null || v === undefined || v === '') return '';
  if (ed.type === 'select') return ed.options?.find((o) => o.value === v)?.label ?? String(v);
  if (ed.type === 'date') return fmtDate(String(v));
  if (ed.type === 'number') return fmtAmount(v as number);
  return String(v);
};

/** 편집 컨트롤 */
const editor = <T,>(ed: EditableConfig<T>, label: string): ReactNode => {
  switch (ed.type) {
    case 'number':
      return <InputNumber size="small" style={{ width: '100%' }} aria-label={label} placeholder={ed.placeholder} />;
    case 'select':
      return <Select size="small" style={{ width: '100%' }} options={ed.options} aria-label={label} placeholder={ed.placeholder} allowClear />;
    case 'date':
      return <DatePicker size="small" style={{ width: '100%' }} aria-label={label} placeholder={ed.placeholder} />;
    case 'check':
      return <Checkbox aria-label={label} />;
    default:
      return <Input size="small" aria-label={label} placeholder={ed.placeholder} />;
  }
};

/** 컨트롤 ↔ 저장값 변환(Form.Item props) */
const itemProps = <T,>(ed: EditableConfig<T>) => {
  if (ed.type === 'date') {
    const fmt = ed.valueFormat ?? YMD;
    const parse = (v: unknown): Dayjs | null => (fmt === YMD ? fromYmd(String(v)) ?? null : dayjs(String(v), fmt));
    return {
      getValueProps: (v: unknown) => ({ value: v ? parse(v) : null }),
      normalize: (d: Dayjs | null) => (fmt === YMD ? toYmd(d) : d ? d.format(fmt) : undefined),
    };
  }
  if (ed.type === 'check') {
    const [on, off] = ed.checkValues ?? [true, false];
    return {
      getValueProps: (v: unknown) => ({ checked: v === on }),
      getValueFromEvent: (e: CheckboxChangeEvent) => (e.target.checked ? on : off),
    };
  }
  return {};
};

/**
 * 인라인 편집 그리드 (견본: 기기모델코드 일괄 저장).
 *  - 그리드당 Form 1개, 셀마다 Form.Item(name=[행키, 필드])
 *  - 변경 셀 'cell-dirty', 추가 행 'row-added', 삭제 행 'row-deleted'(취소선)
 *  - ref 로 getChanges/validate/reset 제공, [행추가/행삭제/저장/취소] 툴바 내장
 *  - 행별 잠금 `editable.disabled(row, isNew)`(예: 기존 행 키 칸), 버튼별 권한 `canAdd`·`canUpdate`·`canDelete`·`canSave`
 */
export function EditableGrid<T extends object>({
  columns, rows, rowKey, ref, onSave, readOnly = false, canAdd = true, canUpdate = true, canDelete = true, canSave = true, newRow, grade = 'G2', height, loading, toolbar = true, toolbarExtra, className,
}: EditableGridProps<T>) {
  const [form] = Form.useForm<Values>();
  const keyOf = (r: T): string => (typeof rowKey === 'function' ? rowKey(r) : String(r[rowKey]));

  const editCols = useMemo(() => columns.filter((c) => c.editable), [columns]);
  const toEntries = (src: T[]): Entry<T>[] => src.map((r) => ({ key: keyOf(r), row: r, added: false, deleted: false }));
  const rowValues = (r: T) => Object.fromEntries(editCols.map((c) => [fieldOf(c), get(r, fieldOf(c))]));
  const initialValues: Values = Object.fromEntries(rows.map((r) => [keyOf(r), rowValues(r)]));

  const [src, setSrc] = useState(rows);
  const [entries, setEntries] = useState<Entry<T>[]>(() => toEntries(rows));
  const [dirty, setDirty] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<Key[]>([]);
  const [saving, setSaving] = useState(false);

  // rows 교체 시 편집 상태 초기화 (렌더 중 동기화)
  if (src !== rows) {
    setSrc(rows);
    setEntries(toEntries(rows));
    setDirty({});
    setSelected([]);
  }
  useEffect(() => {
    form.resetFields();
  }, [rows, form]);

  /** 행의 변경 필드 목록 */
  const dirtyOf = (e: Entry<T>, vals: Values): string[] =>
    e.added ? [] : editCols.map(fieldOf).filter((f) => vals[e.key] && f in vals[e.key] && !same(vals[e.key][f], get(e.row, f)));

  const computeChanges = (): EditableChanges<T> => {
    const vals = form.getFieldsValue(true) as Values;
    const merged = (e: Entry<T>) => ({ ...e.row, ...(vals[e.key] ?? {}) }) as T;
    return {
      added: entries.filter((e) => e.added && !e.deleted).map(merged),
      updated: entries.filter((e) => !e.added && !e.deleted && dirtyOf(e, vals).length > 0).map(merged),
      deleted: entries.filter((e) => !e.added && e.deleted).map((e) => e.row),
    };
  };

  const changeCount = {
    updated: entries.filter((e) => !e.added && !e.deleted && (dirty[e.key]?.length ?? 0) > 0).length,
    added: entries.filter((e) => e.added).length,
    deleted: entries.filter((e) => e.deleted).length,
  };
  const changed = changeCount.updated + changeCount.added + changeCount.deleted > 0;

  const addRow = (init?: Partial<T>): string => {
    tempSeq += 1;
    const key = `${TEMP_PREFIX}${tempSeq}`;
    const row = { ...(newRow?.() ?? {}), ...(init ?? {}) } as T;
    form.setFieldValue(key, rowValues(row));
    setEntries((prev) => [...prev, { key, row, added: true, deleted: false }]);
    return key;
  };

  const reset = () => {
    form.resetFields();
    setEntries(toEntries(rows));
    setDirty({});
    setSelected([]);
  };

  const validate = async (): Promise<boolean> => {
    try {
      await form.validateFields();
      return true;
    } catch {
      return false;
    }
  };

  /** 선택 행 삭제 표시 (모두 삭제 상태면 복원). 추가 행은 즉시 제거 */
  const toggleDelete = () => {
    const sel = new Set(selected.map(String));
    const targets = entries.filter((e) => sel.has(e.key));
    const restore = targets.length > 0 && targets.every((e) => e.deleted);
    setEntries((prev) => prev.filter((e) => !(e.added && sel.has(e.key) && !restore)).map((e) => (sel.has(e.key) ? { ...e, deleted: !restore } : e)));
    setSelected([]);
  };

  const save = async () => {
    if (!onSave || !(await validate())) return;
    setSaving(true);
    try {
      await onSave(computeChanges());
    } finally {
      setSaving(false);
    }
  };

  /** 이 행의 이 칸을 편집하나 — 추가 행은 canAdd, 기존 행은 canUpdate, 그다음 칸의 disabled(row, isNew) */
  const cellEditable = (ed: EditableConfig<T>, e: Entry<T>): boolean => {
    if (e.added ? !canAdd : !canUpdate) return false;
    return !ed.disabled?.(e.row, e.added);
  };

  useImperativeHandle(ref, () => ({ getChanges: computeChanges, validate, reset, addRow, hasChanges: () => changed }));

  const tableCols = columns.map((c, ci): ColumnType<Entry<T>> => {
    const { editable, render: _render, onCell, ...rest } = c;
    const field = fieldOf(c);
    const label = typeof c.title === 'string' ? c.title : field;
    return {
      ...(rest as ColumnType<Entry<T>>),
      key: c.key ?? (field || ci),
      dataIndex: undefined,
      onCell: (e, i) => {
        const base = onCell?.(e.row, i) ?? {};
        const isDirty = !e.deleted && dirty[e.key]?.includes(field);
        const locked = !!editable && !readOnly && !e.deleted && !cellEditable(editable, e);
        return {
          ...base,
          title: locked && editable?.disabledTitle ? editable.disabledTitle : base.title,
          className: [base.className, isDirty ? 'cell-dirty' : '', locked ? 'cell-locked' : ''].filter(Boolean).join(' ') || undefined,
        };
      },
      render: (_: unknown, e: Entry<T>, i: number) => {
        if (editable && !readOnly && !e.deleted && cellEditable(editable, e)) {
          return (
            <Form.Item name={[e.key, field]} rules={editable.rules} valuePropName={editable.type === 'check' ? 'checked' : 'value'} style={{ margin: 0 }} {...itemProps(editable)}>
              {editor(editable, label)}
            </Form.Item>
          );
        }
        const v = editable ? (form.getFieldValue([e.key, field]) ?? get(e.row, field)) : get(e.row, field);
        return display(c, v, e.row, i);
      },
    };
  });

  const selectable = !readOnly && canDelete;
  const totalWidth = sumWidth(columns as never) + (selectable ? 40 : 0);
  const scroll = { x: grade === 'G1' ? undefined : totalWidth, y: height };

  return (
    <div className={`data-grid editable-grid${className ? ` ${className}` : ''}`}>
      {toolbar && (
        <div className="grid-ext-toolbar">
          <span className="ge-summary">
            {changed ? (
              <>
                변경 <b>{changeCount.updated}</b> · 추가 <b>{changeCount.added}</b> · 삭제 <b>{changeCount.deleted}</b>
              </>
            ) : (
              <span className="muted">변경 내역 없음</span>
            )}
          </span>
          <span className="flex">
            {toolbarExtra}
            <Button size="small" onClick={() => addRow()} disabled={readOnly || !canAdd}>
              행추가
            </Button>
            <Button size="small" onClick={toggleDelete} disabled={readOnly || !canDelete || selected.length === 0}>
              행삭제
            </Button>
            {onSave && (
              <Button size="small" type="primary" onClick={() => void save()} loading={saving} disabled={readOnly || !canSave || !changed}>
                저장
              </Button>
            )}
            <Button size="small" onClick={reset} disabled={readOnly || !changed}>
              취소
            </Button>
          </span>
        </div>
      )}
      <Form<Values>
        form={form}
        component={false}
        initialValues={initialValues}
        onValuesChange={(chg: Partial<Values>, all: Values) => {
          setDirty((prev) => {
            const next = { ...prev };
            for (const k of Object.keys(chg)) {
              const e = entries.find((x) => x.key === k);
              if (e) next[k] = dirtyOf(e, all);
            }
            return next;
          });
        }}
      >
        <Table<Entry<T>>
          columns={tableCols}
          dataSource={entries}
          rowKey="key"
          size="small"
          bordered
          loading={loading}
          pagination={false}
          scroll={scroll}
          tableLayout={grade === 'G1' ? 'auto' : 'fixed'}
          rowSelection={selectable ? { selectedRowKeys: selected, onChange: setSelected, columnWidth: 40 } : undefined}
          rowClassName={(e) => (e.deleted ? 'row-deleted' : e.added ? 'row-added' : '')}
        />
      </Form>
    </div>
  );
}
