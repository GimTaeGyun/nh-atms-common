import { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/useAuthStore';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';

const LoginPage = lazy(() => import('@/screens/common/LoginPage'));
const SsoEntryPage = lazy(() => import('@/screens/common/SsoEntryPage'));
const SsoEndPage = lazy(() => import('@/screens/common/SsoEndPage'));

/**
 * 미인증이면 로그인 방식에 따라 보낸다(현업 회신 No 16·17):
 *   SSO(통합업무시스템에서 Ticket 으로 들어온 현업) → /sso/end (재연결·창 닫기 안내, 아이디/비밀번호 화면 아님)
 *   LOCAL(용역업체) 또는 처음 → /login
 */
export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSso = useAuthStore((s) => s.loginType === 'SSO');
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to={isSso ? '/sso/end' : '/login'} replace state={{ from: location.pathname }} />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Suspense fallback={<LoadingBlock height={400} />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* 통합업무시스템 → ATMS 진입(새창, ?ticket=) / SSO 세션 종료 안내 — 설계 18 문서 */}
      <Route path="/sso" element={<SsoEntryPage />} />
      <Route path="/sso/end" element={<SsoEndPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      />
    </Routes>
  </Suspense>
);

/** vite base(예: '/atms/')를 라우터 basename('/atms')으로. 기본 '/' 와 데모의 './' 는 basename 없음 */
const basename = /^\/.+/.test(import.meta.env.BASE_URL) ? import.meta.env.BASE_URL.replace(/\/+$/, '') : undefined;

/**
 * 기본은 주소창 라우팅(BrowserRouter, 하위 경로 배포 시 basename 적용).
 * hash: `/#/home` 형태 — 웹서버(WebtoB)에 SPA 새로고침(404→index.html) 설정을 넣을 수 없을 때.
 * memory: 주소를 바꿀 수 없는 미리보기 호스팅(데모 빌드). 새로고침하면 로그인 상태에 따라 대시보드 또는 로그인으로 시작.
 */
export const AppRouter = () =>
  env.routerMode === 'memory' ? (
    <MemoryRouter initialEntries={['/home']}>
      <AppRoutes />
    </MemoryRouter>
  ) : env.routerMode === 'hash' ? (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  ) : (
    <BrowserRouter basename={basename}>
      <AppRoutes />
    </BrowserRouter>
  );
