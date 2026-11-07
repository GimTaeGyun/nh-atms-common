import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { McnSearchModal, OfficeSearchModal, PersonSearchModal } from '@/components/search';
import { useAuthStore } from '@/stores/useAuthStore';
import { MOCK_ME } from '@/mocks/handlers/me';

beforeEach(() => useAuthStore.getState().setMe(MOCK_ME));

const rowOf = async (text: string) => (await screen.findByText(text)).closest('tr')!;

describe('OfficeSearchModal', () => {
  it('코드·사무소명·시도로 거르고, 더블클릭으로 고른다', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(<OfficeSearchModal open onClose={onClose} onSelect={onSelect} />);
    expect(await screen.findByText('사무소 검색')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('사무소코드 또는 사무소명'), '부산');
    const row = await rowOf('부산중앙지점');
    expect(screen.queryByText('본점영업부')).toBeNull();
    fireEvent.doubleClick(row);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ ofcCode: '004010', kanm: '부산중앙지점', sidoCode: '26', sidoNm: '부산광역시' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('PersonSearchModal', () => {
  it('처음엔 내 사무소 인원, 성명으로 다시 조회, 더블클릭으로 고른다', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<PersonSearchModal open onClose={() => undefined} onSelect={onSelect} />);
    expect(await screen.findByText('인원 검색')).toBeInTheDocument();
    expect(await screen.findByText('홍길동')).toBeInTheDocument(); // 내 사무소(000080) 기본
    await userEvent.type(screen.getByRole('textbox', { name: '성명 또는 개인번호' }), '1234567');
    await userEvent.click(screen.getByRole('button', { name: /조회/ }));
    const row = await rowOf('1234567');
    fireEvent.doubleClick(row);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ perNo: '1234567', name: '홍길동' }));
  });

  it('사무소·검색어가 모두 비면 호출하지 않고 안내만', async () => {
    useAuthStore.getState().setMe({ ...MOCK_ME, ofcCode: null });
    renderWithProviders(<PersonSearchModal open onClose={() => undefined} onSelect={() => undefined} />);
    expect(await screen.findByText('사무소 또는 검색어를 입력하고 [조회]를 누르세요.')).toBeInTheDocument();
  });
});

describe('McnSearchModal', () => {
  it('사무소 필수, 기번으로 거르고, 더블클릭으로 고른다', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<McnSearchModal open onClose={() => undefined} onSelect={onSelect} />);
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('001')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByRole('textbox', { name: '기번' }), '2');
    await userEvent.click(within(dialog).getByRole('button', { name: /조회/ }));
    await waitFor(() => expect(within(dialog).queryByText('001')).toBeNull());
    const row = (await within(dialog).findByText('002')).closest('tr')!;
    fireEvent.doubleClick(row);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ ofcCode: '000080', mcnNo: '002' }));
  });

  it('사무소가 없으면 사무소 선택 안내', async () => {
    useAuthStore.getState().setMe({ ...MOCK_ME, ofcCode: null });
    renderWithProviders(<McnSearchModal open onClose={() => undefined} onSelect={() => undefined} />);
    expect(await screen.findByText('사무소를 선택하세요.')).toBeInTheDocument();
  });
});
