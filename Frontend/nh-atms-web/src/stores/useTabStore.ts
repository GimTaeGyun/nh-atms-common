import { create } from 'zustand';
import { bindScreenContext } from '@/api/http';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OpenTab } from '@/types/menu';
import { MAX_OPEN_TABS, STORAGE_PREFIX } from '@/config/constants';
import { HOME_SCREEN_KEY, SCREEN_IDS, type ScreenKey } from '@/screens/screenIds';

interface TabState {
  tabs: OpenTab[];
  activeKey: ScreenKey;
  /** 탭 열기(이미 있으면 활성화만). 반환: 최대 개수 초과로 거부되면 false */
  open: (tab: Omit<OpenTab, 'openedAt' | 'key' | 'screenId'>) => boolean;
  activate: (key: ScreenKey) => void;
  close: (key: ScreenKey) => ScreenKey | null;
  closeOthers: (key: ScreenKey) => void;
  closeRight: (key: ScreenKey) => void;
  closeAll: () => void;
  reset: () => void;
}

const homeTab: OpenTab = { key: HOME_SCREEN_KEY, screenKey: HOME_SCREEN_KEY, screenId: SCREEN_IDS[HOME_SCREEN_KEY], title: '대시보드', path: '/home', closable: false, openedAt: 0 };

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [homeTab],
      activeKey: HOME_SCREEN_KEY,
      open: (tab) => {
        const { tabs } = get();
        const key = tab.screenKey;
        const exists = tabs.find((t) => t.key === key);
        if (exists) {
          set({ activeKey: key });
          return true;
        }
        if (tabs.length >= MAX_OPEN_TABS) return false;
        set({ tabs: [...tabs, { ...tab, key, screenId: SCREEN_IDS[key], openedAt: Date.now() }], activeKey: key });
        return true;
      },
      activate: (key) => {
        if (get().tabs.some((t) => t.key === key)) set({ activeKey: key });
      },
      close: (key) => {
        const { tabs, activeKey } = get();
        const idx = tabs.findIndex((t) => t.key === key);
        if (idx < 0 || !tabs[idx].closable) return null;
        const next = tabs.filter((t) => t.key !== key);
        let nextActive = activeKey;
        if (activeKey === key) {
          const neighbor = next[Math.min(idx, next.length - 1)] ?? next[0];
          nextActive = neighbor?.key ?? HOME_SCREEN_KEY;
        }
        set({ tabs: next, activeKey: nextActive });
        return nextActive;
      },
      closeOthers: (key) => set((s) => ({ tabs: s.tabs.filter((t) => !t.closable || t.key === key), activeKey: key })),
      closeRight: (key) =>
        set((s) => {
          const idx = s.tabs.findIndex((t) => t.key === key);
          const tabs = s.tabs.filter((t, i) => !t.closable || i <= idx);
          return { tabs, activeKey: tabs.some((t) => t.key === s.activeKey) ? s.activeKey : key };
        }),
      closeAll: () => set((s) => ({ tabs: s.tabs.filter((t) => !t.closable), activeKey: HOME_SCREEN_KEY })),
      reset: () => set({ tabs: [homeTab], activeKey: HOME_SCREEN_KEY }),
    }),
    // version 2: 탭 키가 화면번호 → 화면키로 바뀜. 이전 저장분은 버린다
    { name: `${STORAGE_PREFIX}:tabs`, version: 2, migrate: () => ({ tabs: [homeTab], activeKey: HOME_SCREEN_KEY }) as never, storage: createJSONStorage(() => sessionStorage) },
  ),
);

/* 활성 탭의 화면키·화면명을 API 요청 헤더에 싣는다(행위 이력 7211 의 "어느 화면" 근거) */
bindScreenContext({
  getActiveScreen: () => {
    const s = useTabStore.getState();
    const tab = s.tabs.find((t) => t.key === s.activeKey);
    return s.activeKey ? { key: s.activeKey, name: tab?.title } : null;
  },
});
