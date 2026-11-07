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
 * 대분류(1뎁스) 정의 — 상단 메뉴와 아이콘 줄이 공유한다.
 * `name` 은 메뉴 테이블(TB_SCR_MENU) 최상위 그룹의 MENU_NM 과 같아야 사이드바가 그 그룹을 찾는다.
 * 이 저장소는 업무 대분류 없이 홈 + 견본 1개(설계 §6.6). 팝업(popup)은 메뉴에 칸이 없다.
 * 새 업무 대분류를 추가하면: 여기 한 줄 + types/screen.ts L1Slug + 메뉴 테이블 그룹.
 */
export const L1_DEFS: L1DefEx[] = [
  { slug: 'home', name: '홈', label: '홈', railLabel: '홈', icon: 'HomeOutlined' },
  { slug: 'sample', name: '견본', label: '견본', railLabel: '견본', icon: 'AppstoreOutlined' },
  { slug: 'popup', name: '팝업', label: '팝업', railLabel: '팝업', icon: 'AppstoreOutlined', hidden: true, navAs: 'home' },
];

export const L1_BY_SLUG: Record<L1Slug, L1DefEx> = Object.fromEntries(L1_DEFS.map((d) => [d.slug, d])) as Record<L1Slug, L1DefEx>;
export const L1_BY_NAME: Record<string, L1DefEx> = Object.fromEntries(L1_DEFS.map((d) => [d.name, d]));
export const isL1Slug = (v: string): v is L1Slug => v in L1_BY_SLUG;
/** 화면이 속한 대분류 → 상단 메뉴·사이드바에서 활성으로 표시할 대분류 */
export const navSlugOf = (slug: L1Slug): L1Slug => L1_BY_SLUG[slug]?.navAs ?? slug;
/** 상단 메뉴·아이콘 줄에 보이는 대분류 */
export const visibleL1Defs = (isAdmin: boolean): L1DefEx[] => L1_DEFS.filter((d) => !d.hidden && (!d.adminOnly || isAdmin));
