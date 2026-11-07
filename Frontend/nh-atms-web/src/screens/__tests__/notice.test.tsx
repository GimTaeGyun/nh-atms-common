import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { waitForModalClosed } from '@/test/modal';
import { noticeApi } from '@/api/endpoints/notice';
import { AppError } from '@/api/errors';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePermPreviewStore } from '@/stores/usePermPreviewStore';
import { MOCK_ME } from '@/mocks/handlers/me';
import { NOTICES, NOTICE_COUNT, resetMockNotices } from '@/mocks/data/notice';
import { toYmd } from '@/utils/date';
import NoticePage from '@/screens/sample/NoticePage';
import type { Notice } from '@/domain/notice';
import { lastMonth, toNoticeParams } from '@/screens/sample/NoticeParts';
import { byteLength } from '@/utils/rules';
import { VMSG } from '@/config/messages';

const WAIT = { timeout: 4000 };

beforeEach(() => {
  resetMockNotices();
  useAuthStore.getState().setMe(MOCK_ME);
  usePermPreviewStore.getState().setPreview('off');
});

const renderPage = () => renderWithProviders(<NoticePage screenKey="sample.notice" screenId="" active />);

/** 기본 조건(최근 1개월 + 내 사무소)에 맞는 목 행 — 화면 결과와 비교용 */
const expectedDefault = () => {
  const [from, to] = lastMonth().map((d) => toYmd(d) ?? '');
  return NOTICES.filter((n) => n.ofcCode === MOCK_ME.ofcCode && (n.wrtDate ?? '') >= from && (n.wrtDate ?? '') <= to).sort((a, b) => b.no - a.no);
};

/** [조회](조회조건 패널의 버튼)를 눌러 '총 N건' 이 뜰 때까지 */
const searchDefault = async () => {
  const rows = expectedDefault();
  fireEvent.click(screen.getAllByRole('button', { name: /조회/ })[0]);
  await screen.findByText(`총 ${rows.length}건`, undefined, WAIT);
  return rows;
};

/** 그리드의 행(인쇄 양식에도 같은 글이 있어 data-row-key 로 찾는다) */
const dataRow = (n: Notice): HTMLElement => {
  const tr = document.querySelector<HTMLElement>(`.data-grid tr[data-row-key="${n.no}"]`);
  if (!tr) throw new Error(`그리드에 ${n.no} 행이 없다`);
  return tr;
};

describe('공지사항 목 API(계약 §3)', () => {
  it('목록은 NO 내림차순·text null, 검색구분 ALL 이면 검색어를 무시한다', async () => {
    const r = await noticeApi.list({ field: 'ALL', keyword: '없는말', page: 1, size: 100 });
    expect(r.totalCount).toBe(NOTICE_COUNT);
    expect(r.content[0].no).toBeGreaterThan(r.content[1].no);
    r.content.forEach((n) => expect(n.text).toBeNull());
    const byName = await noticeApi.list({ field: 'NAME', keyword: NOTICES[0].name ?? '', page: 1, size: 100 });
    byName.content.forEach((n) => expect(n.name).toContain(NOTICES[0].name));
  });

  it('오류 코드는 백엔드와 같다: VAL_003(형식)·VAL_001(기간)·NTC_001(없음)', async () => {
    await expect(noticeApi.list({ field: 'WRITER' as never, keyword: 'x' })).rejects.toMatchObject({ code: 'VAL_003', userMessage: '파라미터 형식이 올바르지 않습니다: field' });
    await expect(noticeApi.list({ fromDate: '20261031', toDate: '20261001' })).rejects.toMatchObject({ code: 'VAL_001' });
    await expect(noticeApi.list({ ofcCode: '12a' })).rejects.toMatchObject({ code: 'VAL_003' });
    const e = await noticeApi.get(99999).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(AppError);
    expect(e).toMatchObject({ kind: 'notFound', code: 'NTC_001' });
    await expect(noticeApi.remove([])).rejects.toMatchObject({ code: 'VAL_001', userMessage: '입력값이 올바르지 않습니다: nos' });
    await expect(noticeApi.create({ subject: '가'.repeat(101), text: '내용' })).rejects.toMatchObject({ code: 'VAL_001' });
  });

  it('hit=Y 일 때만 조회수가 오른다, 등록은 MAX+1·고정 사용자', async () => {
    const before = NOTICES[0].visit ?? 0;
    await noticeApi.get(NOTICES[0].no);
    expect(NOTICES[0].visit).toBe(before);
    const got = await noticeApi.get(NOTICES[0].no, true);
    expect(got.visit).toBe(before + 1);
    const created = await noticeApi.create({ subject: '새 글', text: '본문', ofcCode: '80' });
    expect(created).toMatchObject({ no: NOTICE_COUNT + 1, ofcCode: '000080', kanm: '테크부문', name: MOCK_ME.name, perNo: MOCK_ME.perNo, visit: 0 });
    expect(created.crtDtm).toHaveLength(14);
  });
});

describe('조회조건 → 파라미터 · 바이트 규칙', () => {
  it('검색구분 전체·빈 검색어는 보내지 않고, 빈 사무소·작성자는 빠진다', () => {
    expect(toNoticeParams({ field: 'ALL', keyword: '점검', ofcCode: '' })).toEqual({});
    expect(toNoticeParams({ field: 'SUBJECT', keyword: ' 점검 ', ofcCode: '000080', perNo: undefined })).toEqual({ field: 'SUBJECT', keyword: '점검', ofcCode: '000080' });
    expect(toNoticeParams({ field: 'TEXT', keyword: '  ' })).toEqual({});
  });
  it('바이트: ASCII 1, 한글 2 (서버 DbBytes.length 와 같음)', () => {
    expect(byteLength('abc')).toBe(3);
    expect(byteLength('공지 A')).toBe(6);
    expect(byteLength(null)).toBe(0);
  });
});

