package kr.co.nh.atms.web.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** `{asOf, rows}` 래퍼 — 페이징 없는 목록 (corner, cash/fx, reconcile) */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsOfRows<T> {
    private String asOf;
    private List<T> rows;

    public static <T> AsOfRows<T> now(List<T> rows) { return new AsOfRows<>(Dates.asOf(), rows); }
    public static <T> AsOfRows<T> today(List<T> rows) { return new AsOfRows<>(Dates.asOfDate(), rows); }
}
