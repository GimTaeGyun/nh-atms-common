import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabStore } from '@/stores/useTabStore';
import { useNavStore, findMenuByScreen } from '@/stores/useNavStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { MAX_OPEN_TABS } from '@/config/constants';
import { notifyError } from '@/hooks/useAppMessage';
import { getScreen, screenPath } from './registry';
import type { L1Slug } from '@/types/screen';
import { L1_BY_NAME, isL1Slug, navSlugOf } from './l1';
import { HOME_SCREEN_KEY, type ScreenKey } from './screenIds';

/** 화면키로 탭 열기 + 라우팅 (메뉴/즐겨찾기/검색/화면 내 링크 공통 진입점) */
export const useOpenScreen = () => {
  const navigate = useNavigate();
  const open = useTabStore((s) => s.open);
  const menus = useNavStore((s) => s.menus);
  const setActiveL1 = useNavStore((s) => s.setActiveL1);
  const visit = useFavoriteStore((s) => s.visit);

  return useCallback(
    (screenKey: ScreenKey) => {
      const def = getScreen(screenKey);
      const menu = findMenuByScreen(menus, screenKey);
      const keySlug = screenKey.split('.')[0] ?? '';
      const slug: L1Slug = def?.slug ?? (menu?.l1 ? L1_BY_NAME[menu.l1]?.slug : undefined) ?? (isL1Slug(keySlug) ? keySlug : 'home');
      const title = def?.title ?? menu?.menuNm ?? screenKey;
      const path = screenPath(screenKey, slug);
      const ok = open({ screenKey, title, path, closable: screenKey !== HOME_SCREEN_KEY });
      if (!ok) {
        notifyError(`열 수 있는 화면 탭은 최대 ${MAX_OPEN_TABS}개입니다. 사용하지 않는 탭을 닫고 다시 시도하세요.`);
        return;
      }
      visit(screenKey);
      setActiveL1(navSlugOf(slug));
      navigate(path);
    },
    [menus, open, visit, setActiveL1, navigate],
  );
};
