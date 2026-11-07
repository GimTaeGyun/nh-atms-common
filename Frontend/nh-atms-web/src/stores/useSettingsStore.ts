import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_PREFIX } from '@/config/constants';

export interface UserSettings {
  /** 좁은 화면(S 밴드)에서 사이드 패널 기본 접힘 */
  collapseOnNarrow: boolean;
  /** 상단 1뎁스 메뉴 표시 (아이콘 레일만 쓰고 싶을 때 끔) */
  showTopNav: boolean;
  /** 그리드 기본 페이지 크기 */
  pageSize: number;
  /** 열린 탭 복원 (브라우저 새로고침 시) */
  restoreTabs: boolean;
}

interface SettingsState extends UserSettings {
  update: (patch: Partial<UserSettings>) => void;
  reset: () => void;
}

const DEFAULTS: UserSettings = { collapseOnNarrow: true, showTopNav: true, pageSize: 20, restoreTabs: true };

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      update: (patch) => set(patch),
      reset: () => set(DEFAULTS),
    }),
    { name: `${STORAGE_PREFIX}:settings`, storage: createJSONStorage(() => localStorage) },
  ),
);
