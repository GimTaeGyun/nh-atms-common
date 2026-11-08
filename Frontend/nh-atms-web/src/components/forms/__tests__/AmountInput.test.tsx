import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, ConfigProvider, Form } from 'antd';
import { AmountInput, fromAmountText, toAmountText } from '../AmountInput';
import { formItem, triggerOf } from '../formItem';

describe('toAmountText / fromAmountText', () => {
  it('숫자·입력 중 문자열 → 콤마 글자, 빈 값은 빈 글자', () => {
    expect(toAmountText(1234567)).toBe('1,234,567');
    expect(toAmountText('1234567')).toBe('1,234,567');
    expect(toAmountText(0)).toBe('0');
    expect(toAmountText(-5000)).toBe('-5,000');
    expect(toAmountText(undefined)).toBe('');
    expect(toAmountText(null)).toBe('');
    expect(toAmountText('')).toBe('');
    expect(toAmountText('-')).toBe('-');
  });

  it('칸 글자 → 숫자 문자열(콤마·글자 제거), 빈 칸은 빈 문자열(0 이 아님)', () => {
    expect(fromAmountText('1,234,567')).toBe('1234567');
    expect(fromAmountText('1,234원')).toBe('1234');
    expect(fromAmountText('-5,000')).toBe('-5000');
    expect(fromAmountText('')).toBe('');
    expect(fromAmountText(undefined)).toBe('');
    expect(fromAmountText('-')).toBe('-');
  });
});

const Host = ({ onChange, initial = null }: { onChange: (v: number | null) => void; initial?: number | null }) => {
  const [v, setV] = useState<number | null>(initial);
  return (
    <ConfigProvider>
      <AmountInput
        aria-label="금액"
        value={v}
        onChange={(n) => {
          setV(n);
          onChange(n);
        }}
      />
    </ConfigProvider>
  );
};

describe('AmountInput', () => {
  it('치는 동안 콤마가 붙고, 값은 숫자로 넘어간다', async () => {
    const onChange = vi.fn();
    render(<Host onChange={onChange} />);
    const input = screen.getByLabelText('금액');
    await userEvent.type(input, '1234567');
    expect(input).toHaveValue('1,234,567');
    expect(onChange).toHaveBeenLastCalledWith(1234567);
  });

  it('처음 값도 콤마로 보인다', () => {
    render(<Host onChange={vi.fn()} initial={50000000} />);
    expect(screen.getByLabelText('금액')).toHaveValue('50,000,000');
  });

  it('칸을 다 지우면 값이 비고(null) 0 이 되지 않는다', async () => {
    const onChange = vi.fn();
    render(<Host onChange={onChange} initial={1000} />);
    const input = screen.getByLabelText('금액');
    await userEvent.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input).toHaveValue('');
  });

  it('formItem 안에서 글자 칸으로 취급(칸 벗어날 때 검사)하고, 폼 값은 숫자다', async () => {
    expect(triggerOf(<AmountInput />)).toBe('onBlur');

    const onFinish = vi.fn();
    render(
      <ConfigProvider>
        <Form onFinish={onFinish}>
          {formItem('amount', <AmountInput aria-label="금액" unit="원" />)}
          <Button htmlType="submit">저장</Button>
        </Form>
      </ConfigProvider>,
    );
    await userEvent.type(screen.getByLabelText('금액'), '30000');
    expect(screen.getByText('원')).toBeInTheDocument();
    await userEvent.click(screen.getByText('저장'));
    await vi.waitFor(() => expect(onFinish).toHaveBeenCalledWith({ amount: 30000 }));
  });
});
