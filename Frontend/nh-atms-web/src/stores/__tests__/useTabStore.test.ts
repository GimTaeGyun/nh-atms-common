import { beforeEach, describe, expect, it } from 'vitest';
import { useTabStore } from '@/stores/useTabStore';
import { MAX_OPEN_TABS } from '@/config/constants';

import { screenPath } from '@/screens/registry';
import { HOME_SCREEN_KEY, SCREEN_IDS, type ScreenKey } from '@/screens/screenIds';

const KEYS = Object.keys(SCREEN_IDS).filter((k) => k !== HOME_SCREEN_KEY && !k.startsWith('popup.')) as ScreenKey[];
const open = (key: ScreenKey) => useTabStore.getState().open({ screenKey: key, title: `T${key}`, path: screenPath(key), closable: true });

describe('useTabStore', () => {
  beforeEach(() => useTabStore.getState().reset());

  it('홈 탭은 항상 존재하고 닫히지 않는다', () => {
    expect(useTabStore.getState().tabs.map((t) => t.key)).toEqual([HOME_SCREEN_KEY]);
    expect(useTabStore.getState().close(HOME_SCREEN_KEY)).toBeNull();
    expect(useTabStore.getState().tabs).toHaveLength(1);
  });

  it('동일 화면은 1인스턴스(활성화만), 닫으면 이웃 탭 활성화', () => {
    open('mgmt.faultStatus');
    open('mgmt.faultHistory');
    open('mgmt.faultStatus');
    expect(useTabStore.getState().tabs).toHaveLength(3);
    expect(useTabStore.getState().activeKey).toBe('mgmt.faultStatus');
    const next = useTabStore.getState().close('mgmt.faultStatus');
    expect(next).toBe('mgmt.faultHistory');
    expect(useTabStore.getState().activeKey).toBe('mgmt.faultHistory');
  });

  it('최대 개수 초과 시 거부', () => {
    for (let i = 1; i < MAX_OPEN_TABS; i++) expect(open(KEYS[i])).toBe(true);
    expect(open(KEYS[MAX_OPEN_TABS + 1])).toBe(false);
  });

  it('다른 탭 닫기 / 오른쪽 탭 닫기 / 전체 닫기', () => {
    (['mgmt.faultStatus', 'mgmt.faultHistory', 'mgmt.cashStatus', 'journal.journalList'] as ScreenKey[]).forEach(open);
    useTabStore.getState().closeRight('mgmt.faultHistory');
    expect(useTabStore.getState().tabs.map((t) => t.key)).toEqual([HOME_SCREEN_KEY, 'mgmt.faultStatus', 'mgmt.faultHistory']);
    useTabStore.getState().closeOthers('mgmt.faultStatus');
    expect(useTabStore.getState().tabs.map((t) => t.key)).toEqual([HOME_SCREEN_KEY, 'mgmt.faultStatus']);
    useTabStore.getState().closeAll();
    expect(useTabStore.getState().tabs.map((t) => t.key)).toEqual([HOME_SCREEN_KEY]);
    expect(useTabStore.getState().activeKey).toBe(HOME_SCREEN_KEY);
  });
});
