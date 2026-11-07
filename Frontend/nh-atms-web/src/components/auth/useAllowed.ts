import { usePermission, type Permission } from '@/hooks/usePermission';
import type { ScreenKey } from '@/screens/screenIds';
import { useScreenId } from './screenIdContext';

/**
 * 권한 요구 수준 — TB_SCR_AUTH_MENU 의 5개 플래그 + 관리자.
 * qry 조회 · reg 등록 · upd 수정 · del 삭제 · exe 업무실행 · admin 관리자
 */
export type PermNeed = 'qry' | 'reg' | 'upd' | 'del' | 'exe' | 'admin';

/** 권한 없음 안내 문구 */
export const DENIED_TEXT = '권한이 없습니다.';

/** 권한 객체가 요구 수준을 충족하는지 */
export const meetsNeed = (p: Permission, need: PermNeed): boolean => {
  switch (need) {
    case 'admin':
      return p.isAdmin;
    case 'qry':
      return p.canQry;
    case 'reg':
      return p.canReg;
    case 'upd':
      return p.canUpd;
    case 'del':
      return p.canDel;
    case 'exe':
      return p.canExe;
  }
};

/** 화면 권한 (screenKey 미지정 시 ScreenIdProvider 값 사용) */
export const useScreenPermission = (screenKey?: ScreenKey): Permission => {
  const ctxId = useScreenId();
  return usePermission(screenKey ?? ctxId);
};

/** 요구 수준 충족 여부 */
export const useAllowed = (need: PermNeed, screenKey?: ScreenKey): boolean => meetsNeed(useScreenPermission(screenKey), need);
