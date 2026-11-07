package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.exception.BusinessException;
import org.springframework.util.StringUtils;

/**
 * 사무소 코드(프론트 officeCd, DB TERM_GROUP_ID) 처리.
 * 결정(2026-10-23·10-24): 사무소 코드는 **6자리**, DB 컬럼은 V1.6.0 으로 CHAR(5)→CHAR(6) 확장.
 * SQL 은 항상 `RTRIM(TERM_GROUP_ID) = #{officeCd}` 로 자리수에 중립이고, 바인딩 전에 여기서 trim 만 한다.
 * 5자리 데이터가 남아 있는 DB 를 임시로 쓸 때는 {@link #toDb} 의 변환을 켠다(설정 atms.office-code.legacy5=true).
 */
public final class OfficeCode {
    private OfficeCode() {}

    public static final int LENGTH = 6;

    /** 요청값 정리. 비어 있으면 null. */
    public static String norm(String officeCd) {
        if (!StringUtils.hasText(officeCd)) return null;
        return officeCd.trim();
    }

    /** 필수 파라미터 검증(사무소 없이 전체 조회를 막는다 — 부하·노출 방지). */
    public static String require(String officeCd) {
        String v = norm(officeCd);
        if (v == null) throw new BusinessException("V001_20");
        return v;
    }

    /** 6자리 → DB 값. 기본은 그대로. legacy5 가 켜지면 앞자리 '0' 하나를 떼어 5자리로. */
    public static String toDb(String officeCd, boolean legacy5) {
        String v = norm(officeCd);
        if (v == null) return null;
        if (legacy5 && v.length() == LENGTH && v.charAt(0) == '0') return v.substring(1);
        return v;
    }

    /** DB 값 → 6자리 응답값(왼쪽 '0' 채움). */
    public static String fromDb(String dbValue) {
        if (dbValue == null) return null;
        String v = dbValue.trim();
        if (v.isEmpty()) return v;
        return v.length() >= LENGTH ? v : "0".repeat(LENGTH - v.length()) + v;
    }
}
