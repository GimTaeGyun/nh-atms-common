package kr.co.nh.atms.web.notice.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 공지 다건 삭제 결과 — API 계약 §3 {@code { count: number }} (실제로 지운 건수) */
@Getter
@AllArgsConstructor
public class NoticeDeleteResult {
    private int count;
}
