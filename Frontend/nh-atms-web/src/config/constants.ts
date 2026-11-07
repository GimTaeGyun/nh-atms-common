/** 화면 폭 밴드 경계(px). 08_프론트_반응형_제안 §2 */
export const BAND_BREAKPOINTS = { M: 1280, L: 1600 } as const;
/** 콘텐츠 최소 폭(px). 이하에서는 접지 않고 페이지 가로 스크롤 */
export const CONTENT_MIN_WIDTH = 1050;
/** 이 창 폭 미만이면 사이드 패널 기본 접힘(레일 64 + 패널 220 + 콘텐츠 1050 + 여백) */
export const PANEL_AUTO_COLLAPSE_BELOW = 1366;

/** 열린 화면 탭 최대 개수 */
export const MAX_OPEN_TABS = 12;

/** 홈 화면키 (고정 탭) */
export { HOME_SCREEN_KEY } from '@/screens/screenIds';

/** 그리드 기본 페이지 크기 */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = ['20', '50', '100'];

/** 그리드 빈 결과 문구 (AS-IS 원문 유지) */
export const EMPTY_RESULT_TEXT = '검색된 데이터가 없습니다.';

/** 로컬/세션 스토리지 키 접두어 */
export const STORAGE_PREFIX = 'nh-atms';
