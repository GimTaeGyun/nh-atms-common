package kr.co.nh.atms.web.notice.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/** 공지 다건 삭제 본문 — API 계약 §3 {@code { nos: number[] }} (1~100건, 서비스가 검사 → 400 VAL_001) */
@Getter
@Setter
@NoArgsConstructor
public class NoticeDeleteRequest {
    private List<Long> nos;

    public NoticeDeleteRequest(List<Long> nos) {
        this.nos = nos;
    }
}
