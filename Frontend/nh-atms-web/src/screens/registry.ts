import { lazy } from 'react';
import type { L1Slug, ScreenDef } from '@/types/screen';
import { HOME_SCREEN_KEY, SCREEN_IDS, type ScreenKey } from './screenIds';
import { L1_BY_SLUG, isL1Slug } from './l1';
import { isScreenKey } from './screenIds';

/**
 * 화면 레지스트리 — 영문 화면키 → 컴포넌트/제목/대분류. 등록하면 라우트·탭·브레드크럼이 자동 연결된다(B7-FE-05).
 * 파일명 규칙: {PascalName}Page.tsx (1 화면키 = 1 파일, 번호 없음), 동형 쌍은 래퍼 파일.
 * 화면번호는 `screenIds.ts` 매핑에서만 읽는다(표시용). 라우트는 /{slug}/{kebab-case 이름}.
 */
const kebab = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** 화면키 → 라우트 경로. 홈은 /home */
export const screenPath = (key: ScreenKey, slug?: L1Slug): string => {
  if (key === HOME_SCREEN_KEY) return '/home';
  const [s, name] = key.split('.') as [string, string];
  return `/${slug ?? s}/${kebab(name)}`;
};

const def = (key: ScreenKey, title: string, slug: L1Slug, group: string, loader: () => Promise<{ default: ScreenDef['component'] extends React.LazyExoticComponent<infer C> ? C : never }>, extra?: Partial<ScreenDef>): ScreenDef => ({
  key,
  screenId: SCREEN_IDS[key],
  path: screenPath(key, slug),
  title,
  slug,
  group,
  openMode: key === HOME_SCREEN_KEY ? 'HOME' : 'TAB',
  component: lazy(loader),
  status: 'done',
  ...extra,
});

