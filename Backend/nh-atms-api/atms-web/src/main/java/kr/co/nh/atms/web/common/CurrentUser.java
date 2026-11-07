package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.audit.AuditUserProvider;
import kr.co.nh.atms.web.common.auth.LoginUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 현재 사용자 — 로그인 없는 고정 사용자(설계 §5.3). principal 은 {@link LoginUser}(FixedUserFilter 가 채움).
 * 사용자가 없으면(기동 시 처리·배치 등) {@code id()}/{@code perNo()} 는 "SYSTEM"({@link AuditUserProvider#SYSTEM_ID}).
 * [원본] nh-atms web/common/CurrentUser — principal 이 JWT userId 에서 LoginUser 로 바뀌었다. {@code id()} 는 개인번호를 돌려준다.
 */
public final class CurrentUser {
    private CurrentUser() {}

    /** 현재 사용자(없으면 null) */
    public static LoginUser get() {
        try {
            Authentication a = SecurityContextHolder.getContext().getAuthentication();
            return (a != null && a.getPrincipal() instanceof LoginUser u) ? u : null;
        } catch (Exception e) {
            return null;
        }
    }

    /** 사용자 식별자 = 개인번호. 없으면 "SYSTEM" (원본 호출부 호환용 이름) */
    public static String id() {
        return perNo();
    }

    /** 개인번호(TB_INSA.PER_NO). 없으면 "SYSTEM" — 감사 컬럼 CRT_CMENO·LS_CMENO 에 들어간다 */
    public static String perNo() {
        LoginUser u = get();
        return (u == null || u.perNo() == null || u.perNo().isBlank()) ? AuditUserProvider.SYSTEM_ID : u.perNo();
    }

    /** 성명(TB_INSA.NAME). 없으면 null */
    public static String name() {
        LoginUser u = get();
        return u == null ? null : u.name();
    }

    /** 권한 사무소코드(TB_SCR_AUTH.OFC_CODE, 6자리). 없으면 null */
    public static String ofcCode() {
        LoginUser u = get();
        return u == null ? null : u.ofcCode();
    }

    /** 권한코드(TB_SCR_AUTH.AUTH). 없으면 null */
    public static String auth() {
        LoginUser u = get();
        return u == null ? null : u.auth();
    }

    public static boolean isAdmin() {
        LoginUser u = get();
        return u != null && "Y".equals(u.adminYn());
    }
}
