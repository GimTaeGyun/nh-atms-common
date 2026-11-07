package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.page.PageResult;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** `{asOf, page}` 래퍼 (cash/status, cash/fx/verify 등). summary 가 있으면 {@link AsOfPageSummary}. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsOfPage<T> {
    private String asOf;
    private PageResult<T> page;

    public static <T> AsOfPage<T> now(PageResult<T> page) { return new AsOfPage<>(Dates.asOf(), page); }
}
