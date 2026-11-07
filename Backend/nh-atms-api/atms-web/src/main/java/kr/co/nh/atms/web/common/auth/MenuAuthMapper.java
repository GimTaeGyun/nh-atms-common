package kr.co.nh.atms.web.common.auth;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/** 화면 권한 조회 — mapper/common/MenuAuthMapper.xml */
@Mapper
public interface MenuAuthMapper {
    /** 메뉴경로 + 권한코드의 플래그 5개(행이 없으면 모든 값 null 인 1행) */
    MenuAuthFlags selectMenuAuth(@Param("menuPath") String menuPath, @Param("auth") String auth);
}
