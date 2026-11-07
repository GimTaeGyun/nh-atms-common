import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ListEditTabs } from '@/components/page/ListEditTabs';
import { ApprovalStepBar } from '@/components/approval/ApprovalStepBar';
import { RowCommandButton } from '@/components/grid/RowCommandButton';
import { MasterDetailGrids } from '@/components/grid/MasterDetailGrids';
import { summarizeTxStatus } from '@/screens/popup/TxStatusSummaryModal';
import type { Transaction } from '@/domain/types';

describe('ListEditTabs', () => {
  it('목록에서 선택하면 수정 탭, 등록이면 등록 탭, done 이면 목록으로', async () => {
    render(
      <ListEditTabs<{ id: number }>
        list={({ select, openCreate }) => (
          <div>
            <button onClick={() => select({ id: 7 })}>pick</button>
            <button onClick={openCreate}>new</button>
          </div>
        )}
        edit={({ mode, row, done }) => (
          <div>
            <span data-testid="mode">{mode}:{row?.id ?? '-'}</span>
            <button onClick={done}>done</button>
          </div>
        )}
      />,
    );
    fireEvent.click(screen.getByText('pick'));
    await waitFor(() => expect(screen.getByTestId('mode').textContent).toBe('edit:7'));
    expect(screen.getByRole('tab', { name: '수정' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('done'));
    fireEvent.click(screen.getByText('new'));
    await waitFor(() => expect(screen.getByTestId('mode').textContent).toBe('create:-'));
  });
});

describe('ApprovalStepBar', () => {
  it('현재 단계만 활성', () => {
    render(<ApprovalStepBar steps={[{ key: 'a', title: '① 확인', done: true, enabled: true }, { key: 'b', title: '② 팀원', enabled: true }, { key: 'c', title: '③ 팀장', enabled: false }]} />);
    expect(screen.getByRole('button', { name: '① 확인' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '② 팀원' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '③ 팀장' })).toBeDisabled();
  });
});

describe('RowCommandButton', () => {
  it('실행 결과를 셀에 표시', async () => {
    render(<RowCommandButton label="PING" run={async () => ({ ok: true, text: 'OK 12ms' })} />);
    fireEvent.click(screen.getByRole('button', { name: 'PING' }));
    await waitFor(() => expect(screen.getByText('OK 12ms')).toBeInTheDocument());
  });
  it('예외는 실패로', async () => {
    render(<RowCommandButton label="PING" run={async () => { throw new Error('timeout'); }} />);
    fireEvent.click(screen.getByRole('button', { name: 'PING' }));
    await waitFor(() => expect(screen.getByText('timeout')).toBeInTheDocument());
  });
});

describe('MasterDetailGrids', () => {
  it('마스터 선택 전 안내, 선택 후 디테일', () => {
    render(
      <MasterDetailGrids<{ cd: string }>
        masterTitle="업체" detailTitle={(m) => `모델 ${m?.cd ?? ''}`}
        master={({ select }) => <button onClick={() => select({ cd: 'HY' })}>HY</button>}
        detail={(m) => <span>detail-{m.cd}</span>}
      />,
    );
    expect(screen.getByText('상단 목록에서 항목을 선택하세요.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('HY'));
    expect(screen.getByText('detail-HY')).toBeInTheDocument();
    expect(screen.getByText('모델 HY')).toBeInTheDocument();
  });
});

describe('summarizeTxStatus', () => {
  it('거래종류×상태로 건수·금액 합산', () => {
    const t = (trTypeName: string, status: Transaction['status'], amount: number, fee = 0) => ({ trTypeName, status, amount, fee }) as Transaction;
    const out = summarizeTxStatus([t('입금', '정상', 100), t('입금', '정상', 50, 1), t('출금', '불능', 10)]);
    expect(out).toEqual([
      { trTypeName: '입금', status: '정상', count: 2, amount: 150, fee: 1 },
      { trTypeName: '출금', status: '불능', count: 1, amount: 10, fee: 0 },
    ]);
  });
});
