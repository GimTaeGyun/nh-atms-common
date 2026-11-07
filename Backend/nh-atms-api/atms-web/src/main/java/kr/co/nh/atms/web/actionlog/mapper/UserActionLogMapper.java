package kr.co.nh.atms.web.actionlog.mapper;

import kr.co.nh.atms.web.actionlog.dto.UserActionLogDto;
import org.apache.ibatis.annotations.Mapper;

/** 사용자 행위 이력(T_USER_ACTION_LOG — TO-BE 대응 없음, H-074 로 T_ 유지) */
@Mapper
public interface UserActionLogMapper {
    int insert(UserActionLogDto row);
}
