package kr.co.nh.atms.common.exception;

import kr.co.nh.atms.common.message.ApiMessages;
import kr.co.nh.atms.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 공통 예외 → 응답. 문구는 모두 응답코드 테이블(T_API_MESSAGE)에서 찾는다.
 * <ul>
 *   <li>업무 예외(BusinessException) → 400 + 예외의 응답코드</li>
 *   <li>입력값 검증(@Valid·필수 파라미터·형식) → 400 VAL_001~VAL_004</li>
 *   <li>권한 없음 → 403 SYS_403 (이 저장소는 로그인이 없다 — 고정 사용자, 설계 §5.3)</li>
 *   <li>없는 주소 → 404 SYS_404, 허용 안 된 메서드 → 405 SYS_405, 그 밖의 오류 → 500 SYS_500</li>
 * </ul>
 * atms-web 의 ExceptionAdvice(404/401/403 전용 예외)가 이보다 먼저 적용된다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        log.warn("BusinessException: [{}] {}", e.getCode(), e.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.fail(e));
    }

    /** @Valid 실패(@RequestBody 는 MethodArgumentNotValidException — BindException 의 하위 클래스, @ModelAttribute 는 BindException) */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiResponse<Void>> handleBind(BindException e) {
        FieldError fe = e.getBindingResult().getFieldError();
        return ResponseEntity.badRequest().body(fieldError(fe));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(MissingServletRequestParameterException e) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("VAL_002", e.getParameterName()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("VAL_003", e.getName()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException e) {
        log.warn("요청 본문 해석 실패: {}", e.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.fail("VAL_004"));
    }

    /** 메서드 보안(@PreAuthorize) 거부 — Exception 핸들러가 500 으로 삼키지 않도록 403 으로 내려준다 */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException e) {
        log.warn("접근 거부: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.fail("SYS_403"));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResource(NoResourceFoundException e) {
        log.warn("없는 주소: {}", e.getResourcePath());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("SYS_404"));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethod(HttpRequestMethodNotSupportedException e) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(ApiResponse.fail("SYS_405", e.getMethod()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("시스템 오류: ", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.fail("SYS_500"));
    }

    /**
     * 검증 어노테이션의 message 에는 응답코드를 쓴다(예: {@code @NotBlank(message = 응답코드)} — 코드는 api-messages.tsv 에 먼저 추가).
     * 코드가 아니면(어노테이션 기본 문구) VAL_001 "입력값이 올바르지 않습니다: {필드}" 로 내려준다.
     */
    static ApiResponse<Void> fieldError(FieldError fe) {
        if (fe == null) return ApiResponse.fail("VAL_001", "-");
        String m = fe.getDefaultMessage();
        if (ApiMessages.contains(m)) return ApiResponse.fail(m);
        return ApiResponse.fail("VAL_001", fe.getField());
    }
}
