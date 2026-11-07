import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MenuNode, MenuTreeNode } from '@/types/menu';
import type { L1Slug } from '@/types/screen';
import { menuApi } from '@/api/endpoints/menu';
import { toAppError } from '@/api/errors';
import { STORAGE_PREFIX } from '@/config/constants';
import { env } from '@/config/env';
import { L1_BY_NAME } from '@/screens/l1';
import { buildMenuSeed } from '@/screens/menuSeed';
import { parseScreenPath } from '@/screens/registry';
import type { ScreenKey } from '@/screens/screenIds';

export type MenuSource = 'api' | 'static';

interface NavState {
  menus: MenuTreeNode[];
  /** 실제로 쓰는 메뉴 트리의 출처 (static = 내장 메뉴 시드) */
  menuSource: MenuSource | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  /** 상단 네비/아이콘 레일의 현재 대분류 */
  activeL1: L1Slug;
  /** 좌측 패널 접힘 (레일만 표시) */
  panelCollapsed: boolean;
  /** 사용자가 직접 접힘을 조작했는지 (밴드 기본값 적용 여부) */
  panelUserSet: boolean;
  /** 레일 호버 플라이아웃 대상 */
  flyoutL1: L1Slug | null;
  fetchMenus: (force?: boolean) => Promise<void>;
  clearMenus: () => void;
  setActiveL1: (slug: L1Slug) => void;
  setPanelCollapsed: (v: boolean, byUser?: boolean) => void;
  togglePanel: () => void;
  setFlyout: (slug: L1Slug | null) => void;
}

export const useNavStore = create<NavState>()(
  persist(
    (set, get) => ({
      menus: [],
      menuSource: null,
      loaded: false,
      loading: false,
      error: null,
      activeL1: 'home',
      panelCollapsed: false,
      panelUserSet: false,
      flyoutL1: null,
      fetchMenus: async (force = false) => {
        if (get().loading || (get().loaded && !force)) return;
        set({ loading: true, error: null });
        try {
          const fromApi = env.menuSource === 'static' ? [] : await menuApi.my();
          const { menus, source } = resolveMenus(fromApi, env.menuSource);
          if (source === 'static' && env.menuSource === 'auto') {
            console.info('[menu] /api/menu/my 응답에 화면(MENU_PATH → 화면키)이 없어 내장 메뉴 시드(src/screens/menuSeed.ts)를 사용합니다.');
          }
          set({ menus, menuSource: source, loaded: true, loading: false });
        } catch (e) {
          set({ loading: false, error: toAppError(e).userMessage });
        }
      },
      clearMenus: () => set({ menus: [], menuSource: null, loaded: false, error: null, activeL1: 'home' }),
      setActiveL1: (slug) => set({ activeL1: slug, flyoutL1: null }),
      setPanelCollapsed: (v, byUser = true) => set({ panelCollapsed: v, panelUserSet: byUser || get().panelUserSet, flyoutL1: null }),
      togglePanel: () => set((s) => ({ panelCollapsed: !s.panelCollapsed, panelUserSet: true, flyoutL1: null })),
      setFlyout: (slug) => set({ flyoutL1: slug }),
    }),
    {
      name: `${STORAGE_PREFIX}:nav`,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ panelCollapsed: s.panelCollapsed, panelUserSet: s.panelUserSet }),
    },
  ),
);

/* ---------- 셀렉터/헬퍼 ---------- */

/** 대분류(1뎁스) 노드 목록 — 최상위 그룹의 메뉴명(menuNm)으로 L1 slug 매핑(l1.ts 의 name) */
export const topNodes = (menus: MenuTreeNode[]): { slug: L1Slug; node: MenuTreeNode }[] =>
  menus
    .filter((n) => n.menuType === 'G' && n.level === 1)
    .map((node) => ({ slug: L1_BY_NAME[node.menuNm]?.slug, node }))
    .filter((x): x is { slug: L1Slug; node: MenuTreeNode } => !!x.slug);

export const nodeOfL1 = (menus: MenuTreeNode[], slug: L1Slug): MenuTreeNode | undefined => topNodes(menus).find((t) => t.slug === slug)?.node;

/** 모든 화면(리프, 화면키가 있는 것) 평탄화 — l1 = 대분류 메뉴명, folder = 2뎁스 그룹 메뉴명 */
export const flattenScreens = (menus: MenuTreeNode[], acc: (MenuTreeNode & { l1?: string; folder?: string })[] = [], l1?: string, folder?: string) => {
  for (const n of menus) {
    if (n.children.length) flattenScreens(n.children, acc, l1 ?? n.menuNm, l1 ? n.menuNm : undefined);
    else if (n.screenKey) acc.push({ ...n, l1, folder });
  }
  return acc;
};

/** 화면키로 메뉴 리프 찾기 */
export const findMenuByScreen = (menus: MenuTreeNode[], screenKey?: ScreenKey | string) => flattenScreens(menus).find((n) => n.screenKey === screenKey);

/**
 * 계약 MenuNode → 프론트 MenuTreeNode: 화면(M)은 menuPath 로 화면키를 찾고(레지스트리 parseScreenPath, 잠정 Q-05),
 * 사용 안 함(useYn='N') 노드는 뺀다. 형제는 sortNo 순.
 */
export const toTree = (nodes: MenuNode[] | null | undefined, level = 1): MenuTreeNode[] =>
  (nodes ?? [])
    .filter((n) => n.useYn !== 'N')
    .slice()
    .sort((a, b) => (a.sortNo ?? 0) - (b.sortNo ?? 0))
    .map((n) => {
      const { children, ...rest } = n;
      const screenKey = n.menuType === 'M' ? parseScreenPath(n.menuPath)?.screenKey : undefined;
      return { ...rest, ...(screenKey ? { screenKey } : {}), level, children: toTree(children, level + 1) };
    });

/**
 * 메뉴 트리 결정.
 *  - api: 응답 그대로(화면키를 못 찾은 화면은 사이드바에 안 나옴)
 *  - auto: 응답에서 화면키를 하나도 못 찾으면(메뉴 테이블 MENU_PATH 미입력 등) 내장 메뉴 시드로 대신한다
 *  - static: 내장 시드만(API 호출 안 함)
 */
export const resolveMenus = (fromApi: MenuNode[], mode: 'auto' | 'api' | 'static'): { menus: MenuTreeNode[]; source: MenuSource } => {
  const api = toTree(fromApi);
  if (mode === 'api') return { menus: api, source: 'api' };
  if (mode === 'auto' && flattenScreens(api).length > 0) return { menus: api, source: 'api' };
  return { menus: toTree(buildMenuSeed()), source: 'static' };
};
