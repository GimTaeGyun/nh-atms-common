import { http, HttpResponse, type DefaultBodyType } from 'msw';

/* ---------- 폴백 — 목 핸들러가 없는 API ---------- */

export const fallbackHandlers = [
  http.all('/api/*', ({ request }) => {
    console.warn('[msw] 미정의 엔드포인트', request.method, request.url);
    return HttpResponse.json({ success: false, message: `목 핸들러가 없는 API 입니다: ${new URL(request.url).pathname}`, code: 'M404', data: null as DefaultBodyType }, { status: 404 });
  }),
];
