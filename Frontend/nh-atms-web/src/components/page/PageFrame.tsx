import type { ReactNode } from 'react';
import { Breadcrumb, Button, Tooltip } from 'antd';
import { ReloadOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useNavStore, findMenuByScreen } from '@/stores/useNavStore';
import { getScreen, l1Label } from '@/screens/registry';
import { HOME_SCREEN_KEY, screenIdOf, type ScreenKey } from '@/screens/screenIds';
import { L1_BY_NAME } from '@/screens/l1';
import { fmtAgo } from '@/utils/format';
import { useEffect, useState } from 'react';
import './page.css';

interface Props {
  /** 영문 화면키. 화면번호는 쓰지 않는다(설계 Q9) — 매핑이 빈 값이면 번호 자리를 그리지 않는다 */
  screenKey: ScreenKey;
  title?: string;
  /** 제목 우측 보조 설명 */
  subtitle?: ReactNode;
  /** 마지막 조회 시각(ms). 주면 '마지막 업데이트 : n초 전' + 새로고침 버튼 표시 */
  lastUpdated?: number | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** 제목 행 우측 액션 */
  extra?: ReactNode;
  /** @deprecated 2026-11-03 시안 반영으로 제목 행 닫기 버튼을 없앴다(탭 × 로 닫는다). 호환용으로 남겨 두며 무시된다 */
  closable?: boolean;
  children: ReactNode;
}

/** 화면 프레임(시안 2026-10-21): 브레드크럼(>) › 제목(▍) ☆ · 마지막 업데이트 ↻ · 액션 */
export const PageFrame = ({ screenKey, title, subtitle, lastUpdated, onRefresh, refreshing, extra, children }: Props) => {
  const def = getScreen(screenKey);
  const screenId = screenIdOf(screenKey);
  const menus = useNavStore((s) => s.menus);
  const menu = findMenuByScreen(menus, screenKey);
  const isFav = useFavoriteStore((s) => s.favorites.includes(screenKey));
  const toggleFav = useFavoriteStore((s) => s.toggle);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!lastUpdated) return;
    const id = window.setInterval(() => tick((n) => n + 1), 5000);
    return () => window.clearInterval(id);
  }, [lastUpdated]);

  const l1 = def ? l1Label(def.slug) : menu?.l1 ? L1_BY_NAME[menu.l1]?.label ?? menu.l1 : undefined;
  const group = def?.group ?? menu?.folder;
  const name = title ?? def?.title ?? menu?.menuNm ?? screenKey;
  const isHome = screenKey === HOME_SCREEN_KEY;

  return (
    <div className="page-frame">
      {!isHome && (
        <Breadcrumb className="page-crumb" separator=">" items={[{ title: l1 }, ...(group ? [{ title: group }] : []), { title: name }].filter((i) => i.title)} />
      )}
      <div className="page-title-row">
        <div className="page-title">
          <span className="bar" />
          <h1>{name}</h1>
          {!isHome && screenId && <span className="sid">{screenId}</span>}
          {!isHome && (
            <Tooltip title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
              <button type="button" className={`fav-btn${isFav ? ' on' : ''}`} onClick={() => toggleFav(screenKey)} aria-label="즐겨찾기">
                {isFav ? <StarFilled /> : <StarOutlined />}
              </button>
            </Tooltip>
          )}
          {subtitle && <span className="page-subtitle">{subtitle}</span>}
        </div>
        <div className="page-actions">
          {lastUpdated !== undefined && (
            <span className="last-updated">
              {lastUpdated ? <>마지막 업데이트 : {fmtAgo(lastUpdated)}</> : '조회 전'}
              {onRefresh && <Button size="small" icon={<ReloadOutlined spin={refreshing} />} onClick={onRefresh} aria-label="새로고침" />}
            </span>
          )}
          {extra}
        </div>
      </div>
      {children}
    </div>
  );
};
