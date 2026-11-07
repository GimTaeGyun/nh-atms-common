package kr.co.nh.atms.web.mcnmodel;

import kr.co.nh.atms.common.exception.BusinessException;
import kr.co.nh.atms.web.common.BatchChanges;
import kr.co.nh.atms.web.common.DbBytes;
import kr.co.nh.atms.web.common.ForbiddenException;
import kr.co.nh.atms.web.common.NotFoundException;
import kr.co.nh.atms.web.common.auth.MenuAuthService;
import kr.co.nh.atms.web.common.auth.Perm;
import kr.co.nh.atms.web.mcnmodel.dto.McnModel;
import kr.co.nh.atms.web.mcnmodel.dto.McnModelBatchResult;
import kr.co.nh.atms.web.mcnmodel.dto.McnModelSearchDto;
import kr.co.nh.atms.web.mcnmodel.mapper.McnModelMapper;
import kr.co.nh.atms.web.mcnmodel.service.McnModelRules;
import kr.co.nh.atms.web.mcnmodel.service.McnModelService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.dao.DuplicateKeyException;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * 기기모델코드 견본 규칙 — 권한(있는 종류만 REG·UPD·DEL)·VAL_001(키·모델명)·MDL_002(본문 안·DB 중복)·MDL_001(404)·처리 순서·기기사명 원천 설정
 */
class McnModelServiceTest {

    private static final String SCREEN = "sample.mcnModel";

    private final McnModelMapper mapper = mock(McnModelMapper.class);
    private final MenuAuthService auth = mock(MenuAuthService.class);
    private final McnModelService service = new McnModelService(mapper, auth, "");

    private static String code(Throwable t) {
        return ((BusinessException) t).getCode();
    }

    private static Object[] args(Throwable t) {
        return ((BusinessException) t).getArgs();
    }

    private static McnModel row(String vend, String type, String model, String nm) {
        McnModel r = new McnModel();
        r.setVendCode(vend);
        r.setMcnType(type);
        r.setModelCode(model);
        r.setModelNm(nm);
        return r;
    }

    private static BatchChanges<McnModel> batch(List<McnModel> added, List<McnModel> updated, List<McnModel> deleted) {
        BatchChanges<McnModel> b = new BatchChanges<>();
        b.setAdded(new ArrayList<>(added));
        b.setUpdated(new ArrayList<>(updated));
        b.setDeleted(new ArrayList<>(deleted));
        return b;
    }

    @Test
    void listTrimsConditionsAndUsesVendorSetting() {
        McnModelSearchDto s = new McnModelSearchDto();
        s.setVendCode(" 01 ");
        s.setMcnType(" ");
        s.setQ(" A1 ");
        when(mapper.selectList(any(), any())).thenReturn(List.of(row("01", "01", "A1", "ATM")));

        assertThat(service.list(s)).hasSize(1);
        assertThat(s.getVendCode()).isEqualTo("01");
        assertThat(s.getMcnType()).isNull();
        assertThat(s.getQ()).isEqualTo("A1");
        verify(mapper).selectList(s, null);

        new McnModelService(mapper, auth, " VENDOR ").list(new McnModelSearchDto());
        verify(mapper).selectList(any(), eq("VENDOR"));
    }

    @Test
    void checksOnlyPermissionsOfKindsPresent() {
        when(mapper.updateName(any())).thenReturn(1);
        service.saveBatch(batch(List.of(), List.of(row("01", "01", "A1", "x")), List.of()));
        verify(auth).check(SCREEN, Perm.UPD);
        verify(auth, never()).check(SCREEN, Perm.REG);
        verify(auth, never()).check(SCREEN, Perm.DEL);
    }

    @Test
    void forbiddenStopsBeforeAnyWrite() {
        doThrow(new ForbiddenException("SYS_403")).when(auth).check(SCREEN, Perm.DEL);
        BatchChanges<McnModel> b = batch(List.of(row("01", "01", "Z1", "new")), List.of(), List.of(row("01", "01", "A1", null)));

        assertThatThrownBy(() -> service.saveBatch(b)).isInstanceOf(ForbiddenException.class).satisfies(t -> assertThat(code(t)).isEqualTo("SYS_403"));
        verify(auth).check(SCREEN, Perm.REG);
        verifyNoInteractions(mapper);
    }

    @Test
    void keyFieldsRequiredAndAtMostTwoChars() {
        assertThatThrownBy(() -> service.saveBatch(batch(List.of(row(" ", "01", "A1", null)), List.of(), List.of())))
                .satisfies(t -> {
                    assertThat(code(t)).isEqualTo("VAL_001");
                    assertThat(args(t)).containsExactly("vendCode");
                });
        assertThatThrownBy(() -> service.saveBatch(batch(List.of(), List.of(row("01", null, "A1", null)), List.of())))
                .satisfies(t -> assertThat(args(t)).containsExactly("mcnType"));
        assertThatThrownBy(() -> service.saveBatch(batch(List.of(), List.of(), List.of(row("01", "01", "ABC", null)))))
                .satisfies(t -> {
                    assertThat(code(t)).isEqualTo("VAL_001");
                    assertThat(args(t)).containsExactly("modelCode");
                });
        verify(mapper, never()).insert(any());
        verify(mapper, never()).delete(any());
    }

