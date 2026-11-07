package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.page.PageRequest;
import kr.co.nh.atms.common.page.PageResult;

import java.util.List;

/** 메모리 목록을 PageResult 로 자르기(집계 후 페이징이 필요한 조회용). DB 페이징이 가능하면 OFFSET/FETCH 를 우선한다. */
public final class Pages {
    private Pages() {}

    public static <T> PageResult<T> slice(List<T> rows, PageRequest req) {
        int from = Math.min(req.getOffset(), rows.size());
        int to = Math.min(from + req.getLimit(), rows.size());
        return PageResult.of(rows.subList(from, to), rows.size(), req);
    }

    public static <T> PageResult<T> empty(PageRequest req) {
        return PageResult.of(List.of(), 0, req);
    }
}
