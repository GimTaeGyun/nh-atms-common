import { useState, type ReactNode } from 'react';
import { Alert, Form, Input, Modal, Select } from 'antd';
import { toAppError } from '@/api/errors';
import { VMSG } from '@/config/messages';

/** 열람 사유 구분 */
export const UNMASK_REASONS = ['고객 민원 처리', '장애 조치', '감사·점검', '기타'] as const;
const OTHER = '기타';
const OPTIONS = UNMASK_REASONS.map((v) => ({ value: v, label: v === OTHER ? '기타(직접입력)' : v }));

interface Values {
  reasonType?: string;
  detail?: string;
}

interface Props {
  open: boolean;
  onCancel: () => void;
  /** 사유 문자열('구분' 또는 '구분: 상세') 전달. reject 시 모달 유지 + 오류 표시 */
  onSubmit: (reason: string) => Promise<unknown> | void;
  title?: ReactNode;
  /** 열람 대상 안내 */
  description?: ReactNode;
}

/** 사유 조합: 기타는 상세 필수, 그 외는 상세가 있으면 덧붙임 */
const compose = (v: Values): string => {
  const detail = v.detail?.trim();
  return detail ? `${v.reasonType}: ${detail}` : String(v.reasonType);
};

/** 개인정보 원문 열람 사유 입력 모달 (열람사유 흐름 일반화) */
export const UnmaskReasonModal = ({ open, onCancel, onSubmit, title = '개인정보 열람 사유', description }: Props) => {
  const [form] = Form.useForm<Values>();
  const reasonType = Form.useWatch('reasonType', form);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOther = reasonType === OTHER;

  const finish = async (v: Values) => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(compose(v));
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
    <Modal open={open} title={title} onCancel={cancel} onOk={() => form.submit()} okText="열람" cancelText="취소" confirmLoading={loading} destroyOnHidden maskClosable={false}>
      <Alert type="warning" showIcon style={{ marginBottom: 12 }} title="개인정보 보호 대상입니다." description={description ?? '열람 사유를 입력하면 권한 확인 후 원문이 표시되며, 열람 기록이 저장됩니다.'} />
      <Form form={form} layout="vertical" onFinish={finish} preserve={false}>
        <Form.Item name="reasonType" label="열람 사유" rules={[{ required: true, message: VMSG.select('열람 사유') }]}>
          <Select options={OPTIONS} placeholder="사유 선택" />
        </Form.Item>
        <Form.Item
          name="detail"
          label={isOther ? '상세 사유' : '상세 사유 (선택)'}
          rules={isOther ? [{ required: true, whitespace: true, message: VMSG.required('상세 사유') }, { min: 5, message: VMSG.minLength(5) }] : []}
        >
          <Input.TextArea rows={3} maxLength={200} showCount placeholder="예: 고객 민원(미수취 현금) 확인 요청" />
        </Form.Item>
      </Form>
      {error && <Alert type="error" showIcon title={error} />}
    </Modal>
  );
};
