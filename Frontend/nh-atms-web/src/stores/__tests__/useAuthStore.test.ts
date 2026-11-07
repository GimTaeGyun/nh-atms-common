import { beforeEach, describe, expect, it } from 'vitest';
import { selectIsAdmin, selectOfcCode, useAuthStore } from '../useAuthStore';
import { MOCK_ME, ME_001_MESSAGE, setMockMeFail } from '@/mocks/handlers/me';

describe('useAuthStore — 고정 사용자(/api/me)', () => {
  beforeEach(() => {
    setMockMeFail(false);
    useAuthStore.setState({ me: null, status: 'idle', error: null });
  });

  it('loadMe 가 /api/me 를 읽어 나·사무소·관리자 여부를 채운다', async () => {
    await useAuthStore.getState().loadMe();
    const s = useAuthStore.getState();
    expect(s.status).toBe('ready');
    expect(s.me).toEqual(MOCK_ME);
    expect(selectOfcCode(s)).toBe(MOCK_ME.ofcCode);
    expect(selectIsAdmin(s)).toBe(false);
  });

  it('adminYn=Y 면 관리자', () => {
    useAuthStore.getState().setMe({ ...MOCK_ME, adminYn: 'Y' });
    expect(selectIsAdmin(useAuthStore.getState())).toBe(true);
  });

  it('401 ME_001 이면 status=error + 서버 문구·코드를 담는다(되돌이 없음)', async () => {
    setMockMeFail(true);
    await useAuthStore.getState().loadMe();
    const s = useAuthStore.getState();
    expect(s.status).toBe('error');
    expect(s.me).toBeNull();
    expect(s.error).toEqual({ code: 'ME_001', message: ME_001_MESSAGE });
    expect(selectOfcCode(s)).toBe('');
  });

  it('이미 읽었으면 force 없이는 다시 읽지 않는다', async () => {
    useAuthStore.getState().setMe(MOCK_ME);
    setMockMeFail(true);
    await useAuthStore.getState().loadMe();
    expect(useAuthStore.getState().status).toBe('ready');
    await useAuthStore.getState().loadMe(true);
    expect(useAuthStore.getState().status).toBe('error');
  });
});
