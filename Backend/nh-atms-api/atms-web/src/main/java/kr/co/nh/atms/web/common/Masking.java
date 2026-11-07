package kr.co.nh.atms.web.common;

/**
 * 개인정보 마스킹(프론트는 마스킹된 값을 받는다 — 04 문서 §4). 열람사유 등록 후 원문 해제는 각 /unmask API 가 담당.
 * 규칙은 잠정(현업 확정 전): 계좌 뒤 4자리 노출, 카드 앞6·뒤4 노출, 이름 두 번째 글자 마스킹, 전화 가운데 마스킹.
 */
public final class Masking {
    private Masking() {}

    public static String account(String v) {
        if (v == null) return null;
        String s = v.trim();
        if (s.length() <= 4) return s;
        return "*".repeat(s.length() - 4) + s.substring(s.length() - 4);
    }

    public static String card(String v) {
        if (v == null) return null;
        String s = v.trim();
        if (s.length() <= 10) return account(s);
        return s.substring(0, 6) + "*".repeat(s.length() - 10) + s.substring(s.length() - 4);
    }

    public static String name(String v) {
        if (v == null) return null;
        String s = v.trim();
        if (s.length() < 2) return s;
        if (s.length() == 2) return s.charAt(0) + "*";
        return s.charAt(0) + "*".repeat(s.length() - 2) + s.charAt(s.length() - 1);
    }

    public static String phone(String v) {
        if (v == null) return null;
        String s = v.trim();
        if (s.length() < 7) return s;
        return s.substring(0, 3) + "*".repeat(s.length() - 7) + s.substring(s.length() - 4);
    }

    /** 주민/개인번호: 앞 6자리만 노출 */
    public static String personNo(String v) {
        if (v == null) return null;
        String s = v.trim();
        if (s.length() <= 6) return s;
        return s.substring(0, 6) + "*".repeat(s.length() - 6);
    }
}
