package kr.co.nh.atms.web.mcnmodel.mapper;

import kr.co.nh.atms.web.mcnmodel.dto.McnModel;
import kr.co.nh.atms.web.mcnmodel.dto.McnModelSearchDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 기기모델코드 견본 — mapper/mcnmodel/McnModelMapper.xml (API 계약 §5, TB_CO_MODEL).
 * {@code vendorCodeType}: 기기사명 원천 코드구분(LookupRules.vendorCodeType, 잠정 Q-01). null 이면 기기사명 null.
 * 키 파라미터({@link McnModel} 의 vendCode·mcnType·modelCode)는 서비스가 앞뒤 공백을 지워 넘긴다.
 */
@Mapper
public interface McnModelMapper {

    /** 목록 전체(페이징 없음). 조건 값은 서비스가 정리해서 넘긴다 */
    List<McnModel> selectList(@Param("s") McnModelSearchDto s, @Param("vendorCodeType") String vendorCodeType);

    /** 같은 키 건수(0 또는 1) — 추가 중복 검사 */
    int countByKey(McnModel key);

    int insert(McnModel row);

    /** MODEL_NM 만 수정(키 3개는 수정 불가). 반환 0 = 없음 */
    int updateName(McnModel row);

    /** 키 3개로 물리 삭제. 반환 0 = 없음 */
    int delete(McnModel key);
}
