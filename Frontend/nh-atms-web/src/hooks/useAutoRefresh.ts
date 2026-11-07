import { useEffect, useEffectEvent } from 'react';

/**
 * 주기 자동 새로고침 (현황 화면·홈).
 * 탭이 백그라운드(document.hidden)이거나 비활성 탭이면 쉬고, 다시 보이면 즉시 1회 실행.
 */
export const useAutoRefresh = (enabled: boolean, intervalMs: number | null, callback: () => void, active = true): void => {
  const tick = useEffectEvent(() => {
    if (!document.hidden) callback();
  });
  useEffect(() => {
    if (!enabled || !intervalMs || !active) return;
    let timer: number | undefined;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(tick, intervalMs);
    };
    const onVisibility = () => {
      if (!document.hidden) {
        tick();
        start();
      }
    };
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, intervalMs, active]);
};
