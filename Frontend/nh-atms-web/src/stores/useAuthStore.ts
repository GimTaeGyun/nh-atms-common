import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LoginResponse, LoginType, TokenPair, UserInfo } from '@/types/auth';
import { bindAuthBridge } from '@/api/http';
import { STORAGE_PREFIX } from '@/config/constants';
import { compactParams } from '@/utils/object';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  accessExpiresAt: number | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  /** 로그아웃 사유 (로그인 화면 안내용) */
  logoutReason: 'manual' | 'expired' | 'idle' | null;
  /**
   * 마지막 로그인 방식. 로그아웃해도 지우지 않는다 — 세션이 끝난 뒤 SSO(현업)는 재연결 안내(/sso/end),
   * LOCAL(용역업체)은 로그인 화면(/login)으로 보내야 하므로(현업 회신 No 16·17).
   */
  loginType: LoginType | null;
  login: (res: LoginResponse) => void;
  setTokens: (tokens: TokenPair, user?: UserInfo) => void;
  logout: (reason?: 'manual' | 'expired' | 'idle') => void;
  clearReason: () => void;
}

/**
 * 토큰 갱신 응답의 사용자 정보는 비어 있을 수 있다(현 백엔드 /auth/refresh 는 userName·roleId 를 null 로 보냄).
 * 값이 있는 항목만 덮어써서 이름·권한이 갱신 후에 사라지지 않게 한다.
 */
const mergeUser = (prev: UserInfo | null, next?: UserInfo): UserInfo | null => {
  if (!next) return prev;
  if (!prev) return next;
  const filled = compactParams(next);
  return { ...prev, ...filled };
};

const decodeExp = (token: string | null): number | null => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      accessExpiresAt: null,
      user: null,
      isAuthenticated: false,
      logoutReason: null,
      loginType: null,
      login: (res) =>
        set({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          accessExpiresAt: res.accessExpiresAt ?? decodeExp(res.accessToken),
          user: res.user,
          isAuthenticated: true,
          logoutReason: null,
          loginType: res.loginType ?? 'LOCAL',
        }),
      setTokens: (tokens, user) =>
        set((s) => ({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessExpiresAt: tokens.accessExpiresAt ?? decodeExp(tokens.accessToken),
          user: mergeUser(s.user, user),
          isAuthenticated: true,
        })),
      logout: (reason = 'manual') => {
        if (!get().isAuthenticated) return;
        set({ accessToken: null, refreshToken: null, accessExpiresAt: null, user: null, isAuthenticated: false, logoutReason: reason });
        // 세션 범위 캐시(열린 탭/메뉴)는 각 스토어가 isAuthenticated 변화를 구독해 정리한다.
      },
      clearReason: () => set({ logoutReason: null }),
    }),
    {
      name: `${STORAGE_PREFIX}:auth`,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, accessExpiresAt: s.accessExpiresAt, user: s.user, isAuthenticated: s.isAuthenticated, loginType: s.loginType }),
    },
  ),
);

/* http 클라이언트에 인증 브리지 연결 (순환 import 없이 콜백만 전달) */
bindAuthBridge({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onRefreshed: (tokens, user) => useAuthStore.getState().setTokens(tokens, user),
  onAuthFailed: () => useAuthStore.getState().logout('expired'),
});

/** 통합로그인(SSO)으로 들어온 현업 사용자인가 — 세션 종료 뒤 안내 화면 분기 */
export const selectIsSsoUser = (s: AuthState): boolean => s.loginType === 'SSO';
/** 로그인 사무소 코드 (조회조건 기본값) */
export const selectOfficeCd = (s: AuthState): string => s.user?.officeCd ?? '';
/** 관리자: adminYn='Y' 또는 권한코드 ADMIN / ROLE_ADMIN(현 백엔드 T_AUTH.AUTH_CODE) */
export const selectIsAdmin = (s: AuthState): boolean => s.user?.adminYn === 'Y' || s.user?.roleId === 'ADMIN' || s.user?.roleId === 'ROLE_ADMIN';
