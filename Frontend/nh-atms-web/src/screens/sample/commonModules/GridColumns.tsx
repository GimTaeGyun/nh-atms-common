/**
 * 표 탭·출력 탭이 같이 쓰는 컬럼 정의 — 컬럼 헬퍼 전종(columns.tsx + maskedCol).
 * 엑셀은 이 컬럼 정의를 그대로 `excelColumnsOf(columns)` 로 바꿔 쓴다(화면별 엑셀 컬럼 목록 금지).
 */
import type { MaskedTextProps } from '@/components/privacy/MaskedText';
import { maskedCol } from '@/components/privacy/MaskedCell';
import { ApprovalStatusTag } from '@/components/approval/ApprovalStatusTag';
import { APPROVAL_STATUS } from '@/components/approval/approvalStatus';
import type { EditableColumn } from '@/components/grid/EditableGrid';
import { amountCol, centerCol, col, countCol, dateCol, dateTimeCol, group, indexCol, percentCol, resultCol, stackCol, textCol, timeCol, ynCol, type Col, type ColGroup } from '@/components/grid/columns';
import type { PageParams, PageResult } from '@/types/api';
import { fmtOffice } from '@/utils/format';
import { maxLen, numRange, req } from '@/utils/rules';
import { YN_OPTIONS } from '@/components/search/lookupFields';
import { DEMO_ROWS, type DemoRow, type EditDemoRow } from './demoData';

export type DemoColumns = (Col<DemoRow> | ColGroup<DemoRow>)[];

/** G3 컬럼 — 헬퍼 전종(좌측 고정 + 그룹 헤더 + 마스킹 + 원문 열람) */
export const demoColumns = (page: number, size: number, reveal?: (r: DemoRow) => Pick<MaskedTextProps, 'revealed' | 'onReveal'>): DemoColumns => [
  indexCol<DemoRow>(page, size), // 순번(서버 페이징 오프셋 반영, 엑셀 제외)
  col<DemoRow>('사무소', 'ofcCode', 170, { fixed: 'left', render: (_: unknown, r) => fmtOffice(r.ofcCode, r.kanm), excel: (r) => fmtOffice(r.ofcCode, r.kanm) }),
  centerCol<DemoRow>('기번', 'mcnNo', 60, { fixed: 'left', className: 'mono' }),
  textCol<DemoRow>('모델', 'modelNm', 110), // 빈 값 '-'
  stackCol<DemoRow>('기기사/모델', 140, (r) => [r.vendNm, r.modelNm]), // 2줄 셀, 엑셀은 ' / '
  group<DemoRow>('운영', [ynCol<DemoRow>('사용', 'useYn', 56), ynCol<DemoRow>('365', 'opYn', 56)]),
  dateTimeCol<DemoRow>('작성일시', 'wrtDate', 'wrtTime', 150),
  dateCol<DemoRow>('작성일', 'wrtDate', 100),
  timeCol<DemoRow>('작성시각', 'wrtTime', 80),
  group<DemoRow>('실적', [amountCol<DemoRow>('금액', 'amount', 110), countCol<DemoRow>('건수', 'cnt', 70), percentCol<DemoRow>('비율', 'rate', 80)]),
  maskedCol<DemoRow>('계좌번호', 'acctNo', 'account', 160, { reveal }),
  maskedCol<DemoRow>('전화번호', 'telNo', 'phone', 130),
  maskedCol<DemoRow>('성명', 'name', 'name', 80),
  resultCol<DemoRow>('결과', 'result', 70),
  centerCol<DemoRow>('승인', 'aprvStatus', 80, { render: (v: DemoRow['aprvStatus']) => <ApprovalStatusTag status={v} />, excel: (r) => APPROVAL_STATUS[r.aprvStatus].label }),
];

/** G1 컬럼(폭 100%, 적은 컬럼) */
export const simpleColumns: Col<DemoRow>[] = [
  centerCol<DemoRow>('기번', 'mcnNo', 70),
  col<DemoRow>('사무소', 'kanm', 160),
  textCol<DemoRow>('모델', 'modelNm', 140),
  ynCol<DemoRow>('사용', 'useYn', 70),
  dateCol<DemoRow>('작성일', 'wrtDate', 110),
];

/** G2 컬럼(그룹 헤더, 최소폭) */
export const g2Columns: DemoColumns = [
  centerCol<DemoRow>('기번', 'mcnNo', 70),
  col<DemoRow>('사무소', 'kanm', 150),
  group<DemoRow>('실적', [amountCol<DemoRow>('금액', 'amount', 120), countCol<DemoRow>('건수', 'cnt', 80), percentCol<DemoRow>('비율', 'rate', 90)]),
  resultCol<DemoRow>('결과', 'result', 80),
];

/** 표 편집(EditableGrid) 컬럼 — editable 로 편집 컨트롤·검증 규칙 */
export const editColumns: EditableColumn<EditDemoRow>[] = [
  { title: '코드', dataIndex: 'code', width: 80, align: 'center', editable: { type: 'input', rules: [req('코드'), maxLen(2)], placeholder: '2자리' } },
  { title: '이름', dataIndex: 'name', width: 180, editable: { type: 'input', rules: [req('이름'), maxLen(50)] } },
  { title: '사용', dataIndex: 'useYn', width: 110, align: 'center', editable: { type: 'select', options: YN_OPTIONS.map((o) => ({ value: o.value, label: o.label })), rules: [req('사용여부')] } },
  { title: '정렬', dataIndex: 'sortOrd', width: 90, align: 'right', editable: { type: 'number', rules: [numRange(1, 999)] } },
  { title: '적용일', dataIndex: 'aplyDate', width: 140, align: 'center', editable: { type: 'date' } },
];

/** 견본 서버 페이징 파라미터 */
export interface DemoPageParams extends PageParams {
  useYn?: string;
}

/** 서버 페이징 흉내(화면 안 가짜 fetch) — 실제 화면은 api/endpoints/<업무>.ts 의 list */
export const fakePage = (p: DemoPageParams): Promise<PageResult<DemoRow>> => {
  const rows = p.useYn ? DEMO_ROWS.filter((r) => r.useYn === p.useYn) : DEMO_ROWS;
  const page = p.page ?? 1;
  const size = p.size ?? 10;
  return new Promise((resolve) =>
    window.setTimeout(() => resolve({ content: rows.slice((page - 1) * size, page * size), totalCount: rows.length, page, size, totalPages: Math.max(1, Math.ceil(rows.length / size)) }), 80),
  );
};
