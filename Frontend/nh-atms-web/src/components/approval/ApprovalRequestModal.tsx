import { useState, type ReactNode } from 'react';
import { Alert, Form, Input, Modal, Select } from 'antd';
import { toAppError } from '@/api/errors';
import type { ApprovalRequestValues } from './approvalStatus';
import { VMSG } from '@/config/messages';

interface Props {
  open: boolean;
  onCancel: () => void;
  /** reject 시 모달 유지 + 오류 표시 */
  onSubmit: (v: ApprovalRequestValues) => Promise<unknown> | void;
  title?: ReactNode;
  /** 승인 대상 요약 */
  target?: ReactNode;
  /** 승인자 후보 (주면 선택란 표시) */
  approverOptions?: { value: string; label: string }[];
  /** 승인자 선택 필수 여부 */
  approverRequired?: boolean;
  okText?: string;
}

/** 승인 요청 모달: 대상 요약 + 요청 사유(필수) + 승인자(선택) */
export const ApprovalRequestModal = ({ open, onCancel, onSubmit, title = '승인 요청', target, approverOptions, approverRequired = false, okText = '요청' }: Props) => {
  const [form] = Form.useForm<ApprovalRequestValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async (v: ApprovalRequestValues) => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ reason: v.reason.trim(), approverId: v.approverId || undefined });
      form.resetFields();
    } catch (e) {
      setError(toAppError(e).message);
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    form.resetFields();
    setError(null);
    onCancel();
  };

  return (
    <Modal open={open} title={title} onCancel={cancel} onOk={() => form.submit()} okText={okText} cancelText="취소" confirmLoading={loading} destroyOnHidden maskClosable={false}>
      {target && <div className="panel" style={{ padding: 12, marginBottom: 12 }}>{target}</div>}
      <Form form={form} layout="vertical" onFinish={finish} preserve={false}>
        {approverOptions && (
          <Form.Item name="approverId" label="승인자" rules={approverRequired ? [{ required: true, message: VMSG.select('승인자') }] : []}>
            <Select options={approverOptions} placeholder="승인자 선택" allowClear showSearch={{ optionFilterProp: 'label' }} />
          </Form.Item>
        )}
        <Form.Item name="reason" label="요청 사유" rules={[{ required: true, whitespace: true, message: VMSG.required('요청 사유') }]}>
          <Input.TextArea rows={3} maxLength={500} showCount placeholder="승인 요청 사유를 입력하세요" />
        </Form.Item>
      </Form>
      {error && <Alert type="error" showIcon title={error} />}
    </Modal>
  );
};
