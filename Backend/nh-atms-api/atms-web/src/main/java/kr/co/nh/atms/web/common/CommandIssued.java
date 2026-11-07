package kr.co.nh.atms.web.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 명령 발행 응답 `{cmdId}` */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandIssued {
    private String cmdId;
}
