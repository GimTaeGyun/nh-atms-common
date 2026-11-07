import { createContext, useContext } from 'react';

/** 화면 모드 1개 정의 — hidden: 이 모드에서 숨길 영역 키(필드명·컬럼키·버튼키 등) */
export interface ModeDef {
  label: string;
  hidden?: string[];
}

export interface ModeContextValue<M extends string = string> {
  mode: M;
  def: ModeDef;
  /** 키가 이 모드에서 보이는지 */
  isVisible: (key: string) => boolean;
  /** 키가 이 모드에서 숨김인지 */
  isHidden: (key: string) => boolean;
}

export const ModeContext = createContext<ModeContextValue | null>(null);

/** 모드 값을 만든다 (ModeFrame 바깥, 예: 컬럼 정의 useMemo 에서도 쓸 수 있게) */
export const makeModeValue = <M extends string>(mode: M, modes: Record<M, ModeDef>): ModeContextValue<M> => {
  const def = modes[mode] ?? { label: mode };
  const hidden = new Set(def.hidden ?? []);
  return { mode, def, isHidden: (k) => hidden.has(k), isVisible: (k) => !hidden.has(k) };
};

/** ModeFrame 안에서 현재 모드 조회. 바깥이면 오류 */
export const useMode = <M extends string = string>(): ModeContextValue<M> => {
  const v = useContext(ModeContext);
  if (!v) throw new Error('useMode 는 ModeFrame 안에서만 사용할 수 있습니다.');
  return v as ModeContextValue<M>;
};

/** 모드 미지정 안전 버전 (ModeFrame 바깥이면 null) */
export const useOptionalMode = <M extends string = string>(): ModeContextValue<M> | null => useContext(ModeContext) as ModeContextValue<M> | null;
