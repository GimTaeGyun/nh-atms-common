package kr.co.nh.atms.web.common.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** TB_SCR_AUTH 1행(사용자별 업무권한). 키 DEPT_CODE+OFC_CODE+PER_NO */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ScrAuthRow {
    private String deptCode;
    private String ofcCode;
    private String auth;
    /** 승인상태 APV_STS CHAR(2) — 'Y' 유효 */
    private String apvSts;
    /** 만료일시 DUE_DATE CHAR(14) — 비었거나 지금 이후면 유효 */
    private String dueDate;
}