export const SCREENS: Record<string, ScreenDef> = Object.fromEntries(
  [
    def(HOME_SCREEN_KEY, '대시보드', 'home', '', () => import('./home/HomePage')),
    def('tx.specificTx', '특정(건별) 거래 조회', 'tx', '거래확인', () => import('./tx/SpecificTxPage')),
    def('tx.txJournal', '거래저널조회', 'tx', '거래확인', () => import('./tx/TxJournalPage')),
    def('tx.allTx', '전체거래 조회', 'tx', '거래확인', () => import('./tx/AllTxPage'), { adminOnly: true }),
    def('closing.openCloseReg', '개국/합계 등록', 'closing', '개국/합계', () => import('./closing/OpenCloseRegPage')),
    def('closing.faultSlip', '장애명세표 조회', 'closing', '마감절차', () => import('./closing/FaultSlipPage')),
    def('mgmt.cornerMgmt', '자동화기기 설치코너 관리', 'mgmt', '영업점 등록사항', () => import('./mgmt/CornerMgmtPage')),
    def('mgmt.faultStatus', '장애 현황', 'mgmt', '장애', () => import('./mgmt/FaultStatusPage')),
    def('mgmt.faultHistory', '장애내역 조회', 'mgmt', '장애', () => import('./mgmt/FaultHistoryPage')),
    def('mgmt.cashStatus', '자동화기기 시재현황', 'mgmt', '현황조회', () => import('./mgmt/CashStatusPage')),
    def('journal.journalList', '저널조회', 'journal', '저널', () => import('./journal/JournalListPage')),
    def('stat.nationwideOps', '자동화기기 전국운영현황', 'stat', '관리자메뉴', () => import('./stat/NationwideOpsPage'), { adminOnly: true }),
    def('stat.uptime', '자동화기기 가동률', 'stat', '운영', () => import('./stat/UptimePage')),
    def('outsrc.atmStatus', '기기상태 조회', 'outsrc', '장애', () => import('./outsrc/AtmStatusPage')),
    def('outsrc.dispatchStatus', '업체 출동 현황조회', 'outsrc', '장애', () => import('./outsrc/DispatchStatusPage')),
    def('outsrc.cornerMgmtOutsrc', '자동화기기 설치코너 관리', 'outsrc', '기타', () => import('./outsrc/CornerMgmtOutsrcPage')),
    def('board.notice', '공지사항', 'board', '게시정보', () => import('./board/NoticePage')),
    def('board.bizContact', '업무연락', 'board', '게시정보', () => import('./board/BizContactPage')),
    def('system.authGrant', '시스템 사용권한부여', 'system', '권한/코드', () => import('./system/AuthGrantPage'), { adminOnly: true }),
    def('system.codeMgmt', '자동화기기 코드관리', 'system', '권한/코드', () => import('./system/CodeMgmtPage'), { adminOnly: true }),
    def('tx.depositWithdrawTx', '입금/출금 거래', 'tx', '거래확인', () => import('./tx/DepositWithdrawTxPage')),
    def('tx.destroyedTx', '거래내역 2차 파기 조회', 'tx', '거래확인', () => import('./tx/DestroyedTxPage')),
    def('tx.accessLog', '1차파기대상 조회 내역', 'tx', '거래확인', () => import('./tx/AccessLogPage')),
    def('tx.overCashRefund', '출납과잉금 예상거래 / 자금반환등록', 'tx', '필수출력자료', () => import('./tx/OverCashRefundPage')),
    def('closing.closingSummary', '집계내역/합계상태 조회', 'closing', '개국/합계', () => import('./closing/ClosingSummaryPage')),
    def('closing.closingApproval', '마감장표 전자결재(ATM)', 'closing', '마감절차', () => import('./closing/ClosingApprovalPage')),
    def('mgmt.atmAsset', '자동화기기 자산현황', 'mgmt', '현황조회', () => import('./mgmt/AtmAssetPage')),
    def('mgmt.cashVerify', '자동화기기 시재확인', 'mgmt', '현황조회', () => import('./mgmt/CashVerifyPage')),
    def('mgmt.fxCashStatus', '외국통화 시재현황', 'mgmt', '현황조회', () => import('./mgmt/FxCashStatusPage')),
    def('mgmt.fxCashVerify', '외화ATM 시재요청 및 확인', 'mgmt', '현황조회', () => import('./mgmt/FxCashVerifyPage')),
    def('journal.journalAgentStart', '저널업무 개시현황', 'journal', '관리자메뉴', () => import('./journal/JournalAgentStartPage'), { adminOnly: true }),
    def('journal.journalImageAuth', '저널이미지 권한 관리', 'journal', '저널', () => import('./journal/JournalImageAuthPage')),
    def('journal.journalImageViewLog', '저널이미지 열람 기록 관리', 'journal', '저널', () => import('./journal/JournalImageViewLogPage')),
    def('journal.journalOpsEnv', '운영환경 설정(A)', 'journal', '관리자메뉴', () => import('./journal/JournalOpsEnvPage'), { adminOnly: true }),
    def('stat.txVolumeStat', '거래량/수수료 통계', 'stat', '거래', () => import('./stat/TxVolumeStatPage')),
    def('outsrc.cashPosition', '시재조회', 'outsrc', '시재', () => import('./outsrc/CashPositionPage')),
    def('outsrc.serviceClosing', '마감내역 조회', 'outsrc', '시재', () => import('./outsrc/ServiceClosingPage')),
    def('outsrc.cashUnprocessed', '미처리내역 조회', 'outsrc', '시재', () => import('./outsrc/CashUnprocessedPage')),
    def('outsrc.closingRecon', '용역마감대사', 'outsrc', '시재', () => import('./outsrc/ClosingReconPage')),
    def('outsrc.fundRecon', '운영자금대사', 'outsrc', '시재', () => import('./outsrc/FundReconPage')),
    def('outsrc.uptimeHist', '기기별가동율이력조회', 'outsrc', 'SLA보고서', () => import('./outsrc/UptimeHistPage')),
    def('outsrc.faultHist', '기기별장애이력조회', 'outsrc', 'SLA보고서', () => import('./outsrc/FaultHistPage')),
    def('outsrc.evalItemMgmt', '평가기준관리', 'outsrc', 'SLA보고서', () => import('./outsrc/EvalItemMgmtPage')),
    def('outsrc.pniGradeMgmt', 'P&I등급관리', 'outsrc', 'SLA보고서', () => import('./outsrc/PniGradeMgmtPage')),
    def('outsrc.downtimeReason', '미가동사유관리', 'outsrc', 'SLA보고서', () => import('./outsrc/DowntimeReasonPage')),
    def('outsrc.feeStdMgmt', '용역료기준관리', 'outsrc', 'SLA보고서', () => import('./outsrc/FeeStdMgmtPage')),
    def('outsrc.feeCalc', '용역료 산정', 'outsrc', 'SLA보고서', () => import('./outsrc/FeeCalcPage')),
    def('outsrc.outsrcStaff', '용역업체직원조회', 'outsrc', '기타', () => import('./outsrc/OutsrcStaffPage')),
    def('outsrc.outsrcCompany', '용역업체등록관리', 'outsrc', '기타', () => import('./outsrc/OutsrcCompanyPage')),
    def('system.aritamsCode', 'AriTAMS 코드관리', 'system', '권한/코드', () => import('./system/AritamsCodePage'), { adminOnly: true }),
    def('system.errorMessage', '에러메세지 관리', 'system', '권한/코드', () => import('./system/ErrorMessagePage'), { adminOnly: true }),
    def('system.remoteDispatch', '기기원격지시(매체배포)', 'system', '운영', () => import('./system/RemoteDispatchPage'), { adminOnly: true }),
    def('system.vendorCode', '자동화기기 업체 코드관리', 'system', '권한/코드', () => import('./system/VendorCodePage'), { adminOnly: true }),
    def('system.uiStandard', '자동기화면 표준-1', 'system', '표준', () => import('./system/UiStandardPage'), { adminOnly: true }),
    def('system.userActionLog', '사용자 행위이력', 'system', '운영', () => import('./system/UserActionLogPage'), { adminOnly: true }),
    def('system.menuMgmt', '메뉴관리', 'system', '권한/코드', () => import('./system/MenuMgmtPage'), { adminOnly: true }),
    def('system.userGroupMgmt', '사용자그룹관리', 'system', '권한/코드', () => import('./system/UserGroupMgmtPage'), { adminOnly: true }),
    def('system.userMgmt', '사용자관리', 'system', '권한/코드', () => import('./system/UserMgmtPage'), { adminOnly: true }),
    def('stat.outsrcAtmStat', '일괄용역기기 정보 및 통계', 'stat', '거래', () => import('./stat/OutsrcAtmStatPage')),
    def('outsrc.atmStatusHist', '기기상태이력 조회', 'outsrc', '장애', () => import('./outsrc/AtmStatusHistPage')),
    def('outsrc.openTxStatus', '개국및거래현황 조회', 'outsrc', '장애', () => import('./outsrc/OpenTxStatusPage')),
    def('outsrc.secondDispatch', '2차출동 현황', 'outsrc', '장애', () => import('./outsrc/SecondDispatchPage')),
    def('outsrc.replenishPlan', '정규현송계획내역 조회', 'outsrc', '시재', () => import('./outsrc/ReplenishPlanPage')),
    def('outsrc.replenishExtra', '추가현송내역 조회', 'outsrc', '시재', () => import('./outsrc/ReplenishExtraPage')),
    def('outsrc.vendorSlaGrade', '용역업체SLA등급조회', 'outsrc', 'SLA보고서', () => import('./outsrc/VendorSlaGradePage')),
    def('outsrc.vendorSlaGradeHist', '용역업체SLA등급 이력조회', 'outsrc', 'SLA보고서', () => import('./outsrc/VendorSlaGradeHistPage')),
    def('outsrc.cornerSlaScore', '코너별SLA평가점수조회', 'outsrc', 'SLA보고서', () => import('./outsrc/CornerSlaScorePage')),
    def('outsrc.cornerEnvEval', '용역업체별코너환경평가관리', 'outsrc', 'SLA보고서', () => import('./outsrc/CornerEnvEvalPage')),
    def('outsrc.csEval', '용역업체별C/S평가관리', 'outsrc', 'SLA보고서', () => import('./outsrc/CsEvalPage')),
    def('outsrc.csHist', '용역업체별C/S이력관리', 'outsrc', 'SLA보고서', () => import('./outsrc/CsHistPage')),
    def('outsrc.downtimeHist', '미가동이력조회', 'outsrc', 'SLA보고서', () => import('./outsrc/DowntimeHistPage')),
    def('outsrc.msgLog', '업체간 전문 송수신 이력', 'outsrc', '기타', () => import('./outsrc/MsgLogPage')),
    def('outsrc.itCostBilling', '전산비용 청구액 산정', 'outsrc', '기타', () => import('./outsrc/ItCostBillingPage')),
    def('mgmt.closeReservation', '자동화기기 합계/폐국 예약', 'mgmt', '영업점 등록사항', () => import('./mgmt/CloseReservationPage')),
    def('mgmt.alarmSetting', '알림설정', 'mgmt', '영업점 등록사항', () => import('./mgmt/AlarmSettingPage')),
    def('mgmt.highDenomSetting', '자동화기기 고액권 사용유무관리', 'mgmt', '영업점 등록사항', () => import('./mgmt/HighDenomSettingPage')),
    def('mgmt.checkSetting', '수표설정', 'mgmt', '영업점 등록사항', () => import('./mgmt/CheckSettingPage')),
    def('mgmt.callcenterFault', '콜센터 장애조치 현황', 'mgmt', '장애', () => import('./mgmt/CallcenterFaultPage')),
    def('mgmt.faultNotifyStatus', '장애통보 현황', 'mgmt', '장애', () => import('./mgmt/FaultNotifyStatusPage')),
    def('mgmt.fundOperation', '자동화기기 자금운영', 'mgmt', '현황조회', () => import('./mgmt/FundOperationPage')),
    def('mgmt.fxAtmCashStatus', '외화ATM 시재현황', 'mgmt', '현황조회', () => import('./mgmt/FxAtmCashStatusPage')),
    def('mgmt.atmLocation', '자동화기기 위치조회', 'mgmt', '현황조회', () => import('./mgmt/AtmLocationPage')),
    def('mgmt.globalAtmLocation', '글로벌ATM/바이오인증 위치조회', 'mgmt', '현황조회', () => import('./mgmt/GlobalAtmLocationPage')),
    def('mgmt.regionContact', '지역본부 담당자 안내', 'mgmt', '현황조회', () => import('./mgmt/RegionContactPage')),
    def('mgmt.stmMedia', 'STM 매체현황 조회', 'mgmt', '현황조회', () => import('./mgmt/StmMediaPage')),
    def('mgmt.globalAtmStatus', '글로벌ATM 현황', 'mgmt', '현황조회', () => import('./mgmt/GlobalAtmStatusPage')),
    def('journal.destroyedJournal', '저널 2차 파기 조회', 'journal', '저널', () => import('./journal/DestroyedJournalPage')),
    def('journal.bizStart', '업무개시현황', 'journal', '관리자메뉴', () => import('./journal/BizStartPage')),
    def('journal.missingNoRequest', '결번요청(A)', 'journal', '관리자메뉴', () => import('./journal/MissingNoRequestPage'), { adminOnly: true }),
    def('journal.opsLogRequest', '운영로그 요청(A)', 'journal', '관리자메뉴', () => import('./journal/OpsLogRequestPage'), { adminOnly: true }),
    def('journal.processTypeStat', '저널처리 유형별 집계(A)', 'journal', '관리자메뉴', () => import('./journal/ProcessTypeStatPage'), { adminOnly: true }),
    def('journal.opsStatus', '저널 운영현황(A)', 'journal', '관리자메뉴', () => import('./journal/JournalOpsStatusPage'), { adminOnly: true }),
    def('journal.dailyMonthlyCount', '저널처리 일/월별 건수(A)', 'journal', '관리자메뉴', () => import('./journal/DailyMonthlyCountPage'), { adminOnly: true }),
    def('journal.missingNoCount', '결번 건수(A)', 'journal', '관리자메뉴', () => import('./journal/MissingNoCountPage'), { adminOnly: true }),
    def('journal.opModeRate', '운영모드 운영률(A)', 'journal', '관리자메뉴', () => import('./journal/OpModeRatePage'), { adminOnly: true }),
    def('stat.txByHour', '자동화기기 통계 - 시간별', 'stat', '거래', () => import('./stat/TxByHourPage')),
    def('stat.txByAmount', '거래금액별 통계', 'stat', '관리자메뉴', () => import('./stat/TxByAmountPage'), { adminOnly: true }),
    def('stat.uptimeLow', '자동화기기 가동률 저하점', 'stat', '관리자메뉴', () => import('./stat/UptimeLowPage'), { adminOnly: true }),
    def('stat.holidayUptime', '자동화기기 휴일 가동률', 'stat', '운영', () => import('./stat/HolidayUptimePage')),
    def('stat.cashUsage', '현금사용량 집계', 'stat', '운영', () => import('./stat/CashUsagePage')),
    def('stat.c365Callcenter', '365기기 현황(콜센터용)', 'stat', '운영', () => import('./stat/C365CallcenterPage')),
    def('tx.errorCodeLookup', '명세표 에러사유 조회', 'tx', '에러코드', () => import('./tx/ErrorCodeLookupPage')),
    def('system.authGrantLegacy', '시스템 사용권한부여(구버전)', 'system', '권한/코드', () => import('./system/AuthGrantLegacyPage'), { adminOnly: true }),
    def('system.atmVersionList', '자동화기기 버전리스트', 'system', '운영', () => import('./system/AtmVersionListPage'), { adminOnly: true }),
  ].map((d) => [d.key, d]),
);

const BY_PATH: Record<string, ScreenDef> = Object.fromEntries(Object.values(SCREENS).map((d) => [d.path, d]));

export const getScreen = (key?: string | null): ScreenDef | undefined => (key ? SCREENS[key] : undefined);

/** 경로 → {slug, screenKey}. /home 과 /{slug}/{kebab} 만 인정 */
export const parseScreenPath = (pathname: string): { slug: L1Slug; screenKey: ScreenKey } | null => {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/home') return { slug: 'home', screenKey: HOME_SCREEN_KEY };
  const m = /^\/([a-z]+)\/([a-z0-9-]+)$/.exec(p);
  if (!m || !isL1Slug(m[1])) return null;
  const def = BY_PATH[p];
  if (def) return { slug: m[1], screenKey: def.key };
  // 레지스트리에 없는(아직 미구현) 화면도 메뉴 시드 키로 열 수 있게: kebab → 키 복원
  const camel = m[2].replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
  const key = `${m[1]}.${camel}`;
  return isScreenKey(key) ? { slug: m[1], screenKey: key } : null;
};

export const l1Label = (slug: L1Slug): string => L1_BY_SLUG[slug]?.label ?? slug;
