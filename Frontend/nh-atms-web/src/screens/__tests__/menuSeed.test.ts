import { describe, expect, it } from 'vitest';
import menuSql from '../../../../../db/seed/01_menu.sql?raw';
import { buildMenuSeed } from '../menuSeed';

/** db/seed/01_menu.sql 의 USING 절 행(MENU_ID, PARENT_MENU_ID, MENU_NM, MENU_TYPE, MENU_PATH, SORT_NO, USE_YN)을 읽는다 */
const sqlRows = (): string[][] =>
  menuSql
    .split('\n')
    .filter((l) => /^\s*SELECT\s+'SMP\d{3}'/.test(l))
    .map((l) =>
      l
        .replace(/^\s*SELECT\s+/, '')
        .replace(/\s+FROM\s+DUAL.*$/, '')
        .replace(/CAST\(NULL AS VARCHAR2\(\d+\)\)/, 'NULL')
        .replace(/\s+AS\s+[A-Z_]+/g, '')
        .split(',')
        .map((v) => v.trim().replace(/^'(.*)'$/, '$1')),
    );

describe('menuSeed = db/seed/01_menu.sql', () => {
  it('메뉴 ID·상위·이름·종류·경로·순서가 DB 시드와 같다', () => {
    const [g] = buildMenuSeed();
    const fromSeed = [g, ...g.children].map((n) => [n.menuId, n.parentMenuId, n.menuNm, n.menuType, n.menuPath ?? 'NULL', String(n.sortNo), n.useYn]);
    expect(fromSeed).toEqual(sqlRows());
    expect(fromSeed[0]).toEqual(['SMP000', '0', '견본', 'G', 'NULL', '900', 'Y']);
  });
});
