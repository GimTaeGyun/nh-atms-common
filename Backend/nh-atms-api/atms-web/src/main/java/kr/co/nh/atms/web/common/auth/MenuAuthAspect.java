package kr.co.nh.atms.web.common.auth;

import lombok.RequiredArgsConstructor;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

/** {@link RequireMenuAuth} 가 붙은 메서드 실행 전에 {@link MenuAuthService#check} */
@Aspect
@Component
@RequiredArgsConstructor
public class MenuAuthAspect {

    private final MenuAuthService menuAuthService;

    @Before("@annotation(req)")
    public void check(RequireMenuAuth req) {
        menuAuthService.check(req.screen(), req.need());
    }
}
