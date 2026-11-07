import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavStore } from '@/stores/useNavStore';
import { ActionBar, AuthButton, AuthGuard, ScreenIdProvider } from '@/components/auth';

const wrap = (ui: ReactNode) => render(<ConfigProvider>{ui}</ConfigProvider>);

/** 일반 사용자 + 화면 권한 시드 (RO: 읽기만, RW: 읽기/쓰기) */
const seed = () => {
  useAuthStore.getState().login({ accessToken: 'a', refreshToken: 'r', user: { userId: 'u100', userName: '사용자', deptName: '영업점', roleId: 'ROLE_USER' } });
  useNavStore.setState({
    menus: [
      { menuNo: 1, menuName: '읽기전용', screenKey: 'tx.specificTx', menuType: 'M', readYn: 'Y', writeYn: 'N' },
      { menuNo: 2, menuName: '쓰기가능', screenKey: 'mgmt.cornerMgmt', menuType: 'M', readYn: 'Y', writeYn: 'Y' },
    ],
  });
};

describe('AuthButton / AuthGuard', () => {
  beforeEach(seed);

  it('쓰기 권한이 없으면 비활성 + 툴팁 "권한이 없습니다."', async () => {
    const onClick = vi.fn();
    wrap(<AuthButton screenKey="tx.specificTx" onClick={onClick}>저장</AuthButton>);
    const btn = screen.getByRole('button', { name: '저장' });
    expect(btn).toBeDisabled();
    await userEvent.hover(btn.parentElement!);
    expect(await screen.findByText('권한이 없습니다.')).toBeInTheDocument();
  });

  it('mode=hide 이면 렌더하지 않고, 쓰기 권한이 있으면 활성', () => {
    wrap(
      <>
        <AuthButton screenKey="tx.specificTx" mode="hide">숨김</AuthButton>
        <AuthButton screenKey="mgmt.cornerMgmt">활성</AuthButton>
        <AuthButton screenKey="tx.specificTx" need="read">읽기</AuthButton>
      </>,
    );
    expect(screen.queryByRole('button', { name: '숨김' })).toBeNull();
    expect(screen.getByRole('button', { name: '활성' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '읽기' })).toBeEnabled();
  });

  it('ScreenIdProvider 의 화면 ID 를 쓰고, AuthGuard 는 fallback 을 보여준다', () => {
    wrap(
      <ScreenIdProvider screenKey="tx.specificTx">
        <AuthButton>등록</AuthButton>
        <AuthGuard fallback={<span>권한 없음</span>}>
          <span>편집 영역</span>
        </AuthGuard>
        <AuthGuard need="read">
          <span>조회 영역</span>
        </AuthGuard>
      </ScreenIdProvider>,
    );
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();
    expect(screen.getByText('권한 없음')).toBeInTheDocument();
    expect(screen.queryByText('편집 영역')).toBeNull();
    expect(screen.getByText('조회 영역')).toBeInTheDocument();
  });

  it('관리자는 화면 권한과 무관하게 쓰기 가능, need=admin 은 관리자만', () => {
    useAuthStore.getState().login({ accessToken: 'a', refreshToken: 'r', user: { userId: 'admin', userName: '관리자', deptName: 'IT', roleId: 'ROLE_ADMIN' } });
    wrap(<AuthButton screenKey="tx.specificTx" need="admin">관리</AuthButton>);
    expect(screen.getByRole('button', { name: '관리' })).toBeEnabled();
  });
});

describe('ActionBar', () => {
  beforeEach(seed);

  it('키만 넘기면 기본 라벨로 렌더되고, 쓰기 권한 없으면 변경성 버튼만 비활성', () => {
    wrap(<ActionBar screenKey="tx.specificTx" actions={['search', 'excel', 'save', 'delete', 'close']} />);
    for (const name of ['조회', '엑셀', '닫기']) expect(screen.getByRole('button', { name: new RegExp(name) })).toBeEnabled();
    for (const name of ['저장', '삭제']) expect(screen.getByRole('button', { name: new RegExp(name) })).toBeDisabled();
  });

  it('mode=hide 이면 권한 없는 버튼을 숨긴다', () => {
    wrap(<ActionBar screenKey="tx.specificTx" mode="hide" actions={['search', 'save']} />);
    expect(screen.getByRole('button', { name: /조회/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /저장/ })).toBeNull();
  });

  it('삭제는 기본 확인(삭제하시겠습니까?) 후에만 실행', async () => {
    const onAction = vi.fn();
    const onSearch = vi.fn();
    wrap(<ActionBar screenKey="mgmt.cornerMgmt" actions={[{ key: 'search', onClick: onSearch }, 'delete']} onAction={onAction} />);
    await userEvent.click(screen.getByRole('button', { name: /조회/ }));
    expect(onSearch).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /삭제/ }));
    expect(onAction).not.toHaveBeenCalled();
    expect(await screen.findByText('삭제하시겠습니까?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith('delete'));
  });

  it('사용자 confirm 문구와 label 덮어쓰기', async () => {
    const onClick = vi.fn();
    wrap(<ActionBar screenKey="mgmt.cornerMgmt" actions={[{ key: 'save', label: '일괄저장', confirm: '저장할까요?', onClick }]} />);
    await userEvent.click(screen.getByRole('button', { name: /일괄저장/ }));
    expect(await screen.findByText('저장할까요?')).toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('hotkeys: Ctrl+Enter = 조회 (비활성이면 무시)', async () => {
    const onSearch = vi.fn();
    const { rerender } = wrap(<ActionBar screenKey="tx.specificTx" hotkeys actions={[{ key: 'search', onClick: onSearch }]} />);
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    expect(onSearch).toHaveBeenCalledTimes(1);
    rerender(<ConfigProvider><ActionBar screenKey="tx.specificTx" hotkeys actions={[{ key: 'search', onClick: onSearch, disabled: true }]} /></ConfigProvider>);
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
