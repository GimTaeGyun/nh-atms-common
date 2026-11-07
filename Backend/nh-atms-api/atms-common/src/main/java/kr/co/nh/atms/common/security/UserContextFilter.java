package kr.co.nh.atms.common.security;

import org.springframework.web.filter.OncePerRequestFilter;

/**
 * "요청마다 현재 사용자를 SecurityContext 에 채우는 필터" 의 자리표시(marker).
 * <p>
 * {@link SecurityConfig} 가 이 타입의 빈을 찾아 보안 필터 체인의 {@code AnonymousAuthenticationFilter} 앞에 끼운다.
 * 이 저장소에서는 atms-web 의 {@code FixedUserFilter}(로그인 없는 고정 사용자, 설계 §5.3)가 구현한다.
 * 나중에 SSO 를 붙일 때는 이 타입을 구현한 SSO 필터로 바꾸면 된다.
 * <p>
 * 주의: 이 타입의 빈은 서블릿 컨테이너에 자동 등록되지 않게 막아야 한다(FilterRegistrationBean enabled=false) —
 * 체인 밖에서 먼저 돌면 OncePerRequestFilter 표시 때문에 체인 안에서 건너뛰게 된다.
 */
public abstract class UserContextFilter extends OncePerRequestFilter {
}
