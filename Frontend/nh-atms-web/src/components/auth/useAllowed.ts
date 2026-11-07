import { usePermission } from '@/hooks/usePermission';
import type { ScreenKey } from '@/screens/screenIds';
import { useScreenId } from './screenIdContext';

/** 권한 요구 수준: 읽기 / 쓰기 / 관리자 */
export type PermNeed = 'read' | 'write' | 'admin';

/** 권한 없음 안내 문구 */
export const DENIED_TEXT = '권한이 없습니다.';

type Perm = ReturnType<typeof usePermission>;

/** 권한 객체가 요구 수준을 충족하는지 */
export const meetsNeed = (p: Perm, need: PermNeed): boolean => (need === 'admin' ? p.isAdmin : need === 'read' ? p.canRead : p.canWrite);

/** 화면 권한 (screenKey 미지정 시 ScreenIdProvider 값 사용) */
export const useScreenPermission = (screenKey?: ScreenKey): Perm => {
  const ctxId = useScreenId();
  return usePermission(screenKey ?? ctxId);
};

/** 요구 수준 충족 여부 */
export const useAllowed = (need: PermNeed = 'write', screenKey?: ScreenKey): boolean => meetsNeed(useScreenPermission(screenKey), need);
