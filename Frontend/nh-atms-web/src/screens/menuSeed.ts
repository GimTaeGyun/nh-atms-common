import type { MenuNode } from '@/types/menu';
import { L1_BY_SLUG } from './l1';
import { screenPath } from './registry';
import type { ScreenKey } from './screenIds';

/**
 * 내장 메뉴 시드 — `GET /api/menu/my` 와 **같은 모양(계약 MenuNode)** 의 트리.
 * 쓰는 곳: ① 목 서버 `/api/menu/my` 응답(mocks/data/menu.ts) ② 실서버 응답에 화면(MENU_PATH)이 하나도 없을 때의
 * 대체 메뉴(useNavStore `resolveMenus`, VITE_MENU_SOURCE=auto|static).
 * 실서버는 TB_SCR_MENU 에 같은 구조를 넣는다: 그룹(G) MENU_NM = l1.ts 의 name, 화면(M) MENU_PATH = 라우트 경로.
 * 권한 5개는 시드에서 모두 'Y' — 권한이 없는 모습은 공통 모듈 화면의 "권한 미리보기"로 본다(표시만 바꿈).
 */
const SAMPLE: { key: ScreenKey; name: string }[] = [
  { key: 'sample.commonModules', name: '공통 모듈' },
  { key: 'sample.notice', name: '공지사항' },
  { key: 'sample.mcnInfo', name: '기기정보' },
  { key: 'sample.mcnModel', name: '기기모델코드' },
];

const ALL_Y = { useYn: 'Y', qryRolYn: 'Y', regRolYn: 'Y', updRolYn: 'Y', delRolYn: 'Y', exeRolYn: 'Y' } as const;

export const buildMenuSeed = (): MenuNode[] => [
  {
    menuId: 'SAMPLE',
    parentMenuId: 'ROOT',
    menuNm: L1_BY_SLUG.sample.name,
    menuType: 'G',
    menuPath: null,
    sortNo: 1,
    ...ALL_Y,
    children: SAMPLE.map((s, i) => ({
      menuId: `SAMPLE_${String(i + 1).padStart(2, '0')}`,
      parentMenuId: 'SAMPLE',
      menuNm: s.name,
      menuType: 'M',
      menuPath: screenPath(s.key),
      sortNo: i + 1,
      ...ALL_Y,
      children: [],
    })),
  },
];
