import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

/** dev:mock 모드에서만 호출. 운영 번들에는 동적 import 로만 포함되어 트리셰이킹 대상 */
export const startMockWorker = async (): Promise<void> => {
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true, serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` } });
  console.info('%c[MSW] 목 백엔드 활성 — 로그인: admin / admin1234! (또는 user / user1234!)', 'color:#0054a6;font-weight:bold');
};