describe('공지사항 화면', () => {
  it('조회 → 목록 행·건수, 사무소 표시는 [코드] 사무소명', async () => {
    renderPage();
    expect(screen.getByText('조회 조건을 입력하고 [조회]를 누르세요.')).toBeInTheDocument();
    const rows = await searchDefault();
    expect(rows.length).toBeGreaterThan(0);
    await waitFor(() => expect(within(dataRow(rows[0])).getByText(rows[0].subject ?? '')).toBeInTheDocument(), WAIT);
    expect(within(dataRow(rows[0])).getByText('[000080] 테크부문')).toBeInTheDocument();
  });

  it('권한 미리보기 "조회만" 이면 등록·수정·삭제가 흐리다', async () => {
    usePermPreviewStore.getState().setPreview('qry');
    renderPage();
    expect(screen.getByRole('button', { name: /등록/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /수정/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /삭제/ })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /조회/ })[0]).toBeEnabled();
  });

  it('등록: 바이트 초과는 칸 아래 오류, 고치면 저장되고 팝업이 닫힌다', async () => {
    usePermPreviewStore.getState().setPreview('all');
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /등록/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('공지사항 등록')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('작성자')).toHaveTextContent(`${MOCK_ME.name} (${MOCK_ME.perNo})`);
    fireEvent.change(within(dialog).getByRole('textbox', { name: '제목' }), { target: { value: '가'.repeat(101) } });
    fireEvent.change(within(dialog).getByRole('textbox', { name: '내용' }), { target: { value: '첫 줄\n둘째 줄' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /저장/ }));
    expect(await within(dialog).findByText(VMSG.maxBytes(200), undefined, WAIT)).toBeInTheDocument();
    expect(NOTICES).toHaveLength(NOTICE_COUNT);

    fireEvent.change(within(dialog).getByRole('textbox', { name: '제목' }), { target: { value: '견본 등록 테스트' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /저장/ }));
    await waitFor(() => expect(NOTICES).toHaveLength(NOTICE_COUNT + 1), WAIT);
    expect(NOTICES[NOTICES.length - 1]).toMatchObject({ subject: '견본 등록 테스트', text: '첫 줄\n둘째 줄', ofcCode: MOCK_ME.ofcCode, perNo: MOCK_ME.perNo });
    await waitForModalClosed(dialog, WAIT);
  });

  it('수정: 1건 체크 → 원문을 읽어 채우고, 저장하면 목록이 다시 읽힌다', async () => {
    usePermPreviewStore.getState().setPreview('all');
    renderPage();
    const rows = await searchDefault();
    const target = rows[0];
    const updateBtn = screen.getByRole('button', { name: /수정/ });
    expect(updateBtn).toBeDisabled();
    await userEvent.click(within(dataRow(target)).getByRole('checkbox'));
    expect(updateBtn).toBeEnabled();
    fireEvent.click(updateBtn);
    const dialog = await screen.findByRole('dialog');
    const subject = await within(dialog).findByDisplayValue(target.subject ?? '', undefined, WAIT);
    expect(within(dialog).getByRole('textbox', { name: '내용' })).toHaveValue(target.text);
    fireEvent.change(subject, { target: { value: '제목을 고쳤습니다' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /저장/ }));
    await waitFor(() => expect(NOTICES.find((n) => n.no === target.no)?.subject).toBe('제목을 고쳤습니다'), WAIT);
    await waitFor(() => expect(within(dataRow(target)).getByText('제목을 고쳤습니다')).toBeInTheDocument(), WAIT);
  });

  it('삭제: 여러 건 체크 → 확인창 "선택한 2건을 삭제하시겠습니까?" → 확인', async () => {
    usePermPreviewStore.getState().setPreview('all');
    renderPage();
    const rows = await searchDefault();
    if (rows.length < 2) throw new Error('목 데이터: 기본 조건에 2건 이상 필요');
    await userEvent.click(within(dataRow(rows[0])).getByRole('checkbox'));
    await userEvent.click(within(dataRow(rows[1])).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /삭제/ }));
    expect(await screen.findByText('선택한 2건을 삭제하시겠습니까?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(NOTICES).toHaveLength(NOTICE_COUNT - 2), WAIT);
    expect(NOTICES.some((n) => n.no === rows[0].no || n.no === rows[1].no)).toBe(false);
    await screen.findByText(`총 ${rows.length - 2}건`, undefined, WAIT);
  });

  it('행 더블클릭 → 상세 팝업(내용 줄바꿈 그대로), 조회수 +1, 수정 버튼은 UPD 권한', async () => {
    renderPage();
    const rows = await searchDefault();
    const target = rows[0];
    const before = target.visit ?? 0;
    fireEvent.doubleClick(dataRow(target));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('공지사항 상세')).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).getByText((_, el) => el?.classList.contains('pre') === true && el.textContent === target.text)).toBeInTheDocument(), WAIT);
    expect(NOTICES.find((n) => n.no === target.no)?.visit).toBe(before + 1);
    expect(within(dialog).getByRole('button', { name: /수정/ })).toBeDisabled(); // 실제 권한(메뉴 없음) = 조회만
  });
});
