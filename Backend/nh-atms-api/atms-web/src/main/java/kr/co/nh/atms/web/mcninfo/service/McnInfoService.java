package kr.co.nh.atms.web.mcninfo.service;

import kr.co.nh.atms.common.exception.BusinessException;
import kr.co.nh.atms.common.page.PageResult;
import kr.co.nh.atms.web.common.CurrentUser;
import kr.co.nh.atms.web.common.NotFoundException;
import kr.co.nh.atms.web.common.OfficeCode;
import kr.co.nh.atms.web.lookup.service.LookupRules;
import kr.co.nh.atms.web.mcninfo.dto.McnInfo;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoKey;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoSave;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoSearchDto;
import kr.co.nh.atms.web.mcninfo.mapper.McnInfoMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

/**
 * 기기정보 견본(sample.mcnInfo, TB_MCN_INFO) — "목록/편집 탭형" CRUD. API 계약 §4, 설계 §8.3.
 * <ul>
 *   <li>키 = 사무소코드(OfficeCode 규칙, 6자리) + 기번(숫자 3자리). 형식이 틀리면 400 VAL_003(ofcCode·mcnNo)</li>
 *   <li>없음 404 MCN_001({0}=사무소코드, {1}=기번), 등록 중복 400 MCN_002(같은 인자)</li>
 *   <li>삭제는 논리 삭제(USE_YN='N', 설계 Q11)</li>
 *   <li>기기사명 원천은 공통 조회와 같은 잠정 규칙(LookupRules.vendorCodeType, 설정 atms.lookup.vendor-code-type)</li>
 * </ul>
 * 화면 권한(REG·UPD·DEL)은 컨트롤러의 @RequireMenuAuth 가 검사한다.
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class McnInfoService {

    private static final Pattern MCN_NO = Pattern.compile("\\d{3}");

    private final McnInfoMapper mapper;
    private final String vendorCodeTypeSetting;

    public McnInfoService(McnInfoMapper mapper,
                          @Value("${atms.lookup.vendor-code-type:}") String vendorCodeTypeSetting) {
        this.mapper = mapper;
        this.vendorCodeTypeSetting = vendorCodeTypeSetting;
    }

    /** 목록(페이징). 사무소 필수(V001_20), 기번·사용여부 형식 오류는 VAL_003 */
    public PageResult<McnInfo> list(McnInfoSearchDto s) {
        s.setOfcCode(OfficeCode.require(s.getOfcCode()));
        String mcnNo = trimToNull(s.getMcnNo());
        s.setMcnNo(mcnNo == null ? null : mcnNo(mcnNo));
        s.setVendCode(trimToNull(s.getVendCode()));
        s.setKomType(trimToNull(s.getKomType()));
        s.setOpType(trimToNull(s.getOpType()));
        s.setInoutType(trimToNull(s.getInoutType()));
        s.setUseYn(ynOrNull(s.getUseYn()));
        long total = mapper.countList(s);
        List<McnInfo> rows = total == 0 ? List.of() : mapper.selectList(s, vendorCodeType());
        return PageResult.of(rows, total, s);
    }

    /** 1건. 없으면 404 MCN_001 */
    public McnInfo get(String ofcCode, String mcnNo) {
        String o = OfficeCode.require(ofcCode);
        String m = mcnNo(mcnNo);
        McnInfo row = mapper.selectOne(o, m, vendorCodeType());
        if (row == null) throw new NotFoundException("MCN_001", o, m);
        return row;
    }

    /** 등록. 같은 키가 있으면 400 MCN_002 */
    @Transactional
    public McnInfo create(McnInfoSave d) {
        String o = OfficeCode.require(d.getOfcCode());
        String m = mcnNo(d.getMcnNo());
        if (mapper.countByKey(o, m) > 0) throw new BusinessException("MCN_002", o, m);
        clean(d, o, m);
        try {
            mapper.insert(d);
        } catch (DuplicateKeyException e) {
            // 먼저 센 뒤 넣는 사이에 다른 사람이 같은 키를 넣은 경우(동시 등록) — 500 대신 계약대로 400
            throw new BusinessException("MCN_002", o, m);
        }
        log.info("[기기정보] 등록 {}-{} user={}", o, m, CurrentUser.id());
        return get(o, m);
    }

    /** 수정(본문 키 무시, 경로 키 사용). 없으면 404 MCN_001 */
    @Transactional
    public McnInfo update(String ofcCode, String mcnNo, McnInfoSave d) {
        String o = OfficeCode.require(ofcCode);
        String m = mcnNo(mcnNo);
        clean(d, o, m);
        if (mapper.update(d) == 0) throw new NotFoundException("MCN_001", o, m);
        log.info("[기기정보] 수정 {}-{} user={}", o, m, CurrentUser.id());
        return get(o, m);
    }

    /** 논리 삭제(USE_YN='N'). 없으면 404 MCN_001 */
    @Transactional
    public void delete(String ofcCode, String mcnNo) {
        String o = OfficeCode.require(ofcCode);
        String m = mcnNo(mcnNo);
        if (mapper.softDelete(new McnInfoKey(o, m)) == 0) throw new NotFoundException("MCN_001", o, m);
        log.info("[기기정보] 삭제(USE_YN=N) {}-{} user={}", o, m, CurrentUser.id());
    }

    /** 기기사명 원천 코드구분(잠정 Q-01 — 공통 조회와 같은 규칙 한 곳) */
    private String vendorCodeType() {
        return LookupRules.vendorCodeType(vendorCodeTypeSetting);
    }

    /** 키를 확정하고 선택 항목의 앞뒤 공백 제거(빈 값은 NULL 로 저장) */
    private static void clean(McnInfoSave d, String ofcCode, String mcnNo) {
        d.setOfcCode(ofcCode);
        d.setMcnNo(mcnNo);
        d.setInstPstCode(trimToNull(d.getInstPstCode()));
        d.setSrc(trimToNull(d.getSrc()));
        d.setKomType(trimToNull(d.getKomType()));
        d.setVendCode(trimToNull(d.getVendCode()));
        d.setOpType(trimToNull(d.getOpType()));
        d.setInoutType(trimToNull(d.getInoutType()));
        d.setCnrPstSpecCode(trimToNull(d.getCnrPstSpecCode()));
    }

    /** 기번 MCN_NO CHAR(3): 숫자 3자리가 아니면 400 VAL_003(mcnNo) */
    private static String mcnNo(String v) {
        String t = v == null ? "" : v.trim();
        if (!MCN_NO.matcher(t).matches()) throw new BusinessException("VAL_003", "mcnNo");
        return t;
    }

    /** 사용여부 조건: 비면 null(전체), Y·N 이 아니면 400 VAL_003(useYn) */
    private static String ynOrNull(String v) {
        String t = trimToNull(v);
        if (t == null) return null;
        if (!"Y".equals(t) && !"N".equals(t)) throw new BusinessException("VAL_003", "useYn");
        return t;
    }

    private static String trimToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
