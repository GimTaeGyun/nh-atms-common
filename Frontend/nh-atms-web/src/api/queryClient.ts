import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toAppError } from './errors';
import { notifyError } from '@/hooks/useAppMessage';

let lastShown = { text: '', at: 0 };
const showOnce = (text: string) => {
  const now = Date.now();
  if (lastShown.text === text && now - lastShown.at < 1500) return;
  lastShown = { text, at: now };
  notifyError(text);
};

/**
 * react-query 전역 설정.
 *  - 조회 화면은 "조회 버튼" 트리거가 기본이므로 자동 refetch(창 포커스/재연결/재마운트)는 끈다.
 *    탭 keep-alive(Activity) 로 숨김→표시 시에도 재조회하지 않고 캐시를 그대로 보여준다.
 *  - 401/403/404/검증 오류는 재시도하지 않는다.
 *  - 오류는 한 곳에서 사용자 메시지로 알린다(화면별 message.error 중복 제거).
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err, query) => {
      const e = toAppError(err);
      if (e.kind === 'canceled' || e.kind === 'unauthorized') return;
      if (query.meta?.silent) return;
      showOnce(e.userMessage);
    },
  }),
  mutationCache: new MutationCache({
    onError: (err, _vars, _ctx, mutation) => {
      const e = toAppError(err);
      if (e.kind === 'canceled' || e.kind === 'unauthorized') return;
      if (mutation.meta?.silent) return;
      showOnce(e.userMessage);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: (count, err) => {
        const e = toAppError(err);
        if (['unauthorized', 'forbidden', 'validation', 'notFound', 'canceled'].includes(e.kind)) return false;
        return count < 1;
      },
    },
    mutations: { retry: 0 },
  },
});

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { silent?: boolean };
    mutationMeta: { silent?: boolean };
  }
}
