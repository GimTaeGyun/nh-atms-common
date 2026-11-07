package kr.co.nh.atms.web.common.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.co.nh.atms.common.response.ApiResponse;
import kr.co.nh.atms.common.security.UserContextFilter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * 로그인 없는 고정 사용자(설계 §5.3) — {@code /api/**} 요청마다 설정 {@code atms.fixed-user.per-no} 의 개인번호로
 * {@link LoginUser} 를 SecurityContext 에 채운다.
 * <pre>
 *   요청 /api/** ─▶ 개인번호 설정 확인(비었거나 CHANGE_ME → 401 ME_001)
 *               ─▶ CurrentUserLoader.load (TB_INSA 에 없으면 401 ME_001, DB 오류 500 SYS_500)
 *               ─▶ principal = LoginUser, 권한 ROLE_USER (+관리자면 ROLE_ADMIN) ─▶ 다음 필터
 * </pre>
 * <b>SSO 를 붙일 때 바꿀 곳</b>: 이 필터 하나(같은 {@link UserContextFilter} 를 구현한 SSO 필터로 교체).
 * 빈 등록은 {@link FixedUserConfig}(보안 필터 체인 안에서만 돌게 서블릿 자동 등록을 끈다).
 */
@Slf4j
public class FixedUserFilter extends UserContextFilter {

    private final CurrentUserLoader loader;
    private final ObjectMapper objectMapper;
    private final String perNo;

    public FixedUserFilter(CurrentUserLoader loader, ObjectMapper objectMapper, String perNo) {
        this.loader = loader;
        this.objectMapper = objectMapper;
        this.perNo = perNo == null ? "" : perNo.trim();
        if (!isConfigured(this.perNo)) {
            log.warn("[고정사용자] atms.fixed-user.per-no 가 설정되지 않았습니다 — /api/** 는 401 ME_001 (D:\\local-db.yml 등에 개인번호를 넣으세요)");
        }
    }

    /** 개인번호 설정이 쓸 만한지(비었거나 CHANGE_ME 자리표시면 아님) */
    static boolean isConfigured(String v) {
        return v != null && !v.isBlank() && !v.trim().startsWith("CHANGE_ME");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String ctx = request.getContextPath();
        String path = (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) ? uri.substring(ctx.length()) : uri;
        return !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!isConfigured(perNo)) {
            write(response, HttpStatus.UNAUTHORIZED, ApiResponse.fail("ME_001"));
            return;
        }
        LoginUser user;
        try {
            user = loader.load(perNo);
        } catch (RuntimeException e) {
            log.error("[고정사용자] 사용자 조회 실패(DB): {}", e.toString());
            write(response, HttpStatus.INTERNAL_SERVER_ERROR, ApiResponse.fail("SYS_500"));
            return;
        }
        if (user == null) {
            write(response, HttpStatus.UNAUTHORIZED, ApiResponse.fail("ME_001"));
            return;
        }
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        if (user.isAdmin()) authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new UsernamePasswordAuthenticationToken(user, null, authorities));
        SecurityContextHolder.setContext(ctx);
        try {
            chain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void write(HttpServletResponse response, HttpStatus status, ApiResponse<?> body) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), body);
    }
}
