import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavStore } from '@/stores/useNavStore';
import { usePermPreviewStore } from '@/stores/usePermPreviewStore';
import { mcnModelApi } from '@/api/endpoints/mcnModel';
import { MCN_MODELS, resetMcnModels } from '@/mocks/data/mcnModel';
import { appUi } from '@/hooks/useAppMessage';
import type { AppError } from '@/api/errors';
import type { McnModel } from '@/domain/mcnModel';
import type { Me } from '@/types/auth';
import McnModelPage from '../sample/McnModelPage';
import { byteLength } from '@/utils/rules';
import { duplicateKeyOf, keyText, lacksPermission, vendorRowsOf } from '../sample/McnModelParts';
import { KEY_LOCKED_TITLE } from '../sample/McnModelColumns';

/**
 * 기기모델코드 견본 화면(sample.mcnModel) — 목 API(MSW)로 조회 → 기기사 목록 → 모델 표,
 * 행추가·모델명 수정·행삭제 후 [저장](일괄 저장), 표 안 중복·권한 사전 검사, 권한 미리보기(조회만)일 때 읽기 전용,
 * 그리고 목 응답의 오류코드 계약(VAL_001·MDL_001·MDL_002)과 응답 모양.
 */
const ME: Me = { perNo: '1234567', name: '홍길동', samuso: '000080', samusoName: '테크부문', deptCode: '000080', ofcCode: '000080', kanm: '테크부문', auth: 'A', adminYn: 'Y' };
const T = { timeout: 4000 };
const VEND = '01';

const renderPage = () => renderWithProviders(<McnModelPage screenKey="sample.mcnModel" screenId="" active />);
const panel = (container: HTMLElement) => container.querySelector('.search-panel') as HTMLElement;
const grid = (container: HTMLElement) => container.querySelector('.editable-grid') as HTMLElement;
const gridRows = (container: HTMLElement) => Array.from(grid(container).querySelectorAll<HTMLElement>('tr.ant-table-row'));
const vendRows = () => MCN_MODELS.filter((r) => r.vendCode === VEND);
const m = (vendCode: string, mcnType: string, modelCode: string): McnModel => ({ vendCode, mcnType, modelCode, modelNm: null });

/** 조회 → 기기사 01 선택 → 오른쪽 표에 그 기기사 모델이 나올 때까지 */
const openVendor = async (container: HTMLElement) => {
  await userEvent.click(within(panel(container)).getByRole('button', { name: /조회/ }));
  expect(await screen.findByText(`(${MCN_MODELS.length}건)`, undefined, T)).toBeInTheDocument();
  const vendorTr = (await screen.findByText('[01] 에이텍', undefined, T)).closest('tr') as HTMLElement;
  await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeNull(), T);
  await userEvent.click(vendorTr);
  await waitFor(() => expect(gridRows(container)).toHaveLength(vendRows().length), T);
};

/** 서버 성공 문구(http.ts → notifySuccess → appUi.message) 를 모은다 */
let toasts: string[] = [];
const savedMessage = appUi.message;
const lastToast = () => toasts[toasts.length - 1];

beforeEach(() => {
  toasts = [];
  appUi.message = { success: (t: unknown) => toasts.push(String(t)) } as unknown as typeof appUi.message;
  resetMcnModels();
  useAuthStore.getState().setMe(ME);
  useNavStore.setState({ menus: [] });
  usePermPreviewStore.getState().setPreview('off');
});
afterEach(() => {
  appUi.message = savedMessage;
});

