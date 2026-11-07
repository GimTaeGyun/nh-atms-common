import type { MenuTreeNode } from '@/types/menu';
import { HOME_SCREEN_KEY, SCREEN_IDS, type ScreenKey } from './screenIds';
import { screenPath } from './registry';

/**
 * AS-IS 메뉴 트리(04_ASIS메뉴트리_및_메뉴시드.csv) 중 노출 화면을 3레벨로 시드. **리프는 영문 화면키**, 화면번호는 screenIds.ts 에서 파생.
 * 실제 운영은 DB(T_MENU) → /api/menu/my 가 동일 구조를 반환해야 한다(screenKey 또는 screenId 필수 — screenId 만 오면 resolveMenus 가 키로 바꾼다).
 * 쓰는 곳: 목 서버 `/api/menu/my` 응답, 그리고 실서버 응답에 screenId 가 없을 때의 대체 메뉴(useNavStore `resolveMenus`).
 */
type Leaf = [screenKey: ScreenKey, name: string, admin?: boolean];
interface Folder { name: string; leaves: Leaf[] }
interface Top { name: string; icon: string; admin?: boolean; folders: Folder[] }

const slugOf: Record<string, string> = { 거래내역: 'tx', 마감처리: 'closing', 종합관리: 'mgmt', 저널관리: 'journal', 통계: 'stat', 일괄용역: 'outsrc', 게시판: 'board', '관리자기능(A)': 'system' };

const TREE: Top[] = [
  { name: '거래내역', icon: 'SwapOutlined', folders: [
    { name: '거래확인', leaves: [['tx.specificTx', '특정(건별) 거래 조회'], ['tx.depositWithdrawTx', '입금/출금 거래'], ['tx.destroyedTx', '거래내역 2차 파기 조회'], ['tx.accessLog', '1차파기대상 조회 내역'], ['tx.allTx', '전체거래 조회'], ['tx.txJournal', '거래저널조회', true]] },
    { name: '필수출력자료', leaves: [['tx.overCashRefund', '출납과잉금 예상거래']] },
    { name: '에러코드', leaves: [['tx.errorCodeLookup', '에러코드조회']] },
  ] },
  { name: '마감처리', icon: 'FileDoneOutlined', folders: [
    { name: '개국/합계', leaves: [['closing.openCloseReg', '개국/합계 등록'], ['closing.closingSummary', '집계내역 및 합계상태 조회']] },
    { name: '마감절차', leaves: [['closing.closingApproval', '마감장표 전자결재(ATM)'], ['closing.faultSlip', '장애명세표 조회']] },
  ] },
  { name: '종합관리', icon: 'AppstoreOutlined', folders: [
    { name: '영업점 등록사항', leaves: [['mgmt.cornerMgmt', '자동화기기 설치코너 관리'], ['mgmt.closeReservation', '자동화기기 합계/폐국예약'], ['mgmt.alarmSetting', '장애알림 기능설정'], ['mgmt.highDenomSetting', '자동화기기 고액권 사용유무관리'], ['mgmt.checkSetting', '수표설정']] },
    { name: '장애', leaves: [['mgmt.faultStatus', '장애 현황'], ['mgmt.faultHistory', '장애내역 조회'], ['mgmt.callcenterFault', '콜센터 장애조치 현황'], ['mgmt.faultNotifyStatus', '장애통보 현황']] },
    { name: '현황조회', leaves: [['mgmt.cashStatus', '자동화기기 시재현황'], ['mgmt.fundOperation', '자동화기기 자금운영'], ['mgmt.atmAsset', '자동화기기 자산현황'], ['mgmt.cashVerify', '자동화기기 시재확인'], ['mgmt.atmLocation', '자동화기기 위치조회'], ['mgmt.globalAtmLocation', '글로벌ATM/바이오인증 위치조회'], ['mgmt.regionContact', '지역본부 담당자 조회'], ['mgmt.stmMedia', 'STM 매체현황 조회'], ['mgmt.fxCashStatus', '외국통화 시재현황'], ['mgmt.fxCashVerify', '외화ATM 시재요청 및 확인'], ['mgmt.globalAtmStatus', '글로벌ATM 현황'], ['mgmt.fxAtmCashStatus', '외화ATM 시재현황']] },
  ] },
  { name: '저널관리', icon: 'FileTextOutlined', folders: [
    { name: '저널', leaves: [['journal.journalList', '저널조회'], ['journal.journalImageAuth', '저널이미지 권한 관리'], ['journal.journalImageViewLog', '저널이미지 열람기록관리'], ['journal.destroyedJournal', '저널 2차 파기 조회']] },
    { name: '관리자메뉴', leaves: [['journal.journalAgentStart', '저널업무 개시현황', true], ['journal.bizStart', '업무개시현황'], ['journal.journalOpsEnv', '운영환경 설정', true], ['journal.missingNoRequest', '결번요청', true], ['journal.opsLogRequest', '운영로그 요청', true], ['journal.processTypeStat', '저널처리유형별 집계', true], ['journal.opsStatus', '저널 운영현황', true], ['journal.dailyMonthlyCount', '저널처리 일/월별 건수', true], ['journal.missingNoCount', '결번 건수', true], ['journal.opModeRate', '운영모드 운영률', true]] },
  ] },
  { name: '통계', icon: 'BarChartOutlined', folders: [
    { name: '거래', leaves: [['stat.txVolumeStat', '거래량/수수료 통계'], ['stat.txByHour', '거래시간별 통계'], ['stat.outsrcAtmStat', '일괄용역기기 통계']] },
    { name: '운영', leaves: [['stat.uptime', '가동률'], ['stat.holidayUptime', '휴일 가동률'], ['stat.cashUsage', '현금사용량 집계'], ['stat.c365Callcenter', '365기기 현황(콜센터용)']] },
    { name: '관리자메뉴', leaves: [['stat.nationwideOps', '자동화기기 전국운영현황', true], ['stat.txByAmount', '거래금액별 통계', true], ['stat.uptimeLow', '가동률 저하점', true]] },
  ] },
  { name: '일괄용역', icon: 'ToolOutlined', folders: [
    { name: '장애', leaves: [['outsrc.atmStatus', '기기상태조회'], ['outsrc.atmStatusHist', '기기상태이력조회'], ['outsrc.dispatchStatus', '업체출동현황조회'], ['outsrc.openTxStatus', '개국및거래현황조회'], ['outsrc.secondDispatch', '2차출동현황조회']] },
    { name: '시재', leaves: [['outsrc.cashPosition', '시재조회'], ['outsrc.serviceClosing', '마감내역조회'], ['outsrc.cashUnprocessed', '미처리내역조회'], ['outsrc.closingRecon', '용역마감대사'], ['outsrc.fundRecon', '운영자금대사'], ['outsrc.replenishPlan', '정규현송계획내역조회'], ['outsrc.replenishExtra', '추가현송내역조회'], ['popup.refundDetail', '반환금액상세조회']] },
    { name: 'SLA보고서', leaves: [['outsrc.vendorSlaGrade', '용역업체SLA등급조회'], ['outsrc.vendorSlaGradeHist', '용역업체SLA등급이력'], ['outsrc.cornerSlaScore', '코너별SLA평가점수조회'], ['outsrc.uptimeHist', '기기별가동률이력조회'], ['outsrc.faultHist', '기기별장애이력조회'], ['outsrc.cornerEnvEval', '용역업체별코너환경평가관리'], ['outsrc.csEval', '용역업체별C/S평가관리'], ['outsrc.csHist', '용역업체별C/S이력관리'], ['outsrc.evalItemMgmt', '평가기준관리'], ['outsrc.pniGradeMgmt', 'P&I등급관리'], ['outsrc.downtimeReason', '미가동사유관리'], ['outsrc.feeStdMgmt', '용역료기준관리'], ['outsrc.feeCalc', '용역료산정'], ['outsrc.downtimeHist', '미가동이력조회']] },
    { name: '기타', leaves: [['outsrc.outsrcStaff', '용역업체직원조회'], ['outsrc.msgLog', '업체간전문송수신이력'], ['outsrc.cornerMgmtOutsrc', '자동화기기설치코너관리'], ['outsrc.outsrcCompany', '용역업체등록관리'], ['outsrc.itCostBilling', '전산비용 청구액 산정']] },
  ] },
  { name: '게시판', icon: 'NotificationOutlined', folders: [
    { name: '게시정보', leaves: [['board.notice', '공지사항'], ['board.bizContact', '업무연락']] },
  ] },
  { name: '관리자기능(A)', icon: 'SettingOutlined', admin: true, folders: [
    { name: '권한/코드', leaves: [['system.authGrant', '시스템 사용권한부여', true], ['system.authGrantLegacy', '시스템 사용권한부여(구버전)', true], ['system.codeMgmt', '자동화기기 코드관리', true], ['system.aritamsCode', 'AriTAMS 코드관리', true], ['system.errorMessage', '에러메세지 관리', true], ['system.vendorCode', '자동화기기 업체 코드관리', true], ['system.menuMgmt', '메뉴관리', true], ['system.userGroupMgmt', '사용자그룹관리', true], ['system.userMgmt', '사용자관리', true]] },
    { name: '표준', leaves: [['system.uiStandard', '자동기화면 표준-1', true]] },
    { name: '운영', leaves: [['system.remoteDispatch', '기기원격지시(매체배포)', true], ['system.atmVersionList', '자동화기기 버전리스트', true], ['system.userActionLog', '사용자 행위이력', true]] },
  ] },
];

