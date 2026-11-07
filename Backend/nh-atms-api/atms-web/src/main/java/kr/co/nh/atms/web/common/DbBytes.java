package kr.co.nh.atms.web.common;

/**
 * DB 저장 바이트 수 — 입력 길이 검사용 공통 규칙(공지사항·기기모델코드 견본이 함께 쓴다).
 * 프론트 {@code utils/rules.ts} 의 {@code byteLength}·{@code maxBytes} 와 같은 규칙이다.
 */
public final class DbBytes {
    private DbBytes() {}

    /**
     * 글자열을 DB 에 넣을 때의 바이트 수.
     * <p>
     * <b>잠정 Q-07</b>: 은행 DB 문자셋 KO16MSWIN949 에 맞춰 ASCII(U+0000~U+007F)는 1바이트, 그 밖의 글자(한글 등)는 2바이트로 센다.
     * 컬럼 길이가 BYTE 인지 CHAR 인지(VARCHAR2(n BYTE|CHAR)) 정본에 적혀 있지 않아 BYTE 로 가정. 현업 답이 오면 여기만 고친다.
     * 서로게이트 쌍(이모지 등)은 글자 하나로 2바이트(문자셋에 없는 글자는 DB 가 '?' 로 바꿀 수 있다). null 은 0.
     */
    public static int length(String s) {
        if (s == null) return 0;
        int n = 0;
        for (int i = 0; i < s.length(); ) {
            int cp = s.codePointAt(i);
            n += cp < 0x80 ? 1 : 2;
            i += Character.charCount(cp);
        }
        return n;
    }

    /** 바이트 수가 상한을 넘는가(null 은 넘지 않음) */
    public static boolean over(String s, int maxBytes) {
        return length(s) > maxBytes;
    }
}
