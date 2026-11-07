import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavStore, toTree } from '@/stores/useNavStore';
import { usePermPreviewStore } from '@/stores/usePermPreviewStore';
import { ActionBar, AuthButton, AuthGuard, ScreenIdProvider, meetsNeed } from '@/components/auth';
import { applyPreview, permissionOf } from '@/hooks/usePermission';
import type { Me } from '@/types/auth';
import type { MenuNode, Yn } from '@/types/menu';

const wrap = (ui: ReactNode) => render(<ConfigProvider>{ui}</ConfigProvider>);

const USER: Me = { perNo: '1000001', name: '사용자', samuso: '000001', samusoName: '영업점', deptCode: null, ofcCode: '000001', kanm: '영업점', auth: 'T', adminYn: 'N' };

const leaf = (menuId: string, menuPath: string, flags: [Yn, Yn, Yn, Yn, Yn]): MenuNode => ({
  menuId, parentMenuId: 'S', menuNm: menuId, menuType: 'M', menuPath, sortNo: 1, useYn: 'Y',
  qryRolYn: flags[0], regRolYn: flags[1], updRolYn: flags[2], delRolYn: flags[3], exeRolYn: flags[4], children: [],
});

/**
 * 일반 사용자 + 화면 권한 시드
 *  - sample.notice: 조회만
 *  - sample.mcnInfo: 조회·등록·수정·삭제 (실행 없음)
 */
const seed = () => {
  useAuthStore.getState().setMe(USER);
  usePermPreviewStore.getState().setPreview('off');
  useNavStore.setState({
    menus: toTree([
      { ...leaf('S', '', ['Y', 'Y', 'Y', 'Y', 'Y']), menuNm: '견본', menuType: 'G', menuPath: null, children: [
        leaf('RO', '/sample/notice', ['Y', 'N', 'N', 'N', 'N']),
        leaf('RW', '/sample/mcn-info', ['Y', 'Y', 'Y', 'Y', 'N']),
      ] },
    ]),
  });
};

describe('permissionOf / applyPreview / meetsNeed', () => {
  it('메뉴 플래그 5개 → can*, 메뉴에 없으면 조회만, 관리자는 전부', () => {
    const n = toTree([leaf('A', '/sample/notice', ['Y', 'Y', 'N', 'N', 'Y'])])[0];
    expect(permissionOf(n, false)).toEqual({ canQry: true, canReg: true, canUpd: false, canDel: false, canExe: true, isAdmin: false });
    expect(permissionOf(undefined, false)).toEqual({ canQry: true, canReg: false, canUpd: false, canDel: false, canExe: false, isAdmin: false });
    expect(permissionOf(n, true)).toMatchObject({ canUpd: true, canDel: true, isAdmin: true });
  });

  it('미리보기: qry → 조회만, qry+reg → 조회·등록, all → 전부, off → 그대로', () => {
    const real = permissionOf(undefined, false);
    expect(applyPreview(real, 'off')).toBe(real);
    expect(applyPreview({ ...real, canDel: true }, 'qry')).toMatchObject({ canQry: true, canReg: false, canDel: false });
    expect(applyPreview(real, 'qry+reg')).toMatchObject({ canReg: true, canUpd: false });
    expect(applyPreview(real, 'all')).toMatchObject({ canReg: true, canUpd: true, canDel: true, canExe: true });
  });

  it('meetsNeed 는 요구 수준별 플래그를 본다', () => {
    const p = { canQry: true, canReg: false, canUpd: true, canDel: false, canExe: false, isAdmin: false };
    expect([meetsNeed(p, 'qry'), meetsNeed(p, 'reg'), meetsNeed(p, 'upd'), meetsNeed(p, 'del'), meetsNeed(p, 'exe'), meetsNeed(p, 'admin')]).toEqual([true, false, true, false, false, false]);
  });
});

