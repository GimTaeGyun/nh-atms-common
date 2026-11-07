import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePermPreviewStore } from '@/stores/usePermPreviewStore';
import { MOCK_ME } from '@/mocks/handlers/me';
import { SAME_USER_MESSAGE } from '@/components/approval/ApproverKeyInModal';
import { VMSG } from '@/config/messages';
import { dayjs, today, toYmd } from '@/utils/date';
import CommonModulesPage from '@/screens/sample/CommonModulesPage';
import { toDateParams } from '@/screens/sample/commonModules/DateTab';
import { toComboParams } from '@/screens/sample/commonModules/ComboTab';
import { plain } from '@/screens/sample/commonModules/CodeSample';

const WAIT = { timeout: 4000 };
/** 화면 전체를 그리는 시험(전체 시험 병렬 실행 때 느려짐 대비) */
const SLOW = 20_000;

beforeEach(() => {
  useAuthStore.getState().setMe(MOCK_ME);
  usePermPreviewStore.getState().setPreview('off');
});

const renderPage = (active = true) => renderWithProviders(<CommonModulesPage screenKey="sample.commonModules" screenId="" active={active} />);
const openTab = (name: string) => fireEvent.click(screen.getByRole('tab', { name }));
/** EchoJson(<pre aria-label=…>) 의 글 */
const echoText = (label: string): string => screen.getByLabelText(label).textContent ?? '';
/** 조회조건 패널의 [조회] (role 질의는 큰 화면에서 느려 class 로 찾는다) */
const clickSearch = () => fireEvent.click(document.querySelector<HTMLElement>('.search-btn')!);
const dialog = (title: string) => screen.getAllByRole('dialog').find((d) => within(d).queryByText(title)) as HTMLElement;

describe('매퍼(화면 → API 파라미터)', () => {
  it('날짜 매퍼는 YYYYMMDD·HHmm·YYYYMM 문자열로 바꾼다', () => {
    const d = dayjs('2026-11-07');
    const p = toDateParams({ date: d, period: [d.subtract(6, 'day'), d], periodRange: { unit: 'MONTH', range: [d.subtract(2, 'month'), d] }, yyyymm: d, year: '2026', baseDate: d, time: { from: '0900', to: '1800' }, atTime: '1030', hday: d });
    expect(p).toEqual({ date: '20261107', fromDate: '20261101', toDate: '20261107', period: { unit: 'MONTH', fromDate: '20260907', toDate: '20261107' }, yyyymm: '202611', year: '2026', baseDate: '20261107', fromTime: '0900', toTime: '1800', atTime: '1030', hday: '20261107' });
  });

  it('콤보 매퍼: 전체(ALL·빈 값)는 빠지고, 모델 값은 기기구분/모델코드로 나뉜다', () => {
    expect(toComboParams({ ofcCode: '000080', vendCode: '01', modelCode: '02:A1', code: 'ALL', useYn: '', sidoCode: '11' })).toEqual({ ofcCode: '000080', vendCode: '01', mcnType: '02', modelCode: 'A1', sidoCode: '11' });
    expect(toComboParams({ modelCode: 'A1', useYn: 'Y', code: '01' })).toEqual({ modelCode: 'A1', useYn: 'Y', code: '01' });
  });

  it('JSON 표시는 Dayjs 를 YYYY-MM-DD 로 바꾼다', () => {
    expect(plain({ a: [dayjs('2026-01-02')], b: { c: 1 } })).toEqual({ a: ['2026-01-02'], b: { c: 1 } });
  });
});

describe('공통 모듈 화면 — 날짜·콤보', () => {
  it('날짜 탭: [조회] 하면 조회조건이 API 파라미터로 바뀌어 보인다, 이번 달 휴일은 실제 lookup API 로 읽는다', async () => {
    renderPage();
    expect(screen.getByRole('tab', { name: '날짜', selected: true })).toBeInTheDocument();
    clickSearch();
    await screen.findByLabelText('API 파라미터', undefined, WAIT);
    const text = echoText('API 파라미터');
    const ymd = toYmd(today())!;
    expect(text).toContain(`"date": "${ymd}"`);
    expect(text).toContain(`"fromDate": "${ymd}"`);
    expect(text).toContain(`"yyyymm": "${today().format('YYYYMM')}"`);
    expect(text).toContain(`"year": "${today().format('YYYY')}"`);
    // 목 휴일: 토·일 = HDAY_YN 'Y'
    const firstSat = today().startOf('month').day(6).month() === today().month() ? today().startOf('month').day(6) : today().startOf('month').day(13);
    await waitFor(() => expect(echoText('이번 달 휴일')).toContain(firstSat.format('YYYYMMDD')), WAIT);
  }, SLOW);

  it('날짜 탭: [코드 보기] 를 누르면 사용 예가 펼쳐진다', () => {
    renderPage();
    const btn = screen.getAllByRole('button', { name: /코드 보기/ })[0];
    fireEvent.click(btn);
    expect(document.querySelector('.code-sample')?.textContent).toContain('rangeField({ maxDays: 31 })');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  }, SLOW);

  it('콤보 탭: 내 사무소가 기본값, [조회] 하면 전체(ALL) 칸은 빠진 파라미터', async () => {
    renderPage();
    openTab('콤보');
    clickSearch();
    await screen.findByLabelText('API 파라미터', undefined, WAIT);
    const text = echoText('API 파라미터');
    expect(text).toContain(`"ofcCode": "${MOCK_ME.ofcCode}"`);
    expect(text).toContain('"useYn": "Y"');
    expect(text).not.toContain('"code"');
  }, SLOW);

  it('콤보 탭: 개인번호 Enter → 성명 조회(GET /api/lookup/persons/{perNo})', async () => {
    renderPage();
    openTab('콤보');
    const inputs = screen.getAllByPlaceholderText('개인번호');
    const standalone = inputs[inputs.length - 1];
    fireEvent.change(standalone, { target: { value: MOCK_ME.perNo } });
    fireEvent.keyDown(standalone, { key: 'Enter' });
    await waitFor(() => expect(echoText('개인번호 결과')).toContain(MOCK_ME.name), WAIT);
  }, SLOW);
});

