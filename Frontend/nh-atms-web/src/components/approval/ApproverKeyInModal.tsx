import { useState, type ReactNode } from 'react';
import { Alert, Button, Form, Input, Modal, Space } from 'antd';
import { toAppError } from '@/api/errors';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ApproverCredential } from './approvalStatus';
import { VMSG } from '@/config/messages';

/** 요청자=승인자 금지 문구 */
export const SAME_USER_MESSAGE = '요청자와 승인자가 같을 수 없습니다.';

interface Props {
  open: boolean;
  onCancel: () => void;
  /** 책임자 인증·승인. reject 시 오류 표시 + 비밀번호 초기화 */
  onApprove: (cred: ApproverCredential) => Promise<unknown> | void;
  /** 주면 '반려' 버튼 표시 (사유 필수) */
  onReject?: (reason: string) => Promise<unknown> | void;
  title?: ReactNode;
  /** 승인 대상 요약 */
  target?: ReactNode;
  /** 요청자 사번 (기본: 현재 로그인 사용자) */
  requesterId?: string;
}

interface Values {
  empNo?: string;
  password?: string;
  reason?: string;
}

/** 책임자 KEY-IN 승인 모달: 승인자 사번+비밀번호, 요청자≠승인자(maker-checker) 검증 */
export const ApproverKeyInModal = ({ open, onCancel, onApprove, onReject, title = '책임자 승인', target, requesterId }: Props) => {
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const maker = (requesterId ?? currentUserId ?? '').trim();
  const [form] = Form.useForm<Values>();
  const [mode, setMode] = useState<'approve' | 'reject'>('approve');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown> | void) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
      form.resetFields();
      setMode('approve');
    } catch (e) {
      setError(toAppError(e).message);
      form.setFieldValue('password', '');
    } finally {
      setLoading(false);
    }
  };

  const finish = (v: Values) =>
    mode === 'reject' && onReject ? run(() => onReject(String(v.reason).trim())) : run(() => onApprove({ empNo: String(v.empNo).trim(), password: String(v.password) }));

  const cancel = () => {
    form.resetFields();
    setMode('approve');
    setError(null);
    onCancel();
  };

  const footer =
    mode === 'reject' ? (
      <Space>
        <Button onClick={() => setMode('approve')} disabled={loading}>뒤로</Button>
        <Button danger type="primary" loading={loading} onClick={() => form.submit()}>반려 확정</Button>
      </Space>
    ) : (
      <Space>
        <Button onClick={cancel} disabled={loading}>취소</Button>
        {onReject && <Button danger onClick={() => { setError(null); setMode('reject'); }} disabled={loading}>반려</Button>}
        <Button type="primary" loading={loading} onClick={() => form.submit()}>승인</Button>
      </Space>
    );

  return (
    <Modal open={open} title={title} onCancel={cancel} footer={footer} destroyOnHidden maskClosable={false}>
      {target && <div className="panel" style={{ padding: 12, marginBottom: 12 }}>{target}</div>}
      <Form form={form} layout="vertical" onFinish={finish} preserve={false} autoComplete="off">
        {mode === 'approve' ? (
          <>
            <Form.Item
              name="empNo"
              label="승인자 사번"
              rules={[
                { required: true, whitespace: true, message: VMSG.required('승인자 사번') },
                { validator: (_, v?: string) => (v && maker && v.trim() === maker ? Promise.reject(new Error(SAME_USER_MESSAGE)) : Promise.resolve()) },
              ]}
            >
              <Input placeholder="책임자 사번" autoComplete="off" />
            </Form.Item>
            <Form.Item name="password" label="비밀번호" rules={[{ required: true, message: VMSG.required('비밀번호') }]}>
              <Input.Password placeholder="책임자 비밀번호" autoComplete="new-password" />
            </Form.Item>
          </>
        ) : (
          <Form.Item name="reason" label="반려 사유" rules={[{ required: true, whitespace: true, message: VMSG.required('반려 사유') }]}>
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="반려 사유를 입력하세요" />
          </Form.Item>
        )}
      </Form>
      {error && <Alert type="error" showIcon title={error} />}
    </Modal>
  );
};
