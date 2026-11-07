import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { ApprovalRequestModal, ApprovalStatusTag, ApproverKeyInModal } from '@/components/approval';

const wrap = (ui: ReactNode) => render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ApprovalStatusTag', () => {
  it('상태 코드별 라벨·톤', () => {
    const { container } = wrap(
      <>
        <ApprovalStatusTag status="REQ" />
        <ApprovalStatusTag status="APPROVED" />
        <ApprovalStatusTag status="REJECTED" />
        <ApprovalStatusTag status="CANCEL" />
      </>,
    );
    expect(screen.getByText('요청')).toHaveClass('warning');
    expect(screen.getByText('승인')).toHaveClass('success');
    expect(screen.getByText('반려')).toHaveClass('danger');
    expect(screen.getByText('취소')).toHaveClass('neutral');
    expect(container.querySelectorAll('.status-tag')).toHaveLength(4);
  });
});

describe('ApprovalRequestModal', () => {
  it('요청 사유 필수, 입력 후 onSubmit', async () => {
    const onSubmit = vi.fn(async () => undefined);
    wrap(<ApprovalRequestModal open onCancel={() => {}} onSubmit={onSubmit} target={<span>시재 조정 3건</span>} />);
    expect(screen.getByText('시재 조정 3건')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '요청' }));
    expect(await screen.findByText('요청 사유를 입력하세요.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole('textbox'), '월말 시재 정정');
    await userEvent.click(screen.getByRole('button', { name: '요청' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ reason: '월말 시재 정정', approverId: undefined }));
  });
});

describe('ApproverKeyInModal', () => {
  beforeEach(() => {
    useAuthStore.getState().login({ accessToken: 'a', refreshToken: 'r', user: { userId: 'u100', userName: '요청자', deptName: '영업점', roleId: 'ROLE_USER' } });
  });

  it('요청자와 같은 사번은 거부하고, 다른 사번이면 onApprove', async () => {
    const onApprove = vi.fn(async () => undefined);
    wrap(<ApproverKeyInModal open onCancel={() => {}} onApprove={onApprove} />);
    await userEvent.type(screen.getByPlaceholderText('책임자 사번'), 'u100');
    await userEvent.type(screen.getByPlaceholderText('책임자 비밀번호'), 'pw!');
    await userEvent.click(screen.getByRole('button', { name: '승인' }));
    expect(await screen.findByText('요청자와 승인자가 같을 수 없습니다.')).toBeInTheDocument();
    expect(onApprove).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByPlaceholderText('책임자 사번'));
    await userEvent.type(screen.getByPlaceholderText('책임자 사번'), 'm200');
    await userEvent.click(screen.getByRole('button', { name: '승인' }));
    await waitFor(() => expect(onApprove).toHaveBeenCalledWith({ empNo: 'm200', password: 'pw!' }));
  });

  it('승인 실패 시 오류 표시 + 비밀번호 초기화', async () => {
    const onApprove = vi.fn(async () => {
      throw new Error('비밀번호가 일치하지 않습니다.');
    });
    wrap(<ApproverKeyInModal open onCancel={() => {}} onApprove={onApprove} />);
    await userEvent.type(screen.getByPlaceholderText('책임자 사번'), 'm200');
    await userEvent.type(screen.getByPlaceholderText('책임자 비밀번호'), 'bad');
    await userEvent.click(screen.getByRole('button', { name: '승인' }));
    expect(await screen.findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('책임자 비밀번호')).toHaveValue('');
  });

  it('반려는 사유 필수 후 onReject', async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn(async () => undefined);
    wrap(<ApproverKeyInModal open onCancel={() => {}} onApprove={onApprove} onReject={onReject} />);
    await userEvent.click(screen.getByRole('button', { name: '반려' }));
    await userEvent.click(screen.getByRole('button', { name: '반려 확정' }));
    expect(await screen.findByText('반려 사유를 입력하세요.')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), '증빙 미첨부');
    await userEvent.click(screen.getByRole('button', { name: '반려 확정' }));
    await waitFor(() => expect(onReject).toHaveBeenCalledWith('증빙 미첨부'));
    expect(onApprove).not.toHaveBeenCalled();
  });
});
