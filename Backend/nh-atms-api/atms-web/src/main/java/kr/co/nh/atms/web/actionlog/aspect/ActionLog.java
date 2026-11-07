package kr.co.nh.atms.web.actionlog.aspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 행위 이력의 수행작업(action)을 자동 판정 대신 직접 지정한다.
 * 예: GET 이지만 엑셀 생성인 경우 {@code @ActionLog(action = "EXPORT")}.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ActionLog {
    /** SELECT / INSERT / UPDATE / DELETE / EXPORT */
    String action();
}
