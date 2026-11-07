import { useAuthStore, selectIsAdmin } from '@/stores/useAuthStore';
import { useNavStore, findMenuByScreen } from '@/stores/useNavStore';
import type { ScreenKey } from '@/screens/screenIds';

/** 화면 단위 권한 (T_AUTH_MENU readYn/writeYn + 관리자). 버튼 숨김/비활성에 사용 */
export const usePermission = (screenKey?: ScreenKey | string): { canRead: boolean; canWrite: boolean; isAdmin: boolean } => {
  const isAdmin = useAuthStore(selectIsAdmin);
  const menus = useNavStore((s) => s.menus);
  if (!screenKey) return { canRead: true, canWrite: isAdmin, isAdmin };
  const node = findMenuByScreen(menus, screenKey);
  if (!node) return { canRead: true, canWrite: isAdmin, isAdmin };
  return { canRead: node.readYn !== 'N', canWrite: isAdmin || node.writeYn === 'Y', isAdmin };
};
