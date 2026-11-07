import { EditOutlined } from '@ant-design/icons';
import { DetailModal } from '@/components/display/DetailModal';
import { DetailGrid, type DetailItem } from '@/components/display/DetailGrid';
import { AuthButton } from '@/components/auth/AuthButton';
import { fmtCount, fmtDate, fmtDateTime14, fmtOffice } from '@/utils/format';
import type { Notice } from '@/domain/notice';

interface Props {
  open: boolean;
  /** 표시할 공지(상세 API 응답, text 포함). 읽는 중이면 undefined */
  notice?: Notice;
  loading?: boolean;
  onClose: () => void;
  /** [수정] — 부모가 이 팝업을 닫고 입력 팝업을 연다 */
  onEdit: (n: Notice) => void;
}

/** '이름 (개인번호)' — 둘 다 없으면 undefined(회색 '-') */
const writerOf = (name?: string | null, perNo?: string | null): string | undefined => (name || perNo ? `${name ?? ''}${perNo ? ` (${perNo})` : ''}`.trim() : undefined);

/** 상세 항목 — 번호·사무소·작성자·작성일·조회수·최종변경, 제목과 내용(줄바꿈 그대로) */
const itemsOf = (n: Notice): DetailItem[] => [
  { label: '제목', value: n.subject, span: 2 },
  { label: '번호', value: n.no, num: true },
  { label: '사무소', value: n.ofcCode ? fmtOffice(n.ofcCode, n.kanm) : undefined },
  { label: '작성자', value: writerOf(n.name, n.perNo) },
  { label: '작성일', value: fmtDate(n.wrtDate) },
  { label: '조회수', value: fmtCount(n.visit), num: true },
  { label: '최종변경', value: n.lschgDtm ? `${fmtDateTime14(n.lschgDtm)}${n.lsCmeno ? ` · ${n.lsCmeno}` : ''}` : undefined },
  { label: '내용', value: n.text, span: 2, pre: true },
];

/**
 * 공지 상세 팝업(`popup.noticeView`) — 조회 전용. 여는 쪽(NoticePage)이 `GET /api/notice/{no}?hit=Y` 로 읽어 넘긴다(조회수 +1).
 * [수정]은 화면 권한 UPD 가 있어야 눌린다(sample.notice 기준).
 */
export const NoticeViewModal = ({ open, notice, loading, onClose, onEdit }: Props) => (
  <DetailModal
    open={open}
    onClose={onClose}
    title="공지사항 상세"
    screenKey="popup.noticeView"
    width={760}
    loading={loading || !notice}
    actions={
      <AuthButton screenKey="sample.notice" need="upd" type="primary" icon={<EditOutlined />} disabled={!notice} onClick={() => notice && onEdit(notice)}>
        수정
      </AuthButton>
    }
  >
    {notice && <DetailGrid cols={2} labelWidth={100} items={itemsOf(notice)} />}
  </DetailModal>
);
