import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { PageParams, PageResult } from '@/types/api';
import { usePagedSearch, useSearch } from '../usePagedSearch';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

type P = PageParams & { officeCd: string };

describe('조회 전 새로고침', () => {
  it('usePagedSearch: 조회 전에는 refetch 가 API 를 부르지 않고, 조회 후에는 같은 조건으로 다시 부른다', async () => {
    const fetch = vi.fn(async (p: P): Promise<PageResult<string>> => ({ content: [p.officeCd], totalCount: 1, page: p.page ?? 1, size: p.size ?? 20, totalPages: 1 }));
    const { result } = renderHook(() => usePagedSearch<P, string>({ key: (p) => ['t', p], fetch }), { wrapper });

    await act(() => result.current.refetch());
    expect(fetch).not.toHaveBeenCalled();

    act(() => result.current.search({ officeCd: '000080' }));
    await waitFor(() => expect(result.current.rows).toEqual(['000080']));
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(() => result.current.refetch());
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][0]).toMatchObject({ officeCd: '000080', page: 1 });
  });

  it('useSearch: 조회 전에는 refetch 가 API 를 부르지 않는다', async () => {
    const fetch = vi.fn(async (p: { officeCd: string }) => p.officeCd);
    const { result } = renderHook(() => useSearch<{ officeCd: string }, string>({ key: (p) => ['s', p], fetch }), { wrapper });

    await act(() => result.current.refetch());
    expect(fetch).not.toHaveBeenCalled();
  });
});
