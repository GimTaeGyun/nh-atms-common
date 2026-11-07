/**
 * 탭 4 표 — DataGrid G1/G2/G3, 컬럼 헬퍼 전종, 선택(체크 다건·행 클릭 단건)·더블클릭, 서버 페이징(usePagedSearch) vs 화면 페이징,
 * 그리고 GridExtras(EditableGrid·MasterDetailGrids·MatrixGrid·RowCommandButton·useCommandPoll·ListEditTabs).
 * 자료는 화면 안 견본(demoData) — 서버 페이징은 가짜 fetch(fakePage)로 usePagedSearch 표준 흐름을 그대로 보인다.
 */
import { useMemo, useState } from 'react';
import { Form } from 'antd';
import { DataGrid } from '@/components/grid/DataGrid';
import { ResultHeader } from '@/components/page/ResultHeader';
import { SearchForm } from '@/components/search/SearchForm';
import { ynField } from '@/components/search/lookupFields';
import { allToUndef } from '@/components/search/params';
import { useUnmask } from '@/components/privacy/useUnmask';
import { usePagedSearch } from '@/hooks/usePagedSearch';
import { fmtTermId } from '@/utils/format';
import { Demo, DemoGrid } from './CodeSample';
import { DEMO_ROWS, fakeUnmask, type DemoRow } from './demoData';
import { demoColumns, fakePage, g2Columns, simpleColumns, type DemoPageParams } from './GridColumns';
import { CommandDemo, EditableDemo, ListEditDemo, MasterDetailDemo, MatrixDemo } from './GridExtras';

/** 견본 쿼리 키(화면 안 가짜 fetch 용). 실제 화면은 api/endpoints/<업무>.ts 의 <업무>Keys */
const demoKeys = { all: ['commonModules', 'demo'] as const, page: (p: DemoPageParams) => ['commonModules', 'demo', p] as const };

const SEARCH_FIELDS = [ynField('useYn', '사용여부', { defaultValue: '' })];

const GridTab = () => {
  const [form] = Form.useForm();
  const search = usePagedSearch<DemoPageParams, DemoRow>({ key: demoKeys.page, fetch: fakePage, pageSize: 10 });
  const unmask = useUnmask({ request: fakeUnmask, description: '계좌번호 원문 열람 사유를 입력하세요. (견본: 서버 기록 없음)' });
  const { valueOf, unmask: reveal } = unmask;
  const columns = useMemo(() => demoColumns(search.page, search.size, (r) => ({ revealed: valueOf(r.acctNo), onReveal: () => void reveal(r.acctNo) })), [search.page, search.size, valueOf, reveal]);
  const [selected, setSelected] = useState<DemoRow | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [dbl, setDbl] = useState<DemoRow | null>(null);

  return (
    <>
      <Demo
        title="G3 — 서버 페이징 + 컬럼 헬퍼 전종 (usePagedSearch + DataGrid)"
        desc="[조회] 를 눌러야 읽는다. 체크 = 다건 선택, 행 클릭 = 단건 선택, 더블클릭 = 상세. 계좌 눈 아이콘 = 원문 열람. 헤더 클릭 = 현재 페이지 정렬."
        code={`const search = usePagedSearch({ key: (p) => xxxKeys.list(p), fetch: xxxApi.list, pageSize: 10 });
const columns = useMemo(() => [indexCol(search.page, search.size), col('사무소', 'ofcCode', 170, { fixed: 'left' }),
  centerCol('기번', 'mcnNo', 60), textCol(…), stackCol(…), group('운영', [ynCol(…)]), dateTimeCol(…), dateCol(…), timeCol(…),
  group('실적', [amountCol(…), countCol(…), percentCol(…)]), maskedCol('계좌번호', 'acctNo', 'account', 160, { reveal })], [search.page, search.size]);
<DataGrid columns={columns} rows={search.rows} rowKey="id" grade="G3" pagination={search.pagination} searched={search.searched}
  rowSelection={{ selectedRowKeys, onChange }} onRowClick={setSelected} onRowDoubleClick={openDetail} />`}
        echo={{ params: search.params, checked, selected: selected && fmtTermId(selected.ofcCode, selected.mcnNo), doubleClicked: dbl && fmtTermId(dbl.ofcCode, dbl.mcnNo) }}
        echoLabel="상태"
      >
        <SearchForm form={form} fields={SEARCH_FIELDS} onSearch={(v) => { setSelected(null); setChecked([]); unmask.reset(); search.search({ useYn: allToUndef(v.useYn) }); }} loading={search.loading} />
        <ResultHeader title="G3 결과" total={search.searched ? search.total : undefined} selected={checked.length} />
        <DataGrid<DemoRow>
          columns={columns}
          rows={search.rows}
          rowKey="id"
          loading={search.loading}
          searched={search.searched}
          grade="G3"
          bordered
          pagination={search.pagination}
          rowSelection={{ selectedRowKeys: checked, onChange: (keys) => setChecked(keys.map(String)) }}
          onRowClick={setSelected}
          onRowDoubleClick={setDbl}
          selectedKey={selected?.id ?? null}
        />
        {unmask.modal}
      </Demo>
      <DemoGrid>
        <Demo title="G1 — 화면 페이징 (clientPageSize)" desc="전체 목록을 받아 화면에서 10건씩. 폭 100%." code={`<DataGrid columns={cols} rows={rows} rowKey="id" grade="G1" clientPageSize={10} searched />`}>
          <DataGrid<DemoRow> columns={simpleColumns} rows={DEMO_ROWS} rowKey="id" grade="G1" clientPageSize={10} searched />
        </Demo>
        <Demo title="G2 — 최소폭 + 그룹 헤더, 페이징 없음" desc="좁아지면 최소폭에서 가로 스크롤." code={`<DataGrid columns={[…, group('실적', [amountCol(…), countCol(…), percentCol(…)])]} grade="G2" bordered clientPageSize={0} />`}>
          <DataGrid<DemoRow> columns={g2Columns} rows={DEMO_ROWS.slice(0, 8)} rowKey="id" grade="G2" bordered clientPageSize={0} searched />
        </Demo>
      </DemoGrid>
      <EditableDemo />
      <MasterDetailDemo />
      <MatrixDemo />
      <DemoGrid>
        <CommandDemo />
        <ListEditDemo />
      </DemoGrid>
    </>
  );
};

export default GridTab;
