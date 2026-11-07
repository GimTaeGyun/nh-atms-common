import { useMemo, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { DownOutlined, DoubleLeftOutlined, DoubleRightOutlined, StarFilled, StarOutlined, SettingOutlined, DashboardOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavStore, nodeOfL1 } from '@/stores/useNavStore';
import { useTabStore } from '@/stores/useTabStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useOpenScreen } from '@/screens/navigation';
import { useSignOut } from '@/hooks/useSignOut';
import { L1_BY_SLUG } from '@/screens/l1';
import { HOME_SCREEN_KEY, type ScreenKey } from '@/screens/screenIds';
import type { MenuTreeNode } from '@/types/menu';
import type { L1Slug } from '@/types/screen';
import { MenuIcon } from './icons';
import { FavoritesPopover } from './FavoritesPopover';

interface Props {
  slug: L1Slug;
  flyout?: boolean;
  onOpenSettings: () => void;
  onMouseLeave?: () => void;
}

/** 3뎁스 화면 항목 — 시안대로 이름만(번호는 툴팁). ★ 는 마우스를 올리면 */
const Leaf = ({ node, active, onOpen }: { node: MenuTreeNode; active: boolean; onOpen: (key: ScreenKey) => void }) => {
  const fav = useFavoriteStore((s) => !!node.screenKey && s.favorites.includes(node.screenKey));
  const toggle = useFavoriteStore((s) => s.toggle);
  const id = node.screenKey!;
  const sid = node.screenId ?? '';
  return (
    <button type="button" className={`panel-leaf${active ? ' on' : ''}`} onClick={() => onOpen(id)} title={`${sid} ${node.menuName}`}>
      <span className="nm">{node.menuName}</span>
      {node.adminYn === 'Y' && <span className="adm">A</span>}
      {fav ? (
        <StarFilled className="star fav" onClick={(e) => { e.stopPropagation(); toggle(id); }} />
      ) : (
        <StarOutlined className="star" onClick={(e) => { e.stopPropagation(); toggle(id); }} />
      )}
    </button>
  );
};

const Folder = ({ node, activeId, onOpen }: { node: MenuTreeNode; activeId: string; onOpen: (key: ScreenKey) => void }) => {
  const [open, setOpen] = useState(true);
  const leaves = (node.children ?? []).filter((c) => c.visibleYn !== 'N');
  return (
    <div className="panel-section">
      <button type="button" className={`panel-folder${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)}>
        <span>{node.menuName}</span>
        <DownOutlined />
      </button>
      {open && leaves.map((leaf) => <Leaf key={leaf.menuNo} node={leaf} active={activeId === leaf.screenKey} onOpen={onOpen} />)}
    </div>
  );
};

/**
 * 사이드 패널(시안 2026-10-21): 맨 위 "☆ 즐겨찾기 ▾" 상자(모든 화면) → 대분류 제목 → 폴더/화면 트리.
 * 홈이면 대시보드·최근 방문·게시판. 하단은 사용자 + 환경설정/로그아웃.
 * 접기 버튼은 현업 결정(접으면 아이콘 줄)이라 시안에 없어도 둔다.
 */
export const SidePanel = ({ slug, flyout, onOpenSettings, onMouseLeave }: Props) => {
  const menus = useNavStore((s) => s.menus);
  const loading = useNavStore((s) => s.loading);
  const error = useNavStore((s) => s.error);
  const fetchMenus = useNavStore((s) => s.fetchMenus);
  const togglePanel = useNavStore((s) => s.togglePanel);
  const activeKey = useTabStore((s) => s.activeKey);
  const user = useAuthStore((s) => s.user);
  const { signOut } = useSignOut();
  const favorites = useFavoriteStore((s) => s.favorites);
  const recent = useFavoriteStore((s) => s.recent);
  const openScreen = useOpenScreen();
  const [recentOpen, setRecentOpen] = useState(true);
  const [boardOpen, setBoardOpen] = useState(true);
  const def = L1_BY_SLUG[slug];
  const top = useMemo(() => nodeOfL1(menus, slug), [menus, slug]);
  const allLeaves = useMemo(() => {
    const acc: MenuTreeNode[] = [];
    const walk = (ns: MenuTreeNode[]) => ns.forEach((n) => (n.children?.length ? walk(n.children) : n.screenKey && acc.push(n)));
    walk(menus);
    return acc;
  }, [menus]);
  const byId = (key: string) => allLeaves.find((l) => l.screenKey === key);
  // 게시판은 상단 메뉴에 칸이 없으므로(결정 2) 대시보드 사이드바에 묶음으로 둔다
  const boardLeaves = useMemo(() => {
    const acc: MenuTreeNode[] = [];
    const walk = (ns: MenuTreeNode[] = []) => ns.forEach((n) => (n.children?.length ? walk(n.children) : n.screenKey && n.visibleYn !== 'N' && acc.push(n)));
    walk(nodeOfL1(menus, 'board')?.children);
    return acc;
  }, [menus]);

  return (
    <aside className={`app-panel${flyout ? ' flyout' : ''}`} onMouseLeave={onMouseLeave} aria-label="메뉴 패널">
      <div className="panel-fav-box">
        <FavoritesPopover placement="bottomLeft">
          <button type="button" className="panel-fav-head" aria-label="즐겨찾기">
            {favorites.length ? <StarFilled style={{ color: 'var(--nh-gold)' }} /> : <StarOutlined />} 즐겨찾기 <DownOutlined />
          </button>
        </FavoritesPopover>
      </div>
      <div className="panel-head">
        <MenuIcon name={def.icon} />
        <span>{def.label}</span>
        <span className="panel-head-actions">
          {!flyout && (
            <Tooltip title="패널 접기" placement="right">
              <Button className="collapse-btn" type="text" size="small" icon={<DoubleLeftOutlined />} onClick={togglePanel} aria-label="패널 접기" />
            </Tooltip>
          )}
          {flyout && (
            <Tooltip title="패널 고정" placement="right">
              <Button className="collapse-btn" type="text" size="small" icon={<DoubleRightOutlined />} onClick={togglePanel} aria-label="패널 고정" />
            </Tooltip>
          )}
        </span>
      </div>
      <div className="panel-body">
        {slug === 'home' ? (
          <>
            <button type="button" className={`panel-leaf${activeKey === HOME_SCREEN_KEY ? ' on' : ''}`} onClick={() => openScreen(HOME_SCREEN_KEY)} style={{ fontWeight: 700 }}>
              <DashboardOutlined /> <span className="nm">대시보드</span>
            </button>
            <button type="button" className={`panel-folder${recentOpen ? ' open' : ''}`} onClick={() => setRecentOpen((v) => !v)}>
              <span>최근 방문한 페이지</span>
              <DownOutlined />
            </button>
            {recentOpen && (recent.length === 0 ? <div className="panel-empty">최근 방문한 화면이 없습니다.</div> : recent.map((r) => byId(r.screenKey)).filter(Boolean).map((n) => <Leaf key={n!.menuNo} node={n!} active={activeKey === n!.screenKey} onOpen={openScreen} />))}
            {boardLeaves.length > 0 && (
              <>
                <button type="button" className={`panel-folder${boardOpen ? ' open' : ''}`} onClick={() => setBoardOpen((v) => !v)}>
                  <span>게시판</span>
                  <DownOutlined />
                </button>
                {boardOpen && boardLeaves.map((n) => <Leaf key={n.menuNo} node={n} active={activeKey === n.screenKey} onOpen={openScreen} />)}
              </>
            )}
          </>
        ) : loading && !top ? (
          <div className="panel-empty">메뉴를 불러오는 중…</div>
        ) : error && !top ? (
          <div className="panel-empty">
            {error}
            <br />
            <Button size="small" onClick={() => fetchMenus(true)} style={{ marginTop: 6 }}>
              다시 시도
            </Button>
          </div>
        ) : (
          (top?.children ?? []).map((folder) => (folder.children?.length ? <Folder key={folder.menuNo} node={folder} activeId={activeKey} onOpen={openScreen} /> : folder.screenKey ? <Leaf key={folder.menuNo} node={folder} active={activeKey === folder.screenKey} onOpen={openScreen} /> : null))
        )}
      </div>
      <div className="panel-foot">
        <div className="user-card">
          <div className="avatar">{user?.userName?.slice(0, 1) ?? 'U'}</div>
          <div style={{ minWidth: 0 }}>
            <div className="nm ellipsis">{user?.userName}</div>
            <div className="dept ellipsis">{user?.deptName}</div>
          </div>
        </div>
        <div className="panel-foot-actions">
          <button type="button" className="panel-settings" onClick={onOpenSettings}>
            <SettingOutlined /> 환경설정
          </button>
          <button type="button" className="panel-settings" onClick={() => void signOut()}>
            <LogoutOutlined /> 로그아웃
          </button>
        </div>
      </div>
    </aside>
  );
};
