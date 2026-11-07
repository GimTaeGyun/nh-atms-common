package kr.co.nh.atms.web.common.auth;

import kr.co.nh.atms.web.common.CurrentUser;
import kr.co.nh.atms.web.common.ForbiddenException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * 화면 권한 서버 검사 — TB_SCR_AUTH_MENU(권한코드 × 메뉴) 의 플래그 5개(설계 §5.5).
 * 관리자({@link LoginUser#isAdmin()})는 모두 통과. 권한이 없으면 {@code ForbiddenException("SYS_403")} → 403.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MenuAuthService {

    private final MenuAuthMapper mapper;

    /** 권한이 없으면 403 예외 */
    public void check(String screenKey, Perm need) {
        if (!has(screenKey, need)) {
            log.info("[권한] 거부 screen={} need={} user={} auth={}", screenKey, need, CurrentUser.perNo(), CurrentUser.auth());
            throw new ForbiddenException("SYS_403");
        }
    }

    /** 현재 사용자가 화면 권한을 가졌는지 */
    public boolean has(String screenKey, Perm need) {
        if (CurrentUser.isAdmin()) return true;
        String auth = CurrentUser.auth();
        if (auth == null || auth.isBlank() || screenKey == null || need == null) return false;
        MenuAuthFlags flags = mapper.selectMenuAuth(menuPathOf(screenKey), auth.trim());
        return flags != null && flags.allows(need);
    }

    /**
     * 화면키 → 메뉴경로(TB_SCR_MENU.MENU_PATH). {@code "sample.mcnInfo"} → {@code "/sample/mcn-info"}.
     * <p>
     * <b>잠정 (Q-05)</b>: TO-BE 정본 TB_SCR_MENU 에 화면키(SCREEN_ID) 컬럼이 없어 MENU_PATH 에 화면 경로
     * {@code /{slug}/{kebab-화면키}} 를 넣기로 했다(설계 §5.4). 프론트 parseScreenPath 와 같은 규칙이어야 한다.
     */
    public static String menuPathOf(String screenKey) {
        String k = screenKey.trim();
        int dot = k.indexOf('.');
        String slug = dot < 0 ? "" : k.substring(0, dot);
        String name = dot < 0 ? k : k.substring(dot + 1);
        StringBuilder sb = new StringBuilder("/");
        if (!slug.isEmpty()) sb.append(slug).append('/');
        for (int i = 0; i < name.length(); i++) {
            char c = name.charAt(i);
            if (Character.isUpperCase(c)) {
                if (i > 0) sb.append('-');
                sb.append(Character.toLowerCase(c));
            } else {
                sb.append(c);
            }
        }
        return sb.toString().toLowerCase(Locale.ROOT);
    }
}
