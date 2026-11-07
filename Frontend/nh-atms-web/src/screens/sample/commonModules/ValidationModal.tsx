/**
 * 입력 팝업(검증 규칙 전종) — 등록/수정 팝업을 만들 때 복사해 쓰는 틀. [원본] nh-atms StdEditModal.
 *  ① 규칙은 파일 위 RULES 한 곳에(`satisfies Record<keyof 값, Rule[]>` — 칸을 빠뜨리면 타입 오류)
 *  ② JSX 에는 formItem(이름, 컨트롤, RULES.이름) 만 — 오류 글씨는 칸 아래 자동
 *  ③ 저장은 Form onFinish — 하나라도 틀리면 onFinish 가 불리지 않는다(if 문 없음)
 *  ④ 칸끼리 비교(afterField·gteField)는 dependencies 를 같이, 조건부 필수는 when()
 *  ⑤ 모달 안 Form 은 열릴 때마다 새로 마운트(destroyOnHidden + 안쪽 컴포넌트)
 * 실제 화면은 onFinish 에서 mutation.mutate(toBody(v)) — 성공 문구는 서버가 주고 http.ts 가 띄운다.
 */
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import type { Rule } from 'antd/es/form';
import { SaveOutlined } from '@ant-design/icons';
import { DetailGrid } from '@/components/display/DetailGrid';
import { ModalTitle } from '@/components/display/ModalTitle';
import { formItem } from '@/components/forms/formItem';
import { OfficeSelector } from '@/components/search/fields';
import { today, toYmd, type Dayjs } from '@/utils/date';
import { afterField, check, dateRange, digits, gteField, maxLen, numeric, numRange, phone, req, reqSelect, when } from '@/utils/rules';

type Kind = 'NORMAL' | 'ETC';
export interface ValidationValues {
  ofcCode: string;
  mcnNo: string;
  kind: Kind;
  memo?: string;
  telNo?: string;
  cnt?: string;
  amount: number;
  startDate: Dayjs;
  endDate: Dayjs;
  period?: [Dayjs, Dayjs];
  keepMonths: number;
  delMonths: number;
}

const KIND_OPTIONS: { value: Kind; label: string }[] = [{ value: 'NORMAL', label: '일반' }, { value: 'ETC', label: '기타(비고 필수)' }];

/** ① 이 팝업의 검사 목록 — 규칙 함수 전종(req·reqSelect·when·maxLen·digits·numeric·phone·numRange·afterField·gteField·dateRange·check) */
const RULES = {
  ofcCode: [req('사무소'), check<string>((v) => (v === '000000' ? '사무소코드 000000 은 쓸 수 없습니다.' : undefined))],
  mcnNo: [req('기번'), digits(3)],
  kind: [reqSelect('구분')],
  memo: [maxLen(100)],
  telNo: [phone()],
  cnt: [numeric()],
  amount: [req('금액'), numRange(1, 100000000)],
  startDate: [req('시작일')],
  endDate: [req('종료일'), afterField('startDate', '종료일은 시작일 이후여야 합니다.')],
  period: [dateRange(31)],
  keepMonths: [req('보관 개월'), numRange(0, 120)],
  delMonths: [req('삭제 개월'), numRange(0, 120), gteField('keepMonths', '삭제 개월은 보관 개월 이상이어야 합니다.')],
} satisfies Record<keyof ValidationValues, Rule[]>;

/** 검증을 통과한 값 → 보낼 본문 모양(날짜는 YYYYMMDD) */
export const toValidationBody = (v: ValidationValues) => ({
  ofcCode: v.ofcCode,
  mcnNo: v.mcnNo,
  kind: v.kind,
  memo: v.memo ?? null,
  telNo: v.telNo ?? null,
  cnt: v.cnt ? Number(v.cnt) : null,
  amount: v.amount,
  startDate: toYmd(v.startDate),
  endDate: toYmd(v.endDate),
  periodFrom: toYmd(v.period?.[0]) ?? null,
  periodTo: toYmd(v.period?.[1]) ?? null,
  keepMonths: v.keepMonths,
  delMonths: v.delMonths,
});

