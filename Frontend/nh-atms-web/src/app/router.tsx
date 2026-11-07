import { Suspense } from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import { env } from '@/config/env';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { MeGate } from './MeGate';

/**
 * 로그인 화면이 없다(설계 Q1 — 고정 사용자). 앱을 열면 MeGate 가 `/api/me` 를 먼저 읽고,
 * 실패하면 서버 문구를 화면 전체에 보여 준다(로그인 화면으로 보내지 않음 → 되돌이 없음).
 */
const AppRoutes = () => (
  <Suspense fallback={<LoadingBlock height={400} />}>
    <Routes>
      <Route
        path="/*"
        element={
          <MeGate>
            <AppShell />
          </MeGate>
        }
      />
    </Routes>
  </Suspense>
);

/** vite base(예: '/atms/')를 라우터 basename('/atms')으로. 기본 '/' 는 basename 없음 */
const basename = /^\/.+/.test(import.meta.env.BASE_URL) ? import.meta.env.BASE_URL.replace(/\/+$/, '') : undefined;

/**
 * 기본은 주소창 라우팅(BrowserRouter, 하위 경로 배포 시 basename 적용).
 * hash: `/#/home` 형태 — 웹서버(WebtoB)에 SPA 새로고침(404→index.html) 설정을 넣을 수 없을 때.
 */
export const AppRouter = () =>
  env.routerMode === 'hash' ? (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  ) : (
    <BrowserRouter basename={basename}>
      <AppRoutes />
    </BrowserRouter>
  );
