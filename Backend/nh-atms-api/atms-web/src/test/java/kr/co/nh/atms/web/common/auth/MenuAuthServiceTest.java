package kr.co.nh.atms.web.common.auth;

import kr.co.nh.atms.web.common.ForbiddenException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 화면 권한 서버 검사 — 플래그 5개·관리자 통과·권한코드 없음 거부·화면키→메뉴경로 */
class MenuAuthServiceTest {

    private final MenuAuthMapper mapper = mock(MenuAuthMapper.class);
    private final MenuAuthService service = new MenuAuthService(mapper);

    @AfterEach
    void tearDown() {
        AuthTestSupport.logout();
    }

    /**
     * 화면키 → 메뉴경로 공통 예시 표 — 프론트 src/screens/__tests__/registry.test.ts 의 MENU_PATH_EXAMPLES 와 **같은 표**.
     * 한쪽 규칙·표를 바꾸면 다른 쪽도 같이 바꾼다(잠정 Q-05).
     */
    static final String[][] MENU_PATH_EXAMPLES = {
            {"sample.notice", "/sample/notice"},
            {"sample.mcnInfo", "/sample/mcn-info"},
            {"sample.mcnModel", "/sample/mcn-model"},
            {"sample.commonModules", "/sample/common-modules"},
            {"popup.officeSearch", "/popup/office-search"},
            {"a.mcnABC", "/a/mcn-abc"},
            {"a.mcn2Info", "/a/mcn2-info"},
            {"home", "/home"},
    };

    @Test
    void menuPathFromScreenKey() {
        for (String[] e : MENU_PATH_EXAMPLES) {
            assertThat(MenuAuthService.menuPathOf(e[0])).as(e[0]).isEqualTo(e[1]);
        }
    }

    @Test
    void allowsWhenFlagIsY() {
        AuthTestSupport.login(AuthTestSupport.user("T", "N"));
        when(mapper.selectMenuAuth("/sample/notice", "T")).thenReturn(new MenuAuthFlags("Y", "Y", "N", "N", "N"));
        assertThatCode(() -> service.check("sample.notice", Perm.REG)).doesNotThrowAnyException();
        assertThatThrownBy(() -> service.check("sample.notice", Perm.DEL))
                .isInstanceOf(ForbiddenException.class)
                .extracting("code").isEqualTo("SYS_403");
    }

    @Test
    void deniesWhenNoRowOrNoAuth() {
        AuthTestSupport.login(AuthTestSupport.user("T", "N"));
        when(mapper.selectMenuAuth(any(), any())).thenReturn(new MenuAuthFlags());
        assertThat(service.has("sample.mcnInfo", Perm.QRY)).isFalse();

        AuthTestSupport.login(AuthTestSupport.user(null, "N"));
        assertThatThrownBy(() -> service.check("sample.mcnInfo", Perm.QRY)).isInstanceOf(ForbiddenException.class);

        AuthTestSupport.logout();
        assertThat(service.has("sample.mcnInfo", Perm.QRY)).isFalse();
    }

    @Test
    void adminPassesWithoutQuery() {
        AuthTestSupport.login(AuthTestSupport.user("A", "Y"));
        assertThatCode(() -> service.check("sample.mcnModel", Perm.EXE)).doesNotThrowAnyException();
        verify(mapper, never()).selectMenuAuth(any(), any());
    }
}
