package kr.co.nh.atms.web.mcnmodel.service;

import kr.co.nh.atms.web.mcnmodel.dto.McnModel;

/**
 * 기기모델코드 견본 규칙 모음 — 잠정 규칙은 메서드 하나씩(정본·현업 답이 오면 여기만 고친다).
 */
public final class McnModelRules {
    private McnModelRules() {}

    /** 키 3개 최대 길이 — VEND_CODE·MCN_TYPE·MODEL_CODE VARCHAR2(2) */
    public static final int KEY_MAX_LEN = 2;

    /** 모델명 최대 바이트 — MODEL_NM VARCHAR2(80), 바이트 계산은 공통 DbBytes(잠정 Q-07) */
    public static final int MODEL_NM_MAX_BYTES = 80;

    /**
     * 삭제해도 되는 모델인가("사용 중" 검사).
     * <p>
     * <b>잠정 Q-06</b>: TO-BE 정본 TB_MCN_INFO 에 모델 컬럼이 없어 "기기에서 쓰는 모델" 을 찾을 근거가 없다 → 검사하지 않고 항상 true.
     * 현업 답이 오면 여기서 매퍼 조회로 바꾸고, false 면 서비스가 오류를 낸다(물리 FK 없음, 21지침 §6).
     */
    public static boolean deletable(McnModel key) {
        return key != null;
    }
}
