package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.exception.BusinessException;

/** 프론트 "없음" — HTTP 404 로 내려준다(프론트 목 계약: 404 → notFound). 기존 BusinessException 은 400. 문구는 응답코드 테이블. */
public class NotFoundException extends BusinessException {
    public NotFoundException(String code, Object... args) {
        super(code, args);
    }
}
