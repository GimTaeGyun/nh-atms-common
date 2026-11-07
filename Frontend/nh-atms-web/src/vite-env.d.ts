/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_ENV_LABEL?: string;
  /** browser(기본) | hash */
  readonly VITE_ROUTER?: string;
  /** auto(기본) | api | static — 메뉴 트리 출처 */
  readonly VITE_MENU_SOURCE?: string;
  /** 빌드 시 기준 경로(vite base). 기본 '/', 하위 경로 배포 시 예: '/atms/' */
  readonly VITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
/** 목 서버 포함 여부(빌드 시점 상수, vite.config.ts define) */
declare const __MOCK_ENABLED__: boolean;
