package kr.co.nh.atms.common.audit;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * {@link AuditInterceptor} 빈 등록. mybatis-spring-boot-starter 가 Interceptor 빈을 SqlSessionFactory 에 자동으로 붙인다.
 * 개인번호는 {@link AuditUserProvider} 빈(atms-web)에서, 빈이 없으면 {@link AuditUserProvider#SYSTEM_ID}.
 */
@Configuration
public class AuditConfig {

    @Bean
    public AuditInterceptor auditInterceptor(ObjectProvider<AuditUserProvider> provider) {
        return new AuditInterceptor(() -> {
            AuditUserProvider p = provider.getIfAvailable();
            return p == null ? AuditUserProvider.SYSTEM_ID : p.currentUserId();
        });
    }
}
