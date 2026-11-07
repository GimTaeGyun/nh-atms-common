package kr.co.nh.atms.web.notice.mapper;

import kr.co.nh.atms.web.notice.dto.Notice;
import kr.co.nh.atms.web.notice.dto.NoticeSearchDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/** 공지사항 견본 — TB_NOTICE (SQL: resources/mapper/notice/NoticeMapper.xml) */
@Mapper
public interface NoticeMapper {

    /** 목록 한 페이지(TEXT 제외, NO DESC) */
    List<Notice> selectList(NoticeSearchDto s);

    /** 목록 건수 */
    long countList(NoticeSearchDto s);

    /** 1건(TEXT 포함). 없으면 null */
    Notice selectOne(@Param("no") long no);

    /** 다음 번호 NVL(MAX(NO),0)+1 — 서비스는 NoticeRules.nextNo 로만 부른다(잠정 Q-02) */
    long selectNextNo();

    /** 등록 — WRT_DATE=SYSDATE, VISIT=0, 감사 4컬럼은 AuditInterceptor */
    int insert(Notice n);

    /** 제목·내용·사무소 수정. 반영 건수(0 = 없음) */
    int update(Notice n);

    /** 조회수 +1 (감사 컬럼은 바꾸지 않는다). 반영 건수(0 = 없음) */
    int increaseVisit(@Param("no") long no);

    /** 다건 물리 삭제. 지운 건수 */
    int deleteByNos(@Param("nos") List<Long> nos);
}
