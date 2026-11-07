import type { ReactNode } from 'react';
import { Button, Modal, Skeleton } from 'antd';
import { ModalTitle } from './ModalTitle';
import type { ScreenKey } from '@/screens/screenIds';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 팝업 화면키(popup.*) — 제목 옆 번호를 매핑에서 표시 */
  screenKey?: ScreenKey;
  /** 비표준 팝업의 표시 번호(화면키가 없을 때만) */
  sid?: string;
  width?: number;
  loading?: boolean;
  /** 기본 닫기 버튼 외 추가 버튼(닫기 오른쪽, 시안 '닫기 · 수정완료' 순) */
  actions?: ReactNode;
  /** footer 를 직접 그릴 때 */
  footer?: ReactNode | null;
  children: ReactNode;
}

/**
 * 조회용 상세 팝업 껍데기 — 제목(▍ 제목 + ID)·닫기 버튼·로딩 스켈레톤·닫을 때 내용 파기(destroyOnHidden).
 * 등록/수정 폼 모달은 내부 컴포넌트를 열릴 때마다 새로 마운트하는 규칙(dev-guide §5-5)을 따로 지킨다.
 */
export const DetailModal = ({ open, onClose, title, screenKey, sid, width = 720, loading, actions, footer, children }: Props) => (
  <Modal
    open={open}
    onCancel={onClose}
    width={width}
    title={<ModalTitle title={title} screenKey={screenKey} sid={sid} />}
    footer={footer === undefined ? <><Button onClick={onClose}>닫기</Button>{actions}</> : footer}
    destroyOnHidden
  >
    {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : children}
  </Modal>
);
