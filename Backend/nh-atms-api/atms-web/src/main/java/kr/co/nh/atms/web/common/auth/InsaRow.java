package kr.co.nh.atms.web.common.auth;

import lombok.Getter;
import lombok.Setter;

/** TB_INSA 1행(현재 사용자용 컬럼만) */
@Getter
@Setter
public class InsaRow {
    private String perNo;
    private String name;
    private String samuso;
    private String samusoName;
}
