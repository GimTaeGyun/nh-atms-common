import type { ScreenKey } from '@/screens/screenIds';

/** 'Y' | 'N' 플래그 */
export type Yn = 'Y' | 'N';

/**
 * 백엔드 `GET /api/menu/my` 응답 노드 — API 계약 §1 `MenuNode` 와 글자 하나까지 같다.
 * 테이블 TB_SCR_MENU(+ TB_SCR_AUTH_MENU 권한 5개). 필드 = 정본 컬럼 camelCase.
 */
export interface MenuNode {
  menuId: string;
  parentMenuId: string;
  menuNm: string;
  /** G 그룹, M 화면 */
  menuType: 'G' | 'M';
  /** 화면 경로 '/sample/notice' — 프론트가 parseScreenPath 로 화면키를 찾는다(잠정 Q-05) */
  menuPath: string | null;
  sortNo: number;
  useYn: Yn;
  /** 조회 */
  qryRolYn: Yn;
  /** 등록 */
  regRolYn: Yn;
  /** 수정 */
  updRolYn: Yn;
  /** 삭제 */
  delRolYn: Yn;
  /** 업무실행 */
  exeRolYn: Yn;
  children: MenuNode[];
}

/**
 * 프론트 안에서 쓰는 메뉴 노드 — 계약 `MenuNode` 에 프론트가 붙이는 값만 더한다.
 *  - screenKey: menuPath → 화면키(레지스트리 parseScreenPath). 그룹·모르는 경로는 없음
 *  - level: 깊이(1 = 대분류)
 */
export interface MenuTreeNode extends Omit<MenuNode, 'children'> {
  screenKey?: ScreenKey;
  level: number;
  children: MenuTreeNode[];
}

/** 열린 화면 탭 */
export interface OpenTab {
  /** 탭 키 = 화면키 (동일 화면 1인스턴스) */
  key: ScreenKey;
  screenKey: ScreenKey;
  title: string;
  path: string;
  closable: boolean;
  /** 열린 시각 (최근 방문 정렬) */
  openedAt: number;
}
