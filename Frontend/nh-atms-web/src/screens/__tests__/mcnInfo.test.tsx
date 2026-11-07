import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavStore } from '@/stores/useNavStore';
import { usePermPreviewStore } from '@/stores/usePermPreviewStore';
import { mcnInfoApi } from '@/api/endpoints/mcnInfo';
import { MCN_INFOS, resetMcnInfos } from '@/mocks/data/mcnInfo';
import { appUi } from '@/hooks/useAppMessage';
import type { AppError } from '@/api/errors';
import type { Me } from '@/types/auth';
import McnInfoPage from '../sample/McnInfoPage';

/**
 * 기기정보 견본 화면(sample.mcnInfo) — 목 API(MSW)로 조회 → 그리드, 등록·수정·삭제 흐름, 권한 미리보기(조회만)일 때 버튼 흐림,
 * 그리고 목 응답의 오류코드 계약(V001_20·VAL_003·MCN_001·MCN_002).
 */
const ME: Me = { perNo: '1234567', name: '홍길동', samuso: '000080', samusoName: '테크부문', deptCode: '000080', ofcCode: '000080', kanm: '테크부문', auth: 'A', adminYn: 'Y' };
const T = { timeout: 4000 };

const renderPage = () => renderWithProviders(<McnInfoPage screenKey="sample.mcnInfo" screenId="" active />);
const panel = (container: HTMLElement) => container.querySelector('.search-panel') as HTMLElement;
const activePane = () => document.querySelector('.ant-tabs-tabpane-active') as HTMLElement;
const myRows = () => MCN_INFOS.filter((r) => r.ofcCode === '000080' && r.useYn === 'Y');

const searchNow = async (container: HTMLElement) => {
  await userEvent.click(within(panel(container)).getByRole('button', { name: /조회/ }));
  expect(await screen.findByText(`(${myRows().length}건)`, undefined, T)).toBeInTheDocument();
};

/** 서버 성공 문구(http.ts → notifySuccess → appUi.message) 를 모은다 — 앱에서는 AppMessageBridge 가 antd message 를 꽂는다 */
let toasts: string[] = [];
const savedMessage = appUi.message;
const lastToast = () => toasts[toasts.length - 1];

beforeEach(() => {
  toasts = [];
  appUi.message = { success: (t: unknown) => toasts.push(String(t)) } as unknown as typeof appUi.message;
  resetMcnInfos();
  useAuthStore.getState().setMe(ME);
  useNavStore.setState({ menus: [] });
  usePermPreviewStore.getState().setPreview('off');
});
afterEach(() => {
  appUi.message = savedMessage;
});

/** 기종 콤보(공통 SrcSelect, `/api/lookup/srcs`)에서 라벨로 고른다 */
const pickSrc = async (pane: HTMLElement, label: string) => {
  fireEvent.mouseDown(within(pane).getByRole('combobox', { name: '기종' }));
  // 목록 탭 그리드 칸에도 같은 title 이 있을 수 있어 열린 드롭다운 안에서 찾는다
  const option = await waitFor(() => {
    const el = Array.from(document.querySelectorAll<HTMLElement>('.ant-select-dropdown [title]')).find((e) => e.getAttribute('title') === label);
    expect(el).toBeDefined();
    return el as HTMLElement;
  }, T);
  fireEvent.click(option);
};

