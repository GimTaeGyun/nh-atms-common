import type { Tone } from '@/components/display/StatusTag';

/** 승인 상태 코드 */
export type ApprovalStatus = 'REQ' | 'APPROVED' | 'REJECTED' | 'CANCEL';

/** 상태별 라벨·톤 */
export const APPROVAL_STATUS: Record<ApprovalStatus, { label: string; tone: Tone }> = {
  REQ: { label: '요청', tone: 'warning' },
  APPROVED: { label: '승인', tone: 'success' },
  REJECTED: { label: '반려', tone: 'danger' },
  CANCEL: { label: '취소', tone: 'neutral' },
};

/** 승인 KEY-IN 입력값 */
export interface ApproverCredential {
  empNo: string;
  password: string;
}

/** 승인 요청 입력값 */
export interface ApprovalRequestValues {
  reason: string;
  approverId?: string;
}
