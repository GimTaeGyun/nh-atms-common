import { lazy } from 'react';
import type { L1Slug, ScreenDef } from '@/types/screen';
import { HOME_SCREEN_KEY, SCREEN_IDS, isScreenKey, type ScreenKey } from './screenIds';
import { L1_BY_SLUG, isL1Slug } from './l1';

/**
 * 화면 레지스트리 — 영문 화면키 → 컴포넌트/제목/대분류. 등록하면 라우트·탭·브레드크럼이 자동 연결된다.
 * 파일명 규칙: `screens/<slug>/{PascalName}Page.tsx` (1 화면키 = 1 파일, 번호 없음). 라우트는 /{slug}/{kebab-case 이름}.
 * 메뉴 테이블(TB_SCR_MENU.MENU_PATH)에는 이 라우트 경로를 넣는다 → `parseScreenPath` 로 화면키를 찾는다(잠정 Q-05).
 */
/** camelCase → kebab: 정규식 `([a-z0-9])([A-Z])` → `$1-$2` 후 전체 소문자 (백엔드 MenuAuthService.menuPathOf 와 같은 규칙) */
const kebab = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * 화면키 문자열 → 메뉴 경로(TB_SCR_MENU.MENU_PATH). 'sample.mcnInfo' → '/sample/mcn-info', 'a.mcnABC' → '/a/mcn-abc'.
 * 점이 없으면 '/' + kebab(키) ('home' → '/home'). 규칙은 백엔드 `MenuAuthService.menuPathOf` 와 한 글자도 다르면 안 된다
 * — 두 쪽 테스트(registry.test.ts · MenuAuthServiceTest)에 같은 예시 표가 있다(잠정 Q-05).
 */
export const menuPathOf = (screenKey: string): string => {
  const k = screenKey.trim();
  const dot = k.indexOf('.');
  return (dot < 0 ? `/${kebab(k)}` : `/${k.slice(0, dot)}/${kebab(k.slice(dot + 1))}`).toLowerCase();
};

/** 화면키 → 라우트 경로. 홈은 /home. 예: 'sample.mcnInfo' → '/sample/mcn-info' (slug 를 주면 대분류만 바꿈) */
export const screenPath = (key: ScreenKey, slug?: L1Slug): string => {
  if (key === HOME_SCREEN_KEY) return '/home';
  const [s, name] = key.split('.') as [string, string];
  return slug && slug !== s ? `/${slug}/${kebab(name)}` : menuPathOf(key);
};

type ScreenModule = { default: ScreenDef['component'] extends React.LazyExoticComponent<infer C> ? C : never };

const def = (key: ScreenKey, title: string, slug: L1Slug, group: string, loader: () => Promise<ScreenModule>, extra?: Partial<ScreenDef>): ScreenDef => ({
  key,
  screenId: SCREEN_IDS[key],
  path: screenPath(key, slug),
  title,
  slug,
  group,
  openMode: key === HOME_SCREEN_KEY ? 'HOME' : 'TAB',
  component: lazy(loader),
  status: 'done',
  ...extra,
});

export const SCREENS: Record<string, ScreenDef> = Object.fromEntries(
  [
    def(HOME_SCREEN_KEY, '홈', 'home', '', () => import('./home/HomePage')),
    // ---- 견본(sample): 공통 모듈 화면 + CRUD 모양 3가지 ----
    def('sample.commonModules', '공통 모듈', 'sample', '', () => import('./sample/CommonModulesPage')),
    def('sample.notice', '공지사항', 'sample', '', () => import('./sample/NoticePage')),
    def('sample.mcnInfo', '기기정보', 'sample', '', () => import('./sample/McnInfoPage')),
    def('sample.mcnModel', '기기모델코드', 'sample', '', () => import('./sample/McnModelPage')),
  ].map((d) => [d.key, d]),
);

const BY_PATH: Record<string, ScreenDef> = Object.fromEntries(Object.values(SCREENS).map((d) => [d.path, d]));

export const getScreen = (key?: string | null): ScreenDef | undefined => (key ? SCREENS[key] : undefined);

/**
 * 경로 → {slug, screenKey}. /home 과 /{slug}/{kebab} 만 인정.
 * 메뉴 응답의 `menuPath` 도 이것으로 화면키를 찾는다. 레지스트리에 없는(아직 미구현) 화면도 screenIds 에 키가 있으면 연다.
 */
export const parseScreenPath = (pathname: string | null | undefined): { slug: L1Slug; screenKey: ScreenKey } | null => {
  if (!pathname) return null;
  const p = pathname.trim().replace(/\/+$/, '') || '/';
  if (p === '/home') return { slug: 'home', screenKey: HOME_SCREEN_KEY };
  const m = /^\/([a-z]+)\/([a-z0-9-]+)$/.exec(p);
  if (!m || !isL1Slug(m[1])) return null;
  const hit = BY_PATH[p];
  if (hit) return { slug: m[1], screenKey: hit.key };
  const camel = m[2].replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
  const key = `${m[1]}.${camel}`;
  return isScreenKey(key) ? { slug: m[1], screenKey: key } : null;
};

export const l1Label = (slug: L1Slug): string => L1_BY_SLUG[slug]?.label ?? slug;
