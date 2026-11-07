import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, Button, ConfigProvider, DatePicker, Form, Input, InputNumber, Select } from 'antd';
import { formGroup, formItem, triggerOf } from '../formItem';
import { OfficeSelector } from '@/components/search/fields';
import { digits, req } from '@/utils/rules';

const Host = ({ inline, group }: { inline?: boolean; group?: boolean }) => {
  const [form] = Form.useForm();
  const cell = formItem('a', <Input aria-label="a" />, [req('가칸')], { inline });
  return (
    <ConfigProvider>
      <App>
        <Form form={form} component={false}>
          {group ? formGroup(cell) : cell}
          <Button onClick={() => void form.validateFields().catch(() => undefined)}>검사</Button>
        </Form>
      </App>
    </ConfigProvider>
  );
};

describe('formItem / formGroup', () => {
  it('기본: 오류 글씨가 칸 아래에 보인다', async () => {
    render(<Host />);
    await userEvent.click(screen.getByText('검사'));
    expect(await screen.findByText('가칸을 입력하세요.')).toBeInTheDocument();
  });

  it('inline 단독이면 글씨가 안 보이고(antd noStyle), formGroup 으로 감싸면 보인다', async () => {
    const { unmount } = render(<Host inline />);
    await userEvent.click(screen.getByText('검사'));
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.queryByText('가칸을 입력하세요.')).toBeNull();
    unmount();

    render(<Host inline group />);
    await userEvent.click(screen.getByText('검사'));
    expect(await screen.findByText('가칸을 입력하세요.')).toBeInTheDocument();
  });

  it('검사 시점: 입력 중에는 조용, 칸을 벗어나면 그 칸 검사, 저장(validateFields)은 전체 검사', async () => {
    const TimingHost = () => {
      const [form] = Form.useForm();
      return (
        <ConfigProvider>
          <App>
            <Form form={form} component={false}>
              {formItem('code', <Input aria-label="code" />, [digits(3)])}
              {formItem('name', <Input aria-label="name" />, [req('이름')])}
              <Button onClick={() => void form.validateFields().catch(() => undefined)}>저장</Button>
            </Form>
          </App>
        </ConfigProvider>
      );
    };
    render(<TimingHost />);
    const hasError = (label: string) => !!screen.getByLabelText(label).closest('.ant-form-item')?.classList.contains('ant-form-item-has-error');
    const wait = () => new Promise((r) => setTimeout(r, 150));

    await userEvent.type(screen.getByLabelText('code'), '1');
    await wait();
    expect(screen.queryByText('숫자 3자리로 입력하세요.')).toBeNull(); // 입력 중: 성급한 검사 없음

    await userEvent.tab(); // 칸 벗어남 → code 만 검사
    expect(await screen.findByText('숫자 3자리로 입력하세요.')).toBeInTheDocument();
    expect(screen.queryByText('이름을 입력하세요.')).toBeNull();

    await userEvent.type(screen.getByLabelText('code'), '23'); // 고쳐도 벗어나기 전까지는 오류 유지(글자마다 재검사 안 함)
    await wait();
    expect(screen.getByText('숫자 3자리로 입력하세요.')).toBeInTheDocument();
    await userEvent.tab();
    await waitFor(() => expect(hasError('code')).toBe(false)); // 벗어나면 다시 검사 → 통과(글씨는 사라지는 애니메이션 중)

    await userEvent.click(screen.getByText('저장')); // 저장 → 전체 검사(name 도 오류)
    expect(await screen.findByText('이름을 입력하세요.')).toBeInTheDocument();
    expect(hasError('name')).toBe(true);
  });

  it('triggerOf: 글자 칸은 onBlur, 고르는 칸·자체 부품은 onChange', () => {
    expect(triggerOf(<Input />)).toBe('onBlur');
    expect(triggerOf(<Input.TextArea />)).toBe('onBlur');
    expect(triggerOf(<Input.Password />)).toBe('onBlur');
    expect(triggerOf(<InputNumber />)).toBe('onBlur');
    expect(triggerOf(<Select />)).toBe('onChange');
    expect(triggerOf(<DatePicker />)).toBe('onChange');
    expect(triggerOf(<OfficeSelector />)).toBe('onChange');
    expect(triggerOf('글자')).toBe('onChange');
  });

  it('onBlur 를 넘기지 않는 자체 부품: 저장 후 오류가 뜬 칸에서 값을 고르면 오류가 사라진다', async () => {
    // OfficeSelector·AtmSelect 처럼 value/onChange 만 받는 부품
    const Picker = ({ onChange }: { value?: string; onChange?: (v: string) => void }) => <button type="button" onClick={() => onChange?.('000001')}>사무소 고르기</button>;
    const PickHost = () => {
      const [form] = Form.useForm();
      return (
        <ConfigProvider>
          <App>
            <Form form={form} component={false}>
              {formItem('ofcCode', <Picker />, [req('사무소')])}
              <Button onClick={() => void form.validateFields().catch(() => undefined)}>저장</Button>
            </Form>
          </App>
        </ConfigProvider>
      );
    };
    const { container } = render(<PickHost />);
    await userEvent.click(screen.getByText('저장'));
    expect(await screen.findByText('사무소를 입력하세요.')).toBeInTheDocument();
    await userEvent.click(screen.getByText('사무소 고르기'));
    await waitFor(() => expect(container.querySelector('.ant-form-item-has-error')).toBeNull());
  });
});
