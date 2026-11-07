import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePermPreviewStore } from '@/stores/usePermPreviewStore';
import { useMessageLineStore } from '@/stores/useMessageLineStore';
import { MOCK_ME } from '@/mocks/handlers/me';
import CommonModulesPage from '@/screens/sample/CommonModulesPage';
import { DEMO_ROWS, EDIT_ROWS } from '@/screens/sample/commonModules/demoData';
import { applyChanges } from '@/screens/sample/commonModules/GridExtras';
import { PREVIEW_NOTE } from '@/screens/sample/commonModules/AuthMessageTab';

const WAIT = { timeout: 4000 };
/** 화면 전체를 그리는 시험(전체 시험 병렬 실행 때 느려짐 대비) */
const SLOW = 20_000;

beforeEach(() => {
  useAuthStore.getState().setMe(MOCK_ME);
  usePermPreviewStore.getState().setPreview('off');
  useMessageLineStore.getState().clear();
});
afterEach(() => {
  usePermPreviewStore.getState().setPreview('off');
});

const renderPage = (active = true) => renderWithProviders(<CommonModulesPage screenKey="sample.commonModules" screenId="" active={active} />);
const openTab = (name: string) => fireEvent.click(screen.getByRole('tab', { name }));
const echoText = (label: string): string => screen.getByLabelText(label).textContent ?? '';
/** ActionBar 버튼(라벨 글자로) — 권한이 없으면 disabled */
const actionBtn = (label: string): HTMLButtonElement => {
  const bar = document.querySelector<HTMLElement>('.demo-action-bar')!;
  const hit = within(bar).getAllByRole('button').find((b) => b.textContent?.replace(/\s/g, '') === label);
  if (!hit) throw new Error(`버튼 ${label} 없음`);
  return hit as HTMLButtonElement;
};

describe('표 탭', () => {
  it('applyChanges: 삭제 빼고, 수정 바꾸고, 추가는 뒤에', () => {
    const next = applyChanges(EDIT_ROWS, { added: [{ id: -1, code: 'Z9', name: '새 모델', useYn: 'Y', sortOrd: 6, aplyDate: '20261107' }], updated: [{ ...EDIT_ROWS[0], name: '바뀐 이름' }], deleted: [EDIT_ROWS[1]] });
    expect(next.map((r) => r.code)).toEqual(['A1', 'B1', 'C1', 'S1', 'Z9']);
    expect(next[0].name).toBe('바뀐 이름');
  });

  it('견본 행은 결정적이고 정본 길이(사무소 6·기번 3)를 지킨다', () => {
    expect(DEMO_ROWS.length).toBeGreaterThanOrEqual(25);
    DEMO_ROWS.forEach((r) => {
      expect(r.ofcCode).toMatch(/^\d{6}$/);
      expect(r.mcnNo).toMatch(/^\d{3}$/);
      expect(r.wrtDate).toMatch(/^\d{8}$/);
      expect(r.wrtTime).toMatch(/^\d{6}$/);
    });
    expect(new Set(DEMO_ROWS.map((r) => r.id)).size).toBe(DEMO_ROWS.length);
  });

  it('G3: 조회 전 안내 → [조회] 하면 서버 페이징 10건, 체크하면 선택 건수, 표 편집 저장은 BatchChanges 본문', async () => {
    renderPage();
    openTab('표');
    expect(screen.getAllByText('조회 조건을 입력하고 [조회]를 누르세요.').length).toBeGreaterThan(0);
    fireEvent.click(document.querySelector<HTMLElement>('.search-btn')!);
    await waitFor(() => expect(document.querySelectorAll('.data-grid')[0].querySelectorAll('tbody tr[data-row-key]').length).toBe(10), WAIT);
    expect(echoText('상태')).toContain('"page": 1');
    const g3 = document.querySelectorAll<HTMLElement>('.data-grid')[0];
    // 마스킹 칸: 계좌번호 원문은 보이지 않는다
    expect(g3.textContent).not.toContain(DEMO_ROWS[0].acctNo);
    const firstCheck = g3.querySelector<HTMLInputElement>(`tr[data-row-key="${DEMO_ROWS[0].id}"] input[type="checkbox"]`)!;
    fireEvent.click(firstCheck);
    await waitFor(() => expect(echoText('상태')).toContain(`"${DEMO_ROWS[0].id}"`), WAIT);

    // EditableGrid: 첫 행 이름을 바꾸고 저장
    const names = screen.getAllByLabelText('이름');
    fireEvent.change(names[0], { target: { value: '바뀐 이름' } });
    const editable = names[0].closest<HTMLElement>('.editable-grid')!;
    await waitFor(() => expect(within(editable).getByRole('button', { name: /저\s*장/ })).toBeEnabled(), WAIT);
    fireEvent.click(within(editable).getByRole('button', { name: /저\s*장/ }));
    await waitFor(() => expect(echoText('저장 요청 본문(BatchChanges)')).toContain('바뀐 이름'), WAIT);
    const body = JSON.parse(echoText('저장 요청 본문(BatchChanges)').replace(/^[^=]*=\s*/, '')) as { added: unknown[]; updated: { id: number; name: string }[]; deleted: unknown[] };
    expect(body.added).toEqual([]);
    expect(body.deleted).toEqual([]);
    expect(body.updated).toEqual([expect.objectContaining({ id: EDIT_ROWS[0].id, name: '바뀐 이름' })]);
  }, SLOW);

  it('마스터 행을 누르면 디테일에 그 기기사 모델만', async () => {
    renderPage();
    openTab('표');
    fireEvent.click(screen.getByText('효성티엔에스'));
    expect(await screen.findByText('모델 — 효성티엔에스', undefined, WAIT)).toBeInTheDocument();
    expect(screen.getByText('공과금수납기')).toBeInTheDocument();
  }, SLOW);
});