export const buildMenuSeed = (): MenuTreeNode[] => {
  let no = 100;
  const out: MenuTreeNode[] = [
    { menuNo: 1, menuName: '대시보드', screenKey: HOME_SCREEN_KEY, screenId: SCREEN_IDS[HOME_SCREEN_KEY], menuUrl: '/home', menuLevel: 1, menuOrder: 0, menuType: 'H', menuIcon: 'DashboardOutlined', visibleYn: 'N', adminYn: 'N', readYn: 'Y', writeYn: 'N' },
  ];
  TREE.forEach((top, ti) => {
    const topNo = ++no;
    const slug = slugOf[top.name];
    const node: MenuTreeNode = { menuNo: topNo, menuName: top.name, menuLevel: 1, menuOrder: ti + 1, menuType: 'D', menuIcon: top.icon, adminYn: top.admin ? 'Y' : 'N', visibleYn: 'Y', children: [] };
    top.folders.forEach((folder, fi) => {
      const folderNo = ++no;
      const fnode: MenuTreeNode = { menuNo: folderNo, parentNo: topNo, menuName: folder.name, menuLevel: 2, menuOrder: fi + 1, menuType: 'D', adminYn: 'N', visibleYn: 'Y', children: [] };
      folder.leaves.forEach(([screenKey, name, admin], li) => {
        fnode.children!.push({ menuNo: ++no, parentNo: folderNo, menuName: name, screenKey, screenId: SCREEN_IDS[screenKey], menuUrl: screenPath(screenKey, slug as never), menuLevel: 3, menuOrder: li + 1, menuType: 'M', adminYn: admin ? 'Y' : 'N', visibleYn: 'Y', readYn: 'Y', writeYn: admin ? 'Y' : 'N' });
      });
      node.children!.push(fnode);
    });
    out.push(node);
  });
  return out;
};
