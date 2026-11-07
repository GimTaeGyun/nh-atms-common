import { afterEach, describe, expect, it, vi } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { api, apiWithMessage, bindScreenContext } from '@/api/http';
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

  it('401 은 재시도 없이 unauthorized + 서버 응답코드(로그인 없음, 토큰·refresh 없음)', async () => {
    let calls = 0;
    server.use(mswHttp.get('/api/me-like', () => { calls++; return HttpResponse.json({ success: false, message: '고정 사용자 확인 불가', code: 'ME_001', data: null }, { status: 401 }); }));
    const err = (await api.get('/me-like').catch((e) => e)) as AppError;
    expect(err).toMatchObject({ kind: 'unauthorized', code: 'ME_001', message: '고정 사용자 확인 불가', status: 401 });
    expect(calls).toBe(1);
  });

  it('모든 요청에 X-Screen-Key / X-Screen-Name(인코딩) 헤더, Authorization 은 없다', async () => {
    let headers: Headers | null = null;
    server.use(mswHttp.get('/api/hdr', ({ request }) => { headers = request.headers; return HttpResponse.json({ success: true, message: null, code: '0000', data: 1 }); }));
    bindScreenContext({ getActiveScreen: () => ({ key: 'sample.notice', name: '공지사항' }) });
    await api.get('/hdr');
    expect(headers!.get('x-screen-key')).toBe('sample.notice');
    expect(decodeURIComponent(headers!.get('x-screen-name') ?? '')).toBe('공지사항');
    expect(headers!.get('authorization')).toBeNull();
  });
});

describe('api/http 파라미터 형식', () => {
  it('배열은 대괄호 없이 같은 키를 반복한다 (Spring List<String> 기본 바인딩)', async () => {
    let seen: URLSearchParams | null = null;
    server.use(mswHttp.get('/api/arr', ({ request }) => { seen = new URL(request.url).searchParams; return HttpResponse.json({ success: true, message: 'OK', code: '200', data: [] }); }));
    await api.get('/arr', { params: { nos: ['01', '02'], unit: 'M' } });
    expect(seen!.getAll('nos')).toEqual(['01', '02']);
    expect(seen!.has('nos[]')).toBe(false);
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
