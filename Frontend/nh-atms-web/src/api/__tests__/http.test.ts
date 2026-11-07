import { afterEach, describe, expect, it, vi } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { api, apiWithMessage, bindAuthBridge } from '@/api/http';
import { appUi } from '@/hooks/useAppMessage';
import type { MessageInstance } from 'antd/es/message/interface';
import { AppError } from '@/api/errors';

describe('api/http', () => {
  afterEach(() => vi.restoreAllMocks());

  it('봉투를 벗겨 data 를 반환하고, success=false 는 AppError(server)', async () => {
    server.use(mswHttp.get('/api/ping', () => HttpResponse.json({ success: true, message: 'OK', code: '0000', data: { pong: true } })));
    await expect(api.get<{ pong: boolean }>('/ping')).resolves.toEqual({ pong: true });
    server.use(mswHttp.get('/api/fail', () => HttpResponse.json({ success: false, message: '업무 오류', code: 'B001', data: null })));
    await expect(api.get('/fail')).rejects.toMatchObject({ kind: 'server', message: '업무 오류', code: 'B001' });
  });

  it('HTTP 상태 → kind 매핑', async () => {
    server.use(mswHttp.get('/api/forbidden', () => HttpResponse.json({ success: false, message: '권한 없음' }, { status: 403 })));
    const err = await api.get('/forbidden').catch((e) => e as AppError);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).kind).toBe('forbidden');
  });

  it('401 → refresh 단일 비행 후 원요청 재시도', async () => {
    let refreshCalls = 0;
    let token = 'old';
    bindAuthBridge({ getAccessToken: () => token, getRefreshToken: () => 'r1', onRefreshed: (t) => { token = t.accessToken; }, onAuthFailed: () => undefined });
    server.use(
      mswHttp.get('/api/secure', ({ request }) => (request.headers.get('authorization') === 'Bearer new' ? HttpResponse.json({ success: true, message: 'OK', code: '0000', data: 'ok' }) : HttpResponse.json({ success: false, message: '만료' }, { status: 401 }))),
      mswHttp.post('/api/auth/refresh', async () => { refreshCalls++; return HttpResponse.json({ success: true, message: 'OK', code: '0000', data: { accessToken: 'new', refreshToken: 'r2' } }); }),
    );
    const results = await Promise.all([api.get<string>('/secure'), api.get<string>('/secure'), api.get<string>('/secure')]);
    expect(results).toEqual(['ok', 'ok', 'ok']);
    expect(refreshCalls).toBe(1);
  });
});

describe('api/http 파라미터 형식', () => {
  it('배열은 대괄호 없이 같은 키를 반복한다 (Spring List<String> 기본 바인딩)', async () => {
    let seen: URLSearchParams | null = null;
    server.use(mswHttp.get('/api/stat/uptime', ({ request }) => { seen = new URL(request.url).searchParams; return HttpResponse.json({ success: true, message: 'OK', code: '200', data: [] }); }));
    await api.get('/stat/uptime', { params: { regions: ['01', '02'], unit: 'M' } });
    expect(seen!.getAll('regions')).toEqual(['01', '02']);
    expect(seen!.has('regions[]')).toBe(false);
  });

  it('성공 응답의 서버 문구를 그대로 띄우고, 문구가 없거나 quietSuccess 면 띄우지 않는다', async () => {
    const success = vi.fn();
    appUi.message = { success } as unknown as MessageInstance;
    try {
      server.use(
        mswHttp.post('/api/save', () => HttpResponse.json({ success: true, message: '저장되었습니다.', code: '0000', data: { id: 1 } })),
        mswHttp.get('/api/list', () => HttpResponse.json({ success: true, message: null, code: '0000', data: [] })),
      );
      await expect(api.post('/save', {})).resolves.toEqual({ id: 1 });
      expect(success).toHaveBeenCalledWith('저장되었습니다.');
      success.mockClear();
      await api.get('/list');
      await api.post('/save', {}, { quietSuccess: true });
      expect(success).not.toHaveBeenCalled();
      await expect(apiWithMessage.post('/save', {})).resolves.toEqual({ data: { id: 1 }, message: '저장되었습니다.' });
      expect(success).not.toHaveBeenCalled();
    } finally {
      appUi.message = null;
    }
  });
});
