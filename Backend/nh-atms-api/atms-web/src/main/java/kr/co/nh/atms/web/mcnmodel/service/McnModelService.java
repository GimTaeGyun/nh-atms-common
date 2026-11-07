package kr.co.nh.atms.web.mcnmodel.service;

import kr.co.nh.atms.common.exception.BusinessException;
import kr.co.nh.atms.web.common.BatchChanges;
import kr.co.nh.atms.web.common.CurrentUser;
import kr.co.nh.atms.web.common.DbBytes;
import kr.co.nh.atms.web.common.NotFoundException;
import kr.co.nh.atms.web.common.auth.MenuAuthService;
import kr.co.nh.atms.web.common.auth.Perm;
import kr.co.nh.atms.web.lookup.service.LookupRules;
import kr.co.nh.atms.web.mcnmodel.dto.McnModel;
import kr.co.nh.atms.web.mcnmodel.dto.McnModelBatchResult;
import kr.co.nh.atms.web.mcnmodel.dto.McnModelSearchDto;
import kr.co.nh.atms.web.mcnmodel.mapper.McnModelMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 기기모델코드 견본(sample.mcnModel, TB_CO_MODEL) — "표 직접 편집·일괄 저장형". API 계약 §5, 설계 §8.4.
 * <ul>
 *   <li>키 = 업체코드 + 기기구분 + 모델코드(각 VARCHAR2(2)). 비었거나 2자 초과면 400 VAL_001(필드명), 모델명 80바이트 초과도 VAL_001(modelNm)</li>
 *   <li>일괄 저장 권한: 추가 REG · 수정 UPD · 삭제 DEL — 들어온 종류만 {@link MenuAuthService#check} (없으면 403 SYS_403)</li>
 *   <li>처리 순서 삭제 → 수정 → 추가, 한 트랜잭션. 없음 404 MDL_001, 중복(본문 안 또는 DB) 400 MDL_002 — 인자 '업체-기기구분-모델'</li>
 *   <li>수정은 모델명만(키 3개는 수정 불가). 삭제는 물리 삭제, "사용 중" 검사는 McnModelRules.deletable(잠정 Q-06)</li>
 * </ul>
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class McnModelService {

    /** 화면키(screens/screenIds.ts) — 권한 검사의 메뉴 경로 원천 */
    public static final String SCREEN = "sample.mcnModel";

    private final McnModelMapper mapper;
    private final MenuAuthService menuAuth;
    private final String vendorCodeTypeSetting;

    public McnModelService(McnModelMapper mapper,
                           MenuAuthService menuAuth,
                           @Value("${atms.lookup.vendor-code-type:}") String vendorCodeTypeSetting) {
        this.mapper = mapper;
        this.menuAuth = menuAuth;
        this.vendorCodeTypeSetting = vendorCodeTypeSetting;
    }

    /** 목록 전체(페이징 없음). 빈 조건은 빠진다 */
    public List<McnModel> list(McnModelSearchDto s) {
        s.setVendCode(trimToNull(s.getVendCode()));
        s.setMcnType(trimToNull(s.getMcnType()));
        s.setQ(trimToNull(s.getQ()));
        return mapper.selectList(s, LookupRules.vendorCodeType(vendorCodeTypeSetting));
    }

    /** 일괄 저장 — 권한(있는 종류만) → 입력 검사 → 삭제 → 수정 → 추가 */
    @Transactional
    public McnModelBatchResult saveBatch(BatchChanges<McnModel> ch) {
        List<McnModel> added = nz(ch.getAdded());
        List<McnModel> updated = nz(ch.getUpdated());
        List<McnModel> deleted = nz(ch.getDeleted());

        if (!added.isEmpty()) menuAuth.check(SCREEN, Perm.REG);
        if (!updated.isEmpty()) menuAuth.check(SCREEN, Perm.UPD);
        if (!deleted.isEmpty()) menuAuth.check(SCREEN, Perm.DEL);

        added.forEach(r -> clean(r, true));
        updated.forEach(r -> clean(r, true));
        deleted.forEach(r -> clean(r, false));
        Set<String> seen = new HashSet<>();
        for (McnModel r : added) {
            if (!seen.add(keyText(r))) throw new BusinessException("MDL_002", keyText(r));
        }

        for (McnModel r : deleted) {
            if (!McnModelRules.deletable(r) || mapper.delete(r) == 0) throw new NotFoundException("MDL_001", keyText(r));
        }
        for (McnModel r : updated) {
            if (mapper.updateName(r) == 0) throw new NotFoundException("MDL_001", keyText(r));
        }
        for (McnModel r : added) {
            if (mapper.countByKey(r) > 0) throw new BusinessException("MDL_002", keyText(r));
            try {
                mapper.insert(r);
            } catch (DuplicateKeyException e) {
                // 동시 등록으로 세는 시점과 넣는 시점 사이에 같은 키가 생긴 경우 — 500 대신 계약대로 400
                throw new BusinessException("MDL_002", keyText(r));
            }
        }
        log.info("[기기모델] 일괄 저장 추가 {} 수정 {} 삭제 {} user={}", added.size(), updated.size(), deleted.size(), CurrentUser.id());
        return new McnModelBatchResult(added.size(), updated.size(), deleted.size());
    }

    /** 오류 문구 인자 '업체-기기구분-모델' (예 01-01-A1) */
    static String keyText(McnModel r) {
        return r.getVendCode() + "-" + r.getMcnType() + "-" + r.getModelCode();
    }

    /** 키 3개 필수·2자 이내, 모델명은 앞뒤 공백 제거(빈 값 NULL)·80바이트 이내. 기기사명은 저장하지 않으므로 지운다 */
    private static void clean(McnModel r, boolean withName) {
        if (r == null) throw new BusinessException("VAL_001", "row");
        r.setVendCode(key(r.getVendCode(), "vendCode"));
        r.setMcnType(key(r.getMcnType(), "mcnType"));
        r.setModelCode(key(r.getModelCode(), "modelCode"));
        r.setVendNm(null);
        if (withName) {
            String nm = trimToNull(r.getModelNm());
            if (DbBytes.over(nm, McnModelRules.MODEL_NM_MAX_BYTES)) throw new BusinessException("VAL_001", "modelNm");
            r.setModelNm(nm);
        }
    }

    private static String key(String v, String field) {
        String t = trimToNull(v);
        if (t == null || t.length() > McnModelRules.KEY_MAX_LEN) throw new BusinessException("VAL_001", field);
        return t;
    }

    private static <T> List<T> nz(List<T> l) {
        return l == null ? List.of() : l;
    }

    private static String trimToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
