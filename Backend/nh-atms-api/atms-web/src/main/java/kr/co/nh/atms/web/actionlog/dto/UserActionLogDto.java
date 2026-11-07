package kr.co.nh.atms.web.actionlog.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.Builder;

/** T_USER_ACTION_LOG 한 행(기록용). userId = 현재 사용자 개인번호(CurrentUser.perNo) */
@Getter
@Setter
@Builder
public class UserActionLogDto {
    private Long logSeq;
    /** YYYYMMDD */
    private String actionDate;
    /** HHMMSS */
    private String actionTime;
    private String userId;
    private String loginIp;
    private String screenKey;
    private String screenName;
    /** SELECT / INSERT / UPDATE / DELETE / EXPORT */
    private String action;
    private String reqMethod;
    private String reqUri;
    private String handler;
    private String actionParam;
    private String reason;
    private String resultYn;
    private String resultMsg;
    private Long elapsedMs;
}
