package kr.co.nh.atms.web.common;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 프론트 날짜·시각 형식 변환. 프론트 계약: 날짜 YYYYMMDD(Ymd), 시각 HHmmss(Hms), 월 YYYYMM, 일시 14자리,
 * 운영시간 'HH:mm', asOf 'yyyy-MM-dd HH:mm:ss'. DB: JNL_DATE CHAR(8), JNL_TIME CHAR(10)(HHmmssSSS+구분), ENTER_DATE CHAR(14).
 */
public final class Dates {
    private Dates() {}

    public static final DateTimeFormatter YMD = DateTimeFormatter.ofPattern("yyyyMMdd");
    public static final DateTimeFormatter HMS = DateTimeFormatter.ofPattern("HHmmss");
    public static final DateTimeFormatter YM = DateTimeFormatter.ofPattern("yyyyMM");
    public static final DateTimeFormatter DT14 = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    public static final DateTimeFormatter AS_OF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static String today() { return LocalDate.now().format(YMD); }
    public static String nowHms() { return LocalDateTime.now().format(HMS); }
    public static String now14() { return LocalDateTime.now().format(DT14); }
    public static String thisMonth() { return LocalDate.now().format(YM); }
    /** 'yyyy-MM-dd HH:mm:ss' — 조회 시각 표시(asOf) */
    public static String asOf() { return LocalDateTime.now().format(AS_OF); }
    /** 'yyyy-MM-dd' */
    public static String asOfDate() { return LocalDate.now().toString(); }

    /** 비어 있으면 오늘(YYYYMMDD) */
    public static String orToday(String ymd) { return isBlank(ymd) ? today() : ymd.trim(); }

    /** CHAR(10) 'HHmmssSSSx' 또는 'HHmmss' → 'HHmmss' */
    public static String hms6(String jnlTime) {
        if (jnlTime == null) return "";
        String s = jnlTime.trim();
        return s.length() > 6 ? s.substring(0, 6) : s;
    }

    /** 'HHmm' → 'HH:mm' (CHAR(4) 운영시간) */
    public static String hhmm(String v) {
        if (v == null) return "";
        String s = v.trim();
        return s.length() >= 4 ? s.substring(0, 2) + ":" + s.substring(2, 4) : s;
    }

    /** 'HH:mm' → 'HHmm' */
    public static String toHhmm(String v) {
        if (v == null) return null;
        String s = v.trim().replace(":", "");
        return s.isEmpty() ? null : s;
    }

    /** 14자리 'yyyyMMddHHmmss' → 'YYYYMMDD' (8자리 이상이면 앞 8자리) */
    public static String ymdOf14(String dt14) {
        if (dt14 == null) return "";
        String s = dt14.trim();
        return s.length() >= 8 ? s.substring(0, 8) : s;
    }

    /** 14자리 → 'HHmmss' */
    public static String hmsOf14(String dt14) {
        if (dt14 == null) return "";
        String s = dt14.trim();
        return s.length() >= 14 ? s.substring(8, 14) : "";
    }

    /** 'YYYYMMDD' + 'HHmmss' → 'yyyy-MM-dd HH:mm' (대시보드 최근 장애 time 형식) */
    public static String dash16(String ymd, String hms) {
        if (isBlank(ymd) || ymd.trim().length() < 8) return "";
        String d = ymd.trim();
        String out = d.substring(0, 4) + "-" + d.substring(4, 6) + "-" + d.substring(6, 8);
        String t = hms6(hms);
        if (t.length() >= 4) out += " " + t.substring(0, 2) + ":" + t.substring(2, 4);
        return out;
    }

    /** 'YYYYMMDD' → 'yyyy-MM-dd' */
    public static String dash10(String ymd) {
        if (isBlank(ymd) || ymd.trim().length() < 8) return ymd == null ? "" : ymd;
        String d = ymd.trim();
        return d.substring(0, 4) + "-" + d.substring(4, 6) + "-" + d.substring(6, 8);
    }

    /** 일자 범위 일수(양끝 포함). 형식 오류면 -1 */
    public static long daysBetween(String fromYmd, String toYmd) {
        try {
            return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.parse(fromYmd.trim(), YMD), LocalDate.parse(toYmd.trim(), YMD)) + 1;
        } catch (Exception e) {
            return -1;
        }
    }

    public static LocalDate parseYmd(String ymd) { return LocalDate.parse(ymd.trim(), YMD); }

    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
}
