import { StatusTag } from '@/components/display/StatusTag';
import { APPROVAL_STATUS, type ApprovalStatus } from './approvalStatus';

/** 승인 상태 태그 (REQ 요청 / APPROVED 승인 / REJECTED 반려 / CANCEL 취소) */
export const ApprovalStatusTag = ({ status, text }: { status?: ApprovalStatus | string | null; text?: boolean }) => {
  if (!status) return <span className="muted">-</span>;
  const def = APPROVAL_STATUS[status as ApprovalStatus];
  return (
    <StatusTag tone={def?.tone ?? 'neutral'} text={text} icon={false}>
      {def?.label ?? status}
    </StatusTag>
  );
};
