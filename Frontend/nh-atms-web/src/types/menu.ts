import type { ScreenKey } from '@/screens/screenIds';

/** 백엔드 /api/menu/my 응답 노드 (3레벨: 대분류 D > 폴더 D > 화면 M) */
export interface MenuTreeNode {
  menuNo: number;
  parentNo?: number | null;
  menuName: string;
  /** 영문 화면키 — 시드는 직접, API 응답은 screenId 로 변환(resolveMenus) */
  screenKey?: ScreenKey;
  /** 화면번호(표시용). 메뉴(M/H/P)에만 존재 */
  screenId?: string;
  menuUrl?: string;
  menuLevel?: number;
  menuOrder?: number;
  menuIcon?: string;
  /** M:화면 D:디렉터리 H:홈 P:팝업 T:템플릿 */
  menuType?: 'M' | 'D' | 'H' | 'P' | 'T' | string;
  adminYn?: 'Y' | 'N';
  visibleYn?: 'Y' | 'N';
  /** 사용여부(관리 화면 /menu/all?includeDisabled=true 에서만 N 이 온다) */
  useYn?: 'Y' | 'N';
  readYn?: 'Y' | 'N';
  writeYn?: 'Y' | 'N';
  children?: MenuTreeNode[];
}

/** 열린 화면 탭 */
export interface OpenTab {
  /** 탭 키 = 화면키 (동일 화면 1인스턴스) */
  key: ScreenKey;
  screenKey: ScreenKey;
  /** 표시용 화면번호 */
  screenId: string;
  title: string;
  path: string;
  closable: boolean;
  /** 열린 시각 (최근 방문 정렬) */
  openedAt: number;
}
