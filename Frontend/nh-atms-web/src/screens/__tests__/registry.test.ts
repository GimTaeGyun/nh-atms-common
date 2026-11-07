import { describe, expect, it } from 'vitest';
import { menuPathOf, parseScreenPath, screenPath } from '../registry';

/**
 * 화면키 → 메뉴경로(TB_SCR_MENU.MENU_PATH) 공통 예시 표 — 백엔드 MenuAuthServiceTest.MENU_PATH_EXAMPLES 와 **같은 표**.
 * 한쪽 규칙·표를 바꾸면 다른 쪽도 같이 바꾼다(잠정 Q-05). 규칙: `([a-z0-9])([A-Z])` → `$1-$2`, 전체 소문자.
 */
const MENU_PATH_EXAMPLES: [string, string][] = [
  ['sample.notice', '/sample/notice'],
  ['sample.mcnInfo', '/sample/mcn-info'],
  ['sample.mcnModel', '/sample/mcn-model'],
  ['sample.commonModules', '/sample/common-modules'],
  ['popup.officeSearch', '/popup/office-search'],
  ['a.mcnABC', '/a/mcn-abc'],
  ['a.mcn2Info', '/a/mcn2-info'],
  ['home', '/home'],
];

describe('menuPathOf — 백엔드 menuPathOf 와 같은 규칙', () => {
  it.each(MENU_PATH_EXAMPLES)('%s → %s', (key, path) => {
    expect(menuPathOf(key)).toBe(path);
  });

  it('screenPath 는 레지스트리 화면에서 menuPathOf 와 같다', () => {
    expect(screenPath('sample.mcnModel')).toBe(menuPathOf('sample.mcnModel'));
    expect(screenPath('sample.commonModules')).toBe('/sample/common-modules');
    expect(screenPath('home')).toBe('/home');
  });

  it('parseScreenPath 로 되돌리면 같은 화면키', () => {
    for (const key of ['sample.notice', 'sample.mcnInfo', 'sample.mcnModel', 'sample.commonModules', 'popup.noticeEdit'] as const) {
      expect(parseScreenPath(menuPathOf(key))?.screenKey).toBe(key);
    }
  });
});
