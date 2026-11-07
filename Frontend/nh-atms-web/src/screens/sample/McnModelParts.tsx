import { useMemo } from 'react';
import { EditableGrid, type EditableChanges } from '@/components/grid/EditableGrid';
import { distinctField, vendorField } from '@/components/search/lookupFields';
import { allToUndef } from '@/components/search/params';
import type { SearchField } from '@/components/search/SearchForm';
import type { Permission } from '@/hooks/usePermission';
import { compactParams } from '@/utils/object';
import type { Vendor } from '@/domain/lookup';
import type { McnModel, McnModelSearch } from '@/domain/mcnModel';
import { modelColumns, type VendorRow } from './McnModelColumns';

/* ---------- 1. 조회조건 ---------- */
/** 기기사(선택) · 기기구분(있는 값 콤보 — 코드표가 정본에 없음) · 검색어(모델코드·모델명) */
export const MCN_MODEL_FIELDS: SearchField[] = [
  vendorField(),
  distinctField('mcnType', '기기구분', 'model-mcn-type'),
  { name: 'q', label: '검색어', type: 'input', widthClass: 'normal', placeholder: '모델코드·모델명' },
];

/** 폼 값 → 조회 파라미터(빈 값은 뺀다) */
export const toMcnModelParams = (v: Record<string, unknown>): McnModelSearch =>
  compactParams({ vendCode: allToUndef(v.vendCode), mcnType: allToUndef(v.mcnType), q: typeof v.q === 'string' ? v.q.trim() : undefined });

/** 같은 조회조건인지(같으면 [조회] 를 다시 눌러도 쿼리 키가 같아 다시 읽지 않으므로 refetch 한다) */
export const sameSearch = (a: McnModelSearch | null, b: McnModelSearch): boolean =>
  !!a && (a.vendCode ?? '') === (b.vendCode ?? '') && (a.mcnType ?? '') === (b.mcnType ?? '') && (a.q ?? '') === (b.q ?? '');

/* ---------- 2. 왼쪽 기기사 목록 ---------- */
/**
 * 기기사 목록 = 공통 조회 기기사 ∪ 조회된 모델의 기기사(이름 원천이 없는 코드 포함), 모델 수는 조회된 모델에서 센다.
 * 조회조건에 기기사가 있으면 그 기기사만.
 */
export const vendorRowsOf = (vendors: Vendor[] | undefined, models: McnModel[], vendCode?: string): VendorRow[] => {
  const map = new Map<string, VendorRow>();
  for (const v of vendors ?? []) map.set(v.vendCode, { vendCode: v.vendCode, vendNm: v.vendNm ?? null, modelCount: 0 });
  for (const m of models) {
    const row = map.get(m.vendCode) ?? { vendCode: m.vendCode, vendNm: m.vendNm ?? null, modelCount: 0 };
    row.modelCount += 1;
    map.set(m.vendCode, row);
  }
  const rows = Array.from(map.values()).sort((a, b) => a.vendCode.localeCompare(b.vendCode));
  return vendCode ? rows.filter((r) => r.vendCode === vendCode) : rows;
};

/* ---------- 3. 저장 전 검사(서버도 같은 검사를 한다) ---------- */
/** 오류 문구 인자와 같은 키 글 '업체-기기구분-모델' (서버 McnModelService.keyText) */
export const keyText = (r: Pick<McnModel, 'vendCode' | 'mcnType' | 'modelCode'>): string =>
  `${(r.vendCode ?? '').trim()}-${(r.mcnType ?? '').trim()}-${(r.modelCode ?? '').trim()}`;

/**
 * 표 안 중복 키(업체+기기구분+모델코드) — 지운 행을 뺀 기존 행 + 추가 행 사이에서 처음 겹친 키, 없으면 null.
 * 같은 저장에서 지운 키를 다시 추가하는 것은 허용(서버가 삭제 → 수정 → 추가 순서로 처리).
 */
export const duplicateKeyOf = (rows: McnModel[], ch: EditableChanges<McnModel>): string | null => {
  const deleted = new Set(ch.deleted.map(keyText));
  const keys = new Set(rows.map(keyText).filter((k) => !deleted.has(k)));
  for (const a of ch.added) {
    const k = keyText(a);
    if (keys.has(k)) return k;
    keys.add(k);
  }
  return null;
};

/** 변경 종류별 권한(추가 REG · 수정 UPD · 삭제 DEL) 중 모자란 것이 있나 — 서버도 들어온 종류만 검사(403 SYS_403) */
export const lacksPermission = (ch: EditableChanges<McnModel>, p: Permission): boolean =>
  (ch.added.length > 0 && !p.canReg) || (ch.updated.length > 0 && !p.canUpd) || (ch.deleted.length > 0 && !p.canDel);

/* ---------- 4. 오른쪽 모델 편집 표 ---------- */
interface ModelPaneProps {
  vendor: VendorRow;
  /** 조회된 전체 모델(이 중 vendor 것만 보인다) */
  models: McnModel[];
  /** 화면 권한(행추가 REG · 셀 수정 UPD · 행삭제 DEL) — 하나도 없으면 표 전체 읽기 전용 */
  perm: Pick<Permission, 'canReg' | 'canUpd' | 'canDel'>;
  loading: boolean;
  onSave: (rows: McnModel[], ch: EditableChanges<McnModel>) => Promise<void>;
}

/**
 * 선택한 기기사의 모델 표(EditableGrid, 툴바 내장: 행추가·행삭제·저장·취소).
 * 행 배열은 useMemo 로 고정한다 — EditableGrid 는 rows 가 바뀌면 편집 상태를 처음으로 돌린다(저장 후 다시 읽을 때만 바뀐다).
 * 기존 행의 키 칸은 잠근다(EditableGrid 행별 잠금), 새 행은 기기사가 정해진 채로 기기구분·모델코드를 입력한다.
 * 버튼별 권한: 행추가 REG · 기존 행 수정 UPD · 행삭제 DEL(EditableGrid canAdd·canUpdate·canDelete). 저장 때 한 번 더 본다(lacksPermission).
 */
export const ModelPane = ({ vendor, models, perm, loading, onSave }: ModelPaneProps) => {
  const rows = useMemo(() => models.filter((m) => m.vendCode === vendor.vendCode), [models, vendor.vendCode]);
  const columns = useMemo(() => modelColumns(), []);
  return (
    <EditableGrid<McnModel>
      columns={columns}
      rows={rows}
      rowKey={keyText}
      readOnly={!(perm.canReg || perm.canUpd || perm.canDel)}
      canAdd={perm.canReg}
      canUpdate={perm.canUpd}
      canDelete={perm.canDel}
      loading={loading}
      height={480}
      newRow={() => ({ vendCode: vendor.vendCode, vendNm: vendor.vendNm, mcnType: '', modelCode: '', modelNm: '' })}
      onSave={(ch) => onSave(rows, ch)}
    />
  );
};
