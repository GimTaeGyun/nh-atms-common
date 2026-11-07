import { defineConfig, devices } from '@playwright/test';

/**
 * E2E / 스크린샷 회귀.
 *  - 폐쇄망: 윈도 PC 는 PW_CHANNEL=msedge 로 설치된 Edge 를 쓰거나, 반입한 브라우저를 PLAYWRIGHT_BROWSERS_PATH
 *    (빌드 번호를 @playwright/test 버전과 맞춤) 또는 PW_CHROMIUM_PATH 로 지정한다.
 *  - 기본은 MSW 목 모드로 dev 서버를 띄워 백엔드 없이 전 화면을 연다.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
    // 브라우저 선택(위에서부터 우선): PW_CHROMIUM_PATH=반입한 chromium 실행 파일 / PW_CHANNEL=msedge(윈도 PC 에 설치된 Edge, 브라우저 반입 불필요)
    ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  projects: [
    { name: 'desktop-1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 1024 } } },
    { name: 'desktop-1920', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
  ],
  webServer: {
    command: 'npm run dev:mock',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
