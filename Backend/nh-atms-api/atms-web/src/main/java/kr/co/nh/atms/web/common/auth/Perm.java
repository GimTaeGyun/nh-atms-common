package kr.co.nh.atms.web.common.auth;

/**
 * 화면 권한 5종 — TB_SCR_AUTH_MENU 의 {@code QRY_ROL_YN·REG_ROL_YN·UPD_ROL_YN·DEL_ROL_YN·EXE_ROL_YN} (H-026 확정: 화면 단위, 버튼은 로직).
 * 버튼별 필요 권한(설계 §5.5): 조회·엑셀·인쇄 QRY, 등록 REG, 수정·저장 UPD, 삭제 DEL, 명령 실행 EXE.
 */
public enum Perm {
    /** 조회 */
    QRY,
    /** 등록 */
    REG,
    /** 수정 */
    UPD,
    /** 삭제 */
    DEL,
    /** 업무실행 */
    EXE
}
