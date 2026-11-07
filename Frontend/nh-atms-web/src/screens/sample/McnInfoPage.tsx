import { useMemo, useState } from 'react';
import { Form } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mcnInfoApi, mcnInfoKeys } from '@/api/endpoints/mcnInfo';
import { usePagedSearch } from '@/hooks/usePagedSearch';
import { PageFrame } from '@/components/page/PageFrame';
import { ListEditTabs } from '@/components/page/ListEditTabs';
import { ResultHeader } from '@/components/page/ResultHeader';
import { ExcelButton } from '@/components/page/ExcelButton';
import { SearchForm } from '@/components/search/SearchForm';
import { ActionBar } from '@/components/auth/ActionBar';
import { DataGrid } from '@/components/grid/DataGrid';
import { excelColumnsOf } from '@/components/grid/columns';
import { downloadExcel } from '@/utils/excel';
import { fmtTermId } from '@/utils/format';
import type { McnInfo, McnInfoSearch } from '@/domain/mcnInfo';
import type { ScreenProps } from '@/types/screen';
import { mcnInfoColumns } from './McnInfoColumns';
import { DELETE_CONFIRM, McnInfoEditPane, toMcnInfoParams, useMcnInfoFields } from './McnInfoParts';

const keyOf = (r: McnInfo): string => `${r.ofcCode}-${r.mcnNo}`;

/**
 * 기기정보(`sample.mcnInfo`, TB_MCN_INFO) — "목록/편집 탭형" CRUD 견본(설계 §8.3, API 계약 §4).
 *  [목록] 조회조건(SearchForm) → 표준 버튼줄(ActionBar: 조회·엑셀·등록·삭제) → 결과 머리(ResultHeader+엑셀) → 그리드(G2, 서버 페이징)
 *         행 클릭 = 선택(삭제 대상), 행 더블클릭 = [수정] 탭
 *  [등록·수정] DetailGrid 3열 폼(키는 수정 불가) + 등록/수정/삭제/목록 버튼 — 저장되면 목록으로 돌아가고 목록을 다시 읽는다
 *  삭제는 사용여부 'N' 으로 바꾸는 논리 삭제(설계 Q11). 버튼 권한은 화면 권한(REG·UPD·DEL), 서버도 다시 검사한다.
 */
const McnInfoPage = ({ screenKey, active }: ScreenProps) => {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'list' | 'edit'>('list');
  const [selected, setSelected] = useState<McnInfo | null>(null);
  const fields = useMcnInfoFields();

  const search = usePagedSearch<McnInfoSearch, McnInfo>({ key: mcnInfoKeys.list, fetch: mcnInfoApi.list });
  const columns = useMemo(() => mcnInfoColumns(search.page, search.size), [search.page, search.size]);

  const remove = useMutation({
    mutationFn: mcnInfoApi.remove,
    onSuccess: () => {
      setSelected(null);
      void qc.invalidateQueries({ queryKey: mcnInfoKeys.all });
    },
  });

  const onSearch = (v: Record<string, unknown>) => {
    setSelected(null);
    search.search(toMcnInfoParams(v));
  };
  const excel = () => downloadExcel<McnInfo>(excelColumnsOf(columns), search.rows, '기기정보');

  return (
    <PageFrame screenKey={screenKey} lastUpdated={search.lastUpdated} onRefresh={() => void search.refetch()} refreshing={search.loading}>
      <ListEditTabs<McnInfo>
        onTabChange={setTab}
        editLabel={(m) => (m === 'edit' ? '수정' : '등록')}
        list={({ select, openCreate }) => (
          <>
            <ActionBar
              screenKey={screenKey}
              size="small"
              hotkeys={active && tab === 'list'}
              style={{ marginBottom: 8 }}
              actions={[
                { key: 'search', onClick: () => form.submit(), loading: search.loading },
                { key: 'excel', onClick: () => void excel(), disabled: !search.rows.length },
                { key: 'create', onClick: openCreate },
                { key: 'delete', disabled: !selected, confirm: DELETE_CONFIRM, loading: remove.isPending, onClick: () => {
                  if (selected) remove.mutate(selected);
                } },
              ]}
            />
            <SearchForm form={form} fields={fields} onSearch={onSearch} loading={search.loading} />
            <ResultHeader
              total={search.searched ? search.total : undefined}
              selected={selected ? 1 : 0}
              note={search.searched ? <>행 클릭 = 선택({selected ? fmtTermId(selected.ofcCode, selected.mcnNo) : '없음'}), 더블클릭 = 수정 탭</> : undefined}
            >
              <ExcelButton onClick={() => void excel()} disabled={!search.rows.length} />
            </ResultHeader>
            <DataGrid<McnInfo>
              columns={columns}
              rows={search.rows}
              rowKey={keyOf}
              loading={search.loading}
              searched={search.searched}
              grade="G2"
              pagination={search.pagination}
              onRowClick={setSelected}
              onRowDoubleClick={(r) => {
                setSelected(r);
                select(r);
              }}
              selectedKey={selected ? keyOf(selected) : null}
            />
          </>
        )}
        edit={({ mode, row, done }) => (tab === 'edit' ? <McnInfoEditPane key={row ? keyOf(row) : 'create'} screenKey={screenKey} mode={mode} row={row} done={done} /> : null)}
      />
    </PageFrame>
  );
};

export default McnInfoPage;
