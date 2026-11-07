package kr.co.nh.atms.web.mcninfo.dto;

import kr.co.nh.atms.common.page.PageRequest;
import lombok.Getter;
import lombok.Setter;

/**
 * 기기정보 조회조건 (API 계약 §4 {@code McnInfoSearch}) — {@code GET /api/mcn-info?ofcCode=…&page=&size=}.
 * 사무소는 필수(없으면 400 V001_20). 나머지는 비면 조건에서 빠진다. 값 정리는 McnInfoService 가 한다.
 */
@Getter
@Setter
public class McnInfoSearchDto extends PageRequest {
    private String ofcCode;
    /** 기번(숫자 3자리, 일치) */
    private String mcnNo;
    private String vendCode;
    private String komType;
    private String opType;
    private String inoutType;
    /** 'Y' | 'N', 비면 전체 */
    private String useYn;
}
