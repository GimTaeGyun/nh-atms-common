package kr.co.nh.atms.web.actionlog.service;

import kr.co.nh.atms.web.actionlog.dto.UserActionLogDto;
import kr.co.nh.atms.web.actionlog.mapper.UserActionLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** 사용자 행위 이력 기록(Aspect 가 호출). 관리자 조회 화면은 이 저장소 범위 밖(원본 nh-atms actionlog 참고) */
@Service
@RequiredArgsConstructor
public class UserActionLogService {

    private final UserActionLogMapper mapper;

    /** 업무 트랜잭션과 분리해 기록(업무가 롤백돼도 이력은 남고, 이력 실패가 업무를 막지 않는다) */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(UserActionLogDto row) {
        mapper.insert(row);
    }
}
