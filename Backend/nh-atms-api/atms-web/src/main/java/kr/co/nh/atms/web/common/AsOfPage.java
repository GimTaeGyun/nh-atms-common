package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.page.PageResult;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** `{asOf, page}` 래퍼 — 기준시각(asOf)이 있는 페이징 목록. 요약이 함께 있으면 {@link AsOfPageSummary}. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsOfPage<T> {
    private String asOf;
    private PageResult<T> page;

    public static <T> AsOfPage<T> now(PageResult<T> page) { return new AsOfPage<>(Dates.asOf(), page); }
}
