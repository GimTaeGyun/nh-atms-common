package kr.co.nh.atms.web.notice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 공지 등록·수정 본문 — API 계약 §3 {@code NoticeSave}. 작성자(NAME·PER_NO)는 받지 않는다(고정 사용자, 서비스가 채움).
 * 빈 값은 {@code @NotBlank} → 400 VAL_001(필드명). 바이트 길이(제목 200·내용 4000)는 서비스가 검사(잠정 Q-07).
 */
@Getter
@Setter
@NoArgsConstructor
public class NoticeSave {
    /** 제목 — 필수, 200바이트 이내 */
    @NotBlank
    private String subject;
    /** 내용 — 필수, 4000바이트 이내 */
    @NotBlank
    private String text;
    /** 사무소코드(선택, 1~6자리 숫자 → 6자리) */
    private String ofcCode;

    public NoticeSave(String subject, String text, String ofcCode) {
        this.subject = subject;
        this.text = text;
        this.ofcCode = ofcCode;
    }
}
