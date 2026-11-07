import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_PREFIX } from '@/config/constants';
import { HOME_SCREEN_KEY, type ScreenKey } from '@/screens/screenIds';

interface FavoriteState {
  /** 즐겨찾기 화면키 목록 (서버 동기화 전까지 localStorage) */
  favorites: ScreenKey[];
  /** 최근 방문 화면 (최신 우선, 최대 8) */
  recent: { screenKey: ScreenKey; at: number }[];
  isFavorite: (screenKey: ScreenKey) => boolean;
  toggle: (screenKey: ScreenKey) => void;
  visit: (screenKey: ScreenKey) => void;
  /** 최근 방문 내역 삭제(시안 즐겨찾기 드롭다운의 버튼) */
  clearRecent: () => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recent: [],
      isFavorite: (id) => get().favorites.includes(id),
      toggle: (id) => set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] })),
      visit: (id) => {
        if (id === HOME_SCREEN_KEY) return;
        set((s) => ({ recent: [{ screenKey: id, at: Date.now() }, ...s.recent.filter((r) => r.screenKey !== id)].slice(0, 8) }));
      },
      clearRecent: () => set({ recent: [] }),
    }),
    // version 2: 화면번호 → 화면키. 이전 저장분은 버린다
    { name: `${STORAGE_PREFIX}:favorites`, version: 2, migrate: () => ({ favorites: [], recent: [] }) as never, storage: createJSONStorage(() => localStorage) },
  ),
);
