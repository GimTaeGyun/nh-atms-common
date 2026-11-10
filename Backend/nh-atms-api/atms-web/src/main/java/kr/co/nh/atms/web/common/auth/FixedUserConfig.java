package kr.co.nh.atms.web.common.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.nh.atms.common.audit.AuditUserProvider;
import kr.co.nh.atms.web.common.CurrentUser;
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
 * 개인번호는 설정 파일이 아니라 아래 상수 {@link #PER_NO} 한 곳에 둔다(yml·D:\local-db.yml·-D 옵션 모두 안 봄).
 */
@Configuration
public class FixedUserConfig {

    /**
     * 고정 사용자 개인번호(TB_INSA.PER_NO) — <b>여기 한 줄만 바꾼다.</b>
     * 저장소(GitHub)에는 CHANGE_ME 로 둔다(개인번호는 비밀값). 폐쇄망 사본에서만 실제 번호로 바꿔 빌드한다.
     * CHANGE_ME 그대로면 /api/** 가 401 ME_001.
     */
    public static final String PER_NO = "CHANGE_ME";

    @Bean
    public FixedUserFilter fixedUserFilter(CurrentUserLoader loader, ObjectMapper objectMapper) {
        return new FixedUserFilter(loader, objectMapper, PER_NO);
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
