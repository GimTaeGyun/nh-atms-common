package kr.co.nh.atms.web;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/** 전체 컨텍스트 기동 — 실제 DB 가 필요하므로 @Tag("db") (기본 제외, 폐쇄망 개발 DB 에서 -PdbTest 로만) */
@Tag("db")
@SpringBootTest
class AtmsWebApplicationTests {

    @Test
    void contextLoads() {
    }
}
