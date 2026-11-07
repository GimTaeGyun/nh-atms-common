package kr.co.nh.atms.common.exception;

import kr.co.nh.atms.common.message.ApiMessages;
import lombok.Getter;

/**
 * 비즈니스 예외 — 응답코드와 문구 인자만 넘긴다. 문구는 응답코드 테이블(T_API_MESSAGE)에서 찾는다.
 * <pre>throw new BusinessException("USR_001");             // 사용자를 찾을 수 없습니다.
 * throw new BusinessException("BATCH_NOT_FOUND", jobId);  // 배치잡을 찾을 수 없습니다: {0}</pre>
 * GlobalExceptionHandler 가 HTTP 400 으로 내려준다.
 */
@Getter
public class BusinessException extends RuntimeException {
    private final String code;
    private final transient Object[] args;

    public BusinessException(String code, Object... args) {
        super(code);
        this.code = code;
        this.args = args == null ? new Object[0] : args.clone();
    }

    /** 응답코드 테이블에서 찾은 사용자 문구 */
    @Override
    public String getMessage() {
        return ApiMessages.text(code, args);
    }
}
