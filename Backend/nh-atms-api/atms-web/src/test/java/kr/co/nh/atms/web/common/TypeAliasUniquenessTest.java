package kr.co.nh.atms.web.common;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AssignableTypeFilter;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * application.yml 의 {@code mybatis.type-aliases-package: kr.co.nh.atms.web} 는 패키지 아래 **모든 클래스의 단순 이름**을
 * 별칭으로 등록한다. 서로 다른 패키지에 같은 단순 이름(예: JournalDetailDto)이 있으면 기동 시
 * "The alias 'X' is already mapped" 로 실패한다. 컨텍스트 로드 없이 그 조건을 미리 검사한다.
 */
class TypeAliasUniquenessTest {

    @Test
    void simpleClassNamesUnderWebPackageAreUnique() {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AssignableTypeFilter(Object.class));
        Map<String, String> seen = new HashMap<>();
        Map<String, String> dup = new HashMap<>();
        for (BeanDefinition bd : scanner.findCandidateComponents("kr.co.nh.atms.web")) {
            String fqcn = bd.getBeanClassName();
            if (fqcn == null || fqcn.contains("$") || fqcn.endsWith("package-info")) continue;
            String simple = fqcn.substring(fqcn.lastIndexOf('.') + 1);
            String prev = seen.putIfAbsent(simple, fqcn);
            if (prev != null && !prev.equals(fqcn)) dup.put(simple, prev + " / " + fqcn);
        }
        assertThat(dup).as("MyBatis type alias 충돌(단순 클래스명 중복) — 이름을 바꾸세요").isEmpty();
    }
}
