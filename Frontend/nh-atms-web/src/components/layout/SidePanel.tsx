import { useMemo, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { DownOutlined, DoubleLeftOutlined, DoubleRightOutlined, StarFilled, StarOutlined, SettingOutlined, HomeOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavStore, nodeOfL1 } from '@/stores/useNavStore';
import { useTabStore } from '@/stores/useTabStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useOpenScreen } from '@/screens/navigation';
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

/** 화면 항목 — 이름만(번호 없음). ★ 는 마우스를 올리면 */
const Leaf = ({ node, active, onOpen }: { node: MenuTreeNode; active: boolean; onOpen: (key: ScreenKey) => void }) => {
  const fav = useFavoriteStore((s) => !!node.screenKey && s.favorites.includes(node.screenKey));
  const toggle = useFavoriteStore((s) => s.toggle);
  const id = node.screenKey!;
  return (
    <button type="button" className={`panel-leaf${active ? ' on' : ''}`} onClick={() => onOpen(id)} title={node.menuNm}>
      <span className="nm">{node.menuNm}</span>
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
  const leaves = node.children.filter((c) => !!c.screenKey);
  return (
    <div className="panel-section">
      <button type="button" className={`panel-folder${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)}>
        <span>{node.menuNm}</span>
        <DownOutlined />
      </button>
      {open && leaves.map((leaf) => <Leaf key={leaf.menuId} node={leaf} active={activeId === leaf.screenKey} onOpen={onOpen} />)}
    </div>
  );
};

/**
 * 사이드 패널: 맨 위 "☆ 즐겨찾기 ▾" 상자 → 대분류 제목 → 폴더/화면 트리(메뉴 응답 `/api/menu/my`).
 * 홈이면 홈·최근 방문. 하단은 나(고정 사용자) + 환경설정. 로그인이 없어 로그아웃 버튼은 없다(설계 Q1).
 */
export const SidePanel = ({ slug, flyout, onOpenSettings, onMouseLeave }: Props) => {
  const menus = useNavStore((s) => s.menus);
  const loading = useNavStore((s) => s.loading);
  const error = useNavStore((s) => s.error);
  const fetchMenus = useNavStore((s) => s.fetchMenus);
  const togglePanel = useNavStore((s) => s.togglePanel);
  const activeKey = useTabStore((s) => s.activeKey);
  const me = useAuthStore((s) => s.me);
  const favorites = useFavoriteStore((s) => s.favorites);
  const recent = useFavoriteStore((s) => s.recent);
  const openScreen = useOpenScreen();
  const [recentOpen, setRecentOpen] = useState(true);
  const def = L1_BY_SLUG[slug];
  const top = useMemo(() => nodeOfL1(menus, slug), [menus, slug]);
  const allLeaves = useMemo(() => {
    const acc: MenuTreeNode[] = [];
    const walk = (ns: MenuTreeNode[]) => ns.forEach((n) => (n.children.length ? walk(n.children) : n.screenKey && acc.push(n)));
    walk(menus);
    return acc;
  }, [menus]);
  const byId = (key: string) => allLeaves.find((l) => l.screenKey === key);

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
              <HomeOutlined /> <span className="nm">홈</span>
            </button>
            <button type="button" className={`panel-folder${recentOpen ? ' open' : ''}`} onClick={() => setRecentOpen((v) => !v)}>
              <span>최근 방문한 페이지</span>
              <DownOutlined />
            </button>
            {recentOpen && (recent.length === 0 ? <div className="panel-empty">최근 방문한 화면이 없습니다.</div> : recent.map((r) => byId(r.screenKey)).filter(Boolean).map((n) => <Leaf key={n!.menuId} node={n!} active={activeKey === n!.screenKey} onOpen={openScreen} />))}
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
          (top?.children ?? []).map((folder) => (folder.children.length ? <Folder key={folder.menuId} node={folder} activeId={activeKey} onOpen={openScreen} /> : folder.screenKey ? <Leaf key={folder.menuId} node={folder} active={activeKey === folder.screenKey} onOpen={openScreen} /> : null))
        )}
      </div>
      <div className="panel-foot">
        <div className="user-card">
          <div className="avatar">{me?.name?.slice(0, 1) ?? 'U'}</div>
          <div style={{ minWidth: 0 }}>
            <div className="nm ellipsis">{me?.name ?? '-'}</div>
            <div className="dept ellipsis">{me?.kanm ?? me?.samusoName ?? ''}</div>
          </div>
        </div>
        <div className="panel-foot-actions">
          <button type="button" className="panel-settings" onClick={onOpenSettings}>
            <SettingOutlined /> 환경설정
          </button>
        </div>
      </div>
    </aside>
  );
};
