package kr.co.nh.atms.common.audit;

import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Signature;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;

/**
 * 감사 컬럼 자동 채움 (MyBatis 플러그인, 설계 §5.6 · 21지침 §3).
 * <pre>
 *   매퍼 INSERT/UPDATE 호출 ─▶ [이 인터셉터] 파라미터 중 Auditable 을 찾아
 *       INSERT → crtDtm·crtCmeno·lschgDtm·lsCmeno 4개
 *       UPDATE → lschgDtm·lsCmeno 2개
 *   ─▶ 매퍼 XML 의 #{crtDtm} 등에 값이 들어간 채로 실행
 * </pre>
 * 파라미터가 Auditable 하나이거나, {@code @Param} 여러 개(MapperMethod.ParamMap)·목록(foreach) 안에 Auditable 이 있어도 채운다.
 * DELETE 는 건드리지 않는다. 빈 등록은 {@link AuditConfig}(mybatis-spring-boot-starter 가 Interceptor 빈을 자동으로 붙인다).
 */
@Intercepts(@Signature(type = Executor.class, method = "update", args = {MappedStatement.class, Object.class}))
public class AuditInterceptor implements Interceptor {

    private static final DateTimeFormatter DT14 = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final Supplier<String> userId;
    private final Supplier<String> now14;

    public AuditInterceptor(Supplier<String> userId) {
        this(userId, () -> LocalDateTime.now().format(DT14));
    }

    /** 테스트용: 시각 공급자 지정 */
    public AuditInterceptor(Supplier<String> userId, Supplier<String> now14) {
        this.userId = userId;
        this.now14 = now14;
    }

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object[] args = invocation.getArgs();
        MappedStatement ms = (MappedStatement) args[0];
        SqlCommandType type = ms.getSqlCommandType();
        if (type == SqlCommandType.INSERT || type == SqlCommandType.UPDATE) {
            fill(args[1], type == SqlCommandType.INSERT);
        }
        return invocation.proceed();
    }

    /** 파라미터 안의 Auditable 을 모두 채운다(같은 객체는 한 번만). */
    void fill(Object param, boolean insert) {
        if (param == null) return;
        String now = now14.get();
        String who = currentUser();
        Set<Object> seen = Collections.newSetFromMap(new IdentityHashMap<>());
        visit(param, insert, now, who, seen, 0);
    }

    private void visit(Object o, boolean insert, String now, String who, Set<Object> seen, int depth) {
        if (o == null || depth > 2 || !seen.add(o)) return;
        if (o instanceof Auditable a) {
            if (insert) {
                a.setCrtDtm(now);
                a.setCrtCmeno(who);
            }
            a.setLschgDtm(now);
            a.setLsCmeno(who);
        } else if (o instanceof Map<?, ?> m) {
            // MapperMethod.ParamMap(@Param 여러 개)·StrictMap(목록 하나) — 값마다 확인
            for (Object v : m.values()) visit(v, insert, now, who, seen, depth + 1);
        } else if (o instanceof Iterable<?> it) {
            for (Object v : it) visit(v, insert, now, who, seen, depth + 1);
        } else if (o instanceof Object[] arr) {
            for (Object v : arr) visit(v, insert, now, who, seen, depth + 1);
        }
    }

    private String currentUser() {
        try {
            String v = userId == null ? null : userId.get();
            return (v == null || v.isBlank()) ? AuditUserProvider.SYSTEM_ID : v;
        } catch (RuntimeException e) {
            return AuditUserProvider.SYSTEM_ID;
        }
    }
}
