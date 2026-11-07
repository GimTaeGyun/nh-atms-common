package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.page.PageResult;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** `{asOf, page, summary}` 래퍼 (cash/verify) */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsOfPageSummary<T, S> {
    private String asOf;
    private PageResult<T> page;
    private S summary;
}
