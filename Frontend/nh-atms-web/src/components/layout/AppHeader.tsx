import { useNavigate } from 'react-router-dom';
import { env } from '@/config/env';
import { useAuthStore, selectIsAdmin } from '@/stores/useAuthStore';
import { useNavStore } from '@/stores/useNavStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { visibleL1Defs } from '@/screens/l1';
import type { L1Slug } from '@/types/screen';
import { GlobalSearch } from './GlobalSearch';
import { SessionTimer } from './SessionTimer';
import { AlarmBell } from './AlarmBell';
import { BrandMark } from './BrandMark';
import { MenuIcon } from './icons';

/** 헤더(시안 2026-10-21): 로고 + 시스템명 + 1뎁스 메뉴(아이콘·구분선) + 화면 검색 + 장애 알림 + 세션 타이머 */
export const AppHeader = () => {
  const navigate = useNavigate();
  const isAdmin = useAuthStore(selectIsAdmin);
  const activeL1 = useNavStore((s) => s.activeL1);
  const setActiveL1 = useNavStore((s) => s.setActiveL1);
  const panelCollapsed = useNavStore((s) => s.panelCollapsed);
  const setFlyout = useNavStore((s) => s.setFlyout);
  const showTopNav = useSettingsStore((s) => s.showTopNav);

  const select = (slug: L1Slug) => {
    if (slug === 'home') {
      setActiveL1('home');
      navigate('/home');
      return;
    }
    setActiveL1(slug);
    if (panelCollapsed) setFlyout(slug);
  };

  return (
    <header className="app-header">
      <div className="brand" onClick={() => select('home')} role="link" aria-label="홈으로">
        <BrandMark />
        <span className="sys-name">자동화기기 종합관리시스템</span>
        <span className={`env-badge ${env.envLabel}`}>{env.envLabel.toUpperCase()}</span>
      </div>
      {showTopNav && (
        <nav className="top-nav" aria-label="대분류 메뉴">
          {visibleL1Defs(isAdmin).map((d) => (
            <button key={d.slug} className={activeL1 === d.slug ? 'on' : ''} onClick={() => select(d.slug)} type="button">
              <MenuIcon name={d.icon} />
              {d.label}
            </button>
          ))}
        </nav>
      )}
      <div className="header-right">
        <GlobalSearch />
        <AlarmBell />
        <SessionTimer />
      </div>
    </header>
  );
};