describe('기기모델코드 화면', () => {
  it('조회 → 기기사 목록(모델 수) → 기기사 선택 → 그 기기사 모델 표, 기존 행 키 칸은 잠김', async () => {
    const { container } = renderPage();
    await openVendor(container);
    const vendorTr = screen.getByText('[01] 에이텍').closest('tr') as HTMLElement;
    expect(within(vendorTr).getByText(String(vendRows().length))).toBeInTheDocument();
    const first = gridRows(container)[0];
    const keyCells = Array.from(first.querySelectorAll('td.cell-locked'));
    expect(keyCells).toHaveLength(2);
    expect(within(first).queryByLabelText('기기구분')).toBeNull();
    expect(keyCells[0]).toHaveAttribute('title', KEY_LOCKED_TITLE);
    expect(within(first).getByLabelText('모델명')).toBeInTheDocument();
  }, 20000);

  it('행추가 → 키·모델명 입력 → [저장] 이면 추가되고 서버 문구가 뜬다', async () => {
    const { container } = renderPage();
    await openVendor(container);
    const g = grid(container);
    await userEvent.click(within(g).getByRole('button', { name: '행추가' }));
    const added = await waitFor(() => {
      const r = g.querySelector('tr.row-added') as HTMLElement;
      expect(r).not.toBeNull();
      return r;
    });
    expect(added.querySelector('td.cell-locked')).toBeNull();
    await userEvent.type(within(added).getByLabelText('기기구분'), '03');
    await userEvent.type(within(added).getByLabelText('모델코드'), 'Z9');
    await userEvent.type(within(added).getByLabelText('모델명'), '새 모델');
    await userEvent.click(within(g).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(MCN_MODELS.some((m) => keyText(m) === '01-03-Z9' && m.modelNm === '새 모델')).toBe(true), T);
    await waitFor(() => expect(lastToast()).toBe('저장되었습니다.'), T);
  }, 20000);

  it('모델명 수정 → [저장] 이면 그 행 모델명만 바뀐다', async () => {
    const { container } = renderPage();
    await openVendor(container);
    const target = vendRows()[0];
    const input = within(gridRows(container)[0]).getByLabelText('모델명');
    await userEvent.clear(input);
    await userEvent.type(input, '바꾼 이름');
    await userEvent.click(within(grid(container)).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(MCN_MODELS.find((m) => keyText(m) === keyText(target))?.modelNm).toBe('바꾼 이름'), T);
    expect(lastToast()).toBe('저장되었습니다.');
  }, 20000);

  it('체크 → [행삭제] → [저장] 이면 지워진다', async () => {
    const { container } = renderPage();
    await openVendor(container);
    const target = vendRows()[1];
    await userEvent.click(gridRows(container)[1].querySelector('input[type="checkbox"]') as HTMLElement);
    await userEvent.click(within(grid(container)).getByRole('button', { name: '행삭제' }));
    await userEvent.click(within(grid(container)).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(MCN_MODELS.some((m) => keyText(m) === keyText(target))).toBe(false), T);
    await waitFor(() => expect(lastToast()).toBe('저장되었습니다.'), T);
  }, 20000);

  it('표 안 중복 키는 보내기 전에 막는다(서버 MDL_002 와 같은 문구)', async () => {
    const { container } = renderPage();
    await openVendor(container);
    const dup = vendRows()[0];
    const before = MCN_MODELS.length;
    const g = grid(container);
    await userEvent.click(within(g).getByRole('button', { name: '행추가' }));
    const added = await waitFor(() => {
      const r = g.querySelector('tr.row-added') as HTMLElement;
      expect(r).not.toBeNull();
      return r;
    });
    await userEvent.type(within(added).getByLabelText('기기구분'), dup.mcnType);
    await userEvent.type(within(added).getByLabelText('모델코드'), dup.modelCode);
    await userEvent.click(within(g).getByRole('button', { name: '저장' }));
    expect(await screen.findByText(`이미 등록된 모델코드입니다. (${keyText(dup)})`, undefined, T)).toBeInTheDocument();
    expect(MCN_MODELS).toHaveLength(before);
  }, 20000);

  it('권한 미리보기 "조회만" 이면 표가 읽기 전용(행추가 흐림, 입력 칸 없음)', async () => {
    usePermPreviewStore.getState().setPreview('qry');
    const { container } = renderPage();
    await openVendor(container);
    const g = grid(container);
    expect(within(g).getByRole('button', { name: '행추가' })).toBeDisabled();
    expect(within(g).queryAllByLabelText('모델명')).toHaveLength(0);
  }, 20000);

  it('"조회+등록" 이면 행추가만 된다(기존 행 수정 칸·행 체크 없음, 행삭제 흐림)', async () => {
    usePermPreviewStore.getState().setPreview('qry+reg');
    const { container } = renderPage();
    await openVendor(container);
    const g = grid(container);
    expect(within(g).getByRole('button', { name: '행추가' })).toBeEnabled();
    expect(within(g).getByRole('button', { name: '행삭제' })).toBeDisabled();
    expect(gridRows(container)[0].querySelector('input[type="checkbox"]')).toBeNull();
    expect(within(gridRows(container)[0]).queryByLabelText('모델명')).toBeNull();
    await userEvent.click(within(g).getByRole('button', { name: '행추가' }));
    const added = await waitFor(() => {
      const r = g.querySelector('tr.row-added') as HTMLElement;
      expect(r).not.toBeNull();
      return r;
    });
    expect(within(added).getByLabelText('모델명')).toBeInTheDocument();
  }, 20000);
});

