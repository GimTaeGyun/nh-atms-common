package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.page.PageResult;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** `{kpi, page}` 래퍼 (outsrc/atm-status, std/sample 은 asOf 포함 → 자체 DTO) */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KpiPage<K, T> {
    private K kpi;
    private PageResult<T> page;
}
