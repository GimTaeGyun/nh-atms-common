package kr.co.nh.atms.web.common;

import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.ResultMap;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 매퍼 XML 적재 검사(DB 없이) — application.yml 과 같은 MyBatis 설정(camelCase·type alias 패키지)에
 * classpath:mapper/**&#47;*.xml 을 모두 올려 XML 문법·namespace·id 중복·resultType 클래스를 확인한다.
 * SQL 자체(테이블·컬럼)는 폐쇄망 개발 DB 에서만 확인할 수 있다.
 */
class MapperXmlLoadTest {

    @Test
    void everyMapperXmlLoadsAndResultTypesResolve() throws Exception {
        Configuration cfg = new Configuration();
        cfg.setMapUnderscoreToCamelCase(true);
        cfg.setJdbcTypeForNull(org.apache.ibatis.type.JdbcType.VARCHAR);
        cfg.getTypeAliasRegistry().registerAliases("kr.co.nh.atms.web");

        Resource[] xmls = new PathMatchingResourcePatternResolver().getResources("classpath*:mapper/**/*.xml");
        assertThat(xmls).as("매퍼 XML 이 없음").isNotEmpty();
        for (Resource r : xmls) {
            try (InputStream in = r.getInputStream()) {
                new XMLMapperBuilder(in, cfg, r.getURL().toString(), cfg.getSqlFragments()).parse();
            }
        }
        // 미완 구문(include·resultMap 참조 해석 실패 등)이 남지 않아야 한다
        assertThat(cfg.getIncompleteStatements()).as("해석 못 한 구문").isEmpty();
        assertThat(cfg.getIncompleteResultMaps()).as("해석 못 한 resultMap").isEmpty();
        assertThat(cfg.getIncompleteCacheRefs()).as("해석 못 한 cache-ref").isEmpty();

        List<String> problems = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Object o : cfg.getMappedStatements()) {
            if (!(o instanceof MappedStatement ms) || !seen.add(ms.getId())) continue;
            // namespace 가 실제 매퍼 인터페이스여야 한다
            String ns = ms.getId().substring(0, ms.getId().lastIndexOf('.'));
            try {
                Class.forName(ns);
            } catch (ClassNotFoundException e) {
                problems.add(ms.getId() + " namespace 클래스 없음");
            }
            for (ResultMap rm : ms.getResultMaps()) {
                if (rm.getType() == null) problems.add(ms.getId() + " resultType 없음");
            }
        }
        assertThat(problems).isEmpty();
        assertThat(seen).as("적재된 구문").isNotEmpty();
    }
}
