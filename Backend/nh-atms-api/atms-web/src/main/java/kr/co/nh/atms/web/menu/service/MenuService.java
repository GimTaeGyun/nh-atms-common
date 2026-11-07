package kr.co.nh.atms.web.menu.service;

import kr.co.nh.atms.web.common.CurrentUser;
import kr.co.nh.atms.web.menu.dto.MenuNode;
import kr.co.nh.atms.web.menu.mapper.MenuMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 내 메뉴 트리(설계 §5.4). TB_SCR_MENU(USE_YN='Y') + 현재 사용자 권한코드의 TB_SCR_AUTH_MENU.
 * <ul>
 *   <li>화면(M): 조회권한(QRY_ROL_YN)='Y' 일 때만 보임</li>
 *   <li>그룹(G): 보이는 자식이 하나라도 있으면 보임</li>
 *   <li>관리자: 플래그 5개 모두 Y</li>
 *   <li>부모가 목록에 없는 메뉴는 최상위로 둔다(최상위 PARENT_MENU_ID 값이 정본에 정해져 있지 않음)</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuService {

    private final MenuMapper mapper;

    public List<MenuNode> myMenus() {
        boolean admin = CurrentUser.isAdmin();
        String auth = CurrentUser.auth();
        return buildTree(mapper.selectMenusWithAuth(auth == null ? null : auth.trim()), admin);
    }

    /** 평면 행(SORT_NO 순) → 권한에 맞춰 가지치기한 트리 */
    public static List<MenuNode> buildTree(List<MenuNode> rows, boolean admin) {
        Map<String, MenuNode> byId = new LinkedHashMap<>();
        for (MenuNode n : rows) {
            if (n == null || n.getMenuId() == null) continue;
            n.setChildren(new ArrayList<>());
            if (admin) {
                n.setQryRolYn("Y");
                n.setRegRolYn("Y");
                n.setUpdRolYn("Y");
                n.setDelRolYn("Y");
                n.setExeRolYn("Y");
            }
            byId.putIfAbsent(n.getMenuId(), n);
        }
        List<MenuNode> roots = new ArrayList<>();
        for (MenuNode n : byId.values()) {
            MenuNode parent = n.getParentMenuId() == null ? null : byId.get(n.getParentMenuId());
            if (parent == null || parent == n) roots.add(n);
            else parent.getChildren().add(n);
        }
        return prune(roots);
    }

    private static List<MenuNode> prune(List<MenuNode> nodes) {
        List<MenuNode> out = new ArrayList<>();
        for (MenuNode n : nodes) {
            n.setChildren(prune(n.getChildren()));
            boolean group = "G".equals(trim(n.getMenuType()));
            boolean visible = group ? !n.getChildren().isEmpty() : "Y".equals(trim(n.getQryRolYn()));
            if (visible) out.add(n);
        }
        return out;
    }

    private static String trim(String v) {
        return v == null ? null : v.trim();
    }
}
