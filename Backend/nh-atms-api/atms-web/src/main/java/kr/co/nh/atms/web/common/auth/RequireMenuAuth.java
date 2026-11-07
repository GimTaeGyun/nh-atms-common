package kr.co.nh.atms.web.common.auth;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 컨트롤러 메서드의 화면 권한 서버 검사(설계 §5.5, Q2). 권한이 없으면 403 {@code SYS_403}.
 * <pre>
 *   &#64;RequireMenuAuth(screen = "sample.notice", need = Perm.REG)
 *   &#64;PostMapping("/api/notice")
 *   public ApiResponse&lt;Notice&gt; create(...)
 * </pre>
 * 한 요청에 권한이 여럿 필요하면(예: 일괄 저장 — 추가 REG·수정 UPD·삭제 DEL) 서비스에서 {@link MenuAuthService#check} 를 직접 부른다.
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RequireMenuAuth {
    /** 화면키(screens/screenIds.ts 의 키, 예 "sample.notice") */
    String screen();

    /** 필요한 권한 */
    Perm need() default Perm.QRY;
}