describe('출력 탭', () => {
  it('엑셀 머리글 = 화면 컬럼 정의(순번 제외·그룹 평탄화), [인쇄] 는 window.print', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    renderPage();
    openTab('출력');
    const header = JSON.parse(echoText('엑셀 머리글').replace(/^[^=]*=\s*/, '')) as string[];
    expect(header).toEqual(['사무소', '기번', '모델', '기기사/모델', '사용', '365', '작성일시', '작성일', '작성시각', '금액', '건수', '비율', '계좌번호', '전화번호', '성명', '결과', '승인']);
    fireEvent.click(screen.getByRole('button', { name: /인\s*쇄/ }));
    await waitFor(() => expect(print).toHaveBeenCalled(), WAIT);
    expect(document.querySelector('.print-layout')?.textContent).toContain('공통 모듈 인쇄 견본');
    print.mockRestore();
  }, SLOW);

  it('첨부: 파일을 고르면 가짜 올리기(진행률) 후 완료 파일로', async () => {
    renderPage();
    openTab('출력');
    const input = document.querySelector<HTMLInputElement>('.file-attach-list input[type="file"]')!;
    fireEvent.change(input, { target: { files: [new File(['abc'], 'memo.txt', { type: 'text/plain' })] } });
    await waitFor(() => expect(echoText('완료 파일')).toContain('memo.txt'), WAIT);
    expect(echoText('완료 파일')).toContain('"fileId": "DEMO');
  }, SLOW);
});

describe('권한·메시지 탭', () => {
  it('나(/api/me)와 미리보기 안내를 보여 준다', () => {
    renderPage();
    openTab('권한·메시지');
    expect(screen.getAllByText(MOCK_ME.name).length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(PREVIEW_NOTE)).length).toBeGreaterThan(0);
  }, SLOW);

  it('미리보기 "조회만" 이면 등록·삭제가 흐려지고 AuthGuard 는 대체 문구, "전부" 면 풀린다', async () => {
    renderPage();
    openTab('권한·메시지');
    fireEvent.click(screen.getByRole('radio', { name: '조회만' }));
    await waitFor(() => expect(actionBtn('등록')).toBeDisabled(), WAIT);
    expect(actionBtn('삭제')).toBeDisabled();
    expect(actionBtn('조회')).toBeEnabled();
    expect(screen.getByTestId('guard-fallback')).toBeInTheDocument();
    expect(screen.queryByText('삭제 권한 버튼(숨김형)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: '전부' }));
    await waitFor(() => expect(actionBtn('등록')).toBeEnabled(), WAIT);
    expect(actionBtn('긴급')).toBeEnabled();
    expect(screen.getByTestId('guard-content')).toBeInTheDocument();
    expect(screen.getByText('삭제 권한 버튼(숨김형)')).toBeInTheDocument();
    expect(usePermPreviewStore.getState().preview).toBe('all');
  }, SLOW);

  it('버튼을 누르면 하단 메시지 라인에 남는다', async () => {
    renderPage();
    openTab('권한·메시지');
    fireEvent.click(actionBtn('조회'));
    await waitFor(() => expect(useMessageLineStore.getState().messages[0]?.text).toBe('[조회] 버튼을 눌렀습니다.'), WAIT);
    expect(useMessageLineStore.getState().messages[0]?.screenKey).toBe('sample.commonModules');
  }, SLOW);

  it('서버 오류는 서버 응답코드·문구 그대로(400 LKP_002, 404)', async () => {
    renderPage();
    openTab('권한·메시지');
    fireEvent.click(screen.getByRole('button', { name: /LKP_002/ }));
    await waitFor(() => expect(echoText('마지막 오류')).toContain('"code": "LKP_002"'), WAIT);
    expect(echoText('마지막 오류')).toContain('조회할 수 없는 항목입니다. (unknown)');
    expect(echoText('마지막 오류')).toContain('"status": 400');
  }, SLOW);

  it('자동 새로고침: 화면 탭이 비활성이면 멈춤으로 보인다', () => {
    renderPage(false);
    openTab('권한·메시지');
    fireEvent.click(screen.getByRole('switch', { name: '자동 새로고침' }));
    expect(screen.getByText(/멈춤\(탭 비활성\)/)).toBeInTheDocument();
    expect(screen.getByTestId('auto-count')).toHaveTextContent('0');
  }, SLOW);
});
