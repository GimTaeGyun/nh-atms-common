/**
 * 목 서버 핸들러 — 업무별 파일을 모은다. 새 화면의 API 는 해당 업무 파일에(없으면 새 파일 + 여기 한 줄).
 * 공통(응답 봉투·페이징·지연·파라미터 기본값)은 `_util.ts`, 데이터 생성은 `../data/*`.
 * 단위 테스트(msw/node)와 브라우저(dev:mock)가 같은 핸들러를 쓴다. `fallbackHandlers` 는 항상 맨 끝.
 */
import { authHandlers } from './auth';
import { masterHandlers } from './master';
import { homeHandlers } from './home';
import { txHandlers } from './tx';
import { faultHandlers } from './fault';
import { outsrcHandlers } from './outsrc';
import { cornerHandlers } from './corner';
import { cashHandlers } from './cash';
import { journalHandlers } from './journal';
import { statHandlers } from './stat';
import { boardHandlers } from './board';
import { authGrantHandlers } from './authGrant';
import { remoteHandlers } from './remote';
import { txExtHandlers } from './txExt';
import { closingExtHandlers } from './closingExt';
import { mgmtExtHandlers } from './mgmtExt';
import { journalExtHandlers } from './journalExt';
import { statExtHandlers } from './statExt';
import { outsrcCashHandlers } from './outsrcCash';
import { outsrcSlaHandlers } from './outsrcSla';
import { outsrcMasterHandlers } from './outsrcMaster';
import { systemExtHandlers } from './systemExt';
import { outsrcFaultHandlers } from './outsrcFault';
import { outsrcReplenishHandlers } from './outsrcReplenish';
import { outsrcSlaViewHandlers } from './outsrcSlaView';
import { outsrcSlaQualHandlers } from './outsrcSlaQual';
import { statOutsrcHandlers } from './statOutsrc';
import { outsrcPopupsHandlers } from './outsrcPopups';
import { actionLogHandlers } from './actionLog';
import { txJournalHandlers } from './txJournal';
import { sysAdminHandlers } from './sysAdmin';
import { mgmtSettingHandlers } from './mgmtSetting';
import { mgmtOpsHandlers } from './mgmtOps';
import { mgmtInfoHandlers } from './mgmtInfo';
import { journalOpsHandlers } from './journalOps';
import { journalStatHandlers } from './journalStat';
import { statOpsHandlers } from './statOps';
import { sysToolHandlers } from './sysTool';
import { fallbackHandlers } from './fallback';

export const handlers = [
  ...authHandlers,
  ...masterHandlers,
  ...homeHandlers,
  ...txHandlers,
  ...faultHandlers,
  ...outsrcHandlers,
  ...cornerHandlers,
  ...cashHandlers,
  ...journalHandlers,
  ...statHandlers,
  ...boardHandlers,
  ...authGrantHandlers,
  ...remoteHandlers,
  // 2026-10-23 추가 화면 묶음
  ...txExtHandlers,
  ...closingExtHandlers,
  ...mgmtExtHandlers,
  ...journalExtHandlers,
  ...statExtHandlers,
  ...outsrcCashHandlers,
  ...outsrcSlaHandlers,
  ...outsrcMasterHandlers,
  ...systemExtHandlers,
  // 2026-10-23 일괄용역 잔여 묶음
  ...outsrcFaultHandlers,
  ...outsrcReplenishHandlers,
  ...outsrcSlaViewHandlers,
  ...outsrcSlaQualHandlers,
  ...statOutsrcHandlers,
  ...outsrcPopupsHandlers,
  ...actionLogHandlers,
  ...txJournalHandlers,
  ...sysAdminHandlers,
  ...mgmtSettingHandlers,
  ...mgmtOpsHandlers,
  ...mgmtInfoHandlers,
  ...journalOpsHandlers,
  ...journalStatHandlers,
  ...statOpsHandlers,
  ...sysToolHandlers,
  ...fallbackHandlers,
];
