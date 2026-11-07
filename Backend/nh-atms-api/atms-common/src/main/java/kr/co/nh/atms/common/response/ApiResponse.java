package kr.co.nh.atms.common.response;

import kr.co.nh.atms.common.exception.BusinessException;
import kr.co.nh.atms.common.message.ApiMessages;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 공통 API 응답 포맷 — success / code / message / data 4-필드.
 * <ul>
 *   <li>성공 code 는 항상 {@code "0000"}. message 는 화면에 알릴 말이 있을 때만 응답코드 테이블(T_API_MESSAGE)의 문구, 없으면 null.</li>
 *   <li>실패 code 는 응답코드(예: USR_001), message 는 같은 테이블의 문구.</li>
 *   <li>프론트는 message 를 그대로 보여준다(문구를 직접 만들지 않는다).</li>
 * </ul>
 */
@Getter
@Builder
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private String code;
    private T data;

    /** 성공 — 알릴 문구 없음(조회 등) */
    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .code(ApiMessages.SUCCESS)
                .data(data)
                .build();
    }

    /** 성공 — 응답코드 테이블의 문구를 함께 내려준다(예: S010 "저장되었습니다.") */
    public static <T> ApiResponse<T> ok(T data, String msgCode, Object... args) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(ApiMessages.text(msgCode, args))
                .code(ApiMessages.SUCCESS)
                .data(data)
                .build();
    }

    /** 실패 — 응답코드와 그 문구 */
    public static <T> ApiResponse<T> fail(String code, Object... args) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(ApiMessages.text(code, args))
                .code(code)
                .data(null)
                .build();
    }

    /** 실패 — 업무 예외(코드·인자를 그대로 사용) */
    public static <T> ApiResponse<T> fail(BusinessException e) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(e.getMessage())
                .code(e.getCode())
                .data(null)
                .build();
    }
}
