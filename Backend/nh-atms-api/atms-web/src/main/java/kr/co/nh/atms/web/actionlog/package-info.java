/**
 * 사용자 행위 이력 — 누가·언제·어느 화면에서·조회/등록/수정/삭제/엑셀을·어떤 인자로 했는지.
 * {@code aspect.UserActionLogAspect} 가 모든 컨트롤러 호출을 T_USER_ACTION_LOG 에 자동 기록한다(테이블이 없거나 실패해도 요청은 정상 처리).
 * [원본] nh-atms web/actionlog — 사용자 ID 는 고정 사용자 개인번호, 관리자 조회 API 는 뺐다(설계 §13 Q7).
 */
package kr.co.nh.atms.web.actionlog;
