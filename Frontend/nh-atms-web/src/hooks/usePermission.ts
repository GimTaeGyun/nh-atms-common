import { useAuthStore, selectIsAdmin } from '@/stores/useAuthStore';
import { useNavStore, findMenuByScreen } from '@/stores/useNavStore';
import { usePermPreviewStore, type PermPreview } from '@/stores/usePermPreviewStore';
import type { MenuTreeNode } from '@/types/menu';
import type { ScreenKey } from '@/screens/screenIds';

/**
 * 화면 권한 5개 — TB_SCR_AUTH_MENU 의 QRY/REG/UPD/DEL/EXE_ROL_YN (메뉴 응답 `/api/menu/my` 에 붙어 온다).
 * 버튼 흐림·숨김에만 쓴다. 서버도 쓰기 API 마다 `@RequireMenuAuth` 로 같은 표를 다시 검사한다(403 SYS_403).
 */
export interface Permission {
  /** 조회 */
  canQry: boolean;
  /** 등록 */
  canReg: boolean;
  /** 수정 */
  canUpd: boolean;
  /** 삭제 */
  canDel: boolean;
  /** 업무실행 */
  canExe: boolean;
  isAdmin: boolean;
}

/** 메뉴 노드(또는 없음) → 권한. 메뉴에 없는 화면(홈·팝업 등)은 조회만 허용, 관리자면 전부 */
export const permissionOf = (node: MenuTreeNode | undefined, isAdmin: boolean): Permission => {
  if (isAdmin) return { canQry: true, canReg: true, canUpd: true, canDel: true, canExe: true, isAdmin };
  if (!node) return { canQry: true, canReg: false, canUpd: false, canDel: false, canExe: false, isAdmin };
  return {
    canQry: node.qryRolYn === 'Y',
    canReg: node.regRolYn === 'Y',
    canUpd: node.updRolYn === 'Y',
    canDel: node.delRolYn === 'Y',
    canExe: node.exeRolYn === 'Y',
    isAdmin,
  };
};

/** 권한 미리보기(표시만 바꿈, 서버 검사는 DB 기준)를 얹는다. off 면 그대로 */
export const applyPreview = (p: Permission, preview: PermPreview): Permission => {
  if (preview === 'off') return p;
  const all = preview === 'all';
  return { canQry: true, canReg: all || preview === 'qry+reg', canUpd: all, canDel: all, canExe: all, isAdmin: p.isAdmin };
};

/** 화면 단위 권한 `{canQry, canReg, canUpd, canDel, canExe, isAdmin}` — 화면키를 생략하면 조회만 */
export const usePermission = (screenKey?: ScreenKey | string): Permission => {
  const isAdmin = useAuthStore(selectIsAdmin);
  const menus = useNavStore((s) => s.menus);
  const preview = usePermPreviewStore((s) => s.preview);
  const node = screenKey ? findMenuByScreen(menus, screenKey) : undefined;
  return applyPreview(permissionOf(node, isAdmin), preview);
};
