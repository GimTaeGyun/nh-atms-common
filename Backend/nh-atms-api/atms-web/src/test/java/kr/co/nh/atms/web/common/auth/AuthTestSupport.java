package kr.co.nh.atms.web.common.auth;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

/** 테스트용: SecurityContext 에 LoginUser 넣기 */
final class AuthTestSupport {
    private AuthTestSupport() {}

    static LoginUser user(String auth, String adminYn) {
        return new LoginUser("123456789", "홍길동", "000080", "본점", "000080", "000080", "본점", auth, adminYn);
    }

    static void login(LoginUser u) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(u, null, List.of()));
    }

    static void logout() {
        SecurityContextHolder.clearContext();
    }
}
