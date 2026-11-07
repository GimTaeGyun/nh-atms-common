import type { MenuNode } from '@/types/menu';
import { buildMenuSeed } from '@/screens/menuSeed';

/**
 * 목 `/api/menu/my` 응답 — 내장 메뉴 시드(screens/menuSeed.ts)와 같은 트리(견본 그룹 + 화면 4개, 권한 5개 모두 'Y').
 * 권한이 없는 모습은 공통 모듈 화면의 "권한 미리보기"로 확인한다(표시만 바꿈).
 */
export const MENU_TREE: MenuNode[] = buildMenuSeed();
