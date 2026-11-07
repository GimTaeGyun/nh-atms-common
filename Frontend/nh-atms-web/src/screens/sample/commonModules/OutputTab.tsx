/**
 * 탭 5 출력 — 엑셀(화면 컬럼 정의 → excelColumnsOf), 인쇄(PrintLayout + usePrint), 마스킹(MaskedText·maskedCol), 첨부(FileAttachList·useFileUpload).
 * 인쇄 양식(PrintLayout)은 PageFrame 의 직계 자식이어야 해서 화면 본체(CommonModulesPage)에 있다 — 이 탭은 버튼만.
 * 파일 올리기는 가짜 요청(fakeUpload, 진행률 25%씩) — 실제 화면은 api/endpoints/<업무>.ts 의 upload.
 */
import { useMemo, useState } from 'react';
import { Button, Space } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { ExcelButton } from '@/components/page/ExcelButton';
import { ResultHeader } from '@/components/page/ResultHeader';
import { DataGrid } from '@/components/grid/DataGrid';
import { excelColumnsOf } from '@/components/grid/columns';
import { MaskedText } from '@/components/privacy/MaskedText';
import { maskedCol } from '@/components/privacy/MaskedCell';
import type { MaskKind } from '@/components/privacy/maskKinds';
import { FileAttachList } from '@/components/forms/FileAttachList';
import { DetailGrid } from '@/components/display/DetailGrid';
import { useFileUpload, type UploadedFile } from '@/hooks/useFileUpload';
import { downloadExcel } from '@/utils/excel';
import { saveBlob } from '@/utils/download';
import { Demo, DemoGrid } from './CodeSample';
import { DEMO_ROWS, fakeUpload, type DemoRow } from './demoData';
import { demoColumns } from './GridColumns';

/** 엑셀 파일 이름(날짜·시각은 downloadExcel 이 붙인다) */
export const EXCEL_NAME = '공통모듈_견본';

const MASK_SAMPLES: { kind: MaskKind; label: string; value: string }[] = [
  { kind: 'account', label: '계좌', value: '3011234567891' },
  { kind: 'card', label: '카드', value: '9410123456781234' },
  { kind: 'name', label: '성명', value: '홍길동' },
  { kind: 'phone', label: '전화', value: '01012345678' },
];

const maskGridCols = [maskedCol<DemoRow>('성명', 'name', 'name', 90), maskedCol<DemoRow>('전화번호', 'telNo', 'phone', 140), maskedCol<DemoRow>('계좌번호', 'acctNo', 'account', 170)];

/** useFileUpload 를 직접 쓰는 예 — 목록 모양을 화면이 정할 때 */
const UploadHookDemo = () => {
  const up = useFileUpload({ upload: fakeUpload, maxSizeMb: 1, accept: '.txt,.csv', maxCount: 2 });
  return (
    <Demo
      title="파일 올리기 훅 (useFileUpload)"
      desc="형식·크기·개수 검사 → 올리기(진행률) → 완료 목록 files. 1MB·.txt/.csv·2개까지."
      code={`const up = useFileUpload({ upload: (f, onProgress) => api.upload(f, onProgress), maxSizeMb: 1, accept: '.txt,.csv', maxCount: 2 });
<input type="file" onChange={(e) => e.target.files?.[0] && void up.add(e.target.files[0])} />`}
      echo={{ uploading: up.uploading, items: up.items.map((i) => ({ name: i.name, status: i.status, progress: i.progress, fileId: i.fileId ?? null })), files: up.files }}
      echoLabel="상태"
    >
      <input
        type="file"
        aria-label="파일 선택"
        accept=".txt,.csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void up.add(f);
          e.target.value = '';
        }}
      />
      <Button size="small" onClick={() => up.reset()} style={{ marginLeft: 8 }}>
        비우기
      </Button>
    </Demo>
  );
};

