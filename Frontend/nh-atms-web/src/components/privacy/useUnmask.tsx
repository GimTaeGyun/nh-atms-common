import { useCallback, useRef, useState, type ReactNode } from 'react';
import { UnmaskReasonModal } from './UnmaskReasonModal';

interface Options {
  /** 사유와 함께 원문 요청 (서버가 권한 확인·열람 기록) */
  request: (key: string, reason: string) => Promise<string>;
  title?: ReactNode;
  description?: ReactNode;
}

/**
 * 원문 열람 훅: unmask(key) → 사유 모달 → request → 결과를 화면 메모리에만 캐시.
 * 저장소에 남기지 않으므로 화면이 닫히면 사라진다. 반환된 modal 을 화면에 렌더할 것.
 */
export const useUnmask = ({ request, title, description }: Options) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);
  const resolver = useRef<((v: string | undefined) => void) | null>(null);

  const settle = (v: string | undefined) => {
    resolver.current?.(v);
    resolver.current = null;
  };

  /** 원문 요청 — 캐시가 있으면 즉시, 없으면 모달을 띄우고 완료/취소 시 resolve (취소 = undefined) */
  const unmask = useCallback(
    (key: string): Promise<string | undefined> => {
      if (Object.prototype.hasOwnProperty.call(values, key)) return Promise.resolve(values[key]);
      return new Promise((resolve) => {
        resolver.current?.(undefined);
        resolver.current = resolve;
        setPending(key);
      });
    },
    [values],
  );

  const submit = async (reason: string) => {
    if (pending === null) return;
    const v = await request(pending, reason);
    setValues((m) => ({ ...m, [pending]: v }));
    setPending(null);
    settle(v);
  };

  const cancel = () => {
    setPending(null);
    settle(undefined);
  };

  const isUnmasked = useCallback((key: string) => Object.prototype.hasOwnProperty.call(values, key), [values]);
  const valueOf = useCallback((key: string): string | undefined => values[key], [values]);
  /** 캐시 비우기 (조회 조건 변경 등) */
  const reset = useCallback(() => setValues({}), []);

  const modal = <UnmaskReasonModal open={pending !== null} onCancel={cancel} onSubmit={submit} title={title} description={description} />;
  return { unmask, isUnmasked, valueOf, reset, modal, pendingKey: pending };
};
