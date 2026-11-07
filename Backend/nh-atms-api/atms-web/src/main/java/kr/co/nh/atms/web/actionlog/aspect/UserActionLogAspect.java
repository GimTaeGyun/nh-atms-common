package kr.co.nh.atms.web.actionlog.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import kr.co.nh.atms.web.actionlog.dto.UserActionLogDto;
import kr.co.nh.atms.web.actionlog.service.UserActionLogService;
import kr.co.nh.atms.common.audit.AuditUserProvider;
import kr.co.nh.atms.web.common.CurrentUser;
import kr.co.nh.atms.web.common.Dates;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * 사용자 행위 이력 자동 기록 — 모든 컨트롤러 메서드를 감싼다(공통).
 *
 * <pre>
 *   요청 ─▶ [제외 경로·@NoActionLog 검사] ─▶ 컨트롤러 실행 ─▶ 성공/실패·소요시간 ─▶ T_USER_ACTION_LOG INSERT(실패해도 요청은 정상 응답)
 *   화면키·화면명은 프론트가 보내는 X-Screen-Key / X-Screen-Name(URL 인코딩) 헤더, 사유는 X-Action-Reason 헤더 또는 reason 파라미터.
 * </pre>
 * 기록 실패(DB 장애 등)는 경고 로그만 남기고 업무 요청을 막지 않는다.
 * [원본] nh-atms UserActionLogAspect — 사용자 ID 를 고정 사용자 개인번호로 바꿨다. 설정 키(actionlog.*)는 원본 그대로.
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class UserActionLogAspect {

    private final UserActionLogService service;
    private final ObjectMapper objectMapper;

    /** 사용자 행위가 아닌 호출(나·메뉴·공통 조회·헬스체크) — 쉼표 구분 접두어 */
    @Value("${actionlog.exclude-uri-prefixes:/api/me,/api/menu/,/api/lookup/,/actuator}")
    private String excludePrefixes;

    @Value("${actionlog.enabled:true}")
    private boolean enabled;

    @Around("execution(* kr.co.nh.atms.web..controller..*(..))")
    public Object around(ProceedingJoinPoint jp) throws Throwable {
        if (!enabled) return jp.proceed();
        HttpServletRequest req = currentRequest();
        if (req == null) return jp.proceed();
        Method method = ((MethodSignature) jp.getSignature()).getMethod();
        String uri = pathOf(req);
        if (isExcluded(uri) || hasAnnotation(method, NoActionLog.class)) return jp.proceed();

        long start = System.currentTimeMillis();
        String resultYn = "Y";
        String resultMsg = null;
        try {
            Object ret = jp.proceed();
            return ret;
        } catch (Throwable t) {
            resultYn = "N";
            resultMsg = t.getMessage() == null ? t.getClass().getSimpleName() : t.getMessage();
            throw t;
        } finally {
            try {
                record(req, jp, method, uri, resultYn, resultMsg, System.currentTimeMillis() - start);
            } catch (Exception e) {
                log.warn("[행위이력] 기록 실패(요청은 정상 처리): uri={}, err={}", uri, e.toString());
            }
        }
    }

    private void record(HttpServletRequest req, ProceedingJoinPoint jp, Method method, String uri, String resultYn, String resultMsg, long elapsed) {
        ActionLog explicit = AnnotatedElementUtils.findMergedAnnotation(method, ActionLog.class);
        String action = explicit != null ? explicit.action() : UserActionLogSupport.deriveAction(req.getMethod(), uri, method.getName());
        String handler = method.getDeclaringClass().getSimpleName() + "." + method.getName();
        Object body = requestBodyArg(jp, method);
        String reason = StringUtils.hasText(req.getHeader("X-Action-Reason")) ? decode(req.getHeader("X-Action-Reason")) : req.getParameter("reason");

        UserActionLogDto row = UserActionLogDto.builder()
                .actionDate(Dates.today())
                .actionTime(Dates.nowHms())
                .userId(userIdOrDash())
                .loginIp(req.getRemoteAddr())
                .screenKey(cut(req.getHeader("X-Screen-Key"), 40))
                .screenName(cut(decode(req.getHeader("X-Screen-Name")), 100))
                .action(action)
                .reqMethod(req.getMethod())
                .reqUri(cut(uri, 300))
                .handler(cut(handler, 120))
                .actionParam(UserActionLogSupport.buildParam(objectMapper, req.getParameterMap(), body))
                .reason(UserActionLogSupport.truncateBytes(reason, MSG_LIMIT))
                .resultYn(resultYn)
                .resultMsg(UserActionLogSupport.truncateBytes(resultMsg, UserActionLogSupport.MSG_MAX_BYTES))
                .elapsedMs(elapsed)
                .build();
        service.record(row);
    }

    private static final int MSG_LIMIT = 480;

    /** @RequestBody 가 붙은 인자(파일·서블릿 객체는 제외) */
    private static Object requestBodyArg(ProceedingJoinPoint jp, Method method) {
        Annotation[][] anns = method.getParameterAnnotations();
        Object[] args = jp.getArgs();
        for (int i = 0; i < anns.length && i < args.length; i++) {
            for (Annotation a : anns[i]) {
                if (a instanceof RequestBody) {
                    Object v = args[i];
                    if (v instanceof MultipartFile || v instanceof HttpServletRequest || v instanceof HttpServletResponse) return null;
                    return v;
                }
            }
        }
        return null;
    }

    private boolean isExcluded(String uri) {
        if (!StringUtils.hasText(excludePrefixes)) return false;
        List<String> prefixes = Arrays.stream(excludePrefixes.split(",")).map(String::trim).filter(StringUtils::hasText).toList();
        for (String p : prefixes) if (uri.startsWith(p)) return true;
        return false;
    }

    private static boolean hasAnnotation(Method m, Class<? extends Annotation> type) {
        return AnnotatedElementUtils.hasAnnotation(m, type) || AnnotatedElementUtils.hasAnnotation(m.getDeclaringClass(), type);
    }

    private static String pathOf(HttpServletRequest req) {
        String uri = req.getRequestURI();
        String ctx = req.getContextPath();
        return (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) ? uri.substring(ctx.length()) : uri;
    }

    /** 현재 사용자 개인번호(고정 사용자). 사용자가 없으면 "-" */
    private static String userIdOrDash() {
        String id = CurrentUser.perNo();
        return AuditUserProvider.SYSTEM_ID.equals(id) ? "-" : id;
    }

    private static String decode(String v) {
        if (v == null) return null;
        try {
            return URLDecoder.decode(v, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return v;
        }
    }

    private static String cut(String v, int max) {
        if (v == null) return null;
        return v.length() > max ? v.substring(0, max) : v;
    }

    private static HttpServletRequest currentRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
