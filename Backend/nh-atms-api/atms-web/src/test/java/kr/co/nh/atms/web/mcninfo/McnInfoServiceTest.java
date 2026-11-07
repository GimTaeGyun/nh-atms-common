package kr.co.nh.atms.web.mcninfo;

import kr.co.nh.atms.common.exception.BusinessException;
import kr.co.nh.atms.common.page.PageResult;
import kr.co.nh.atms.web.common.NotFoundException;
import kr.co.nh.atms.web.mcninfo.dto.McnInfo;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoKey;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoSave;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoSearchDto;
import kr.co.nh.atms.web.mcninfo.mapper.McnInfoMapper;
import kr.co.nh.atms.web.mcninfo.service.McnInfoService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DuplicateKeyException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 기기정보 견본 규칙 — V001_20·VAL_003(ofcCode·mcnNo·useYn)·MCN_001(404)·MCN_002·논리 삭제·기기사명 원천 설정 */
class McnInfoServiceTest {

    private final McnInfoMapper mapper = mock(McnInfoMapper.class);
    private final McnInfoService service = new McnInfoService(mapper, "");

    private static String code(Throwable t) {
        return ((BusinessException) t).getCode();
    }

    private static Object[] args(Throwable t) {
        return ((BusinessException) t).getArgs();
    }

    private static McnInfo row(String ofcCode, String mcnNo) {
        McnInfo r = new McnInfo();
        r.setOfcCode(ofcCode);
        r.setMcnNo(mcnNo);
        r.setUseYn("Y");
        return r;
    }

    private static McnInfoSave save(String ofcCode, String mcnNo) {
        McnInfoSave d = new McnInfoSave();
        d.setOfcCode(ofcCode);
        d.setMcnNo(mcnNo);
        d.setUseYn("Y");
        return d;
    }

    @Test
    void listRequiresOfficeAndNormalizesConditions() {
        assertThatThrownBy(() -> service.list(new McnInfoSearchDto())).satisfies(t -> assertThat(code(t)).isEqualTo("V001_20"));

        McnInfoSearchDto bad = new McnInfoSearchDto();
        bad.setOfcCode("12A");
        assertThatThrownBy(() -> service.list(bad)).satisfies(t -> assertThat(code(t)).isEqualTo("VAL_003"));

        McnInfoSearchDto badMcn = new McnInfoSearchDto();
        badMcn.setOfcCode("80");
        badMcn.setMcnNo("12");
        assertThatThrownBy(() -> service.list(badMcn)).satisfies(t -> {
            assertThat(code(t)).isEqualTo("VAL_003");
            assertThat(args(t)).containsExactly("mcnNo");
        });

        McnInfoSearchDto badYn = new McnInfoSearchDto();
        badYn.setOfcCode("80");
        badYn.setUseYn("X");
        assertThatThrownBy(() -> service.list(badYn)).satisfies(t -> assertThat(args(t)).containsExactly("useYn"));

        McnInfoSearchDto s = new McnInfoSearchDto();
        s.setOfcCode(" 80 ");
        s.setMcnNo(" 001 ");
        s.setVendCode(" ");
        s.setKomType("1");
        s.setUseYn("Y");
        s.setPage(2);
        s.setSize(10);
        when(mapper.countList(s)).thenReturn(11L);
        when(mapper.selectList(s, null)).thenReturn(List.of(row("000080", "001")));
        PageResult<McnInfo> r = service.list(s);
        assertThat(s.getOfcCode()).isEqualTo("000080");
        assertThat(s.getMcnNo()).isEqualTo("001");
        assertThat(s.getVendCode()).isNull();
        assertThat(r.getTotalCount()).isEqualTo(11L);
        assertThat(r.getTotalPages()).isEqualTo(2);
        assertThat(r.getContent()).hasSize(1);
    }

    @Test
    void listSkipsSelectWhenCountIsZero() {
        McnInfoSearchDto s = new McnInfoSearchDto();
        s.setOfcCode("000080");
        when(mapper.countList(s)).thenReturn(0L);
        assertThat(service.list(s).getContent()).isEmpty();
        verify(mapper, never()).selectList(any(), any());
    }

    @Test
    void getNotFoundIs404WithKeyArgs() {
        assertThatThrownBy(() -> service.get("80", "001")).isInstanceOf(NotFoundException.class).satisfies(t -> {
            assertThat(code(t)).isEqualTo("MCN_001");
            assertThat(args(t)).containsExactly("000080", "001");
        });
        assertThatThrownBy(() -> service.get("000080", "1")).satisfies(t -> assertThat(code(t)).isEqualTo("VAL_003"));
        when(mapper.selectOne("000080", "001", null)).thenReturn(row("000080", "001"));
        assertThat(service.get("80", "001").getMcnNo()).isEqualTo("001");
    }

