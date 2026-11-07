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
     * <p>
     * DB 시드(db/seed/*.sql)는 감사 개인번호로 이 값이 아니라 {@code 'NHCOMMON'} 을 쓴다 — 일부러 다르게 둔 것이다.
     * {@code NHCOMMON} = "시드 스크립트가 넣은 행" 표시(99_cleanup_samples.sql 이 이것으로 골라 지움),
     * {@code SYSTEM} = "앱이 사람 없이 쓴 행". 둘 다 H-071 답이 오면 함께 정리한다(db/seed/README.md "감사 개인번호").
     */
    String SYSTEM_ID = "SYSTEM";

    /** 현재 사용자 개인번호. 모르면 {@link #SYSTEM_ID} */
    String currentUserId();
}
