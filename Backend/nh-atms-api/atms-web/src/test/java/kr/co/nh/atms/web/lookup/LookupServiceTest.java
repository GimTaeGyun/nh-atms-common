package kr.co.nh.atms.web.lookup;

import kr.co.nh.atms.common.exception.BusinessException;
import kr.co.nh.atms.web.common.NotFoundException;
import kr.co.nh.atms.web.lookup.mapper.LookupMapper;
import kr.co.nh.atms.web.lookup.service.LookupRules;
import kr.co.nh.atms.web.lookup.service.LookupService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 공통 조회 규칙 — LKP_001·LKP_002·사무소 필수(V001_20)·없음 404·휴일 기간·기기사 원천·기종 */
class LookupServiceTest {

    private final LookupMapper mapper = mock(LookupMapper.class);
    private final LookupService service = new LookupService(mapper, "");

    private static String code(Throwable t) {
        return ((BusinessException) t).getCode();
    }

    @Test
    void personsNeedOfficeOrKeyword() {
        assertThatThrownBy(() -> service.persons(" ", null)).satisfies(t -> assertThat(code(t)).isEqualTo("LKP_001"));
        service.persons("000080", null);
        verify(mapper).selectPersons(eq("000080"), eq(null), eq(LookupRules.personRetireCutoff()));
        service.persons(null, " 홍 ");
        verify(mapper).selectPersons(eq(null), eq("홍"), any());
    }

    @Test
    void distinctOnlyAllowsWhitelist() {
        assertThatThrownBy(() -> service.distinct("TB_INSA.NAME")).satisfies(t -> assertThat(code(t)).isEqualTo("LKP_002"));
        when(mapper.selectDistinctMcnOpType()).thenReturn(List.of());
        assertThat(service.distinct("mcn-op-type")).isEmpty();
        verify(mapper).selectDistinctMcnOpType();
    }

    @Test
    void machinesAndCornersRequireOffice() {
        assertThatThrownBy(() -> service.machines(null, null, null)).satisfies(t -> assertThat(code(t)).isEqualTo("V001_20"));
        assertThatThrownBy(() -> service.corners(" ")).satisfies(t -> assertThat(code(t)).isEqualTo("V001_20"));
        service.machines(" 000080 ", "", "01");
        verify(mapper).selectMachines("000080", null, "01");
    }

    @Test
    void srcsFilterByVendorOnlyWhenGiven() {
        service.srcs(" ");
        verify(mapper).selectSrcs(null);
        service.srcs(" 01 ");
        verify(mapper).selectSrcs("01");
    }

    @Test
    void notFoundCodes() {
        assertThatThrownBy(() -> service.office("999999")).isInstanceOf(NotFoundException.class)
                .satisfies(t -> assertThat(code(t)).isEqualTo("LKP_404"));
        assertThatThrownBy(() -> service.person("999")).isInstanceOf(NotFoundException.class)
                .satisfies(t -> assertThat(code(t)).isEqualTo("E404"));
    }

    @Test
    void holidayRange() {
        assertThatThrownBy(() -> service.holidays(null, "20261231")).satisfies(t -> assertThat(code(t)).isEqualTo("VAL_002"));
        assertThatThrownBy(() -> service.holidays("2026-01-01", "20261231")).satisfies(t -> assertThat(code(t)).isEqualTo("VAL_003"));
        assertThatThrownBy(() -> service.holidays("20261231", "20260101")).satisfies(t -> assertThat(code(t)).isEqualTo("VAL_001"));
        assertThatThrownBy(() -> service.holidays("20260101", "20270102")).satisfies(t -> assertThat(code(t)).isEqualTo("VAL_001"));
        service.holidays("20260101", "20261231");
        verify(mapper).selectHolidays("20260101", "20261231");
    }

    @Test
    void vendorSourceFollowsSetting() {
        service.vendors();
        verify(mapper).selectVendorsDistinct();
        verify(mapper, never()).selectVendorsFromCode(any());

        LookupMapper m2 = mock(LookupMapper.class);
        new LookupService(m2, " VEND ").vendors();
        verify(m2).selectVendorsFromCode("VEND");
    }
}