    @Test
    void createRejectsDuplicateAndBadKeys() {
        assertThatThrownBy(() -> service.create(save(null, "001"))).satisfies(t -> assertThat(code(t)).isEqualTo("V001_20"));
        assertThatThrownBy(() -> service.create(save("000080", "01A"))).satisfies(t -> {
            assertThat(code(t)).isEqualTo("VAL_003");
            assertThat(args(t)).containsExactly("mcnNo");
        });
        when(mapper.countByKey("000080", "001")).thenReturn(1);
        assertThatThrownBy(() -> service.create(save("80", "001"))).isNotInstanceOf(NotFoundException.class).satisfies(t -> {
            assertThat(code(t)).isEqualTo("MCN_002");
            assertThat(args(t)).containsExactly("000080", "001");
        });
        verify(mapper, never()).insert(any());
    }

    @Test
    void concurrentDuplicateInsertIsMcn002Not500() {
        when(mapper.countByKey("000080", "003")).thenReturn(0);
        doThrow(new DuplicateKeyException("ORA-00001")).when(mapper).insert(any());
        assertThatThrownBy(() -> service.create(save("80", "003"))).satisfies(t -> {
            assertThat(code(t)).isEqualTo("MCN_002");
            assertThat(args(t)).containsExactly("000080", "003");
        });
    }

    @Test
    void createInsertsCleanedRowAndReturnsSaved() {
        McnInfoSave d = save("80", " 002 ");
        d.setKomType(" ");
        d.setSrc(" A1 ");
        when(mapper.countByKey("000080", "002")).thenReturn(0);
        when(mapper.selectOne("000080", "002", null)).thenReturn(row("000080", "002"));
        McnInfo r = service.create(d);
        ArgumentCaptor<McnInfoSave> cap = ArgumentCaptor.forClass(McnInfoSave.class);
        verify(mapper).insert(cap.capture());
        assertThat(cap.getValue().getOfcCode()).isEqualTo("000080");
        assertThat(cap.getValue().getMcnNo()).isEqualTo("002");
        assertThat(cap.getValue().getKomType()).isNull();
        assertThat(cap.getValue().getSrc()).isEqualTo("A1");
        assertThat(r.getMcnNo()).isEqualTo("002");
    }

    @Test
    void updateUsesPathKeysAndNotFound() {
        McnInfoSave body = save("999999", "999");
        when(mapper.update(any())).thenReturn(0);
        assertThatThrownBy(() -> service.update("80", "001", body)).isInstanceOf(NotFoundException.class).satisfies(t -> {
            assertThat(code(t)).isEqualTo("MCN_001");
            assertThat(args(t)).containsExactly("000080", "001");
        });
        assertThat(body.getOfcCode()).isEqualTo("000080");
        assertThat(body.getMcnNo()).isEqualTo("001");

        McnInfoSave ok = save(null, null);
        when(mapper.update(ok)).thenReturn(1);
        when(mapper.selectOne("000080", "001", null)).thenReturn(row("000080", "001"));
        assertThat(service.update("000080", "001", ok).getOfcCode()).isEqualTo("000080");
    }

    @Test
    void deleteIsSoftAndNotFound() {
        when(mapper.softDelete(any())).thenReturn(0);
        assertThatThrownBy(() -> service.delete("000080", "009")).isInstanceOf(NotFoundException.class)
                .satisfies(t -> assertThat(code(t)).isEqualTo("MCN_001"));

        McnInfoMapper m2 = mock(McnInfoMapper.class);
        when(m2.softDelete(any())).thenReturn(1);
        new McnInfoService(m2, "").delete("80", "001");
        ArgumentCaptor<McnInfoKey> cap = ArgumentCaptor.forClass(McnInfoKey.class);
        verify(m2).softDelete(cap.capture());
        assertThat(cap.getValue().getOfcCode()).isEqualTo("000080");
        assertThat(cap.getValue().getMcnNo()).isEqualTo("001");
    }

    @Test
    void vendorNameSourceFollowsLookupSetting() {
        McnInfoMapper m2 = mock(McnInfoMapper.class);
        when(m2.selectOne(eq("000080"), eq("001"), eq("VEND"))).thenReturn(row("000080", "001"));
        assertThat(new McnInfoService(m2, " VEND ").get("000080", "001")).isNotNull();
        verify(m2).selectOne("000080", "001", "VEND");
    }
}