describe('기기정보 화면', () => {
  it('조회 → 내 사무소(사용 Y)의 기기가 그리드에 나온다', async () => {
    const { container } = renderPage();
    await searchNow(container);
    const first = myRows()[0];
    expect(screen.getAllByText(first.mcnNo).length).toBeGreaterThan(0);
    expect(container.querySelectorAll('tr.ant-table-row')).toHaveLength(myRows().length);
  }, 15000);

  it('등록: [등록] → 편집 탭 입력 → 저장되면 목록으로 돌아가고 새 행이 보인다', async () => {
    const { container } = renderPage();
    await searchNow(container);
    await userEvent.click(within(activePane()).getByRole('button', { name: /등록/ }));
    const pane = await waitFor(() => {
      const p = activePane();
      expect(within(p).getByLabelText('기번 입력')).toBeInTheDocument();
      return p;
    });
    await userEvent.type(within(pane).getByLabelText('기번 입력'), '777');
    await pickSrc(pane, '[S1] STM');
    await userEvent.click(within(pane).getByRole('button', { name: /등록/ }));
    await waitFor(() => expect(MCN_INFOS.some((r) => r.ofcCode === '000080' && r.mcnNo === '777' && r.src === 'S1')).toBe(true), T);
    expect(await screen.findByText('777', undefined, T)).toBeInTheDocument();
    expect(lastToast()).toBe('등록되었습니다.');
  }, 20000);

  it('수정: 행 더블클릭 → 수정 탭(키는 잠김) → 기종 바꿔 저장', async () => {
    const { container } = renderPage();
    await searchNow(container);
    const target = myRows()[0];
    fireEvent.doubleClick(screen.getAllByText(target.mcnNo)[0].closest('tr') as HTMLElement);
    const keyInput = await screen.findByLabelText('기번 입력', undefined, T);
    expect(keyInput).toBeDisabled();
    const pane = activePane();
    const next = target.src === 'B1' ? { src: 'A2', label: '[A2] ATM 365형' } : { src: 'B1', label: '[B1] 공과금수납기' };
    await pickSrc(pane, next.label);
    await userEvent.click(within(pane).getByRole('button', { name: /수정/ }));
    await waitFor(() => expect(MCN_INFOS.find((r) => r.ofcCode === target.ofcCode && r.mcnNo === target.mcnNo)?.src).toBe(next.src), T);
    await waitFor(() => expect(lastToast()).toBe('수정되었습니다.'), T);
  }, 20000);

  it('삭제: 행 선택 → [삭제] → 확인 → 사용여부 N(논리 삭제)', async () => {
    const { container } = renderPage();
    await searchNow(container);
    const target = myRows()[1];
    await userEvent.click(screen.getAllByText(target.mcnNo)[0].closest('tr') as HTMLElement);
    await userEvent.click(within(activePane()).getByRole('button', { name: /삭제/ }));
    expect(await screen.findByText(/사용여부 N 처리/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(MCN_INFOS.find((r) => r.ofcCode === target.ofcCode && r.mcnNo === target.mcnNo)?.useYn).toBe('N'), T);
    await waitFor(() => expect(lastToast()).toBe('삭제되었습니다.'), T);
  }, 20000);

  it('권한 미리보기 "조회만" 이면 등록·삭제 버튼이 흐리고 조회는 된다', async () => {
    usePermPreviewStore.getState().setPreview('qry');
    const { container } = renderPage();
    const bar = activePane();
    expect(within(bar).getByRole('button', { name: /등록/ })).toBeDisabled();
    expect(within(bar).getByRole('button', { name: /삭제/ })).toBeDisabled();
    await searchNow(container);
  }, 15000);
});

describe('기기정보 목 API 계약', () => {
  const codeOf = async (p: Promise<unknown>) => ((await p.then(() => null, (e: unknown) => e)) as AppError | null)?.code;

  it('사무소 필수 V001_20 · 형식 VAL_003 · 없음 MCN_001 · 중복 MCN_002', async () => {
    expect(await codeOf(mcnInfoApi.list({ ofcCode: '' }))).toBe('V001_20');
    expect(await codeOf(mcnInfoApi.list({ ofcCode: '80', mcnNo: '12' }))).toBe('VAL_003');
    expect(await codeOf(mcnInfoApi.get('000080', '999'))).toBe('MCN_001');
    const dup = MCN_INFOS[0];
    expect(await codeOf(mcnInfoApi.create({ ofcCode: dup.ofcCode, mcnNo: dup.mcnNo, useYn: 'Y' }))).toBe('MCN_002');
    expect(await codeOf(mcnInfoApi.create({ ofcCode: '000080', mcnNo: '778', useYn: 'Y', komType: '123456' }))).toBe('VAL_001');
  });

  it('사무소코드는 앞 0 을 채우고, 응답은 PageResult 모양', async () => {
    const page = await mcnInfoApi.list({ ofcCode: '80', page: 1, size: 2 });
    expect(Object.keys(page).sort()).toEqual(['content', 'page', 'size', 'totalCount', 'totalPages']);
    expect(page.content).toHaveLength(2);
    expect(page.content.every((r) => r.ofcCode === '000080')).toBe(true);
    expect(Object.keys(page.content[0]).sort()).toEqual(
      ['cnrPstSpecCode', 'crtCmeno', 'crtDtm', 'inoutType', 'instPstCode', 'instPstNm', 'kanm', 'komType', 'lsCmeno', 'lschgDtm', 'mcnNo', 'ofcCode', 'opType', 'src', 'srcNm', 'useYn', 'vendCode', 'vendNm'],
    );
  });
});
