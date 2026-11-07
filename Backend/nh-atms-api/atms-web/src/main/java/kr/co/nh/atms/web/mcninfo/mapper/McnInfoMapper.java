package kr.co.nh.atms.web.mcninfo.mapper;

import kr.co.nh.atms.web.mcninfo.dto.McnInfo;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoKey;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoSave;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoSearchDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 기기정보 견본 — mapper/mcninfo/McnInfoMapper.xml (API 계약 §4, TB_MCN_INFO).
 * {@code vendorCodeType}: 기기사명 원천 코드구분(LookupRules.vendorCodeType, 잠정 Q-01). null 이면 기기사명 null.
 */
@Mapper
public interface McnInfoMapper {

    /** 목록 한 페이지(OFFSET/FETCH). 조건 값은 서비스가 정리해서 넘긴다 */
    List<McnInfo> selectList(@Param("s") McnInfoSearchDto s, @Param("vendorCodeType") String vendorCodeType);

    /** 목록 전체 건수(같은 조건) */
    long countList(@Param("s") McnInfoSearchDto s);

    McnInfo selectOne(@Param("ofcCode") String ofcCode, @Param("mcnNo") String mcnNo, @Param("vendorCodeType") String vendorCodeType);

    /** 같은 키 건수(0 또는 1) — 등록 중복 검사 */
    int countByKey(@Param("ofcCode") String ofcCode, @Param("mcnNo") String mcnNo);

    int insert(McnInfoSave row);

    /** 키 외 전 컬럼 수정. 반환 0 = 없음 */
    int update(McnInfoSave row);

    /** USE_YN='N' (논리 삭제, 설계 Q11). 반환 0 = 없음 */
    int softDelete(McnInfoKey key);
}
