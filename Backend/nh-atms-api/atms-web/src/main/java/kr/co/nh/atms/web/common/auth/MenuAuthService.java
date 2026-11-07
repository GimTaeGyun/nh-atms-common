package kr.co.nh.atms.web.common.auth;

import kr.co.nh.atms.web.common.CurrentUser;
import kr.co.nh.atms.web.common.ForbiddenException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 화면 권한 서버 검사 — TB_SCR_AUTH_MENU(권한코드 × 메뉴) 의 플래그 5개(설계 §5.5).
 * 관리자({@link LoginUser#isAdmin()})는 모두 통과. 권한이 없으면 {@code ForbiddenException("SYS_403")} → 403.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MenuAuthService {

    /** camelCase 경계 — 프론트 registry.ts 의 /([a-z0-9])([A-Z])/g 와 같다 */
    private static final Pattern KEBAB = Pattern.compile("([a-z0-9])([A-Z])");

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
     * 화면키 → 메뉴경로(TB_SCR_MENU.MENU_PATH). {@code "sample.mcnInfo"} → {@code "/sample/mcn-info"},
     * {@code "a.mcnABC"} → {@code "/a/mcn-abc"}, 점이 없으면 {@code "home"} → {@code "/home"}.
     * <p>
     * 규칙: 이름 부분에 정규식 {@code ([a-z0-9])([A-Z])} → {@code $1-$2} 를 한 번 적용하고 결과 전체를 소문자로.
     * 프론트 {@code screens/registry.ts menuPathOf} 와 한 글자도 다르면 안 된다 — 두 쪽 테스트에 같은 예시 표가 있다
     * (MenuAuthServiceTest.MENU_PATH_EXAMPLES · registry.test.ts).
     * <p>
     * <b>잠정 (Q-05)</b>: TO-BE 정본 TB_SCR_MENU 에 화면키(SCREEN_ID) 컬럼이 없어 MENU_PATH 에 화면 경로
     * {@code /{slug}/{kebab-화면키}} 를 넣기로 했다(설계 §5.4).
     */
    public static String menuPathOf(String screenKey) {
        String k = screenKey.trim();
        int dot = k.indexOf('.');
        String path = dot < 0
                ? "/" + KEBAB.matcher(k).replaceAll("$1-$2")
                : "/" + k.substring(0, dot) + "/" + KEBAB.matcher(k.substring(dot + 1)).replaceAll("$1-$2");
        return path.toLowerCase(Locale.ROOT);
    }
}
