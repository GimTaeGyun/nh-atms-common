/**
 * 화면 백엔드 공통 계층. 업무 패키지 {@code web/<업무>/{controller,service,mapper,dto}} 가 함께 쓴다.
 * 응답 봉투·페이징은 atms-common(ApiResponse·PageRequest·PageResult)을, 감사 컬럼은 atms-common audit(AuditFields)을 쓴다.
 * 사용자·권한은 {@code web.common.auth}(고정 사용자 FixedUserFilter, @RequireMenuAuth).
 */
package kr.co.nh.atms.web.common;
