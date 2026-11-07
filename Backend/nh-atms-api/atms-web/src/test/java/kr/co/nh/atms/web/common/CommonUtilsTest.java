package kr.co.nh.atms.web.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CommonUtilsTest {

    @Test
    void officeCode() {
        assertThat(OfficeCode.norm(" 000080 ")).isEqualTo("000080");
        assertThat(OfficeCode.norm("")).isNull();
        assertThat(OfficeCode.toDb("000080", false)).isEqualTo("000080");
        assertThat(OfficeCode.toDb("000080", true)).isEqualTo("00080");
        assertThat(OfficeCode.fromDb("00101")).isEqualTo("000101");
        assertThat(OfficeCode.fromDb("000101 ")).isEqualTo("000101");
        assertThatThrownBy(() -> OfficeCode.require(" ")).hasMessageContaining("사무소코드");
    }

    @Test
    void dates() {
        assertThat(Dates.hms6("1230459990")).isEqualTo("123045");
        assertThat(Dates.hhmm("0830")).isEqualTo("08:30");
        assertThat(Dates.toHhmm("08:30")).isEqualTo("0830");
        assertThat(Dates.ymdOf14("20261024123045")).isEqualTo("20261024");
        assertThat(Dates.hmsOf14("20261024123045")).isEqualTo("123045");
        assertThat(Dates.dash16("20261024", "1230459990")).isEqualTo("2026-10-24 12:30");
        assertThat(Dates.dash10("20261024")).isEqualTo("2026-10-24");
        assertThat(Dates.daysBetween("20261001", "20261007")).isEqualTo(7);
        assertThat(Dates.daysBetween("x", "y")).isEqualTo(-1);
        assertThat(Dates.today()).hasSize(8);
    }

    @Test
    void masking() {
        assertThat(Masking.account("1234567890")).isEqualTo("******7890");
        assertThat(Masking.card("1234567890123456")).isEqualTo("123456******3456");
        assertThat(Masking.name("홍길동")).isEqualTo("홍*동");
        assertThat(Masking.name("김철")).isEqualTo("김*");
        assertThat(Masking.phone("01012345678")).isEqualTo("010****5678");
    }

    @Test
    void yn() {
        assertThat(Yn.is("Y ")).isTrue();
        assertThat(Yn.is("N")).isFalse();
        assertThat(Yn.of(true)).isEqualTo("Y");
        assertThat(Yn.nvl("  ", "x")).isEqualTo("x");
    }
}
