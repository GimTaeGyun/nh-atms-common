import { useMemo, useState } from 'react';
import { Form } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mcnModelApi, mcnModelKeys } from '@/api/endpoints/mcnModel';
import { useSearch } from '@/hooks/usePagedSearch';
import { usePermission } from '@/hooks/usePermission';
import { useVendors } from '@/hooks/useLookup';
import { useAppMessage } from '@/hooks/useAppMessage';
import { PageFrame } from '@/components/page/PageFrame';
import { ResultHeader } from '@/components/page/ResultHeader';
import { ExcelButton } from '@/components/page/ExcelButton';
import { SearchForm } from '@/components/search/SearchForm';
import { codeNameLabel } from '@/components/search/lookupFields';
import { ActionBar } from '@/components/auth/ActionBar';
import { DENIED_TEXT } from '@/components/auth/useAllowed';
import { DataGrid } from '@/components/grid/DataGrid';
import { MasterDetailGrids } from '@/components/grid/MasterDetailGrids';
import { excelColumnsOf } from '@/components/grid/columns';
import type { EditableChanges } from '@/components/grid/EditableGrid';
import { downloadExcel } from '@/utils/excel';
import { VMSG } from '@/config/messages';
import type { McnModel, McnModelSearch } from '@/domain/mcnModel';
import type { ScreenProps } from '@/types/screen';
import { modelColumns, vendorColumns, type VendorRow } from './McnModelColumns';
import { MCN_MODEL_FIELDS, ModelPane, duplicateKeyOf, lacksPermission, sameSearch, toMcnModelParams, vendorRowsOf } from './McnModelParts';

const NO_MODELS: McnModel[] = [];
/** 엑셀 컬럼은 편집 표 정의에서 만든다(키 잠금 여부는 엑셀과 상관없음) */
const EXCEL_COLUMNS = excelColumnsOf(modelColumns());

/**
 * 기기모델코드(`sample.mcnModel`, TB_CO_MODEL) — "표 직접 편집·일괄 저장형" 견본(설계 §8.4, API 계약 §5).
 *  조회조건(기기사·기기구분·검색어) → 표준 버튼줄(조회·엑셀) → 결과 머리(+엑셀)
 *  → 좌: 기기사 목록(모델 수) / 우: 선택한 기기사의 모델 표(EditableGrid — 행추가·행삭제·셀 편집 후 [저장] 한 번에)
 *  저장 = `POST /api/mcn-model/batch` {added, updated, deleted}(서버가 삭제 → 수정 → 추가, 한 트랜잭션, S001).
 *  권한: 행추가 REG · 셀 수정 UPD · 행삭제 DEL 버튼별(하나도 없으면 읽기 전용). 저장 때 변경 종류별로 다시 보고, 서버도 검사한다.
 *  기존 행의 키(기기구분·모델코드)는 잠기고 모델명만 고친다. 키를 바꾸려면 삭제 후 다시 추가.
 */
const McnModelPage = ({ screenKey, active }: ScreenProps) => {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = useAppMessage();
  const perm = usePermission(screenKey);
  /** 조회할 때마다 올려 왼쪽 선택을 비운다(MasterDetailGrids 를 새로 그림) */
  const [searchSeq, setSearchSeq] = useState(0);
  const [vendor, setVendor] = useState<VendorRow | null>(null);

  const search = useSearch<McnModelSearch, McnModel[]>({ key: mcnModelKeys.list, fetch: mcnModelApi.list });
  const vendors = useVendors();
  const models = search.data ?? NO_MODELS;
  const vendorRows = useMemo(
    () => (search.searched ? vendorRowsOf(vendors.data, models, search.params?.vendCode) : []),
    [search.searched, search.params, vendors.data, models],
  );
  const excelRows = useMemo(() => (vendor ? models.filter((m) => m.vendCode === vendor.vendCode) : NO_MODELS), [models, vendor]);

  const save = useMutation({
    mutationFn: mcnModelApi.saveBatch,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mcnModelKeys.all });
    },
  });

  const onSearch = (v: Record<string, unknown>) => {
    const p = toMcnModelParams(v);
    setVendor(null);
    setSearchSeq((n) => n + 1);
    if (sameSearch(search.params, p)) void search.refetch();
    else search.search(p);
  };

  /** 저장 전 검사(권한·표 안 중복) → 일괄 저장. 서버 오류 문구는 공통 처리가 띄운다 */
  const onSave = async (rows: McnModel[], ch: EditableChanges<McnModel>) => {
    if (lacksPermission(ch, perm)) {
      void message.warning(DENIED_TEXT);
      return;
    }
    const dup = duplicateKeyOf(rows, ch);
    if (dup) {
      void message.warning(VMSG.duplicateModel(dup));
      return;
    }
    await save.mutateAsync(ch).then(
      () => undefined,
      () => undefined,
    );
  };

  const excel = () => {
    if (vendor) void downloadExcel<McnModel>(EXCEL_COLUMNS, excelRows, `기기모델코드_${vendor.vendCode}`);
  };

  return (
    <PageFrame screenKey={screenKey} lastUpdated={search.lastUpdated} onRefresh={() => void search.refetch()} refreshing={search.loading}>
      <ActionBar
        screenKey={screenKey}
        size="small"
        hotkeys={active}
        style={{ marginBottom: 8 }}
        actions={[
          { key: 'search', onClick: () => form.submit(), loading: search.loading },
          { key: 'excel', onClick: excel, disabled: !excelRows.length },
        ]}
      />
      <SearchForm form={form} fields={MCN_MODEL_FIELDS} onSearch={onSearch} loading={search.loading} />
      <ResultHeader
        total={search.searched ? models.length : undefined}
        note={search.searched ? '등록 = 행추가 후 입력, 삭제 = 체크 후 [행삭제], 수정 = 모델명 직접 편집. 마지막에 [저장]을 눌러야 반영됩니다.' : undefined}
      >
        <ExcelButton onClick={excel} disabled={!excelRows.length} />
      </ResultHeader>
      <MasterDetailGrids<VendorRow>
        key={searchSeq}
        layout="horizontal"
        masterTitle="기기사"
        detailTitle={(m) => (m ? `모델 — ${codeNameLabel(m.vendCode, m.vendNm)}` : '모델')}
        emptyText="왼쪽 기기사 목록에서 기기사를 선택하세요."
        master={({ select, selected }) => (
          <DataGrid<VendorRow>
            columns={vendorColumns}
            rows={vendorRows}
            rowKey="vendCode"
            loading={search.loading || vendors.isFetching}
            searched={search.searched}
            grade="G1"
            height={480}
            pagination={false}
            onRowClick={(r) => {
              select(r);
              setVendor(r);
            }}
            selectedKey={selected?.vendCode ?? null}
          />
        )}
        detail={(m) => (
          <ModelPane key={m.vendCode} vendor={m} models={models} perm={perm} loading={search.loading || save.isPending} onSave={onSave} />
        )}
      />
    </PageFrame>
  );
};

export default McnModelPage;
