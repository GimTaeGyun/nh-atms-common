import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import { PersonNoInput, type PersonInfo } from '../PersonNoInput';
import { AddressSearch, splitRoadAddr, type AddressHit, type AddressValue } from '../AddressSearch';

const wrap = (ui: ReactNode) => render(
  <ConfigProvider>
    <App>{ui}</App>
  </ConfigProvider>,
);

const PersonHost = ({ lookup, onParentKey, onResolved }: { lookup: (n: string) => Promise<PersonInfo | null>; onParentKey: (e: KeyboardEvent) => void; onResolved?: (p: PersonInfo | null) => void }) => {
  const [v, setV] = useState('');
  return (
    <form onKeyDown={onParentKey} onSubmit={(e) => e.preventDefault()}>
      <PersonNoInput value={v} onChange={setV} lookup={lookup} onResolved={onResolved} showHelp />
    </form>
  );
};

describe('PersonNoInput', () => {
  it('Enter → lookup 호출, 성명 표시, Enter 는 상위 폼으로 전파되지 않는다', async () => {
    const lookup = vi.fn(async (empNo: string) => ({ empNo, name: '홍길동', deptName: '디지털전략부' }));
    const onParentKey = vi.fn();
    const onResolved = vi.fn();
    wrap(<PersonHost lookup={lookup} onParentKey={onParentKey} onResolved={onResolved} />);

    expect(screen.getByText('※ 개인번호 입력 후 엔터키를 눌러주세요.')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('개인번호');
    await userEvent.type(input, '05a300000{Enter}');

    expect(lookup).toHaveBeenCalledWith('05300000');
    expect(await screen.findByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('(디지털전략부)')).toBeInTheDocument();
    expect(onResolved).toHaveBeenLastCalledWith({ empNo: '05300000', name: '홍길동', deptName: '디지털전략부' });
    // 글자 입력 키는 전파되지만 Enter 는 막힌다
    expect(onParentKey).toHaveBeenCalled();
    expect(onParentKey.mock.calls.some(([e]) => (e as KeyboardEvent).key === 'Enter')).toBe(false);
  });

  it('없는 번호 → 오류 문구, 값을 고치면 결과가 지워진다', async () => {
    const lookup = vi.fn(async () => null);
    const onResolved = vi.fn();
    wrap(<PersonHost lookup={lookup} onParentKey={() => {}} onResolved={onResolved} />);
    const input = screen.getByPlaceholderText('개인번호');
    await userEvent.type(input, '1234');
    await userEvent.click(screen.getByRole('button', { name: '성명 조회' }));
    expect(await screen.findByText('개인번호를 확인하세요.')).toBeInTheDocument();
    expect(onResolved).toHaveBeenLastCalledWith(null);
    await userEvent.type(input, '5');
    expect(screen.queryByText('개인번호를 확인하세요.')).not.toBeInTheDocument();
  });
});

const AddrHost = ({ search, onValue }: { search?: (k: string) => Promise<AddressHit[]>; onValue?: (v: AddressValue) => void }) => {
  const [v, setV] = useState<AddressValue>({ detail: '기존 상세' });
  return (
    <AddressSearch
      value={v}
      search={search}
      onChange={(nv) => {
        setV(nv);
        onValue?.(nv);
      }}
    />
  );
};

describe('AddressSearch', () => {
  it('splitRoadAddr: 시도/시군구/도로명 분리 (시+구 합침)', () => {
    expect(splitRoadAddr('서울특별시 중구 세종대로 110')).toEqual({ sido: '서울특별시', sigungu: '중구', road: '세종대로 110' });
    expect(splitRoadAddr('경기도 성남시 분당구 판교역로 235')).toEqual({ sido: '경기도', sigungu: '성남시 분당구', road: '판교역로 235' });
  });

  it('검색 팝업에서 고른 주소로 시도·시군구·도로명·우편번호를 채운다', async () => {
    const search = vi.fn(async () => [{ zip: '04524', roadAddr: '서울특별시 중구 세종대로 110', jibunAddr: '서울특별시 중구 태평로1가 31' }]);
    const onValue = vi.fn();
    wrap(<AddrHost search={search} onValue={onValue} />);

    await userEvent.click(screen.getByRole('button', { name: /검색/ }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByPlaceholderText('도로명 + 건물번호, 건물명, 지번'), '세종대로 110{Enter}');
    expect(search).toHaveBeenCalledWith('세종대로 110');
    await userEvent.click(await within(dialog).findByText('서울특별시 중구 세종대로 110'));

    await waitFor(() => expect(onValue).toHaveBeenLastCalledWith({ sido: '서울특별시', sigungu: '중구', road: '세종대로 110', zip: '04524', detail: '' }));
    expect(screen.getByLabelText('도로명 및 건물번호')).toHaveValue('세종대로 110');
    expect(screen.getByLabelText('우편번호')).toHaveValue('04524');
  });

  it('search 가 없으면 연동 전 안내', async () => {
    wrap(<AddrHost />);
    await userEvent.click(screen.getByRole('button', { name: /검색/ }));
    expect(await screen.findByText('주소 검색 API 연동 전입니다.')).toBeInTheDocument();
  });
});
