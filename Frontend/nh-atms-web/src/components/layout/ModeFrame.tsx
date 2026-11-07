import { useMemo, type ReactNode } from 'react';
import { ModeContext, makeModeValue, useOptionalMode, type ModeContextValue, type ModeDef } from './modeContext';

interface Props<M extends string> {
  /** 현재 모드 (예: 화면 ID '3000' | '6302') */
  mode: M;
  modes: Record<M, ModeDef>;
  /** 모드별 렌더 (render-prop) 또는 일반 children */
  children: ReactNode | ((mode: M, ctx: ModeContextValue<M>) => ReactNode);
}

/**
 * 동형 쌍 화면 모드 래퍼 — AS-IS 의 같은 화면을 두 화면 ID 로 쓰던 것(3000↔6302 등)을 1개 컴포넌트 + 모드로 분기.
 * 하위에서는 useMode().isVisible('필드키') 또는 <ModeOnly hide="필드키"> 로 모드별 숨김을 처리한다.
 */
export const ModeFrame = <M extends string>({ mode, modes, children }: Props<M>) => {
  const value = useMemo(() => makeModeValue(mode, modes), [mode, modes]);
  return (
    <ModeContext.Provider value={value as ModeContextValue}>
      {typeof children === 'function' ? children(mode, value) : children}
    </ModeContext.Provider>
  );
};

/** 현재 모드에서 key 가 숨김이면 렌더하지 않음 (ModeFrame 바깥이면 그대로 렌더) */
export const ModeOnly = ({ hide, children }: { hide: string; children: ReactNode }) => {
  const m = useOptionalMode();
  return m?.isHidden(hide) ? null : <>{children}</>;
};
