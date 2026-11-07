import type { Rule } from 'antd/es/form';
import { countCol, type Col } from '@/components/grid/columns';
import type { EditableColumn } from '@/components/grid/EditableGrid';
import { codeNameLabel } from '@/components/search/lookupFields';
import { maxBytes, maxLen, req } from '@/utils/rules';
import { fmtDateTime14 } from '@/utils/format';
import type { McnModel } from '@/domain/mcnModel';

/* ---------- 0. 길이 규칙(TB_CO_MODEL 정본) ---------- */
/** 키 3개 최대 길이 — VEND_CODE·MCN_TYPE·MODEL_CODE VARCHAR2(2) (서버 McnModelRules.KEY_MAX_LEN) */
export const KEY_MAX_LEN = 2;
/** 모델명 최대 바이트 — MODEL_NM VARCHAR2(80) (서버 McnModelRules.MODEL_NM_MAX_BYTES, 계산은 공통 maxBytes·DbBytes 잠정 Q-07) */
export const MODEL_NM_MAX_BYTES = 80;

/** 편집 칸 검증 — 서버도 같은 검사를 한다(키 비었거나 2자 초과·모델명 80바이트 초과 → 400 VAL_001) */
export const RULES = {
  mcnType: [req('기기구분'), maxLen(KEY_MAX_LEN)],
  modelCode: [req('모델코드'), maxLen(KEY_MAX_LEN)],
  modelNm: [maxBytes(MODEL_NM_MAX_BYTES)],
} satisfies Record<'mcnType' | 'modelCode' | 'modelNm', Rule[]>;

/* ---------- 1. 왼쪽: 기기사 목록 ---------- */
/** 기기사 1행 — 공통 조회 기기사 + 조회된 모델 수(화면에서 셈) */
export interface VendorRow {
  vendCode: string;
  vendNm: string | null;
  modelCount: number;
}

/** 기기사 목록 컬럼(G1) */
export const vendorColumns: Col<VendorRow>[] = [
  { title: '순번', key: '__idx', width: 56, align: 'center', render: (_v: unknown, _r: VendorRow, i: number) => i + 1, excel: false },
  { title: '기기사', dataIndex: 'vendCode', width: 200, ellipsis: true, render: (_v: unknown, r: VendorRow) => codeNameLabel(r.vendCode, r.vendNm), excel: (r) => codeNameLabel(r.vendCode, r.vendNm) },
  countCol<VendorRow>('모델 수', 'modelCount', 80),
];

/* ---------- 2. 오른쪽: 모델 편집 표 ---------- */
/** 편집 컬럼 + 엑셀 힌트(excelColumnsOf 로 엑셀도 이 정의에서 만든다) */
export type McnModelCol = EditableColumn<McnModel> & Col<McnModel>;

/** 키 칸 잠금 안내(기존 행) */
export const KEY_LOCKED_TITLE = '등록된 모델의 키는 바꿀 수 없습니다. 삭제 후 다시 추가하세요.';

/** 기존 행의 키 칸 잠금 — 새로 추가한 행만 키를 입력한다(EditableGrid 행별 잠금 editable.disabled) */
const keyLocked = (_r: McnModel, isNew: boolean) => !isNew;

/**
 * 모델 편집 표 컬럼(G2) — 기기구분·모델코드(새 행만 입력, 2자·필수), 모델명(80바이트), 최종변경일시·변경자(읽기 전용).
 * 기존 행의 키는 EditableGrid 가 잠근다(keyLocked).
 */
export const modelColumns = (): McnModelCol[] => [
  { title: '순번', key: '__idx', width: 56, align: 'center', render: (_v: unknown, _r: McnModel, i: number) => i + 1, excel: false },
  { title: '기기구분', dataIndex: 'mcnType', width: 90, align: 'center', className: 'mono', editable: { type: 'input', rules: RULES.mcnType, placeholder: '2자', disabled: keyLocked, disabledTitle: KEY_LOCKED_TITLE } },
  { title: '모델코드', dataIndex: 'modelCode', width: 90, align: 'center', className: 'mono', editable: { type: 'input', rules: RULES.modelCode, placeholder: '2자', disabled: keyLocked, disabledTitle: KEY_LOCKED_TITLE } },
  { title: '모델명', dataIndex: 'modelNm', width: 220, editable: { type: 'input', rules: RULES.modelNm } },
  { title: '최종변경일시', dataIndex: 'lschgDtm', width: 160, align: 'center', render: (v: unknown) => (v ? fmtDateTime14(v as string) : ''), excel: (r) => fmtDateTime14(r.lschgDtm) },
  { title: '변경자', dataIndex: 'lsCmeno', width: 90, align: 'center' },
];
