import { beforeEach, describe, expect, it } from 'vitest';
import { selectIsAdmin, selectIsSsoUser, useAuthStore } from '../useAuthStore';
import type { UserInfo } from '@/types/auth';

const admin: UserInfo = { userId: 'admin', userName: '관리자', deptName: 'IT운영팀', roleId: 'ROLE_ADMIN' };

describe('useAuthStore — 현 백엔드 응답 대응', () => {
  beforeEach(() => useAuthStore.getState().logout('manual'));

  it('권한코드 ROLE_ADMIN(현 백엔드)·ADMIN·adminYn=Y 를 관리자로 본다', () => {
    useAuthStore.getState().login({ accessToken: 'a', refreshToken: 'r', user: admin });
    expect(selectIsAdmin(useAuthStore.getState())).toBe(true);
    useAuthStore.getState().login({ accessToken: 'a', refreshToken: 'r', user: { ...admin, roleId: 'ROLE_USER' } });
    expect(selectIsAdmin(useAuthStore.getState())).toBe(false);
    useAuthStore.getState().login({ accessToken: 'a', refreshToken: 'r', user: { ...admin, roleId: 'ROLE_USER', adminYn: 'Y' } });
    expect(selectIsAdmin(useAuthStore.getState())).toBe(true);
  });

  it('토큰 갱신 응답의 빈 사용자 항목(userName·roleId=null)이 기존 값을 지우지 않는다', () => {
    useAuthStore.getState().login({ accessToken: 'a', refreshToken: 'r', user: admin });
    const refreshed = { userId: 'admin', userName: null, deptName: 'IT운영팀', roleId: null } as unknown as UserInfo;
    useAuthStore.getState().setTokens({ accessToken: 'a2', refreshToken: 'r2' }, refreshed);
    const s = useAuthStore.getState();
    expect(s.accessToken).toBe('a2');
    expect(s.user).toMatchObject({ userName: '관리자', roleId: 'ROLE_ADMIN', deptName: 'IT운영팀' });
    expect(selectIsAdmin(s)).toBe(true);
  });

  it('로그인 방식(loginType)은 응답값을 따르고 없으면 LOCAL, 로그아웃해도 남는다(세션 종료 화면 분기용)', () => {
    useAuthStore.getState().login({ accessToken: 'a', refreshToken: 'r', user: admin });
    expect(useAuthStore.getState().loginType).toBe('LOCAL');
    expect(selectIsSsoUser(useAuthStore.getState())).toBe(false);
    useAuthStore.getState().login({ accessToken: 'a', refreshToken: 'r', user: admin, loginType: 'SSO' });
    expect(selectIsSsoUser(useAuthStore.getState())).toBe(true);
    useAuthStore.getState().logout('idle');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().loginType).toBe('SSO');
  });
});
