package kr.co.nh.atms.web.common.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.nh.atms.common.audit.AuditUserProvider;
import kr.co.nh.atms.web.common.CurrentUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 고정 사용자 연결.
 * <ul>
 *   <li>{@link FixedUserFilter} 빈 — atms-common SecurityConfig 가 보안 필터 체인에 끼운다</li>
 *   <li>서블릿 자동 등록 끔 — 체인 밖에서 한 번 더 돌지 않게</li>
 *   <li>감사 컬럼 개인번호 = {@link CurrentUser#perNo()}</li>
 * </ul>
 * 설정 {@code atms.fixed-user.per-no}: 저장소에는 CHANGE_ME, 실제 개인번호는 PC 의 D:\local-db.yml(로컬) 또는 내부망 설정에.
 */
@Configuration
public class FixedUserConfig {

    @Bean
    public FixedUserFilter fixedUserFilter(CurrentUserLoader loader, ObjectMapper objectMapper,
                                           @Value("${atms.fixed-user.per-no:}") String perNo) {
        return new FixedUserFilter(loader, objectMapper, perNo);
    }

    @Bean
    public FilterRegistrationBean<FixedUserFilter> fixedUserFilterRegistration(FixedUserFilter filter) {
        FilterRegistrationBean<FixedUserFilter> reg = new FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public AuditUserProvider auditUserProvider() {
        return CurrentUser::perNo;
    }
}
