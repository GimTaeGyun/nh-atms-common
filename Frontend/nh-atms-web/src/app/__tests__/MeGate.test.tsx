import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { MeGate } from '@/app/MeGate';
import { useAuthStore } from '@/stores/useAuthStore';
import { ME_001_MESSAGE, setMockMeFail } from '@/mocks/handlers/me';

describe('MeGate — 로그인 없이 /api/me 확인', () => {
  beforeEach(() => useAuthStore.setState({ me: null, status: 'idle', error: null }));
  afterEach(() => setMockMeFail(false));

  it('성공하면 앱을 그린다', async () => {
    renderWithProviders(<MeGate><div>앱 본문</div></MeGate>);
    expect(await screen.findByText('앱 본문')).toBeInTheDocument();
    expect(useAuthStore.getState().me?.name).toBe('홍길동');
  });

  it('ME_001 이면 서버 문구를 화면 전체에 보이고(로그인 화면 없음), 다시 시도하면 다시 읽는다', async () => {
    setMockMeFail(true);
    renderWithProviders(<MeGate><div>앱 본문</div></MeGate>);
    expect(await screen.findByTestId('me-error')).toHaveTextContent(ME_001_MESSAGE);
    expect(screen.getByText('응답코드 ME_001')).toBeInTheDocument();
    expect(screen.queryByText('앱 본문')).toBeNull();
    setMockMeFail(false);
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('앱 본문')).toBeInTheDocument();
  });
});
