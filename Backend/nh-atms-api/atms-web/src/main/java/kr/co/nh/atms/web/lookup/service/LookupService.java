package kr.co.nh.atms.web.lookup.service;

import kr.co.nh.atms.common.exception.BusinessException;
import kr.co.nh.atms.web.common.Dates;
import kr.co.nh.atms.web.common.NotFoundException;
import kr.co.nh.atms.web.common.OfficeCode;
import kr.co.nh.atms.web.lookup.dto.LookupCode;
import kr.co.nh.atms.web.lookup.dto.LookupCorner;
import kr.co.nh.atms.web.lookup.dto.LookupDistinctValue;
import kr.co.nh.atms.web.lookup.dto.LookupHoliday;
import kr.co.nh.atms.web.lookup.dto.LookupMachine;
import kr.co.nh.atms.web.lookup.dto.LookupModel;
import kr.co.nh.atms.web.lookup.dto.LookupOffice;
import kr.co.nh.atms.web.lookup.dto.LookupPerson;
import kr.co.nh.atms.web.lookup.dto.LookupSido;
import kr.co.nh.atms.web.lookup.dto.LookupSigun;
import kr.co.nh.atms.web.lookup.dto.LookupSrc;
import kr.co.nh.atms.web.lookup.dto.LookupVendor;
import kr.co.nh.atms.web.lookup.mapper.LookupMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * 공통 조회(콤보·팝업 원천) — API 계약 §2. 로그인 사용자면 누구나(화면 권한 검사 없음).
 */
@Service
@Transactional(readOnly = true)
public class LookupService {

    /**
     * 있는 값 목록 허용 목록: target → 매퍼 select(테이블.컬럼은 XML 주석). 여기 없는 target 은 400 LKP_002.
     */
    static final Map<String, Function<LookupMapper, List<LookupDistinctValue>>> DISTINCT = Map.of(
            "mcn-kom-type", LookupMapper::selectDistinctMcnKomType,          // TB_MCN_INFO.KOM_TYPE
            "mcn-op-type", LookupMapper::selectDistinctMcnOpType,            // TB_MCN_INFO.OP_TYPE
            "mcn-inout-type", LookupMapper::selectDistinctMcnInoutType,      // TB_MCN_INFO.INOUT_TYPE
            "mcn-cnr-pst-spec", LookupMapper::selectDistinctMcnCnrPstSpec,   // TB_MCN_INFO.CNR_PST_SPEC_CODE
            "mcn-vend-code", LookupMapper::selectDistinctMcnVendCode,        // TB_MCN_INFO.VEND_CODE
            "model-mcn-type", LookupMapper::selectDistinctModelMcnType       // TB_CO_MODEL.MCN_TYPE
    );

    private final LookupMapper mapper;
    private final String vendorCodeTypeSetting;

    public LookupService(LookupMapper mapper,
                         @Value("${atms.lookup.vendor-code-type:}") String vendorCodeTypeSetting) {
        this.mapper = mapper;
        this.vendorCodeTypeSetting = vendorCodeTypeSetting;
    }

    public List<LookupOffice> offices(String q) {
        return mapper.selectOffices(trimToNull(q));
    }

    public LookupOffice office(String ofcCode) {
        String code = OfficeCode.norm(ofcCode);
        LookupOffice o = code == null ? null : mapper.selectOffice(code);
        if (o == null) throw new NotFoundException("LKP_404", ofcCode);
        return o;
    }

    /** 사무소·검색어 중 하나는 있어야 한다(전체 인사 조회 방지). 최대 {@value LookupRules#MAX_PERSONS}건 */
    public List<LookupPerson> persons(String ofcCode, String q) {
        String o = OfficeCode.norm(ofcCode);
        String k = trimToNull(q);
        if (o == null && k == null) throw new BusinessException("LKP_001");
        return mapper.selectPersons(o, k, LookupRules.personRetireCutoff());
    }

    public LookupPerson person(String perNo) {
        String p = trimToNull(perNo);
        LookupPerson r = p == null ? null : mapper.selectPerson(p);
        if (r == null) throw new NotFoundException("E404");
        return r;
    }

    public List<LookupVendor> vendors() {
        String codeType = LookupRules.vendorCodeType(vendorCodeTypeSetting);
        return codeType != null ? mapper.selectVendorsFromCode(codeType) : mapper.selectVendorsDistinct();
    }

    public List<LookupModel> models(String vendCode, String mcnType) {
        return mapper.selectModels(trimToNull(vendCode), trimToNull(mcnType));
    }

    /** 기종(SRC) 목록 — 기기정보 편집의 기종 콤보 원천 */
    public List<LookupSrc> srcs(String vendCode) {
        return mapper.selectSrcs(trimToNull(vendCode));
    }

    /** 사무소 필수(V001_20) */
    public List<LookupMachine> machines(String ofcCode, String vendCode, String q) {
        return mapper.selectMachines(OfficeCode.require(ofcCode), trimToNull(vendCode), trimToNull(q));
    }

    /** 사무소 필수(V001_20) */
    public List<LookupCorner> corners(String ofcCode) {
        return mapper.selectCorners(OfficeCode.require(ofcCode));
    }

    public List<LookupCode> codes(String codeType) {
        String t = trimToNull(codeType);
        if (t == null) throw new BusinessException("VAL_002", "codeType");
        return mapper.selectCodes(t);
    }

    public List<LookupDistinctValue> distinct(String target) {
        Function<LookupMapper, List<LookupDistinctValue>> f = target == null ? null : DISTINCT.get(target.trim());
        if (f == null) throw new BusinessException("LKP_002", target);
        return f.apply(mapper);
    }

    public List<LookupSido> sido() {
        return mapper.selectSido();
    }

    public List<LookupSigun> sigun(String sidoCode) {
        String s = trimToNull(sidoCode);
        if (s == null) throw new BusinessException("VAL_002", "sidoCode");
        return mapper.selectSigun(s);
    }

    /** from·to: YYYYMMDD, from ≤ to, 최대 {@value LookupRules#MAX_HOLIDAY_DAYS}일 */
    public List<LookupHoliday> holidays(String from, String to) {
        String f = trimToNull(from);
        String t = trimToNull(to);
        if (f == null) throw new BusinessException("VAL_002", "from");
        if (t == null) throw new BusinessException("VAL_002", "to");
        if (!isYmd(f)) throw new BusinessException("VAL_003", "from");
        if (!isYmd(t)) throw new BusinessException("VAL_003", "to");
        long days = Dates.daysBetween(f, t);
        if (days < 1 || days > LookupRules.MAX_HOLIDAY_DAYS) throw new BusinessException("VAL_001", "from~to");
        return mapper.selectHolidays(f, t);
    }

    private static boolean isYmd(String v) {
        if (v.length() != 8) return false;
        try {
            Dates.parseYmd(v);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private static String trimToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
