import { create } from 'zustand';
import type { Me } from '@/types/auth';
import { meApi } from '@/api/endpoints/me';
import { toAppError } from '@/api/errors';

/**
 * 나(고정 사용자) 스토어 — 로그인이 없다(설계 Q1). 앱 시작 때 `GET /api/me` 결과를 한 번 담는다.
 * 실패(401 ME_001 등)하면 status='error' 와 서버 문구를 담고, 화면 전체에 그 문구를 보여 준다(MeGate).
 * 로그인 화면·토큰·세션 타이머·자동 로그아웃은 없다. SSO 를 붙일 때 바꿀 곳: 서버 FixedUserFilter + 이 스토어.
 * 이름은 원본(nh-atms)과 같은 `useAuthStore` 로 두어 복사해 온 부품이 그대로 쓰게 했다.
 */
export type MeStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AuthState {
  me: Me | null;
  status: MeStatus;
  /** 실패 시 서버 응답코드(예: ME_001)·문구 */
  error: { code?: string; message: string } | null;
  /** /api/me 를 읽는다. 이미 읽었으면(force 아님) 건너뛴다 */
  loadMe: (force?: boolean) => Promise<void>;
  /** 테스트·미리보기용으로 직접 넣기 */
  setMe: (me: Me | null) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  me: null,
  status: 'idle',
  error: null,
  loadMe: async (force = false) => {
    const { status } = get();
    if (status === 'loading' || (status === 'ready' && !force)) return;
    set({ status: 'loading', error: null });
    try {
      const me = await meApi.get();
      set({ me, status: 'ready', error: null });
    } catch (e) {
      const err = toAppError(e);
      set({ me: null, status: 'error', error: { code: err.code, message: err.userMessage } });
    }
  },
  setMe: (me) => set({ me, status: me ? 'ready' : 'idle', error: null }),
}));

/** 내 사무소 코드 (조회조건 기본값). 없으면 '' */
export const selectOfcCode = (s: AuthState): string => s.me?.ofcCode ?? '';
/** 관리자 여부 — 서버가 정한 adminYn(잠정: AUTH='A') 그대로 */
export const selectIsAdmin = (s: AuthState): boolean => s.me?.adminYn === 'Y';
