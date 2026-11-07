package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.exception.BusinessException;

/** "권한/승인 없음" — HTTP 403 (예: 화면 권한 부족 SYS_403 — MenuAuthService). */
public class ForbiddenException extends BusinessException {
    public ForbiddenException(String code, Object... args) {
        super(code, args);
    }
}
