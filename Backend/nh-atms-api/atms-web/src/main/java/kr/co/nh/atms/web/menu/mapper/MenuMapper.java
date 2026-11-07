package kr.co.nh.atms.web.menu.mapper;

import kr.co.nh.atms.web.menu.dto.MenuNode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** 메뉴 — mapper/menu/MenuMapper.xml */
@Mapper
public interface MenuMapper {
    /** 사용 중인 메뉴 전부 + 권한코드의 플래그(없으면 N). SORT_NO 순 */
    List<MenuNode> selectMenusWithAuth(@Param("auth") String auth);
}
