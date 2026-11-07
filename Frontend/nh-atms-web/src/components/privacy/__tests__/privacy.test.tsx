import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { MaskedText, applyMask, maskedCol, useUnmask } from '@/components/privacy';

const wrap = (ui: ReactNode) => render(<ConfigProvider>{ui}</ConfigProvider>);

describe('MaskedText / maskedCol', () => {
  it('종류별 마스킹, masked=true 면 서버 값을 그대로 표시', () => {
    wrap(
      <>
        <MaskedText value="1234567890123" kind="account" />
        <MaskedText value="123-****-0123" kind="account" masked />
        <MaskedText value="홍길동" kind="name" />
        <MaskedText value="abcd" kind="custom" mask={(v) => `${v[0]}***`} />
      </>,
    );
    expect(screen.getAllByText('123-****-0123')).toHaveLength(2);
    expect(screen.getByText('홍*동')).toBeInTheDocument();
    expect(screen.getByText('a***')).toBeInTheDocument();
    expect(applyMask('phone', '010-1234-5678')).toBe('010-****-5678');
    expect(applyMask('card', null)).toBe('-');
  });

  it('maskedCol: render 가 MaskedText 를 쓴다', () => {
    type Row = { acct: string };
    const c = maskedCol<Row>('계좌번호', 'acct', 'account', 150);
    expect(c).toMatchObject({ title: '계좌번호', dataIndex: 'acct', width: 150 });
    const row = { acct: '1234567890123' };
    wrap(<>{c.render?.(row.acct, row, 0)}</>);
    expect(screen.getByText('123-****-0123')).toBeInTheDocument();
  });
});

const Demo = ({ request }: { request: (key: string, reason: string) => Promise<string> }) => {
  const u = useUnmask({ request });
  return (
    <div>
      <span data-testid="state">{u.isUnmasked('A1') ? 'open' : 'closed'}</span>
      <MaskedText value="1234567890123" kind="account" revealed={u.valueOf('A1')} onReveal={() => void u.unmask('A1')} />
      {u.modal}
    </div>
  );
};

describe('useUnmask', () => {
  it('사유 없이는 요청하지 않고, 사유 선택 후 원문을 표시·캐시한다', async () => {
    const request = vi.fn(async (key: string) => `${key}-원문-1234567890123`);
    wrap(<Demo request={request} />);
    expect(screen.getByText('123-****-0123')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '원문 보기' }));
    expect(await screen.findByText('개인정보 열람 사유')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '열람' }));
    expect(await screen.findByText('열람 사유를 선택하세요.')).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByTitle('장애 조치'));
    await userEvent.click(screen.getByRole('button', { name: '열람' }));

    await waitFor(() => expect(request).toHaveBeenCalledWith('A1', '장애 조치'));
    expect(await screen.findByText('A1-원문-1234567890123')).toBeInTheDocument();
    expect(screen.getByTestId('state')).toHaveTextContent('open');
    expect(screen.queryByRole('button', { name: '원문 보기' })).toBeNull();
  });

  it('기타는 상세 사유 필수, 요청 실패 시 모달 유지 + 오류 표시', async () => {
    const request = vi.fn(async () => {
      throw new Error('열람 권한이 없습니다.');
    });
    wrap(<Demo request={request} />);
    await userEvent.click(screen.getByRole('button', { name: '원문 보기' }));
    await userEvent.click(await screen.findByRole('combobox'));
    await userEvent.click(await screen.findByTitle('기타(직접입력)'));
    await userEvent.click(screen.getByRole('button', { name: '열람' }));
    expect(await screen.findByText('상세 사유를 입력하세요.')).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('textbox'), '감사 대응 자료 확인');
    await userEvent.click(screen.getByRole('button', { name: '열람' }));
    await waitFor(() => expect(request).toHaveBeenCalledWith('A1', '기타: 감사 대응 자료 확인'));
    expect(await screen.findByText('열람 권한이 없습니다.')).toBeInTheDocument();
    expect(screen.getByTestId('state')).toHaveTextContent('closed');
  });
});
