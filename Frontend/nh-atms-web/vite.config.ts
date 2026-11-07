/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * 개발 서버 프록시가 백엔드로 넘길 때 Origin 헤더를 뺀다.
 * 백엔드 CORS 허용 목록(로컬 3000·5173, 폐쇄망 nh 프로파일은 CORS_ALLOWED_ORIGINS)에 개발 포트 3100 이 없어도
 * POST(등록·수정 등)가 403 으로 막히지 않게 하기 위함 — 개발 서버에서만 적용되고 운영(같은 출처 배포)과는 무관하다.
 */
const dropOrigin: ProxyOptions['configure'] = (proxy) => {
  proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env.* 의 비공개 키(DEV_PROXY_*)와 VITE_BASE 를 설정 단계에서 읽는다(브라우저 번들에는 VITE_ 키만 들어감)
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const apiTarget = fileEnv.DEV_PROXY_TARGET || 'http://localhost:8080';
  return {
    base: fileEnv.VITE_BASE || '/',
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      // 목 서버(MSW)를 번들에 넣을지. 운영(production) 빌드는 항상 false → 목 코드 청크가 산출물에서 아예 빠진다
      __MOCK_ENABLED__: JSON.stringify(mode !== 'production' && fileEnv.VITE_USE_MOCK === 'true'),
    },
    server: {
      port: 3100,
      proxy: {
        // 대상은 .env.development(.local) 의 DEV_PROXY_TARGET 으로 바꾼다
        '/api': { target: apiTarget, changeOrigin: true, configure: dropOrigin },
      },
    },
    // AS-IS(ES2020) 사본에 그대로 들어가므로 ES2022+ 문법·API 가 번들에 남지 않게 한다
    build: {
      // 목 빌드(build:mock)는 dist-mock/ 에 따로 — 운영 산출물 dist/ 를 덮어써 목 화면이 운영으로 나가는 일이 없게
      outDir: mode === 'mock' ? 'dist-mock' : 'dist',
      target: 'es2020',
      sourcemap: false,
      chunkSizeWarningLimit: 1100,
      rollupOptions: {
        output: {
          // 큰 벤더만 따로 묶고, 화면·공통 코드는 Rollup 기본 분할(화면별 lazy 청크 + 공유 청크)에 맡긴다.
          // (화면 디렉터리별 수동 청크는 공용 모듈을 특정 화면 청크로 끌어들여 초기 로딩에 모든 화면 청크가 실리는 문제가 있었다)
          // msw·xlsx 는 여기서 묶지 않아 목 모드·엑셀 다운로드 때만 불러온다.
          // 아이콘(@ant-design/icons)은 antd 와 같은 청크에 둔다. 따로 떼면 icons → @ant-design/colors(antd 청크) → icons 로
          // 청크끼리 서로 import 해, antd 6.3.1 에서 운영 빌드가 시작 시 'Cannot access … before initialization' 로 멈췄다.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](antd|@ant-design|@rc-component|rc-[^\\/]+)[\\/]/.test(id)) return 'vendor-antd';
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            return undefined;
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      coverage: { provider: 'v8', reporter: ['text', 'html'], include: ['src/utils/**', 'src/components/**', 'src/stores/**'] },
    },
  };
});
