package kr.co.nh.atms.web.actionlog.aspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** 이 컨트롤러 메서드(또는 클래스)는 행위 이력을 남기지 않는다 — 폴링·헬스체크처럼 사용자 행위가 아닌 호출용 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
public @interface NoActionLog {
}