    @Test
    void modelNameIsLimitedTo80Bytes() {
        String hangul40 = "가".repeat(40);
        when(mapper.updateName(any())).thenReturn(1);
        service.saveBatch(batch(List.of(), List.of(row("01", "01", "A1", hangul40)), List.of()));

        assertThat(DbBytes.length(hangul40 + "a")).isEqualTo(81);
        assertThatThrownBy(() -> service.saveBatch(batch(List.of(), List.of(row("01", "01", "A1", hangul40 + "a")), List.of())))
                .satisfies(t -> {
                    assertThat(code(t)).isEqualTo("VAL_001");
                    assertThat(args(t)).containsExactly("modelNm");
                });
    }

    @Test
    void duplicateInsideBatchIsMdl002() {
        BatchChanges<McnModel> b = batch(List.of(row("01", "01", "Z1", "a"), row(" 01", "01 ", "Z1", "b")), List.of(), List.of());
        assertThatThrownBy(() -> service.saveBatch(b)).satisfies(t -> {
            assertThat(code(t)).isEqualTo("MDL_002");
            assertThat(args(t)).containsExactly("01-01-Z1");
        });
        verify(mapper, never()).insert(any());
    }

    @Test
    void concurrentDuplicateInsertIsMdl002Not500() {
        when(mapper.countByKey(any())).thenReturn(0);
        doThrow(new DuplicateKeyException("ORA-00001")).when(mapper).insert(any());
        assertThatThrownBy(() -> service.saveBatch(batch(List.of(row("01", "01", "A2", "a")), List.of(), List.of())))
                .satisfies(t -> {
                    assertThat(code(t)).isEqualTo("MDL_002");
                    assertThat(args(t)).containsExactly("01-01-A2");
                });
    }

    @Test
    void duplicateInDbIsMdl002() {
        when(mapper.countByKey(any())).thenReturn(1);
        assertThatThrownBy(() -> service.saveBatch(batch(List.of(row("01", "01", "A1", "a")), List.of(), List.of())))
                .isNotInstanceOf(NotFoundException.class)
                .satisfies(t -> {
                    assertThat(code(t)).isEqualTo("MDL_002");
                    assertThat(args(t)).containsExactly("01-01-A1");
                });
        verify(mapper, never()).insert(any());
    }

    @Test
    void missingOnUpdateOrDeleteIsMdl001NotFound() {
        when(mapper.updateName(any())).thenReturn(0);
        assertThatThrownBy(() -> service.saveBatch(batch(List.of(), List.of(row("02", "01", "H9", "x")), List.of())))
                .isInstanceOf(NotFoundException.class)
                .satisfies(t -> {
                    assertThat(code(t)).isEqualTo("MDL_001");
                    assertThat(args(t)).containsExactly("02-01-H9");
                });

        when(mapper.delete(any())).thenReturn(0);
        assertThatThrownBy(() -> service.saveBatch(batch(List.of(), List.of(), List.of(row("02", "03", "B9", null)))))
                .isInstanceOf(NotFoundException.class)
                .satisfies(t -> assertThat(args(t)).containsExactly("02-03-B9"));
    }

    @Test
    void savesInOrderDeleteUpdateInsertAndReturnsCounts() {
        when(mapper.delete(any())).thenReturn(1);
        when(mapper.updateName(any())).thenReturn(1);
        when(mapper.countByKey(any())).thenReturn(0);
        McnModel add = row(" 01 ", "01", "A1", "  새 모델  ");
        add.setVendNm("에이텍");
        McnModel upd = row("01", "01", "A2", " ");
        McnModel del = row("01", "01", "A1", "옛 모델");

        McnModelBatchResult r = service.saveBatch(batch(List.of(add), List.of(upd), List.of(del)));

        assertThat(r.added()).isEqualTo(1);
        assertThat(r.updated()).isEqualTo(1);
        assertThat(r.deleted()).isEqualTo(1);
        InOrder order = inOrder(auth, mapper);
        order.verify(auth).check(SCREEN, Perm.REG);
        order.verify(auth).check(SCREEN, Perm.UPD);
        order.verify(auth).check(SCREEN, Perm.DEL);
        order.verify(mapper).delete(del);
        order.verify(mapper).updateName(upd);
        order.verify(mapper).countByKey(add);
        order.verify(mapper).insert(add);

        ArgumentCaptor<McnModel> ins = ArgumentCaptor.forClass(McnModel.class);
        verify(mapper).insert(ins.capture());
        assertThat(ins.getValue().getVendCode()).isEqualTo("01");
        assertThat(ins.getValue().getModelNm()).isEqualTo("새 모델");
        assertThat(ins.getValue().getVendNm()).isNull();
        assertThat(upd.getModelNm()).isNull();
    }

    @Test
    void emptyBatchDoesNothing() {
        McnModelBatchResult r = service.saveBatch(new BatchChanges<>());
        assertThat(r).isEqualTo(new McnModelBatchResult(0, 0, 0));
        verifyNoInteractions(auth, mapper);
    }

    @Test
    void deletableIsAlwaysTrueUntilQ06() {
        assertThat(McnModelRules.deletable(row("01", "01", "A1", null))).isTrue();
    }
}
