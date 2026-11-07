import { useCallback, useMemo, useState } from 'react';
import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import type { PageParams, PageResult } from '@/types/api';
import { useSettingsStore } from '@/stores/useSettingsStore';

/**
 * "조회 버튼 → 결과" 화면의 공통 상태 머신(페이징·비페이징 공용 코어).
 *  - params === null 이면 조회 전: 쿼리를 켜지 않고, ↻(refetch)도 막는다
 *    (react-query 의 refetch 는 enabled:false 여도 queryFn 을 실행해 null 조건으로 API 를 부르므로)
 *  - 이전 결과는 placeholder 로 유지(깜빡임 없음)
 */
function useSearchCore<P, R>(opts: { key: (p: P) => QueryKey; fetch: (p: P) => Promise<R>; refetchInterval?: number | false; idleKey: readonly unknown[] }) {
  const [params, setParams] = useState<P | null>(null);
  const query = useQuery({
    queryKey: params ? opts.key(params) : opts.idleKey,
    queryFn: () => opts.fetch(params as P),
    enabled: params !== null,
    placeholderData: keepPreviousData,
    refetchInterval: opts.refetchInterval,
  });
  const { refetch: rawRefetch } = query;
  const refetch = useCallback(() => (params === null ? Promise.resolve(undefined) : rawRefetch()), [params, rawRefetch]);
  const reset = useCallback(() => setParams(null), []);
  return { params, setParams, query, refetch, reset };
}

interface PagedOptions<P extends PageParams, T, R = PageResult<T>> {
  key: (p: P) => QueryKey;
  fetch: (p: P) => Promise<R>;
  /** 응답이 {asOf, page} 처럼 페이지를 감싸고 있으면 페이지를 꺼내는 함수 */
  select?: (r: R) => PageResult<T>;
  /** 기본 페이지 크기. 없으면 설정 드로어의 '그리드 기본 페이지 크기' */
  pageSize?: number;
}

/**
 * "조회 버튼 → 서버 페이징 목록" 화면의 표준 상태 머신.
 *  - search(values): 1페이지부터 조회 / setPage(page,size): 같은 조건으로 페이지 이동
 *  - pagination: DataGrid 의 pagination prop 에 그대로 넘긴다
 *  - raw: select 전 원 응답(헤더의 asOf·kpi 등)
 */
export function usePagedSearch<P extends PageParams, T, R = PageResult<T>>(opts: PagedOptions<P, T, R>) {
  const settingPageSize = useSettingsStore((s) => s.pageSize);
  const pageSize = opts.pageSize ?? settingPageSize;
  const core = useSearchCore<P, R>({ key: opts.key, fetch: opts.fetch, idleKey: ['paged-search', 'idle'] });
  const { params, setParams, query, refetch, reset } = core;

  const search = useCallback(
    (values: Omit<P, 'page' | 'size'>) => setParams((prev) => ({ ...(values as P), page: 1, size: prev?.size ?? pageSize })),
    [pageSize, setParams],
  );
  const setPage = useCallback((page: number, size: number) => setParams((prev) => (prev ? { ...prev, page, size } : prev)), [setParams]);

  const raw = query.data;
  const select = opts.select;
  const data = useMemo(() => (raw === undefined ? undefined : select ? select(raw) : (raw as unknown as PageResult<T>)), [raw, select]);
  const page = params?.page ?? 1;
  const size = params?.size ?? pageSize;
  const total = data?.totalCount ?? 0;

  return useMemo(
    () => ({
      params,
      searched: !!params,
      raw,
      rows: data?.content ?? [],
      total,
      page,
      size,
      loading: query.isFetching,
      error: query.error,
      lastUpdated: query.dataUpdatedAt || null,
      /** DataGrid pagination prop */
      pagination: { page, size, total, onChange: setPage },
      search,
      setPage,
      reset,
      refetch,
    }),
    [params, raw, data, total, page, size, query.isFetching, query.error, query.dataUpdatedAt, refetch, search, setPage, reset],
  );
}

/** 페이징 없는 조회(전체 목록/집계) — usePagedSearch 와 같은 코어 */
export function useSearch<P, T>(opts: { key: (p: P) => QueryKey; fetch: (p: P) => Promise<T>; refetchInterval?: number | false }) {
  const { params, setParams, query, refetch, reset } = useSearchCore<P, T>({ ...opts, idleKey: ['search', 'idle'] });
  const search = useCallback((p: P) => setParams(p), [setParams]);
  const { data, isFetching, error, dataUpdatedAt } = query;
  return useMemo(
    () => ({ params, searched: params !== null, data, loading: isFetching, error, lastUpdated: dataUpdatedAt || null, search, refetch, reset }),
    [params, data, isFetching, error, dataUpdatedAt, search, refetch, reset],
  );
}
