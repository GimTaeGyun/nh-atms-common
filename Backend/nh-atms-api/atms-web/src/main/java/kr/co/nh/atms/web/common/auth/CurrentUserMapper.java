package kr.co.nh.atms.web.common.auth;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** 현재 사용자 조회 — mapper/common/CurrentUserMapper.xml */
@Mapper
public interface CurrentUserMapper {
    /** TB_INSA 1건(없으면 null) */
    InsaRow selectInsa(@Param("perNo") String perNo);

    /** TB_SCR_AUTH 의 그 개인번호 행 전부(채택은 CurrentUserLoader.pickAuth) */
    List<ScrAuthRow> selectAuths(@Param("perNo") String perNo);

    /** TB_OFC_REG_MGT.KANM (없으면 null) */
    String selectKanm(@Param("ofcCode") String ofcCode);
}
