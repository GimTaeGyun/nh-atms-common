package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.exception.BusinessException;

/** "사용자 확인 실패" — HTTP 401 (예: 고정 사용자 없음 ME_001 — MeController). 프론트는 code 로 구분한다. */
public class UnauthorizedException extends BusinessException {
    public UnauthorizedException(String code, Object... args) {
        super(code, args);
    }
}
