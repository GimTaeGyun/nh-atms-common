package kr.co.nh.atms.web.common;

/** 'Y'/'N' ↔ boolean, CHAR 플래그 해석 */
public final class Yn {
    private Yn() {}
    public static boolean is(String v) { return v != null && ("Y".equalsIgnoreCase(v.trim()) || "1".equals(v.trim())); }
    public static String of(boolean b) { return b ? "Y" : "N"; }
    public static String of(Boolean b) { return Boolean.TRUE.equals(b) ? "Y" : "N"; }
    /** 공백 패딩 제거, null 안전 */
    public static String trim(String v) { return v == null ? null : v.trim(); }
    public static String nvl(String v, String def) { String t = trim(v); return (t == null || t.isEmpty()) ? def : t; }
}
