package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.page.PageResult;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** `{kpi, page}` 래퍼 — 요약 지표(kpi)와 목록 한 쪽(page)을 함께 내려줄 때. 기준시각(asOf)까지 필요하면 AsOfPageSummary */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KpiPage<K, T> {
    private K kpi;
    private PageResult<T> page;
}