describe('공통 모듈 화면 — 팝업', () => {
  it('입력 팝업: 빈 채로 저장하면 칸 아래 오류, 채우면 보낼 본문이 보인다', async () => {
    renderPage();
    openTab('팝업');
    fireEvent.click(screen.getByRole('button', { name: '입력 팝업 열기' }));
    const dlg = await screen.findByRole('dialog', undefined, WAIT);
    fireEvent.click(within(dlg).getByRole('button', { name: /저장/ }));
    expect(await within(dlg).findByText(VMSG.required('기번'), undefined, WAIT)).toBeInTheDocument();
    expect(within(dlg).getByText(VMSG.required('금액'))).toBeInTheDocument();

    fireEvent.change(within(dlg).getByLabelText('기번'), { target: { value: '12' } });
    fireEvent.blur(within(dlg).getByLabelText('기번'));
    expect(await within(dlg).findByText(VMSG.digits(3), undefined, WAIT)).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText('기번'), { target: { value: '001' } });
    fireEvent.change(within(dlg).getByLabelText('금액'), { target: { value: '5000' } });
    const code = within(dlg).getByLabelText('사무소코드');
    fireEvent.change(code, { target: { value: '80' } });
    await waitFor(() => {
      fireEvent.blur(code);
      expect(within(dlg).getAllByText(`[${MOCK_ME.ofcCode}] ${MOCK_ME.kanm}`).length).toBeGreaterThan(0);
    }, WAIT);
    fireEvent.click(within(dlg).getByRole('button', { name: /저장/ }));
    await waitFor(() => expect(echoText('보낼 본문')).toContain('"mcnNo": "001"'), WAIT);
    expect(echoText('보낼 본문')).toContain(`"ofcCode": "${MOCK_ME.ofcCode}"`);
    expect(echoText('보낼 본문')).toContain('"amount": 5000');
  }, SLOW);

  it('사무소 검색 팝업: 실제 목록에서 더블클릭으로 고른다', async () => {
    renderPage();
    openTab('팝업');
    fireEvent.click(screen.getByRole('button', { name: /사무소 검색/ }));
    const dlg = await screen.findByRole('dialog', undefined, WAIT);
    const cell = await within(dlg).findByText(MOCK_ME.ofcCode!, undefined, WAIT);
    fireEvent.doubleClick(cell.closest('tr')!);
    await waitFor(() => expect(echoText('선택 결과')).toContain(`[${MOCK_ME.ofcCode}] ${MOCK_ME.kanm}`), WAIT);
  }, SLOW);

  it('결재: 요청 → 같은 사람 승인은 막고, 다른 사번이면 승인된다', async () => {
    const user = userEvent.setup();
    renderPage();
    openTab('팝업');
    fireEvent.click(screen.getByRole('button', { name: '① 승인 요청' }));
    const req = await screen.findByRole('dialog', undefined, WAIT);
    await user.type(within(req).getByPlaceholderText('승인 요청 사유를 입력하세요'), '기기 정보 변경');
    fireEvent.click(within(req).getByRole('button', { name: /요\s*청/ }));
    await waitFor(() => expect(echoText('결재 상태')).toContain('"status": "REQ"'), WAIT);

    fireEvent.click(screen.getByRole('button', { name: '② 책임자 승인' }));
    const key = dialog('책임자 승인') ?? (await screen.findByRole('dialog', undefined, WAIT));
    await user.type(within(key).getByLabelText('승인자 사번'), MOCK_ME.perNo);
    await user.type(within(key).getByLabelText('비밀번호'), 'pw');
    fireEvent.click(within(key).getByRole('button', { name: /승\s*인/ }));
    expect(await within(key).findByText(SAME_USER_MESSAGE, undefined, WAIT)).toBeInTheDocument();
    await user.clear(within(key).getByLabelText('승인자 사번'));
    await user.type(within(key).getByLabelText('승인자 사번'), '7654321');
    fireEvent.click(within(key).getByRole('button', { name: /승\s*인/ }));
    await waitFor(() => expect(echoText('결재 상태')).toContain('"status": "APPROVED"'), WAIT);
    expect(echoText('결재 상태')).toContain('"approver": "7654321"');
  }, SLOW);

  it('원문 열람: 눈 아이콘 → 사유 팝업', async () => {
    renderPage();
    openTab('팝업');
    fireEvent.click(screen.getByRole('button', { name: '원문 보기' }));
    expect(await screen.findByText('개인정보 열람 사유', undefined, WAIT)).toBeInTheDocument();
  }, SLOW);
});
