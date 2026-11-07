import { describe, expect, it } from 'vitest';
import type { MenuTreeNode } from '@/types/menu';
import { flattenScreens, resolveMenus } from '../useNavStore';

/** 현 백엔드 MenuTreeNode 모양 — screenId·adminYn 없음 */
const legacyTree: MenuTreeNode[] = [
  { menuNo: 10, menuName: '종합관리', menuLevel: 1, menuType: 'D', children: [
    { menuNo: 11, parentNo: 10, menuName: '영업점 등록사항', menuLevel: 2, menuType: 'D', children: [
      { menuNo: 12, parentNo: 11, menuName: '자동화기기 설치코너 관리', menuUrl: '/corner', menuLevel: 3, menuType: 'M' },
    ] },
  ] },
];

const apiTree: MenuTreeNode[] = [
  { menuNo: 1, menuName: '종합관리', menuLevel: 1, menuType: 'D', children: [
    { menuNo: 2, parentNo: 1, menuName: '영업점 등록사항', menuLevel: 2, menuType: 'D', children: [
      { menuNo: 3, parentNo: 2, menuName: '자동화기기 설치코너 관리', screenId: '3000', menuLevel: 3, menuType: 'M' },
    ] },
  ] },
];

const ids = (menus: MenuTreeNode[]) => flattenScreens(menus).map((n) => n.screenKey);

describe('resolveMenus', () => {
  it('auto: 응답에 screenId 가 있으면 응답을 그대로 쓴다', () => {
    const r = resolveMenus(apiTree, 'auto', false);
    expect(r.source).toBe('api');
    expect(ids(r.menus)).toEqual(['mgmt.cornerMgmt']); // 번호만 온 리프는 매핑으로 키를 채운다
  });

  it('auto: screenId 가 하나도 없으면(현 백엔드) 내장 시드로 대신한다', () => {
    const r = resolveMenus(legacyTree, 'auto', true);
    expect(r.source).toBe('static');
    expect(ids(r.menus)).toEqual(expect.arrayContaining(['home', 'tx.specificTx', 'mgmt.cornerMgmt', 'system.authGrant']));
  });

  it('시드 대체 시 관리자가 아니면 관리자 전용 노드를 뺀다', () => {
    const r = resolveMenus([], 'static', false);
    const all = ids(r.menus);
    expect(all).toContain('mgmt.cornerMgmt');
    expect(all).not.toContain('system.authGrant');
    expect(r.menus.some((n) => n.menuName === '관리자기능(A)')).toBe(false);
  });

  it('api: screenId 가 없어도 응답을 그대로 쓴다', () => {
    const r = resolveMenus(legacyTree, 'api', true);
    expect(r.source).toBe('api');
    expect(r.menus).toEqual(legacyTree); // 키 보강(withScreenKeys)으로 복사본이 되지만 내용은 그대로
  });
});
