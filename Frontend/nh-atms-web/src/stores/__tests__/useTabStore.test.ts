import { beforeEach, describe, expect, it } from 'vitest';
import { useTabStore } from '@/stores/useTabStore';
import { MAX_OPEN_TABS } from '@/config/constants';
import { HOME_SCREEN_KEY, type ScreenKey } from '@/screens/screenIds';

/** 탭 스토어는 화면키 문자열만 본다 — 최대 개수 시험용으로 가짜 키를 쓴다 */
const fake = (i: number) => `sample.fake${i}` as ScreenKey;
const open = (key: ScreenKey) => useTabStore.getState().open({ screenKey: key, title: `T${key}`, path: `/sample/${key}`, closable: true });

describe('useTabStore', () => {
  beforeEach(() => useTabStore.getState().reset());

  it('홈 탭은 항상 존재하고 닫히지 않는다', () => {
    expect(useTabStore.getState().tabs.map((t) => t.key)).toEqual([HOME_SCREEN_KEY]);
    expect(useTabStore.getState().close(HOME_SCREEN_KEY)).toBeNull();
    expect(useTabStore.getState().tabs).toHaveLength(1);
  });

  it('동일 화면은 1인스턴스(활성화만), 닫으면 이웃 탭 활성화', () => {
    open('sample.notice');
    open('sample.mcnInfo');
    open('sample.notice');
    expect(useTabStore.getState().tabs).toHaveLength(3);
    expect(useTabStore.getState().activeKey).toBe('sample.notice');
    const next = useTabStore.getState().close('sample.notice');
    expect(next).toBe('sample.mcnInfo');
    expect(useTabStore.getState().activeKey).toBe('sample.mcnInfo');
  });

  it('최대 개수 초과 시 거부', () => {
    for (let i = 1; i < MAX_OPEN_TABS; i++) expect(open(fake(i))).toBe(true);
    expect(open(fake(MAX_OPEN_TABS + 1))).toBe(false);
  });

  it('다른 탭 닫기 / 오른쪽 탭 닫기 / 전체 닫기', () => {
    (['sample.commonModules', 'sample.notice', 'sample.mcnInfo', 'sample.mcnModel'] as ScreenKey[]).forEach(open);
    useTabStore.getState().closeRight('sample.notice');
    expect(useTabStore.getState().tabs.map((t) => t.key)).toEqual([HOME_SCREEN_KEY, 'sample.commonModules', 'sample.notice']);
    useTabStore.getState().closeOthers('sample.commonModules');
    expect(useTabStore.getState().tabs.map((t) => t.key)).toEqual([HOME_SCREEN_KEY, 'sample.commonModules']);
    useTabStore.getState().closeAll();
    expect(useTabStore.getState().tabs.map((t) => t.key)).toEqual([HOME_SCREEN_KEY]);
    expect(useTabStore.getState().activeKey).toBe(HOME_SCREEN_KEY);
  });
});
