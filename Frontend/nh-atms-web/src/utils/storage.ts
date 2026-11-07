import { STORAGE_PREFIX } from '@/config/constants';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const safe = (store: Store | undefined) => ({
  get<T>(key: string, fallback: T): T {
    try {
      const raw = store?.getItem(`${STORAGE_PREFIX}:${key}`);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      store?.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value));
    } catch {
      /* 스토리지 불가(프라이빗 모드 등) — 무시 */
    }
  },
  remove(key: string): void {
    try {
      store?.removeItem(`${STORAGE_PREFIX}:${key}`);
    } catch {
      /* ignore */
    }
  },
});

const hasWindow = typeof window !== 'undefined';
/** 저장소 접근 자체가 예외를 던지는 환경(잠긴 프레임·차단된 사이트 데이터)에서는 저장 없이 동작 */
const pick = (get: () => Storage): Store | undefined => {
  try {
    return hasWindow ? get() : undefined;
  } catch {
    return undefined;
  }
};
/** 브라우저 탭 세션 범위 (토큰·열린 탭 등) */
export const sessionStore = safe(pick(() => window.sessionStorage));
/** 사용자 PC 범위 (사이드바 접힘, 즐겨찾기 로컬 폴백 등) */
export const localStore = safe(pick(() => window.localStorage));
