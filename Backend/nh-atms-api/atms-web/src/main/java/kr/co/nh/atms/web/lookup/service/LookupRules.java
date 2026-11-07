package kr.co.nh.atms.web.lookup.service;

import kr.co.nh.atms.web.common.Dates;

/**
 * 공통 조회의 잠정 규칙 모음(정본·현업 답이 없어 임시로 정한 것 — 답이 오면 여기만 고친다).
 */
public final class LookupRules {
    private LookupRules() {}

    /** 인원 조회 최대 건수(SQL 의 FETCH FIRST 200 ROWS ONLY 와 같은 값) */
    public static final int MAX_PERSONS = 200;

    /** 휴일 조회 최대 기간(일, 양끝 포함) */
    public static final int MAX_HOLIDAY_DAYS = 366;

    /**
     * 인원 조회의 퇴직 기준일(YYYYMMDD).
     * <p>
     * <b>잠정 (API 계약 §2 인원 규칙)</b>: 사무소 종속은 {@code TRIM(TB_INSA.SAMUSO) = 사무소코드}(인사 사무소 = 사무소코드로 봄),
     * 퇴직자 제외는 {@code RETIRE_DATE} 가 비었거나 앞 8자리가 오늘보다 뒤. SQL 은 mapper/lookup/LookupMapper.xml selectPersons.
     */
    public static String personRetireCutoff() {
        return Dates.today();
    }

    /**
     * 기기사 이름 원천 코드구분. 비어 있으면 null → TB_CO_MODEL·TB_MCN_INFO 의 VEND_CODE 값만(이름 null).
     * <p>
     * <b>잠정 (Q6)</b>: TO-BE 정본에 업체명 마스터가 없다. 설정 {@code atms.lookup.vendor-code-type} 에 TB_CO_CODE 의
     * CODE_TYPE 을 넣으면 {@code CODE → vendCode, CODE_NM → vendNm} 으로 읽는다. 현업 확인 대기.
     */
    public static String vendorCodeType(String setting) {
        if (setting == null) return null;
        String v = setting.trim();
        return v.isEmpty() ? null : v;
    }
}
