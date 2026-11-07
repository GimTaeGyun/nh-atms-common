package kr.co.nh.atms.web.notice.service;

import kr.co.nh.atms.web.notice.mapper.NoticeMapper;

/**
 * 공지사항 견본 규칙 모음 — 잠정 규칙은 메서드 하나씩(정본·현업 답이 오면 여기만 고친다).
 */
public final class NoticeRules {
    private NoticeRules() {}

    /** 제목 최대 바이트 — SUBJECT VARCHAR2(200), 바이트 계산은 공통 DbBytes(잠정 Q-07) */
    public static final int SUBJECT_MAX_BYTES = 200;

    /** 내용 최대 바이트 — TEXT VARCHAR2(4000) */
    public static final int TEXT_MAX_BYTES = 4000;

    /** 한 번에 지울 수 있는 최대 건수(API 계약 §3, 1~100건) */
    public static final int MAX_DELETE = 100;

    /** 작성일 기간 최대 일수(양끝 포함, 설계 §8.2 "최대 1년") */
    public static final int MAX_SEARCH_DAYS = 366;

    /**
     * 다음 공지 번호.
     * <p>
     * <b>잠정 Q-02</b>: TO-BE 정본 TB_NOTICE 에 시퀀스가 없어 원본 선례대로 {@code NVL(MAX(NO),0)+1}
     * (매퍼 {@code selectNextNo}). 동시에 등록하면 같은 번호가 나와 PK 충돌이 날 수 있다 →
     * NoticeService 가 DuplicateKeyException 이면 한 번만 다시 번호를 받아 넣는다. 채번 규칙은 현업 확인 대기.
     */
    public static long nextNo(NoticeMapper mapper) {
        return mapper.selectNextNo();
    }
}
