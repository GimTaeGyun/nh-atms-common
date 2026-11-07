package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.exception.BusinessException;
import org.springframework.util.StringUtils;

/**
 * 사무소코드(요청 파라미터 {@code ofcCode}) 정리 — TO-BE 컬럼 {@code OFC_CODE CHAR(6)}
 * (TB_OFC_REG_MGT PK, TB_MCN_INFO·TB_SCRT_INST_PST·TB_SCR_AUTH 등). 설계 §5.7.
 * <ul>
 *   <li>앞뒤 공백 제거 → 숫자 1~6자리면 왼쪽을 '0' 으로 채워 6자리({@code "80"} → {@code "000080"})</li>
 *   <li>숫자가 아니거나 7자리 이상이면 400 {@code VAL_003}(파라미터 형식 오류, 인자 {@code ofcCode})</li>
 *   <li>SQL 은 정리된 6자리 값을 {@code OFC_CODE = CAST(#{ofcCode} AS CHAR(6))} 로 비교한다(21지침 §5)</li>
 * </ul>
 * 프론트 사무소 입력칸(OfficeSelector)도 같은 규칙으로 앞자리 '0' 을 채운다.
 */
public final class OfficeCode {
    private OfficeCode() {}

    /** OFC_CODE CHAR(6) */
    public static final int LENGTH = 6;

    /** 요청값 정리. 비어 있으면 null, 숫자 1~6자리면 6자리로 채움, 그 밖은 400 VAL_003. */
    public static String norm(String ofcCode) {
        if (!StringUtils.hasText(ofcCode)) return null;
        String v = ofcCode.trim();
        if (v.length() > LENGTH || !isDigits(v)) throw new BusinessException("VAL_003", "ofcCode");
        return v.length() == LENGTH ? v : "0".repeat(LENGTH - v.length()) + v;
    }

    /** 필수 파라미터 검증(사무소 없이 전체 조회를 막는다 — 부하·노출 방지). 비어 있으면 400 V001_20. */
    public static String require(String ofcCode) {
        String v = norm(ofcCode);
        if (v == null) throw new BusinessException("V001_20");
        return v;
    }

    private static boolean isDigits(String v) {
        for (int i = 0; i < v.length(); i++) {
            char c = v.charAt(i);
            if (c < '0' || c > '9') return false;
        }
        return true;
    }
}
