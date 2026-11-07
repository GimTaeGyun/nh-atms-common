import { useEffect, useState, type RefObject } from 'react';
import { BAND_BREAKPOINTS } from '@/config/constants';

/** 컨테이너 폭 밴드: S(<1280) / M(1280~1599) / L(>=1600) — 08_프론트_반응형_제안 §2 */
export type Band = 'S' | 'M' | 'L';

export const getBand = (width: number): Band => (width < BAND_BREAKPOINTS.M ? 'S' : width < BAND_BREAKPOINTS.L ? 'M' : 'L');

/** ref 요소 폭을 ResizeObserver 로 측정해 밴드를 돌려준다. 첫 측정 전엔 'M' */
export const useContentBand = (ref: RefObject<HTMLElement | null>, forced?: Band): { band: Band; width: number | null } => {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width));
    if (typeof ResizeObserver === 'undefined') {
      const id = requestAnimationFrame(measure);
      return () => cancelAnimationFrame(id);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return { band: forced ?? (width === null ? 'M' : getBand(width)), width };
};

/** 브라우저 창 폭(px) */
export const useWindowWidth = (): number => {
  const [w, setW] = useState<number>(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
};

/** 브라우저 창 폭 기준 밴드 (레이아웃 기본값용) — useWindowWidth 에서 파생(리스너 1개) */
export const useWindowBand = (): Band => getBand(useWindowWidth());
