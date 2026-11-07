import { centerCol, col, emptyOr, indexCol, textCol, ynCol, type Col } from '@/components/grid/columns';
import { codeNameLabel } from '@/components/search/lookupFields';
import { fmtDateTime14, fmtOffice } from '@/utils/format';
import type { McnInfo } from '@/domain/mcnInfo';

/** '[코드] 이름' (코드가 없으면 빈 값) — 화면·엑셀 같은 글 */
const codeName = (code: string | null, name: string | null): string => (code ? codeNameLabel(code, name) : '');
/** 기기사: 이름이 있으면 이름, 없으면 코드(원천 잠정 Q6) */
const vendorText = (r: McnInfo): string => r.vendNm ?? r.vendCode ?? '';

/**
 * 기기정보 목록 컬럼(G2) — 왼쪽 고정: 순번·사무소·기번. 엑셀도 이 정의로 만든다(excelColumnsOf).
 * 표시 글과 엑셀 글이 다른 칸(코드+이름 등)은 `excel` 힌트로 같은 글을 넣는다.
 */
export const mcnInfoColumns = (page: number, size: number): Col<McnInfo>[] => [
  indexCol<McnInfo>(page, size),
  col<McnInfo>('사무소', 'ofcCode', 170, { fixed: 'left', render: (_v, r) => fmtOffice(r.ofcCode, r.kanm), excel: (r) => fmtOffice(r.ofcCode, r.kanm) }),
  centerCol<McnInfo>('기번', 'mcnNo', 64, { fixed: 'left' }),
  col<McnInfo>('코너', 'instPstCode', 180, { render: (_v, r) => emptyOr(codeName(r.instPstCode, r.instPstNm), (t) => t), excel: (r) => codeName(r.instPstCode, r.instPstNm) }),
  col<McnInfo>('기종', 'src', 150, { render: (_v, r) => emptyOr(codeName(r.src, r.srcNm), (t) => t), excel: (r) => codeName(r.src, r.srcNm) }),
  textCol<McnInfo>('기기유형', 'komType', 80, { align: 'center' }),
  col<McnInfo>('기기사', 'vendCode', 120, { render: (_v, r) => emptyOr(vendorText(r), (t) => t), excel: vendorText }),
  textCol<McnInfo>('운영구분', 'opType', 80, { align: 'center' }),
  textCol<McnInfo>('정내외', 'inoutType', 70, { align: 'center' }),
  textCol<McnInfo>('장소특성', 'cnrPstSpecCode', 80, { align: 'center' }),
  ynCol<McnInfo>('사용여부', 'useYn', 80),
  col<McnInfo>('최종변경일시', 'lschgDtm', 160, { align: 'center', render: (_v, r) => fmtDateTime14(r.lschgDtm), excel: (r) => fmtDateTime14(r.lschgDtm) }),
  textCol<McnInfo>('변경자', 'lsCmeno', 90, { align: 'center' }),
];
