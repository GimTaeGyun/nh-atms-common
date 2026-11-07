import type { ReactNode } from 'react';
import { Button, Space, Steps } from 'antd';

export interface ApprovalStep {
  key: string;
  /** 단계 제목(① 내역 확인, ② 결재(팀원), ③ 결재(팀장)) */
  title: string;
  /** 버튼 글자(없으면 title) */
  buttonLabel?: ReactNode;
  done?: boolean;
  /** 지금 누를 수 있는가(이전 단계 완료 + 권한) */
  enabled?: boolean;
  loading?: boolean;
  onClick?: () => void | Promise<unknown>;
  /** 완료 시각·결재자 등 보조 설명 */
  description?: ReactNode;
}

interface Props {
  steps: ApprovalStep[];
  /** 버튼 줄을 Steps 아래가 아니라 우측에 */
  inline?: boolean;
  size?: 'small' | 'default';
}

/**
 * 전자결재 단계 버튼줄(마감장표·일마감 전자결재 등).
 * 완료된 단계는 체크, 현재 단계만 활성 버튼. 단계 상태는 서버 응답으로 호출 쪽이 정한다.
 */
export const ApprovalStepBar = ({ steps, inline = false, size = 'small' }: Props) => {
  const current = Math.max(0, steps.findIndex((s) => !s.done));
  const buttons = (
    <Space size={6} wrap>
      {steps.map((s, i) => (
        <Button key={s.key} size="small" type={i === current && s.enabled ? 'primary' : 'default'} disabled={!s.enabled || s.done} loading={s.loading} onClick={() => void s.onClick?.()}>
          {s.buttonLabel ?? s.title}
        </Button>
      ))}
    </Space>
  );
  return (
    <div style={inline ? { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' } : { display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Steps size={size} current={steps.every((s) => s.done) ? steps.length : current} items={steps.map((s) => ({ title: s.title, description: s.description, status: s.done ? 'finish' : undefined }))} style={{ flex: 1, minWidth: 320 }} />
      {buttons}
    </div>
  );
};
