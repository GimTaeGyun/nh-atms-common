package kr.co.nh.atms.web.audit;

import kr.co.nh.atms.common.audit.AuditFields;
import kr.co.nh.atms.common.audit.AuditInterceptor;
import kr.co.nh.atms.common.audit.AuditUserProvider;
import org.apache.ibatis.binding.MapperMethod;
import org.apache.ibatis.builder.StaticSqlSource;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/** 감사 컬럼 자동 채움 — INSERT 4개, UPDATE 2개, DELETE 안 건드림, ParamMap·목록 안의 Auditable */
class AuditInterceptorTest {

    static class Row extends AuditFields {
    }

    private final AuditInterceptor interceptor = new AuditInterceptor(() -> "123456789", () -> "20261107123045");

    private static MappedStatement ms(SqlCommandType type) {
        Configuration c = new Configuration();
        return new MappedStatement.Builder(c, "t." + type, new StaticSqlSource(c, "X"), type).build();
    }

    private void run(SqlCommandType type, Object param) throws Throwable {
        Executor ex = mock(Executor.class);
        Invocation inv = new Invocation(ex, Executor.class.getMethod("update", MappedStatement.class, Object.class),
                new Object[]{ms(type), param});
        interceptor.intercept(inv);
    }

    @Test
    void insertFillsAllFour() throws Throwable {
        Row r = new Row();
        run(SqlCommandType.INSERT, r);
        assertThat(r.getCrtDtm()).isEqualTo("20261107123045");
        assertThat(r.getCrtCmeno()).isEqualTo("123456789");
        assertThat(r.getLschgDtm()).isEqualTo("20261107123045");
        assertThat(r.getLsCmeno()).isEqualTo("123456789");
    }

    @Test
    void updateFillsOnlyLastChange() throws Throwable {
        Row r = new Row();
        r.setCrtDtm("20200101000000");
        r.setCrtCmeno("old");
        run(SqlCommandType.UPDATE, r);
        assertThat(r.getCrtDtm()).isEqualTo("20200101000000");
        assertThat(r.getCrtCmeno()).isEqualTo("old");
        assertThat(r.getLschgDtm()).isEqualTo("20261107123045");
        assertThat(r.getLsCmeno()).isEqualTo("123456789");
    }

    @Test
    void deleteIsUntouched() throws Throwable {
        Row r = new Row();
        run(SqlCommandType.DELETE, r);
        assertThat(r.getLschgDtm()).isNull();
        assertThat(r.getCrtDtm()).isNull();
    }

    @Test
    void paramMapAndListValuesAreFilled() throws Throwable {
        Row a = new Row();
        Row b = new Row();
        MapperMethod.ParamMap<Object> pm = new MapperMethod.ParamMap<>();
        pm.put("row", a);
        pm.put("param1", a);
        pm.put("rows", List.of(b));
        pm.put("param2", List.of(b));
        pm.put("no", 3);
        run(SqlCommandType.INSERT, pm);
        assertThat(a.getCrtCmeno()).isEqualTo("123456789");
        assertThat(b.getCrtDtm()).isEqualTo("20261107123045");
    }

    @Test
    void blankUserFallsBackToSystemId() throws Throwable {
        AuditInterceptor noUser = new AuditInterceptor(() -> " ", () -> "20261107000000");
        Row r = new Row();
        Executor ex = mock(Executor.class);
        noUser.intercept(new Invocation(ex, Executor.class.getMethod("update", MappedStatement.class, Object.class),
                new Object[]{ms(SqlCommandType.INSERT), r}));
        assertThat(r.getCrtCmeno()).isEqualTo(AuditUserProvider.SYSTEM_ID);
    }
}