describe('AuthButton / AuthGuard', () => {
  beforeEach(seed);

  it('수정 권한이 없으면 비활성 + 툴팁 "권한이 없습니다."', async () => {
    const onClick = vi.fn();
    wrap(<AuthButton screenKey="sample.notice" onClick={onClick}>저장</AuthButton>);
    const btn = screen.getByRole('button', { name: '저장' });
    expect(btn).toBeDisabled();
    await userEvent.hover(btn.parentElement!);
    expect(await screen.findByText('권한이 없습니다.')).toBeInTheDocument();
  });

  it('mode=hide 이면 렌더하지 않고, 권한이 있으면 활성', () => {
    wrap(
      <>
        <AuthButton screenKey="sample.notice" mode="hide">숨김</AuthButton>
        <AuthButton screenKey="sample.mcnInfo">활성</AuthButton>
        <AuthButton screenKey="sample.notice" need="qry">조회</AuthButton>
      </>,
    );
    expect(screen.queryByRole('button', { name: '숨김' })).toBeNull();
    expect(screen.getByRole('button', { name: '활성' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '조회' })).toBeEnabled();
  });

  it('ScreenIdProvider 의 화면키를 쓰고, AuthGuard 는 fallback 을 보여준다', () => {
    wrap(
      <ScreenIdProvider screenKey="sample.notice">
        <AuthButton need="reg">등록</AuthButton>
        <AuthGuard fallback={<span>권한 없음</span>}>
          <span>편집 영역</span>
        </AuthGuard>
        <AuthGuard need="qry">
          <span>조회 영역</span>
        </AuthGuard>
      </ScreenIdProvider>,
    );
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();
    expect(screen.getByText('권한 없음')).toBeInTheDocument();
    expect(screen.queryByText('편집 영역')).toBeNull();
    expect(screen.getByText('조회 영역')).toBeInTheDocument();
  });

  it('관리자는 화면 권한과 무관하게 가능, need=admin 은 관리자만', () => {
    wrap(<AuthButton screenKey="sample.notice" need="admin">관리</AuthButton>);
    expect(screen.getByRole('button', { name: '관리' })).toBeDisabled();
  });

  it('관리자(adminYn=Y)면 need=admin 도 활성', () => {
    useAuthStore.getState().setMe({ ...USER, adminYn: 'Y' });
    wrap(<AuthButton screenKey="sample.notice" need="admin">관리</AuthButton>);
    expect(screen.getByRole('button', { name: '관리' })).toBeEnabled();
  });
});

describe('ActionBar', () => {
  beforeEach(seed);

  it('버튼별 필요 권한: search·excel·print=qry, create=reg, update·save=upd, delete=del, urgent=exe', () => {
    wrap(<ActionBar screenKey="sample.mcnInfo" actions={['search', 'excel', 'print', 'create', 'update', 'save', 'delete', 'urgent', 'close']} />);
    for (const name of ['조회', '엑셀', '출력', '등록', '수정', '저장', '삭제', '닫기']) expect(screen.getByRole('button', { name: new RegExp(name) })).toBeEnabled();
    expect(screen.getByRole('button', { name: /긴급/ })).toBeDisabled();
  });

  it('조회만 있는 화면은 변경성 버튼만 비활성', () => {
    wrap(<ActionBar screenKey="sample.notice" actions={['search', 'excel', 'create', 'save', 'delete', 'close']} />);
    for (const name of ['조회', '엑셀', '닫기']) expect(screen.getByRole('button', { name: new RegExp(name) })).toBeEnabled();
    for (const name of ['등록', '저장', '삭제']) expect(screen.getByRole('button', { name: new RegExp(name) })).toBeDisabled();
  });

  it('권한 미리보기(표시만): qry+reg 면 수정권한 화면에서도 수정·삭제가 흐려지고, all 이면 조회만 화면도 켜진다', () => {
    usePermPreviewStore.getState().setPreview('qry+reg');
    const { unmount } = wrap(<ActionBar screenKey="sample.mcnInfo" actions={['create', 'update', 'delete']} />);
    expect(screen.getByRole('button', { name: /등록/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /수정/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /삭제/ })).toBeDisabled();
    unmount();
    usePermPreviewStore.getState().setPreview('all');
    wrap(<ActionBar screenKey="sample.notice" actions={['update', 'urgent']} />);
    expect(screen.getByRole('button', { name: /수정/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /긴급/ })).toBeEnabled();
  });

  it('mode=hide 이면 권한 없는 버튼을 숨긴다', () => {
    wrap(<ActionBar screenKey="sample.notice" mode="hide" actions={['search', 'save']} />);
    expect(screen.getByRole('button', { name: /조회/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /저장/ })).toBeNull();
  });

  it('삭제는 기본 확인(삭제하시겠습니까?) 후에만 실행', async () => {
    const onAction = vi.fn();
    const onSearch = vi.fn();
    wrap(<ActionBar screenKey="sample.mcnInfo" actions={[{ key: 'search', onClick: onSearch }, 'delete']} onAction={onAction} />);
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
    wrap(<ActionBar screenKey="sample.mcnInfo" actions={[{ key: 'save', label: '일괄저장', confirm: '저장할까요?', onClick }]} />);
    await userEvent.click(screen.getByRole('button', { name: /일괄저장/ }));
    expect(await screen.findByText('저장할까요?')).toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('hotkeys: Ctrl+Enter = 조회 (비활성이면 무시)', async () => {
    const onSearch = vi.fn();
    const { rerender } = wrap(<ActionBar screenKey="sample.notice" hotkeys actions={[{ key: 'search', onClick: onSearch }]} />);
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    expect(onSearch).toHaveBeenCalledTimes(1);
    rerender(<ConfigProvider><ActionBar screenKey="sample.notice" hotkeys actions={[{ key: 'search', onClick: onSearch, disabled: true }]} /></ConfigProvider>);
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
