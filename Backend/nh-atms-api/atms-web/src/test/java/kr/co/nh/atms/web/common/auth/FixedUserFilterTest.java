package kr.co.nh.atms.web.common.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.nh.atms.web.common.CurrentUser;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** 고정 사용자 필터 — 설정 없음/인사정보 없음 401 ME_001, 정상이면 CurrentUser 채움, /api 밖은 통과 */
class FixedUserFilterTest {

    private final ObjectMapper om = new ObjectMapper();

    @Test
    void notConfiguredGives401() throws Exception {
        FixedUserFilter f = new FixedUserFilter(mock(CurrentUserLoader.class), om, "CHANGE_ME");
        MockHttpServletResponse res = new MockHttpServletResponse();
        f.doFilter(new MockHttpServletRequest("GET", "/api/me"), res, new MockFilterChain());
        assertThat(res.getStatus()).isEqualTo(401);
        assertThat(res.getContentAsString()).contains("\"code\":\"ME_001\"");
    }

    @Test
    void unknownPersonGives401() throws Exception {
        CurrentUserLoader loader = mock(CurrentUserLoader.class);
        FixedUserFilter f = new FixedUserFilter(loader, om, "123456789");
        MockHttpServletResponse res = new MockHttpServletResponse();
        f.doFilter(new MockHttpServletRequest("GET", "/api/lookup/sido"), res, new MockFilterChain());
        assertThat(res.getStatus()).isEqualTo(401);
    }

    @Test
    void knownPersonIsSetDuringRequestAndClearedAfter() throws Exception {
        CurrentUserLoader loader = mock(CurrentUserLoader.class);
        when(loader.load("123456789")).thenReturn(AuthTestSupport.user("T", "N"));
        FixedUserFilter f = new FixedUserFilter(loader, om, "123456789");
        AtomicReference<String> seen = new AtomicReference<>();
        MockHttpServletResponse res = new MockHttpServletResponse();
        f.doFilter(new MockHttpServletRequest("GET", "/api/me"), res,
                (req, resp) -> seen.set(CurrentUser.perNo() + "/" + CurrentUser.auth()));
        assertThat(res.getStatus()).isEqualTo(200);
        assertThat(seen.get()).isEqualTo("123456789/T");
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void nonApiPathIsSkipped() throws Exception {
        FixedUserFilter f = new FixedUserFilter(mock(CurrentUserLoader.class), om, "");
        MockHttpServletResponse res = new MockHttpServletResponse();
        f.doFilter(new MockHttpServletRequest("GET", "/index.html"), res, new MockFilterChain());
        assertThat(res.getStatus()).isEqualTo(200);
    }
}
