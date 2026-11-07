import { describe, expect, it } from 'vitest';
import type { MenuNode } from '@/types/menu';
import { findMenuByScreen, flattenScreens, resolveMenus, topNodes, toTree } from '../useNavStore';

const node = (p: Partial<MenuNode> & Pick<MenuNode, 'menuId' | 'menuNm'>): MenuNode => ({
  parentMenuId: 'ROOT',
  menuType: 'M',
  menuPath: null,
  sortNo: 1,
  useYn: 'Y',
  qryRolYn: 'Y',
  regRolYn: 'N',
  updRolYn: 'N',
  delRolYn: 'N',
  exeRolYn: 'N',
  children: [],
  ...p,
});

/** 계약 MenuNode 모양 — MENU_PATH 로 화면을 잇는다 */
const apiTree: MenuNode[] = [
  node({ menuId: 'S', menuNm: '견본', menuType: 'G', children: [
    node({ menuId: 'S2', parentMenuId: 'S', menuNm: '공지사항', menuPath: '/sample/notice', sortNo: 2, regRolYn: 'Y' }),
    node({ menuId: 'S1', parentMenuId: 'S', menuNm: '기기정보', menuPath: '/sample/mcn-info', sortNo: 1 }),
    node({ menuId: 'S3', parentMenuId: 'S', menuNm: '사용안함', menuPath: '/sample/mcn-model', sortNo: 3, useYn: 'N' }),
    node({ menuId: 'S4', parentMenuId: 'S', menuNm: '모르는 경로', menuPath: '/zzz/unknown', sortNo: 4 }),
  ] }),
];

/** 화면 경로가 하나도 없는 응답(메뉴 테이블에 MENU_PATH 미입력) */
const noPathTree: MenuNode[] = [node({ menuId: 'X', menuNm: '견본', menuType: 'G', children: [node({ menuId: 'X1', parentMenuId: 'X', menuNm: '무엇', menuPath: null })] })];

const keys = (menus: ReturnType<typeof toTree>) => flattenScreens(menus).map((n) => n.screenKey);

describe('toTree / resolveMenus', () => {
  it('menuPath → 화면키, sortNo 순, useYn=N 제외, 모르는 경로는 화면키 없음', () => {
    const t = toTree(apiTree);
    expect(t[0].level).toBe(1);
    expect(t[0].children.map((c) => c.menuNm)).toEqual(['기기정보', '공지사항', '모르는 경로']);
    expect(keys(t)).toEqual(['sample.mcnInfo', 'sample.notice']);
    expect(topNodes(t).map((x) => x.slug)).toEqual(['sample']);
    expect(findMenuByScreen(t, 'sample.notice')?.regRolYn).toBe('Y');
  });

  it('auto: 응답에 화면이 있으면 응답을 쓴다', () => {
    const r = resolveMenus(apiTree, 'auto');
    expect(r.source).toBe('api');
    expect(keys(r.menus)).toEqual(['sample.mcnInfo', 'sample.notice']);
  });

  it('auto: 화면이 하나도 없으면 내장 시드(견본 4화면)로 대신한다', () => {
    const r = resolveMenus(noPathTree, 'auto');
    expect(r.source).toBe('static');
    expect(keys(r.menus)).toEqual(['sample.commonModules', 'sample.notice', 'sample.mcnInfo', 'sample.mcnModel']);
  });

  it('api: 화면이 없어도 응답 그대로, static: 시드만', () => {
    expect(resolveMenus(noPathTree, 'api')).toMatchObject({ source: 'api' });
    expect(keys(resolveMenus(noPathTree, 'api').menus)).toEqual([]);
    expect(resolveMenus([], 'static').source).toBe('static');
  });
});
