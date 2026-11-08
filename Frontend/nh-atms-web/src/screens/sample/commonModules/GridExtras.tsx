/**
 * 표 탭 아래쪽 시연 — EditableGrid(일괄 저장 BatchChanges), MasterDetailGrids, MatrixGrid, RowCommandButton,
 * useCommandPoll(명령 폴링), ListEditTabs(목록/편집 탭). 자료는 demoData(화면 안 견본), 서버 호출 없음.
 */
import { useRef, useState } from 'react';
import { Button, Space } from 'antd';
import { DataGrid } from '@/components/grid/DataGrid';
import { EditableGrid, type EditableChanges } from '@/components/grid/EditableGrid';
import { MasterDetailGrids } from '@/components/grid/MasterDetailGrids';
import { MatrixGrid } from '@/components/grid/MatrixGrid';
import { RowCommandButton } from '@/components/grid/RowCommandButton';
import { centerCol, col } from '@/components/grid/columns';
import { ListEditTabs } from '@/components/page/ListEditTabs';
import { DetailGrid } from '@/components/display/DetailGrid';
import { StatusTag } from '@/components/display/StatusTag';
import { useCommandPoll } from '@/hooks/useCommandPoll';
import type { BatchChanges } from '@/types/api';
import { fmtTermId } from '@/utils/format';
import { Demo, EchoJson } from './CodeSample';
import { editColumns } from './GridColumns';
import { DEMO_ROWS, DETAIL_ROWS, EDIT_ROWS, MASTER_ROWS, MATRIX_COLS, MATRIX_ROWS, fakeIssue, fakeRowCommand, fakeStatus, matrixCell, type DemoRow, type DetailRow, type EditDemoRow, type MasterRow } from './demoData';

/** 저장 결과를 화면 안 행에 반영(실제 화면은 저장 API 성공 후 invalidateQueries 로 다시 읽는다) */
export const applyChanges = (rows: EditDemoRow[], c: BatchChanges<EditDemoRow>): EditDemoRow[] => {
  const del = new Set(c.deleted.map((r) => r.id));
  const upd = new Map(c.updated.map((r) => [r.id, r] as const));
  return [...rows.filter((r) => !del.has(r.id)).map((r) => upd.get(r.id) ?? r), ...c.added];
};

export const EditableDemo = () => {
  const [rows, setRows] = useState<EditDemoRow[]>(EDIT_ROWS);
  const [changes, setChanges] = useState<BatchChanges<EditDemoRow> | null>(null);
  const seq = useRef(0);
  const onSave = (c: EditableChanges<EditDemoRow>) => {
    setChanges(c);
    setRows((prev) => applyChanges(prev, c));
  };
  return (
    <Demo
      title="표 직접 편집 · 일괄 저장 (EditableGrid → BatchChanges)"
      desc="셀을 고치면 노란 표시, [행추가]는 초록, [행삭제]는 취소선. [저장] 은 검증 통과 시 { added, updated, deleted } 한 번에."
      code={`<EditableGrid columns={cols} rows={rows} rowKey="id" newRow={() => ({ useYn: 'Y' })}
  onSave={(c) => save.mutate(c)} />   // c = BatchChanges<T> → POST /api/<업무>/batch
// 컬럼: { title: '코드', dataIndex: 'code', editable: { type: 'input', rules: [req('코드'), maxLen(2)] } }
// 금액: { title: '단가', dataIndex: 'unitPrc', editable: { type: 'amount' } }   // 입력 중 콤마, 값은 숫자`}
      echo={changes}
      echoLabel="저장 요청 본문(BatchChanges)"
    >
      <EditableGrid<EditDemoRow>
        columns={editColumns}
        rows={rows}
        rowKey={(r) => String(r.id)}
        newRow={() => {
          seq.current -= 1;
          return { id: seq.current, useYn: 'Y', sortOrd: rows.length + 1 };
        }}
        onSave={onSave}
        grade="G1"
      />
    </Demo>
  );
};

const masterCols = [centerCol<MasterRow>('기기사', 'vendCode', 80), col<MasterRow>('기기사명', 'vendNm', 160)];
const detailCols = [centerCol<DetailRow>('모델코드', 'modelCode', 90), col<DetailRow>('모델명', 'modelNm', 180)];

export const MasterDetailDemo = () => (
  <Demo title="마스터 → 디테일 (MasterDetailGrids)" desc="왼쪽 기기사 행을 누르면 오른쪽에 모델." code={`<MasterDetailGrids masterTitle="기기사" detailTitle={(m) => m?.vendNm}
  master={({ select, selected }) => <DataGrid rows={vendors} onRowClick={select} selectedKey={selected?.vendCode} … />}
  detail={(m) => <DataGrid rows={models(m.vendCode)} … />} />`}>
    <MasterDetailGrids<MasterRow>
      layout="horizontal"
      masterTitle="기기사"
      detailTitle={(m) => (m ? `모델 — ${m.vendNm}` : '모델')}
      master={({ select, selected }) => <DataGrid<MasterRow> columns={masterCols} rows={MASTER_ROWS} rowKey="vendCode" searched grade="G1" clientPageSize={0} onRowClick={select} selectedKey={selected?.vendCode ?? null} />}
      detail={(m) => <DataGrid<DetailRow> columns={detailCols} rows={DETAIL_ROWS.filter((d) => d.vendCode === m.vendCode)} rowKey="modelCode" searched grade="G1" clientPageSize={0} />}
    />
  </Demo>
);

