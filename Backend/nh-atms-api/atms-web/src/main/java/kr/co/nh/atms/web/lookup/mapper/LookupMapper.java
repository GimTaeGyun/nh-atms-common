package kr.co.nh.atms.web.lookup.mapper;

import kr.co.nh.atms.web.lookup.dto.LookupCode;
import kr.co.nh.atms.web.lookup.dto.LookupCorner;
import kr.co.nh.atms.web.lookup.dto.LookupDistinctValue;
import kr.co.nh.atms.web.lookup.dto.LookupHoliday;
import kr.co.nh.atms.web.lookup.dto.LookupMachine;
import kr.co.nh.atms.web.lookup.dto.LookupModel;
import kr.co.nh.atms.web.lookup.dto.LookupOffice;
import kr.co.nh.atms.web.lookup.dto.LookupPerson;
import kr.co.nh.atms.web.lookup.dto.LookupSido;
import kr.co.nh.atms.web.lookup.dto.LookupSigun;
import kr.co.nh.atms.web.lookup.dto.LookupSrc;
import kr.co.nh.atms.web.lookup.dto.LookupVendor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** 공통 조회 — mapper/lookup/LookupMapper.xml (API 계약 §2) */
@Mapper
public interface LookupMapper {

    List<LookupOffice> selectOffices(@Param("q") String q);

    LookupOffice selectOffice(@Param("ofcCode") String ofcCode);

    List<LookupPerson> selectPersons(@Param("ofcCode") String ofcCode, @Param("q") String q, @Param("today") String today);

    LookupPerson selectPerson(@Param("perNo") String perNo);

    /** 기기사: TB_CO_CODE 의 코드구분(설정 atms.lookup.vendor-code-type) */
    List<LookupVendor> selectVendorsFromCode(@Param("codeType") String codeType);

    /** 기기사: TB_CO_MODEL·TB_MCN_INFO 의 VEND_CODE 값(이름 없음) */
    List<LookupVendor> selectVendorsDistinct();

    List<LookupModel> selectModels(@Param("vendCode") String vendCode, @Param("mcnType") String mcnType);

    /** 기종: TB_NMS_SRC (업체코드로 좁히기 선택) */
    List<LookupSrc> selectSrcs(@Param("vendCode") String vendCode);

    List<LookupMachine> selectMachines(@Param("ofcCode") String ofcCode, @Param("vendCode") String vendCode, @Param("q") String q);

    List<LookupCorner> selectCorners(@Param("ofcCode") String ofcCode);

    List<LookupCode> selectCodes(@Param("codeType") String codeType);

    List<LookupSido> selectSido();

    List<LookupSigun> selectSigun(@Param("sidoCode") String sidoCode);

    List<LookupHoliday> selectHolidays(@Param("from") String from, @Param("to") String to);

    // ── 있는 값 목록(distinct) — 허용 목록 target 마다 하나씩(${} 금지). 연결은 LookupService.DISTINCT ──

    List<LookupDistinctValue> selectDistinctMcnKomType();

    List<LookupDistinctValue> selectDistinctMcnOpType();

    List<LookupDistinctValue> selectDistinctMcnInoutType();

    List<LookupDistinctValue> selectDistinctMcnCnrPstSpec();

    List<LookupDistinctValue> selectDistinctMcnVendCode();

    List<LookupDistinctValue> selectDistinctModelMcnType();
}