interface Props {
  open: boolean;
  onClose: () => void;
  /** 검증 통과 시 본문(견본이라 서버에 보내지 않고 화면에 보여 준다) */
  onDone: (body: ReturnType<typeof toValidationBody>) => void;
}

export const ValidationModal = ({ open, onClose, onDone }: Props) => (
  <Modal open={open} onCancel={onClose} width={760} title={<ModalTitle title="입력 팝업(검증 규칙 전종)" screenKey="sample.commonModules" />} footer={null} destroyOnHidden>
    <ValidationForm onClose={onClose} onDone={onDone} />
  </Modal>
);

const ValidationForm = ({ onClose, onDone }: Omit<Props, 'open'>) => {
  const [form] = Form.useForm<ValidationValues>();
  const kind = Form.useWatch('kind', form);
  // ③ 검증을 통과했을 때만 불린다
  const onFinish = (v: ValidationValues) => {
    onDone(toValidationBody(v));
    onClose();
  };
  return (
    <Form<ValidationValues> form={form} component={false} initialValues={{ kind: 'NORMAL', startDate: today(), endDate: today(), keepMonths: 12, delMonths: 24 }} onFinish={onFinish} scrollToFirstError>
      <DetailGrid
        cols={2}
        labelWidth={110}
        items={[
          { label: '사무소', required: true, span: 2, value: formItem('ofcCode', <OfficeSelector />, RULES.ofcCode) },
          { label: '기번', required: true, value: formItem('mcnNo', <Input maxLength={3} placeholder="숫자 3자리" aria-label="기번" />, RULES.mcnNo) },
          { label: '구분', required: true, value: formItem('kind', <Select options={KIND_OPTIONS} aria-label="구분" />, RULES.kind) },
          // ④ 조건부 필수: '기타'일 때만 비고 필수(dependencies 는 주지 않는다 — 고르는 순간 빈칸 오류가 뜨지 않게)
          { label: '비고', span: 2, required: kind === 'ETC', value: formItem('memo', <Input placeholder="구분이 기타면 필수, 100자 이내" aria-label="비고" />, [...when(kind === 'ETC', req('비고')), ...RULES.memo]) },
          { label: '전화번호', value: formItem('telNo', <Input placeholder="02-1234-5678" aria-label="전화번호" />, RULES.telNo) },
          { label: '건수', value: formItem('cnt', <Input placeholder="숫자만" aria-label="건수" />, RULES.cnt) },
          { label: '금액', required: true, value: formItem('amount', <InputNumber<number> style={{ width: '100%' }} min={0} step={1000} placeholder="1 ~ 1억" aria-label="금액" />, RULES.amount) },
          { label: '기간(31일)', value: formItem('period', <DatePicker.RangePicker style={{ width: '100%' }} />, RULES.period) },
          { label: '시작일', required: true, value: formItem('startDate', <DatePicker style={{ width: '100%' }} aria-label="시작일" />, RULES.startDate) },
          // ④ 칸끼리 비교: 시작일이 바뀌면 종료일도 다시 검사
          { label: '종료일', required: true, value: formItem('endDate', <DatePicker style={{ width: '100%' }} aria-label="종료일" />, RULES.endDate, { dependencies: ['startDate'] }) },
          { label: '보관 개월', required: true, value: formItem('keepMonths', <InputNumber<number> style={{ width: '100%' }} precision={0} aria-label="보관 개월" />, RULES.keepMonths) },
          { label: '삭제 개월', required: true, value: formItem('delMonths', <InputNumber<number> style={{ width: '100%' }} precision={0} aria-label="삭제 개월" />, RULES.delMonths, { dependencies: ['keepMonths'] }) },
        ]}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button onClick={onClose}>닫기</Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
          저장
        </Button>
      </div>
    </Form>
  );
};