const OutputTab = ({ onPrint, printing }: { onPrint: () => void; printing: boolean }) => {
  const columns = useMemo(() => demoColumns(1, DEMO_ROWS.length), []);
  const excelCols = useMemo(() => excelColumnsOf(columns), [columns]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const excel = () => downloadExcel<DemoRow>(excelCols, DEMO_ROWS, EXCEL_NAME);

  return (
    <>
      <Demo
        title="엑셀 다운로드 (ExcelButton + downloadExcel(excelColumnsOf(columns)))"
        desc="그리드가 보는 컬럼 정의로 엑셀을 만든다 — 순번 제외, 그룹 헤더는 평탄화, 날짜는 'YYYY-MM-DD', Y/N 아이콘은 글자, 마스킹 칸은 원값 그대로(필요하면 excel 힌트)."
        code={`const excel = () => downloadExcel(excelColumnsOf(columns), search.rows, '화면이름');
<ResultHeader total={search.total}><ExcelButton onClick={excel} disabled={!search.rows.length} /></ResultHeader>`}
        echo={excelCols.map((c) => c.title)}
        echoLabel="엑셀 머리글"
      >
        <ResultHeader title="견본 목록" total={DEMO_ROWS.length}>
          <ExcelButton onClick={() => void excel()} />
        </ResultHeader>
      </Demo>
      <DemoGrid>
        <Demo
          title="인쇄 (PrintLayout + usePrint)"
          desc="화면에서는 숨은 인쇄 양식(PageFrame 직계 자식)만 A4 가로로 나간다. 머리글·PDF 이름은 화면 제목."
          code={`const { print, printing } = usePrint('공지사항 목록');
<PageFrame …>
  … 화면 …
  <PrintLayout title="공지사항 목록" conditions={[{ label: '기간', value: '…' }]}><table>…</table></PrintLayout>
</PageFrame>`}
        >
          <Button icon={<PrinterOutlined />} onClick={onPrint} loading={printing}>
            인쇄
          </Button>
        </Demo>
        <Demo title="마스킹 표시 (MaskedText)" desc="종류별 규칙(account·card·name·phone·custom). 서버가 이미 가렸으면 masked." code={`<MaskedText value={acctNo} kind="account" />
<MaskedText value="010-****-5678" kind="phone" masked />   // 서버 마스킹 그대로
<MaskedText value={v} kind="custom" mask={(s) => s.slice(0, 2) + '***'} />`}>
          <DetailGrid
            cols={2}
            labelWidth={70}
            items={[
              ...MASK_SAMPLES.map((m) => ({ label: m.label, value: <MaskedText value={m.value} kind={m.kind} /> })),
              { label: '서버마스킹', value: <MaskedText value="010-****-5678" kind="phone" masked /> },
              { label: '직접규칙', value: <MaskedText value="NH2026ATMS" kind="custom" mask={(s) => `${s.slice(0, 2)}${'*'.repeat(s.length - 2)}`} /> },
            ]}
          />
        </Demo>
      </DemoGrid>
      <Demo title="표 안 마스킹 (maskedCol)" code={`maskedCol('계좌번호', 'acctNo', 'account', 170, { reveal: (r) => ({ revealed: unmask.valueOf(r.acctNo), onReveal: () => void unmask.unmask(r.acctNo) }) })`}>
        <DataGrid<DemoRow> columns={maskGridCols} rows={DEMO_ROWS.slice(0, 3)} rowKey="id" grade="G1" clientPageSize={0} searched />
      </Demo>
      <DemoGrid>
        <Demo
          title="첨부파일 (FileAttachList)"
          desc="버튼으로 고르면 바로 올리고(진행률), 완료 목록을 onChange 로 준다. 견본은 가짜 올리기·내려받기."
          code={`<FileAttachList upload={(f, p) => api.upload(f, p)} download={(id, name) => api.download(id, name)}
  remove={(id) => api.removeFile(id)} maxSizeMb={10} maxCount={5} onChange={setFiles} />`}
          echo={files}
          echoLabel="완료 파일"
        >
          <Space orientation="vertical" style={{ width: '100%' }}>
            <FileAttachList upload={fakeUpload} maxSizeMb={5} maxCount={3} onChange={setFiles} download={(_id, name) => saveBlob(new Blob(['견본 파일'], { type: 'text/plain' }), name)} />
          </Space>
        </Demo>
        <UploadHookDemo />
      </DemoGrid>
    </>
  );
};

export default OutputTab;
