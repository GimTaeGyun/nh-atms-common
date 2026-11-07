import { Button, Form, Input, Modal, Skeleton } from 'antd';
import type { Rule } from 'antd/es/form';
import { SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { noticeApi, noticeKeys } from '@/api/endpoints/notice';
import { DetailGrid } from '@/components/display/DetailGrid';
import { EmptyState } from '@/components/feedback';
import { ModalTitle } from '@/components/display/ModalTitle';
import { AuthButton } from '@/components/auth/AuthButton';
import { formItem } from '@/components/forms/formItem';
import { OfficeSelector } from '@/components/search/fields';
import { useAuthStore } from '@/stores/useAuthStore';
import { byteCount, maxBytes, req } from '@/utils/rules';
import type { Notice, NoticeSave } from '@/domain/notice';
import { SUBJECT_MAX_BYTES, TEXT_MAX_BYTES } from '../sample/NoticeParts';

/** 폼 값(화면 안) — 보낼 때 toBody 로 계약 NoticeSave 모양 */
interface NoticeFormValues {
  subject: string;
  text: string;
  ofcCode?: string;
}

/* 이 팝업의 검사 목록 — 바이트 상한은 서버 DbBytes 와 같은 규칙(잠정 Q-07) */
const RULES = {
  subject: [req('제목'), maxBytes(SUBJECT_MAX_BYTES)],
  text: [req('내용'), maxBytes(TEXT_MAX_BYTES)],
  ofcCode: [],
} satisfies Record<keyof NoticeFormValues, Rule[]>;

const toBody = (v: NoticeFormValues): NoticeSave => ({ subject: v.subject.trim(), text: v.text, ofcCode: v.ofcCode || undefined });

interface Props {
  open: boolean;
  /** null = 등록, 번호 = 수정 */
  no: number | null;
  onClose: () => void;
}

/**
 * 공지 등록/수정 팝업(`popup.noticeEdit`). 모달 안 폼은 열릴 때마다 새로 마운트(destroyOnHidden + 안쪽 컴포넌트, dev-guide §5-5).
 * 작성자는 서버가 고정 사용자로 채운다(화면은 보여 주기만). 성공 문구(S002·S003)는 서버 → 자동 표시.
 */
export const NoticeEditModal = ({ open, no, onClose }: Props) => (
  <Modal
    open={open}
    onCancel={onClose}
    width={760}
    title={<ModalTitle title={no === null ? '공지사항 등록' : '공지사항 수정'} screenKey="popup.noticeEdit" />}
    footer={null}
    destroyOnHidden
  >
    <NoticeEditBody no={no} onClose={onClose} />
  </Modal>
);

/** 수정이면 원문(text 포함, 조회수 증가 없음)을 읽은 뒤 폼을 그린다. 닫으면 캐시도 버린다(gcTime 0) → 다음에 열 때 새로 읽음 */
const NoticeEditBody = ({ no, onClose }: { no: number | null; onClose: () => void }) => {
  const detail = useQuery({ queryKey: noticeKeys.detail(no ?? 0), queryFn: () => noticeApi.get(no as number), enabled: no !== null, gcTime: 0 });
  // 읽기 실패(404 등) — 문구는 서버가 이미 띄웠다. 끝없는 로딩 대신 닫기만 준다
  if (no !== null && detail.isError) return <EmptyState text="공지를 불러오지 못했습니다." action={<Button onClick={onClose}>닫기</Button>} />;
  if (no !== null && !detail.data) return <Skeleton active paragraph={{ rows: 6 }} />;
  return <NoticeForm target={no === null ? null : (detail.data ?? null)} onClose={onClose} />;
};

const NoticeForm = ({ target, onClose }: { target: Notice | null; onClose: () => void }) => {
  const [form] = Form.useForm<NoticeFormValues>();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.me);
  const save = useMutation({
    mutationFn: (body: NoticeSave) => (target ? noticeApi.update(target.no, body) : noticeApi.create(body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: noticeKeys.all }),
  });
  const writer = target ? { name: target.name, perNo: target.perNo } : { name: me?.name ?? null, perNo: me?.perNo ?? null };
  const initial: Partial<NoticeFormValues> = target
    ? { subject: target.subject ?? '', text: target.text ?? '', ofcCode: target.ofcCode ?? undefined }
    : { ofcCode: me?.ofcCode ?? undefined };

  // 검증을 통과했을 때만 불린다. 닫기는 이 요청이 성공했을 때만
  const onFinish = (v: NoticeFormValues) => save.mutate(toBody(v), { onSuccess: onClose });

  return (
    <Form<NoticeFormValues> form={form} component={false} initialValues={initial} onFinish={onFinish} scrollToFirstError>
      <DetailGrid
        cols={2}
        labelWidth={90}
        items={[
          { label: '제목', required: true, span: 2, value: formItem('subject', <Input placeholder="제목" count={byteCount(SUBJECT_MAX_BYTES)} aria-label="제목" />, RULES.subject) },
          { label: '사무소', value: formItem('ofcCode', <OfficeSelector allowEmpty />, RULES.ofcCode) },
          { label: '작성자', value: <span aria-label="작성자">{`${writer.name ?? '-'}${writer.perNo ? ` (${writer.perNo})` : ''}`}</span> },
          { label: '내용', required: true, span: 2, value: formItem('text', <Input.TextArea rows={10} placeholder="내용" count={byteCount(TEXT_MAX_BYTES)} aria-label="내용" />, RULES.text) },
        ]}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button onClick={onClose}>닫기</Button>
        <AuthButton screenKey="sample.notice" need={target ? 'upd' : 'reg'} type="primary" icon={<SaveOutlined />} loading={save.isPending} onClick={() => form.submit()}>
          저장
        </AuthButton>
      </div>
    </Form>
  );
};
