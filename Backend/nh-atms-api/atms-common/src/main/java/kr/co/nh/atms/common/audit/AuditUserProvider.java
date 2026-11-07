package kr.co.nh.atms.common.audit;

/**
 * 감사 컬럼 개인번호(CRT_CMENO·LS_CMENO) 원천. atms-web 이 현재 사용자 개인번호로 구현한다(CurrentUser.perNo()).
 */
public interface AuditUserProvider {

    /**
     * 사람이 없는 처리(기동 시 적재·배치 등)와 사용자를 알 수 없을 때 쓰는 개인번호.
     * <p>
     * <b>잠정 (H-071)</b>: 사람 없는 적재의 CRT_CMENO·LS_CMENO 값은 현업 답 대기. 답이 오면 이 상수 한 곳만 바꾼다.
     * VARCHAR2(9) 안에 들어가야 한다.
     */
    String SYSTEM_ID = "SYSTEM";

    /** 현재 사용자 개인번호. 모르면 {@link #SYSTEM_ID} */
    String currentUserId();
}
