/**
 * 탭 3 팝업 — 검색 팝업 3종(실제 lookup API), 상세 팝업, 입력 팝업(검증 규칙 전종), 주소, 원문 열람 사유, 결재 요청/책임자 승인.
 * 원문 열람·결재는 서버 API 가 없는 견본이라 demoData 의 가짜 요청(Promise)으로 흉내 낸다.
 */
import { useState } from 'react';
import { Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { OfficeSearchModal } from '@/components/search/OfficeSearchModal';
import { PersonSearchModal } from '@/components/search/PersonSearchModal';
import { McnSearchModal } from '@/components/search/McnSearchModal';
import { DetailModal } from '@/components/display/DetailModal';
import { DetailGrid, type DetailItem } from '@/components/display/DetailGrid';
import { AddressSearch, type AddressValue } from '@/components/forms/AddressSearch';
import { MaskedText } from '@/components/privacy/MaskedText';
import { useUnmask } from '@/components/privacy/useUnmask';
import { ApprovalRequestModal } from '@/components/approval/ApprovalRequestModal';
import { ApproverKeyInModal } from '@/components/approval/ApproverKeyInModal';
import { ApprovalStepBar } from '@/components/approval/ApprovalStepBar';
import { ApprovalStatusTag } from '@/components/approval/ApprovalStatusTag';
import type { ApprovalStatus } from '@/components/approval/approvalStatus';
import type { Machine, Office, Person } from '@/domain/lookup';
import { fmtAmount, fmtDateTime, fmtOffice, fmtPercent, fmtTermId } from '@/utils/format';
import { Demo, DemoGrid } from './CodeSample';
import { DEMO_ROWS, fakeUnmask, type DemoRow } from './demoData';
import { ValidationModal, type toValidationBody } from './ValidationModal';

type Popup = 'office' | 'person' | 'mcn' | 'detail' | 'input' | 'aprvReq' | 'aprvKey' | null;

/** 상세 팝업 항목(DetailGrid) */
export const demoDetailItems = (r: DemoRow): DetailItem[] => [
  { label: '기번', value: fmtTermId(r.ofcCode, r.mcnNo) },
  { label: '사무소', value: fmtOffice(r.ofcCode, r.kanm) },
  { label: '기기사/모델', value: `${r.vendNm} / ${r.modelNm ?? '-'}` },
  { label: '작성일시', value: fmtDateTime(r.wrtDate, r.wrtTime) },
  { label: '금액', value: fmtAmount(r.amount, { prefix: '₩' }), num: true },
  { label: '비율', value: fmtPercent(r.rate), num: true },
  { label: '승인상태', value: <ApprovalStatusTag status={r.aprvStatus} /> },
  { label: '사용여부', value: r.useYn },
];

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

const PopupTab = () => {
  const [popup, setPopup] = useState<Popup>(null);
  const close = () => setPopup(null);
  const [office, setOffice] = useState<Office | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [mcn, setMcn] = useState<Machine | null>(null);
  const [body, setBody] = useState<ReturnType<typeof toValidationBody> | null>(null);
  const [addr, setAddr] = useState<AddressValue>({ sido: '서울특별시', sigungu: '중구', road: '세종대로 124', zip: '04528', detail: '' });
  const [aprv, setAprv] = useState<{ status: ApprovalStatus | null; reason?: string; approver?: string }>({ status: null });
  const unmask = useUnmask({ request: fakeUnmask, description: '계좌번호 원문 열람 사유를 입력하세요. (견본: 서버 기록 없음)' });
  const row = DEMO_ROWS[0];

  return (
    <>
      <DemoGrid>
        <Demo
          title="검색 팝업 3종 (OfficeSearchModal · PersonSearchModal · McnSearchModal)"
          desc="실제 GET /api/lookup/offices · persons · machines. 행 더블클릭 또는 [선택]."
          code={`<OfficeSearchModal open={open} onClose={close} onSelect={(o) => setOffice(o)} />
<PersonSearchModal open={open} onClose={close} onSelect={(p) => setPerson(p)} />
<McnSearchModal open={open} onClose={close} onSelect={(m) => setMcn(m)} />`}
          echo={{ office: office && fmtOffice(office.ofcCode, office.kanm), person: person && `[${person.perNo}] ${person.name}`, mcn: mcn && fmtTermId(mcn.ofcCode, mcn.mcnNo) }}
          echoLabel="선택 결과"
        >
          <Space wrap>
            <Button icon={<SearchOutlined />} onClick={() => setPopup('office')}>사무소 검색</Button>
            <Button icon={<SearchOutlined />} onClick={() => setPopup('person')}>인원 검색</Button>
            <Button icon={<SearchOutlined />} onClick={() => setPopup('mcn')}>기기 검색</Button>
          </Space>
        </Demo>
        <Demo title="상세 팝업 (DetailModal + DetailGrid)" code={`<DetailModal open={!!detail} onClose={close} title="상세" screenKey={screenKey}>
  {detail && <DetailGrid cols={2} items={detailItems(detail)} />}
</DetailModal>`}>
          <Button onClick={() => setPopup('detail')}>상세 보기 ({fmtTermId(row.ofcCode, row.mcnNo)})</Button>
        </Demo>
        <Demo
          title="입력 팝업 — 검증 규칙 전종 (RULES satisfies Record + formItem)"
          desc="필수·조건부 필수·글자수·숫자 n자리·숫자만·전화·숫자범위·칸 비교·기간 31일·화면 고유 검사. 통과하면 보낼 본문을 보여 준다."
          code={`const RULES = { mcnNo: [req('기번'), digits(3)], endDate: [req('종료일'), afterField('startDate', '…')] } satisfies Record<keyof Values, Rule[]>;
{ label: '기번', required: true, value: formItem('mcnNo', <Input />, RULES.mcnNo) }
<Modal destroyOnHidden><EditForm /></Modal>  // 열릴 때마다 새 폼`}
          echo={body}
          echoLabel="보낼 본문"
        >
          <Button type="primary" onClick={() => setPopup('input')}>입력 팝업 열기</Button>
        </Demo>
        <Demo title="주소 (AddressSearch)" desc="주소 검색 API 가 없어 [검색] 은 '연동 전' 안내. 칸 입력은 된다." code={`<AddressSearch value={addr} onChange={setAddr} />  // search 프롭을 주면 검색 팝업`} echo={addr}>
          <AddressSearch value={addr} onChange={setAddr} />
        </Demo>
        <Demo
          title="원문 열람 사유 (useUnmask + UnmaskReasonModal + MaskedText)"
          desc="눈 아이콘 → 사유 입력 → 원문(화면 메모리에만). 견본은 가짜 응답."
          code={`const unmask = useUnmask({ request: (key, reason) => api.unmask(key, reason) });
<MaskedText value={acctNo} kind="account" revealed={unmask.valueOf(acctNo)} onReveal={() => void unmask.unmask(acctNo)} />
{unmask.modal}`}
          echo={{ revealed: unmask.valueOf(row.acctNo) ?? null }}
        >
          <span>계좌번호 </span>
          <MaskedText value={row.acctNo} kind="account" revealed={unmask.valueOf(row.acctNo)} onReveal={() => void unmask.unmask(row.acctNo)} />
          {unmask.modal}
        </Demo>
        <Demo
          title="결재 요청 → 책임자 승인 (ApprovalStepBar · ApprovalRequestModal · ApproverKeyInModal · ApprovalStatusTag)"
          desc="요청자(나)와 승인자 개인번호가 같으면 막는다. 견본은 가짜 응답."
          code={`<ApprovalStepBar steps={[{ key: 'req', title: '① 요청', enabled: true, done, onClick: openReq }, …]} />
<ApprovalRequestModal open onSubmit={(v) => api.request(v)} />
<ApproverKeyInModal open onApprove={(c) => api.approve(c)} onReject={(r) => api.reject(r)} />`}
          echo={aprv}
          echoLabel="결재 상태"
        >
          <div style={{ marginBottom: 8 }}>
            상태 <ApprovalStatusTag status={aprv.status} />
          </div>
          <ApprovalStepBar
            steps={[
              { key: 'req', title: '① 승인 요청', done: aprv.status !== null && aprv.status !== 'CANCEL', enabled: true, onClick: () => setPopup('aprvReq') },
              { key: 'ok', title: '② 책임자 승인', done: aprv.status === 'APPROVED' || aprv.status === 'REJECTED', enabled: aprv.status === 'REQ', onClick: () => setPopup('aprvKey') },
            ]}
          />
          <Button size="small" style={{ marginTop: 8 }} onClick={() => setAprv({ status: null })}>처음부터</Button>
        </Demo>
      </DemoGrid>

      <OfficeSearchModal open={popup === 'office'} onClose={close} onSelect={setOffice} />
      <PersonSearchModal open={popup === 'person'} onClose={close} onSelect={setPerson} />
      <McnSearchModal open={popup === 'mcn'} onClose={close} onSelect={setMcn} />
      <DetailModal open={popup === 'detail'} onClose={close} title="기기 상세(견본)" screenKey="sample.commonModules" width={680}>
        <DetailGrid cols={2} items={demoDetailItems(row)} />
      </DetailModal>
      <ValidationModal open={popup === 'input'} onClose={close} onDone={setBody} />
      <ApprovalRequestModal
        open={popup === 'aprvReq'}
        onCancel={close}
        target={<>대상: {fmtTermId(row.ofcCode, row.mcnNo)} 기기 정보 변경</>}
        onSubmit={async (v) => {
          await wait(150);
          setAprv({ status: 'REQ', reason: v.reason });
          close();
        }}
      />
      <ApproverKeyInModal
        open={popup === 'aprvKey'}
        onCancel={close}
        target={<>요청 사유: {aprv.reason}</>}
        onApprove={async (c) => {
          await wait(150);
          setAprv((a) => ({ ...a, status: 'APPROVED', approver: c.perNo }));
          close();
        }}
        onReject={async (reason) => {
          await wait(150);
          setAprv((a) => ({ ...a, status: 'REJECTED', reason }));
          close();
        }}
      />
    </>
  );
};

export default PopupTab;