export const MatrixDemo = () => (
  <Demo title="행렬표 (MatrixGrid)" desc="사무소 × 기기구분 건수, 행·열 합계, 10 이상 빨강." code={`<MatrixGrid rowHeaders={rows} colHeaders={cols} cell={(r, c) => value(r, c)} totals={{ row: true, col: true }}
  highlight={(_r, _c, v) => (typeof v === 'number' && v >= 10 ? 'danger' : undefined)} />`}>
    <MatrixGrid
      rowHeaders={MATRIX_ROWS}
      colHeaders={MATRIX_COLS}
      cell={matrixCell}
      totals={{ row: true, col: true }}
      rowHeaderTitle="사무소"
      groupTitle="권역"
      highlight={(_r, _c, v) => (typeof v === 'number' && v >= 10 ? 'danger' : undefined)}
    />
  </Demo>
);

const cmdColumns = [
  centerCol<DemoRow>('기번', 'mcnNo', 70, { render: (_: unknown, r: DemoRow) => fmtTermId(r.ofcCode, r.mcnNo) }),
  col<DemoRow>('사무소', 'kanm', 140),
  { title: '명령', key: 'cmd', width: 200, render: (_: unknown, r: DemoRow) => <RowCommandButton label="접속 확인" run={() => fakeRowCommand(r)} /> },
];

export const CommandDemo = () => {
  const poll = useCommandPoll<void, { elapsedMs: number }>({ issue: fakeIssue, status: fakeStatus, intervalMs: 300, timeoutMs: 10_000 });
  return (
    <Demo
      title="행 명령 버튼 + 명령 폴링 (RowCommandButton · useCommandPoll)"
      desc="행마다 짧은 명령(기번 홀수=성공). 긴 명령은 발행 → cmdId → 상태 폴링 → 완료/실패/시간초과."
      code={`{ title: '명령', render: (_, r) => <RowCommandButton label="접속 확인" run={() => api.ping(r)} /> }
const poll = useCommandPoll({ issue: (a) => api.issue(a), status: (id) => api.status(id) });
<Button onClick={() => void poll.run()} loading={poll.running}>실행</Button>`}
      echo={{ state: poll.state, cmdId: poll.cmdId, message: poll.message ?? null, result: poll.result ?? null }}
      echoLabel="폴링 상태"
    >
      <DataGrid<DemoRow> columns={cmdColumns} rows={DEMO_ROWS.slice(0, 4)} rowKey="id" searched grade="G1" clientPageSize={0} />
      <Space style={{ marginTop: 8 }}>
        <Button onClick={() => void poll.run()} loading={poll.running}>
          긴 명령 실행
        </Button>
        <Button onClick={poll.cancel} disabled={!poll.running}>
          폴링 중단
        </Button>
        <StatusTag tone={poll.state === 'DONE' ? 'success' : poll.state === 'FAIL' || poll.state === 'TIMEOUT' ? 'danger' : 'info'}>{poll.state}</StatusTag>
      </Space>
    </Demo>
  );
};

const listCols = [centerCol<DemoRow>('기번', 'mcnNo', 70), col<DemoRow>('사무소', 'kanm', 160), col<DemoRow>('모델', 'modelNm', 140)];

export const ListEditDemo = () => (
  <Demo title="목록 / 편집 탭 (ListEditTabs)" desc="목록에서 행을 더블클릭하면 수정 탭, [등록] 이면 빈 등록 탭. 견본: 기기정보 화면." code={`<ListEditTabs<Row>
  list={({ select, openCreate }) => <DataGrid onRowDoubleClick={select} … />}
  edit={({ mode, row, done }) => <EditForm key={row?.id ?? 'new'} mode={mode} row={row} onSaved={done} />} />`}>
    <ListEditTabs<DemoRow>
      list={({ select, openCreate }) => (
        <>
          <Button size="small" onClick={openCreate} style={{ marginBottom: 6 }}>
            등록
          </Button>
          <DataGrid<DemoRow> columns={listCols} rows={DEMO_ROWS.slice(0, 6)} rowKey="id" searched grade="G1" clientPageSize={0} onRowDoubleClick={select} />
        </>
      )}
      edit={({ mode, row, done }) => (
        <>
          <DetailGrid cols={2} items={[{ label: '모드', value: mode === 'edit' ? '수정' : '등록' }, { label: '기번', value: row ? fmtTermId(row.ofcCode, row.mcnNo) : '(새로 입력)' }]} />
          <EchoJson value={row} label="편집 대상" />
          <Button size="small" type="primary" onClick={done} style={{ marginTop: 6 }}>
            목록으로
          </Button>
        </>
      )}
    />
  </Demo>
);
