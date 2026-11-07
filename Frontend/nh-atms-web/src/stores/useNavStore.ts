import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MenuTreeNode } from '@/types/menu';
import type { L1Slug } from '@/types/screen';
import { menuApi } from '@/api/endpoints/menu';
import { toAppError } from '@/api/errors';
import { STORAGE_PREFIX } from '@/config/constants';
import { env } from '@/config/env';
import { L1_BY_NAME } from '@/screens/l1';
import { buildMenuSeed } from '@/screens/menuSeed';
import { screenKeyOf, type ScreenKey } from '@/screens/screenIds';
import { selectIsAdmin, useAuthStore } from './useAuthStore';

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
          const { menus, source } = resolveMenus(fromApi, env.menuSource, selectIsAdmin(useAuthStore.getState()));
          if (source === 'static' && env.menuSource === 'auto') {
            console.info('[menu] /api/menu/my 응답에 화면키(screenKey/screenId)가 없어 내장 메뉴 시드(src/screens/menuSeed.ts)를 사용합니다.');
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

/** 대분류(1뎁스) 노드 목록 — 메뉴명으로 L1 slug 매핑 */
export const topNodes = (menus: MenuTreeNode[]): { slug: L1Slug; node: MenuTreeNode }[] =>
  menus
    .filter((n) => n.menuType === 'D' && (n.menuLevel ?? 1) === 1)
    .map((node) => ({ slug: L1_BY_NAME[node.menuName]?.slug, node }))
    .filter((x): x is { slug: L1Slug; node: MenuTreeNode } => !!x.slug);

export const nodeOfL1 = (menus: MenuTreeNode[], slug: L1Slug): MenuTreeNode | undefined => topNodes(menus).find((t) => t.slug === slug)?.node;

/** 모든 화면(리프) 평탄화 */
export const flattenScreens = (menus: MenuTreeNode[], acc: (MenuTreeNode & { l1?: string; folder?: string })[] = [], l1?: string, folder?: string) => {
  for (const n of menus) {
    if (n.children?.length) flattenScreens(n.children, acc, l1 ?? n.menuName, l1 ? n.menuName : undefined);
    else if (n.screenKey) acc.push({ ...n, l1, folder });
  }
  return acc;
};

/** 화면키로 메뉴 리프 찾기 */
export const findMenuByScreen = (menus: MenuTreeNode[], screenKey?: ScreenKey | string) => flattenScreens(menus).find((n) => n.screenKey === screenKey);

/** API 응답 리프에 screenKey 가 없고 screenId 만 있으면 매핑으로 키를 채운다(백엔드 T_MENU 가 번호만 가질 때) */
const withScreenKeys = (nodes: MenuTreeNode[]): MenuTreeNode[] =>
  nodes.map((n) => ({ ...n, screenKey: n.screenKey ?? screenKeyOf(n.screenId), children: n.children ? withScreenKeys(n.children) : n.children }));

/** 관리자가 아니면 adminYn='Y' 노드(관리자기능 대분류·관리자 전용 화면)를 뺀다 — 화면 차단은 ScreenHost·백엔드가 한 번 더 한다 */
const withoutAdminNodes = (nodes: MenuTreeNode[]): MenuTreeNode[] =>
  nodes.filter((n) => n.adminYn !== 'Y').map((n) => (n.children ? { ...n, children: withoutAdminNodes(n.children) } : n));

/**
 * 메뉴 트리 결정. 현 백엔드 T_MENU 에 SCREEN_ID 가 아직 없으면(B7-DB-01 전) 응답 리프에 screenId 가 없어
 * 사이드바·탭이 비므로, auto 는 이때 내장 메뉴 시드로 대신한다. 시드는 목 서버 `/api/menu/my` 와 같은 트리다.
 */
export const resolveMenus = (
  fromApi: MenuTreeNode[],
  mode: 'auto' | 'api' | 'static',
  isAdmin: boolean,
): { menus: MenuTreeNode[]; source: MenuSource } => {
  const api = withScreenKeys(fromApi);
  if (mode === 'api') return { menus: api, source: 'api' };
  if (mode === 'auto' && flattenScreens(api).length > 0) return { menus: api, source: 'api' };
  const seed = buildMenuSeed();
  return { menus: isAdmin ? seed : withoutAdminNodes(seed), source: 'static' };
};
