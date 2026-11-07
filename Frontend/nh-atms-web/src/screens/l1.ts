import type { L1Def, L1Slug } from '@/types/screen';

export interface L1DefEx extends L1Def {
  /** 아이콘 줄용 짧은 라벨 */
  railLabel: string;
  /** 상단 메뉴·아이콘 줄에 칸을 두지 않는다 (라우트·메뉴 트리·화면 검색에는 남는다) */
  hidden?: boolean;
  /** 이 대분류 화면을 열었을 때 활성으로 표시할 대분류 (사이드바·상단 메뉴 강조 기준) */
  navAs?: L1Slug;
}

/**
 * 대분류(1뎁스) 정의 — AS-IS 서브탭 8 + 홈. 상단 메뉴(시안 B)와 아이콘 줄(시안 A)이 공유.
 * 게시판은 시안 B 처럼 상단 메뉴에 칸을 두지 않는다(결정 2026-10-18). 공지사항·업무연락은
 * 대시보드 게시판 카드와 대시보드 사이드바의 '게시판' 묶음으로 들어가고, 열면 '대시보드' 소속으로 보인다.
 */
export const L1_DEFS: L1DefEx[] = [
  { slug: 'home', name: '홈', label: '대시보드', railLabel: '대시보드', icon: 'DashboardOutlined' },
  { slug: 'tx', name: '거래내역', label: '거래 내역', railLabel: '거래', icon: 'SwapOutlined' },
  { slug: 'closing', name: '마감처리', label: '마감 처리', railLabel: '마감처리', icon: 'FileDoneOutlined' },
  { slug: 'mgmt', name: '종합관리', label: '종합 관리', railLabel: '종합관리', icon: 'AppstoreOutlined' },
  { slug: 'journal', name: '저널관리', label: '저널 관리', railLabel: '저널관리', icon: 'FileTextOutlined' },
  { slug: 'stat', name: '통계', label: '통계', railLabel: '통계', icon: 'BarChartOutlined' },
  { slug: 'outsrc', name: '일괄용역', label: '일괄 용역', railLabel: '일괄용역', icon: 'ToolOutlined' },
  { slug: 'board', name: '게시판', label: '게시판', railLabel: '게시판', icon: 'NotificationOutlined', hidden: true, navAs: 'home' },
  { slug: 'system', name: '관리자기능(A)', label: '관리자기능', railLabel: '관리자', icon: 'SettingOutlined', adminOnly: true },
];

export const L1_BY_SLUG: Record<L1Slug, L1DefEx> = Object.fromEntries(L1_DEFS.map((d) => [d.slug, d])) as Record<L1Slug, L1DefEx>;
export const L1_BY_NAME: Record<string, L1DefEx> = Object.fromEntries(L1_DEFS.map((d) => [d.name, d]));
export const isL1Slug = (v: string): v is L1Slug => v in L1_BY_SLUG;
/** 화면이 속한 대분류 → 상단 메뉴·사이드바에서 활성으로 표시할 대분류 */
export const navSlugOf = (slug: L1Slug): L1Slug => L1_BY_SLUG[slug]?.navAs ?? slug;
/** 상단 메뉴·아이콘 줄에 보이는 대분류 */
export const visibleL1Defs = (isAdmin: boolean): L1DefEx[] => L1_DEFS.filter((d) => !d.hidden && (!d.adminOnly || isAdmin));
