import { Activity, Suspense, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTabStore } from '@/stores/useTabStore';
import { useNavStore, findMenuByScreen } from '@/stores/useNavStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { getScreen, parseScreenPath } from '@/screens/registry';
import PlaceholderScreen from '@/screens/common/PlaceholderScreen';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { MAX_OPEN_TABS } from '@/config/constants';
import { HOME_SCREEN_KEY, screenIdOf } from '@/screens/screenIds';
import { useAuthStore, selectIsAdmin } from '@/stores/useAuthStore';
import { notifyError } from '@/hooks/useAppMessage';
import { L1_BY_NAME, navSlugOf } from '@/screens/l1';
import { Result } from 'antd';

/**
 * URL ↔ 탭 동기화 + 탭 keep-alive.
 *  - /{slug}/{kebab 화면키} 진입 시 탭을 열고(없으면 생성) 활성화
 *  - 열린 탭은 React <Activity> 로 유지: 숨김 탭은 DOM/상태를 보존하고 effect 만 정지(조회조건·결과·스크롤 보존, B7-FE-04)
 *  - 탭마다 ErrorBoundary 로 오류 격리
 */
export const ScreenHost = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = useTabStore((s) => s.tabs);
  const activeKey = useTabStore((s) => s.activeKey);
  const open = useTabStore((s) => s.open);
  const menus = useNavStore((s) => s.menus);
  const menusLoaded = useNavStore((s) => s.loaded);
  const setActiveL1 = useNavStore((s) => s.setActiveL1);
  const visit = useFavoriteStore((s) => s.visit);
  const isAdmin = useAuthStore(selectIsAdmin);

  useEffect(() => {
    const parsed = parseScreenPath(location.pathname);
    if (!parsed) {
      navigate('/home', { replace: true });
      return;
    }
    const { screenKey, slug } = parsed;
    const def = getScreen(screenKey);
    const menu = findMenuByScreen(menus, screenKey);
    if (!def && menusLoaded && !menu) {
      navigate('/home', { replace: true });
      return;
    }
    if (def?.adminOnly && !isAdmin) {
      notifyError('관리자 전용 화면입니다.');
      navigate('/home', { replace: true });
      return;
    }
    const title = def?.title ?? menu?.menuNm ?? screenKey;
    const ok = open({ screenKey, title, path: location.pathname, closable: screenKey !== HOME_SCREEN_KEY });
    if (!ok) {
      notifyError(`열 수 있는 화면 탭은 최대 ${MAX_OPEN_TABS}개입니다.`);
      const cur = useTabStore.getState().tabs.find((t) => t.key === useTabStore.getState().activeKey);
      navigate(cur?.path ?? '/home', { replace: true });
      return;
    }
    visit(screenKey);
    setActiveL1(navSlugOf(def?.slug ?? (menu?.l1 ? L1_BY_NAME[menu.l1]?.slug ?? slug : slug)));
  }, [location.pathname, menus, menusLoaded, isAdmin, open, visit, setActiveL1, navigate]);

  return (
    <>
      {tabs.map((tab) => {
        const def = getScreen(tab.screenKey);
        const Comp = def?.component ?? PlaceholderScreen;
        const active = tab.key === activeKey;
        return (
          <Activity key={tab.key} mode={active ? 'visible' : 'hidden'}>
            <div className="app-content-inner" data-screen={tab.screenKey}>
              <ErrorBoundary scope={tab.title}>
                <Suspense fallback={<LoadingBlock tip={`${tab.title} 화면을 불러오는 중…`} height={240} />}>
                  <Comp screenKey={tab.screenKey} screenId={screenIdOf(tab.screenKey)} active={active} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </Activity>
        );
      })}
      {tabs.length === 0 && <Result status="info" title="열린 화면이 없습니다" subTitle="좌측 메뉴에서 화면을 선택하세요." />}
    </>
  );
};
