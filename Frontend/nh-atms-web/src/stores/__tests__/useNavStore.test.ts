import { describe, expect, it } from 'vitest';
import type { MenuNode } from '@/types/menu';
import { findMenuByScreen, flattenScreens, resolveMenus, topNodes, toTree } from '../useNavStore';
import { menuSourceOf } from '@/config/env';

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

  it('내장 시드 권한: 기본(목 모드 아님)은 조회만 Y, 목 모드("all")는 5개 모두 Y', () => {
    const qry = flattenScreens(resolveMenus(noPathTree, 'auto').menus);
    expect(qry.every((n) => n.qryRolYn === 'Y' && n.regRolYn === 'N' && n.updRolYn === 'N' && n.delRolYn === 'N' && n.exeRolYn === 'N')).toBe(true);
    const all = flattenScreens(resolveMenus(noPathTree, 'static', 'all').menus);
    expect(all.every((n) => n.regRolYn === 'Y' && n.delRolYn === 'Y' && n.exeRolYn === 'Y')).toBe(true);
  });

  it('api: 화면이 없어도 응답 그대로, static: 시드만', () => {
    expect(resolveMenus(noPathTree, 'api')).toMatchObject({ source: 'api' });
    expect(keys(resolveMenus(noPathTree, 'api').menus)).toEqual([]);
    expect(resolveMenus([], 'static').source).toBe('static');
  });
});

describe('menuSourceOf — 운영 빌드는 항상 api', () => {
  it('production 이면 값과 상관없이 api, 그 밖은 VITE_MENU_SOURCE(없으면 auto)', () => {
    expect(menuSourceOf('production', 'auto')).toBe('api');
    expect(menuSourceOf('production', 'static')).toBe('api');
    expect(menuSourceOf('development', undefined)).toBe('auto');
    expect(menuSourceOf('development', 'static')).toBe('static');
    expect(menuSourceOf('mock', 'api')).toBe('api');
    expect(menuSourceOf('mock', 'zzz')).toBe('auto');
  });
});
