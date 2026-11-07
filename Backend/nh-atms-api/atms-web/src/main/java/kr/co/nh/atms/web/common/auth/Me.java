package kr.co.nh.atms.web.common.auth;

/**
 * {@code GET /api/me} 응답 — API 계약(docs/07_API_계약.md §1) {@code Me} 와 필드 이름·타입이 같아야 한다.
 */
public record Me(String perNo, String name, String samuso, String samusoName,
                 String deptCode, String ofcCode, String kanm, String auth, String adminYn) {

    public static Me of(LoginUser u) {
        return new Me(u.perNo(), u.name(), u.samuso(), u.samusoName(),
                u.deptCode(), u.ofcCode(), u.kanm(), u.auth(), u.isAdmin() ? "Y" : "N");
    }
}