describe('기기모델코드 화면 도우미', () => {

  it('표 안 중복: 지운 키를 다시 추가하는 것은 허용, 추가끼리·기존과 겹치면 그 키', () => {
    const rows = [m('01', '01', 'A1'), m('01', '01', 'A2')];
    expect(duplicateKeyOf(rows, { added: [m('01', '01', 'A1')], updated: [], deleted: [] })).toBe('01-01-A1');
    expect(duplicateKeyOf(rows, { added: [m('01', '01', 'A1')], updated: [], deleted: [rows[0]] })).toBeNull();
    expect(duplicateKeyOf(rows, { added: [m('01', '02', 'B1'), m('01', '02', 'B1 ')], updated: [], deleted: [] })).toBe('01-02-B1');
  });

  it('권한: 변경 종류별로 REG·UPD·DEL', () => {
    const p = { canQry: true, canReg: true, canUpd: false, canDel: false, canExe: false, isAdmin: false };
    expect(lacksPermission({ added: [m('01', '01', 'A1')], updated: [], deleted: [] }, p)).toBe(false);
    expect(lacksPermission({ added: [], updated: [m('01', '01', 'A1')], deleted: [] }, p)).toBe(true);
    expect(lacksPermission({ added: [], updated: [], deleted: [m('01', '01', 'A1')] }, p)).toBe(true);
  });

  it('기기사 목록: 공통 기기사 ∪ 모델의 기기사, 모델 수, 조회조건 기기사만', () => {
    const vendors = [{ vendCode: '01', vendNm: '에이텍' }, { vendCode: '02', vendNm: null }];
    const rows = vendorRowsOf(vendors, [m('01', '01', 'A1'), m('01', '02', 'A1'), m('09', '01', 'X1')]);
    expect(rows.map((r) => [r.vendCode, r.modelCount])).toEqual([['01', 2], ['02', 0], ['09', 1]]);
    expect(vendorRowsOf(vendors, [], '02').map((r) => r.vendCode)).toEqual(['02']);
  });

  it('바이트 길이: ASCII 1, 한글 2', () => {
    expect(byteLength('A1 모델')).toBe(7);
    expect(byteLength(null)).toBe(0);
  });
});

describe('기기모델코드 목 API 계약', () => {
  const codeOf = async (p: Promise<unknown>) => ((await p.then(() => null, (e: unknown) => e)) as AppError | null)?.code;
  const none: McnModel[] = [];

  it('응답 모양: 목록 McnModel[] · 저장 {added, updated, deleted}', async () => {
    const list = await mcnModelApi.list({ vendCode: VEND });
    expect(list.length).toBe(vendRows().length);
    expect(list.every((r) => r.vendCode === VEND)).toBe(true);
    expect(Object.keys(list[0]).sort()).toEqual(['crtCmeno', 'crtDtm', 'lsCmeno', 'lschgDtm', 'mcnType', 'modelCode', 'modelNm', 'vendCode', 'vendNm']);
    expect(MCN_MODELS.length).toBeGreaterThanOrEqual(15);
    expect(MCN_MODELS.every((r) => r.vendCode.length <= 2 && r.mcnType.length <= 2 && r.modelCode.length <= 2 && byteLength(r.modelNm) <= 80)).toBe(true);

    const q = await mcnModelApi.list({ q: 'A1' });
    expect(q.every((r) => r.modelCode.includes('A1') || (r.modelNm ?? '').includes('A1'))).toBe(true);

    const res = await mcnModelApi.saveBatch({ added: [m('04', '03', 'Z0')], updated: [{ ...vendRows()[0], modelNm: '수정' }], deleted: [vendRows()[1]] });
    expect(res).toEqual({ added: 1, updated: 1, deleted: 1 });
  });

  it('키 VAL_001 · 모델명 80바이트 VAL_001 · 중복 MDL_002(본문 안·저장소) · 없음 MDL_001, 실패하면 아무것도 안 바뀜', async () => {
    const before = MCN_MODELS.map((r) => ({ ...r }));
    expect(await codeOf(mcnModelApi.saveBatch({ added: [m('01', '', 'Z1')], updated: none, deleted: none }))).toBe('VAL_001');
    expect(await codeOf(mcnModelApi.saveBatch({ added: [m('01', '01', 'ABC')], updated: none, deleted: none }))).toBe('VAL_001');
    expect(await codeOf(mcnModelApi.saveBatch({ added: [{ ...m('01', '01', 'Z1'), modelNm: '가'.repeat(41) }], updated: none, deleted: none }))).toBe('VAL_001');
    expect(await codeOf(mcnModelApi.saveBatch({ added: [m('01', '01', 'Z1'), m('01', '01', 'Z1')], updated: none, deleted: none }))).toBe('MDL_002');
    expect(await codeOf(mcnModelApi.saveBatch({ added: [vendRows()[0]], updated: none, deleted: none }))).toBe('MDL_002');
    expect(await codeOf(mcnModelApi.saveBatch({ added: none, updated: [m('01', '09', 'Q9')], deleted: none }))).toBe('MDL_001');
    expect(await codeOf(mcnModelApi.saveBatch({ added: [m('01', '01', 'Z2')], updated: none, deleted: [m('01', '09', 'Q9')] }))).toBe('MDL_001');
    expect(MCN_MODELS).toEqual(before);
  });
});
