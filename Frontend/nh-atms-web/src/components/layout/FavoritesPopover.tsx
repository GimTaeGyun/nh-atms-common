import { useMemo, useState, type ReactNode } from 'react';
import { Button, Popover, type PopoverProps } from 'antd';
import { CloseOutlined, DeleteOutlined, StarFilled } from '@ant-design/icons';
import { useNavStore, flattenScreens } from '@/stores/useNavStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useOpenScreen } from '@/screens/navigation';

interface Props {
  placement?: PopoverProps['placement'];
  trigger?: PopoverProps['trigger'];
  children: ReactNode;
}

/**
 * 즐겨찾기 드롭다운(시안 2026-10-21 p.10): 즐겨찾기 목록 + "수정"(삭제 모드) · 최근 방문한 페이지 + "최근 방문 내역 삭제".
 * 사이드바 맨 위 상자와 접힌 아이콘 줄의 ★ 가 같은 내용을 쓴다.
 */
export const FavoritesPopover = ({ placement = 'bottomLeft', trigger = 'click', children }: Props) => {
  const menus = useNavStore((s) => s.menus);
  const favorites = useFavoriteStore((s) => s.favorites);
  const recent = useFavoriteStore((s) => s.recent);
  const toggleFav = useFavoriteStore((s) => s.toggle);
  const clearRecent = useFavoriteStore((s) => s.clearRecent);
  const openScreen = useOpenScreen();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const screens = useMemo(() => flattenScreens(menus), [menus]);
  const byKey = (k: string) => screens.find((s) => s.screenKey === k);
  const favNodes = favorites.map(byKey).filter((x): x is NonNullable<typeof x> => !!x);
  const recentNodes = recent.map((r) => byKey(r.screenKey)).filter((x): x is NonNullable<typeof x> => !!x);
  const go = (key: string) => {
    setOpen(false);
    openScreen(key as never);
  };

  return (
    <Popover
      placement={placement}
      trigger={trigger}
      open={open}
      onOpenChange={(v) => { setOpen(v); if (!v) setEdit(false); }}
      content={
        <div className="fav-pop">
          <div className="fav-pop-head">
            <span>즐겨찾기</span>
            {favNodes.length > 0 && <button type="button" className="gs-link" onClick={() => setEdit((v) => !v)}>{edit ? '완료' : '수정'}</button>}
          </div>
          {favNodes.length === 0 && <div className="panel-empty">즐겨찾기한 화면이 없습니다. 메뉴의 ★ 을 눌러 추가하세요.</div>}
          {favNodes.map((n) => (
            <button key={n.screenKey} type="button" className="panel-leaf" onClick={() => go(n.screenKey!)} title={`${n.screenId} ${n.menuName}`}>
              <StarFilled className="star fav" />
              <span className="nm">{n.menuName}</span>
              {edit && <CloseOutlined className="rm" aria-label="즐겨찾기 삭제" onClick={(e) => { e.stopPropagation(); toggleFav(n.screenKey!); }} />}
            </button>
          ))}
          <div className="panel-divider" />
          <div className="fav-pop-head"><span>최근 방문한 페이지</span></div>
          {recentNodes.length === 0 && <div className="panel-empty">최근 방문한 화면이 없습니다.</div>}
          {recentNodes.map((n) => (
            <button key={n.screenKey} type="button" className="panel-leaf" onClick={() => go(n.screenKey!)} title={`${n.screenId} ${n.menuName}`}>
              <span className="nm">{n.menuName}</span>
            </button>
          ))}
          {recentNodes.length > 0 && (
            <div className="fav-pop-foot">
              <Button size="small" icon={<DeleteOutlined />} onClick={clearRecent}>최근 방문 내역 삭제</Button>
            </div>
          )}
        </div>
      }
    >
      {children}
    </Popover>
  );
};
