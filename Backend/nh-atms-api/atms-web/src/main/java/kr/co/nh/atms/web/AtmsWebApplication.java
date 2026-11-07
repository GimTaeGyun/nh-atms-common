package kr.co.nh.atms.web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * 화면 백엔드 실행 클래스.
 * <ul>
 *   <li>로컬: 내장 톰캣(bootRun / java -jar) — 프로파일 local</li>
 *   <li>JEUS: WAR(-Pjeus) — {@link SpringBootServletInitializer} 가 시작, 프로파일은 WEB-INF/web.xml 의 jeus</li>
 * </ul>
 * scanBasePackages 로 atms-common(kr.co.nh.atms.common)의 보안·메시지·감사·예외 처리도 함께 읽는다.
 * 로그인이 없으므로(고정 사용자) Spring Security 기본 사용자(자동 생성 비밀번호)는 만들지 않는다.
 */
@SpringBootApplication(scanBasePackages = "kr.co.nh.atms", exclude = UserDetailsServiceAutoConfiguration.class)
public class AtmsWebApplication extends SpringBootServletInitializer {

    public static void main(String[] args) {
        SpringApplication.run(AtmsWebApplication.class, args);
    }

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        return builder.sources(AtmsWebApplication.class);
    }
}
