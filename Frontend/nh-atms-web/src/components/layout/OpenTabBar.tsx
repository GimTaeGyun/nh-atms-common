import { useEffect, useRef } from 'react';
import type { ScreenKey } from '@/screens/screenIds';
import { Dropdown, Tooltip, type MenuProps } from 'antd';
import { CloseOutlined, HomeOutlined, MinusSquareOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTabStore } from '@/stores/useTabStore';
import type { OpenTab } from '@/types/menu';

/** 열린 화면 탭바 — 시안 B 의 하단 탭을 현업 요청대로 상단(헤더 아래)에 배치. 우클릭 컨텍스트 메뉴, 휠 스크롤 */
export const OpenTabBar = () => {
  const navigate = useNavigate();
  const tabs = useTabStore((s) => s.tabs);
  const activeKey = useTabStore((s) => s.activeKey);
  const close = useTabStore((s) => s.close);
  const closeOthers = useTabStore((s) => s.closeOthers);
  const closeRight = useTabStore((s) => s.closeRight);
  const closeAll = useTabStore((s) => s.closeAll);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>('.open-tab.on');
    el?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [activeKey, tabs.length]);

  const go = (tab: OpenTab) => navigate(tab.path);
  const doClose = (key: ScreenKey) => {
    const next = close(key);
    if (next) {
      const t = useTabStore.getState().tabs.find((x) => x.key === next);
      if (t) navigate(t.path);
    }
  };
  const afterBulk = () => {
    const { activeKey: k, tabs: ts } = useTabStore.getState();
    const t = ts.find((x) => x.key === k) ?? ts[0];
    if (t) navigate(t.path);
  };

  const menuFor = (tab: OpenTab): MenuProps['items'] => [
    { key: 'close', label: '이 탭 닫기', disabled: !tab.closable, onClick: () => doClose(tab.key) },
    { key: 'others', label: '다른 탭 모두 닫기', onClick: () => { closeOthers(tab.key); afterBulk(); } },
    { key: 'right', label: '오른쪽 탭 닫기', onClick: () => { closeRight(tab.key); afterBulk(); } },
    { type: 'divider' },
    { key: 'all', label: '전체 닫기', onClick: () => { closeAll(); afterBulk(); } },
  ];

  return (
    <div className="app-tabbar" role="tablist" aria-label="열린 화면">
      <div
        className="tabs"
        ref={scrollRef}
        onWheel={(e) => {
          if (scrollRef.current && e.deltaY) scrollRef.current.scrollLeft += e.deltaY;
        }}
      >
        {tabs.map((tab) => (
          <Dropdown key={tab.key} trigger={['contextMenu']} menu={{ items: menuFor(tab) }}>
            <div
              role="tab"
              aria-selected={tab.key === activeKey}
              className={`open-tab${tab.key === activeKey ? ' on' : ''}${tab.closable ? '' : ' home'}`}
              onClick={() => go(tab)}
              onAuxClick={(e) => {
                if (e.button === 1 && tab.closable) doClose(tab.key);
              }}
              title={tab.title}
            >
              {!tab.closable && <HomeOutlined />}
              <span className="ttl">{tab.title}</span>
              {tab.closable && (
                <CloseOutlined
                  className="cls"
                  aria-label="탭 닫기"
                  onClick={(e) => {
                    e.stopPropagation();
                    doClose(tab.key);
                  }}
                />
              )}
            </div>
          </Dropdown>
        ))}
      </div>
      <div className="tabbar-actions">
        <Tooltip title="열린 화면 전체 닫기">
          <button
            type="button"
            className="quick-link"
            style={{ width: 'auto', padding: '2px 8px' }}
            onClick={() => {
              closeAll();
              afterBulk();
            }}
          >
            <MinusSquareOutlined /> 전체 닫기
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
