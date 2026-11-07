import { Popover, Tooltip } from 'antd';
import { DoubleRightOutlined, LogoutOutlined, SearchOutlined, SettingOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, selectIsAdmin } from '@/stores/useAuthStore';
import { useNavStore } from '@/stores/useNavStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { visibleL1Defs } from '@/screens/l1';
import type { L1Slug } from '@/types/screen';
import { MenuIcon } from './icons';
import { GLOBAL_SEARCH_ID } from './GlobalSearch';
import { FavoritesPopover } from './FavoritesPopover';
import { useSignOut } from '@/hooks/useSignOut';

interface Props {
  onOpenSettings: () => void;
}

/**
 * 아이콘 줄(시안 A) — 현업 결정에 따라 사이드바를 접었을 때 사이드바 자리에 나타난다.
 * 펼친 상태는 시안 B 그대로(상단 메뉴 + 흰색 사이드바)이고, 접으면 이 줄만 남아 업무 화면이 넓어진다.
 * 1뎁스 아이콘(마우스를 올리면 2·3뎁스 플라이아웃) + 맨 위 펼치기 버튼 + 하단 도구(즐겨찾기/화면 검색/사용자).
 * 환경설정에서 상단 메뉴를 끈 경우에는 유일한 1뎁스 이동 수단이므로 펼친 상태에서도 표시한다(AppShell).
 */
export const IconRail = ({ onOpenSettings }: Props) => {
  const navigate = useNavigate();
  const isAdmin = useAuthStore(selectIsAdmin);
  const user = useAuthStore((s) => s.user);
  const { signOut } = useSignOut();
  const activeL1 = useNavStore((s) => s.activeL1);
  const setActiveL1 = useNavStore((s) => s.setActiveL1);
  const panelCollapsed = useNavStore((s) => s.panelCollapsed);
  const togglePanel = useNavStore((s) => s.togglePanel);
  const setFlyout = useNavStore((s) => s.setFlyout);
  const hasFavorites = useFavoriteStore((s) => s.favorites.length > 0);

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
    <aside className="app-rail" aria-label="아이콘 메뉴">
      {panelCollapsed && (
        <Tooltip title="메뉴 펼치기" placement="right">
          <button type="button" className="rail-expand" aria-label="패널 펼치기" onClick={togglePanel}>
            <DoubleRightOutlined />
          </button>
        </Tooltip>
      )}
      <div className="rail-items">
        {visibleL1Defs(isAdmin).map((d) => (
          <button
            key={d.slug}
            type="button"
            className={`rail-btn${activeL1 === d.slug ? ' on' : ''}`}
            onClick={() => select(d.slug)}
            onMouseEnter={() => panelCollapsed && d.slug !== 'home' && setFlyout(d.slug)}
            title={d.label}
          >
            <MenuIcon name={d.icon} />
            <span>{d.railLabel}</span>
          </button>
        ))}
      </div>
      <div className="rail-bottom">
        <FavoritesPopover placement="rightBottom">
          <button type="button" className="rail-icon-btn" aria-label="즐겨찾기">
            {hasFavorites ? <StarFilled style={{ color: 'var(--nh-gold)' }} /> : <StarOutlined />}
          </button>
        </FavoritesPopover>
        <Tooltip title="화면 검색 (Ctrl+K)" placement="right">
          <button type="button" className="rail-icon-btn" aria-label="검색" onClick={() => document.getElementById(GLOBAL_SEARCH_ID)?.focus()}>
            <SearchOutlined />
          </button>
        </Tooltip>
        <Popover
          placement="rightBottom"
          content={
            <div style={{ width: 220 }}>
              <div style={{ padding: '4px 4px 8px', borderBottom: '1px solid var(--border-light)', marginBottom: 6 }}>
                <div style={{ fontWeight: 700 }}>{user?.userName}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {user?.deptName}
                </div>
                <div className="muted" style={{ fontSize: 11 }}>
                  사무소 [{user?.officeCd}] {user?.officeName} · {isAdmin ? '관리자' : '일반'}
                </div>
              </div>
              <button type="button" className="quick-link" onClick={onOpenSettings}>
                <SettingOutlined /> 환경설정
              </button>
              <button type="button" className="quick-link" onClick={() => void signOut()}>
                <LogoutOutlined /> 로그아웃
              </button>
            </div>
          }
        >
          <div className="rail-avatar" aria-label="사용자">
            {user?.userName?.slice(0, 1) ?? 'U'}
          </div>
        </Popover>
      </div>
    </aside>
  );
};
