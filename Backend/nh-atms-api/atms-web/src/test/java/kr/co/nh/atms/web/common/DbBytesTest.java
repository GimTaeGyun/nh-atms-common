package kr.co.nh.atms.web.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** 공통 바이트 수(잠정 Q-07) — 프론트 utils/rules byteLength 와 같은 결과 */
class DbBytesTest {

    @Test
    void asciiOneOthersTwo() {
        assertThat(DbBytes.length(null)).isZero();
        assertThat(DbBytes.length("abc 123")).isEqualTo(7);
        assertThat(DbBytes.length("공지 A")).isEqualTo(6);
        assertThat(DbBytes.length("😀")).isEqualTo(2);
    }

    @Test
    void overIsStrictlyGreater() {
        assertThat(DbBytes.over("가".repeat(40), 80)).isFalse();
        assertThat(DbBytes.over("가".repeat(40) + "a", 80)).isTrue();
        assertThat(DbBytes.over(null, 0)).isFalse();
    }
}
