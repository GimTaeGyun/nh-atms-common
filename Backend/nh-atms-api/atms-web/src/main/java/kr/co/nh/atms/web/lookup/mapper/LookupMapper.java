package kr.co.nh.atms.web.lookup.mapper;

import kr.co.nh.atms.web.lookup.dto.Code;
import kr.co.nh.atms.web.lookup.dto.Corner;
import kr.co.nh.atms.web.lookup.dto.DistinctValue;
import kr.co.nh.atms.web.lookup.dto.Holiday;
import kr.co.nh.atms.web.lookup.dto.Machine;
import kr.co.nh.atms.web.lookup.dto.Model;
import kr.co.nh.atms.web.lookup.dto.Office;
import kr.co.nh.atms.web.lookup.dto.Person;
import kr.co.nh.atms.web.lookup.dto.Sido;
import kr.co.nh.atms.web.lookup.dto.Sigun;
import kr.co.nh.atms.web.lookup.dto.Vendor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** 공통 조회 — mapper/lookup/LookupMapper.xml (API 계약 §2) */
@Mapper
public interface LookupMapper {

    List<Office> selectOffices(@Param("q") String q);

    Office selectOffice(@Param("ofcCode") String ofcCode);

    List<Person> selectPersons(@Param("ofcCode") String ofcCode, @Param("q") String q, @Param("today") String today);

    Person selectPerson(@Param("perNo") String perNo);

    /** 기기사: TB_CO_CODE 의 코드구분(설정 atms.lookup.vendor-code-type) */
    List<Vendor> selectVendorsFromCode(@Param("codeType") String codeType);

    /** 기기사: TB_CO_MODEL·TB_MCN_INFO 의 VEND_CODE 값(이름 없음) */
    List<Vendor> selectVendorsDistinct();

    List<Model> selectModels(@Param("vendCode") String vendCode, @Param("mcnType") String mcnType);

    List<Machine> selectMachines(@Param("ofcCode") String ofcCode, @Param("vendCode") String vendCode, @Param("q") String q);

    List<Corner> selectCorners(@Param("ofcCode") String ofcCode);

    List<Code> selectCodes(@Param("codeType") String codeType);

    List<Sido> selectSido();

    List<Sigun> selectSigun(@Param("sidoCode") String sidoCode);

    List<Holiday> selectHolidays(@Param("from") String from, @Param("to") String to);

    // ── 있는 값 목록(distinct) — 허용 목록 target 마다 하나씩(${} 금지). 연결은 LookupService.DISTINCT ──

    List<DistinctValue> selectDistinctMcnKomType();

    List<DistinctValue> selectDistinctMcnOpType();

    List<DistinctValue> selectDistinctMcnInoutType();

    List<DistinctValue> selectDistinctMcnCnrPstSpec();

    List<DistinctValue> selectDistinctMcnVendCode();

    List<DistinctValue> selectDistinctModelMcnType();
}
