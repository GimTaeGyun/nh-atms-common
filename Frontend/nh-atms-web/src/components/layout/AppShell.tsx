import { useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavStore } from '@/stores/useNavStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTabStore } from '@/stores/useTabStore';
import { useWindowBand, useWindowWidth } from '@/hooks/useContentBand';
import { PANEL_AUTO_COLLAPSE_BELOW } from '@/config/constants';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { AppHeader } from './AppHeader';
import { IconRail } from './IconRail';
import { SidePanel } from './SidePanel';
import { OpenTabBar } from './OpenTabBar';
import { ScreenHost } from './ScreenHost';
import { SettingsDrawer } from './SettingsDrawer';
import './layout.css';

/**
 * 앱 셸 — 현업 검토 반영:
 *   시안 B(라이트, 상단 1뎁스 메뉴, 좌측 2/3뎁스 사이드바)를 기본으로
 *   ① 열린 화면 탭을 하단이 아닌 상단(헤더 바로 아래)에 두고
 *   ② 시안 A 의 좌측 아이콘 줄은 '사이드바를 접었을 때' 사이드바 자리에 나타난다.
 *      펼친 상태는 시안 B 와 동일(상단 메뉴가 1뎁스 — 현업이 B안을 고른 이유), 접으면 아이콘 줄 + 호버 플라이아웃.
 */
export const AppShell = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchMenus = useNavStore((s) => s.fetchMenus);
  const menusLoaded = useNavStore((s) => s.loaded);
  const activeL1 = useNavStore((s) => s.activeL1);
  const panelCollapsed = useNavStore((s) => s.panelCollapsed);
  const panelUserSet = useNavStore((s) => s.panelUserSet);
  const setPanelCollapsed = useNavStore((s) => s.setPanelCollapsed);
  const flyoutL1 = useNavStore((s) => s.flyoutL1);
  const setFlyout = useNavStore((s) => s.setFlyout);
  const collapseOnNarrow = useSettingsStore((s) => s.collapseOnNarrow);
  const showTopNav = useSettingsStore((s) => s.showTopNav);
  const resetTabs = useTabStore((s) => s.reset);
  const band = useWindowBand();
  const winWidth = useWindowWidth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [idleWarn, setIdleWarn] = useState<number | null>(null);
  const sideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated && !menusLoaded) fetchMenus();
  }, [isAuthenticated, menusLoaded, fetchMenus]);

  // 기본 접힘: 좁은 화면(<1366)에서는 사이드바를 접어 아이콘 줄 + 호버 플라이아웃으로 메뉴를 쓴다
  // (08 제안 §2 의 'S 구간 접힘'). 사용자가 직접 접거나 펼친 뒤에는 그 상태를 유지
  useEffect(() => {
    if (panelUserSet) return;
    setPanelCollapsed(winWidth < PANEL_AUTO_COLLAPSE_BELOW && collapseOnNarrow, false);
  }, [winWidth, collapseOnNarrow, panelUserSet, setPanelCollapsed]);

  // 로그아웃 시 세션 캐시 정리
  useEffect(() => {
    if (!isAuthenticated) resetTabs();
  }, [isAuthenticated, resetTabs]);

  useIdleTimeout({ onWarn: (sec) => setIdleWarn(sec), onClearWarn: () => setIdleWarn(null) });

  // 플라이아웃: 레일/패널 영역 밖 클릭 시 닫힘
  useEffect(() => {
    if (!flyoutL1) return;
    const onDown = (e: MouseEvent) => {
      if (sideRef.current && !sideRef.current.contains(e.target as Node)) setFlyout(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [flyoutL1, setFlyout]);

  const panelSlug = flyoutL1 ?? activeL1;
  // 아이콘 줄: 접힌 상태에서만. 단, 상단 메뉴를 끈 사용자에게는 유일한 1뎁스 이동 수단이므로 항상 표시
  const railVisible = panelCollapsed || !showTopNav;

  return (
    <div className="app-shell" data-band={band}>
      <AppHeader />
      <div className="app-side" ref={sideRef} onMouseLeave={() => flyoutL1 && setFlyout(null)}>
        {railVisible && <IconRail onOpenSettings={() => setSettingsOpen(true)} />}
        {!panelCollapsed && <SidePanel slug={activeL1} onOpenSettings={() => setSettingsOpen(true)} />}
        {panelCollapsed && flyoutL1 && <SidePanel slug={panelSlug} flyout onOpenSettings={() => setSettingsOpen(true)} onMouseLeave={() => setFlyout(null)} />}
      </div>
      <div className="app-main">
        <OpenTabBar />
        <main className="app-content">
          <ScreenHost />
        </main>
      </div>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Modal open={idleWarn !== null} title="잠시 후 자동 로그아웃됩니다" okText="계속 사용" cancelButtonProps={{ style: { display: 'none' } }} onOk={() => setIdleWarn(null)} onCancel={() => setIdleWarn(null)} closable={false}>
        장시간 조작이 없어 {idleWarn}초 후 자동 로그아웃됩니다. 계속 사용하려면 확인을 누르세요.
      </Modal>
    </div>
  );
};
