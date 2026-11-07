import type { ComponentType, LazyExoticComponent } from 'react';
import type { ScreenKey } from '@/screens/screenIds';

export type { ScreenKey };

/** 대분류 slug — 라우트 /{slug}/{kebab-case 화면키 이름} */
export type L1Slug = 'home' | 'tx' | 'closing' | 'mgmt' | 'journal' | 'stat' | 'outsrc' | 'board' | 'system';

export interface L1Def {
  slug: L1Slug;
  /** 메뉴 트리 대분류명 (AS-IS 서브탭) */
  name: string;
  /** 상단 네비 표기 */
  label: string;
  /** @ant-design/icons 컴포넌트명 */
  icon: string;
  adminOnly?: boolean;
}

export type OpenMode = 'TAB' | 'POPUP' | 'HOME';

export interface ScreenDef {
  /** 영문 화면키(소스 식별자). 화면번호는 screenIds.ts 매핑에서만 */
  key: ScreenKey;
  /** AS-IS 화면번호(표시용, 매핑에서 파생) */
  screenId: string;
  /** 라우트 경로 /{slug}/{kebab} */
  path: string;
  title: string;
  slug: L1Slug;
  /** 폴더(2뎁스) 명 — 브레드크럼 */
  group?: string;
  openMode: OpenMode;
  adminOnly?: boolean;
  component: LazyExoticComponent<ComponentType<ScreenProps>>;
  /** 구현 상태 (미구현은 플레이스홀더로 자동 노출) */
  status?: 'done' | 'wip';
}

export interface ScreenProps {
  /** 영문 화면키 — PageFrame·usePermission·useOpenScreen 에 쓴다 */
  screenKey: ScreenKey;
  /** 표시용 화면번호(매핑에서 파생). 코드 분기에 쓰지 않는다 */
  screenId: string;
  /** 탭이 현재 활성인지 (keep-alive 중 백그라운드면 false) */
  active: boolean;
}
