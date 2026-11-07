package kr.co.nh.atms.web.common;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** 그리드 일괄 저장 본문 `{added, updated, deleted}` (예: 기기모델코드 견본 POST /api/mcn-model/batch). 프론트 EditChanges 와 같은 모양. */
@Data
public class BatchChanges<T> {
    private List<T> added = new ArrayList<>();
    private List<T> updated = new ArrayList<>();
    private List<T> deleted = new ArrayList<>();

    public boolean isEmpty() { return added.isEmpty() && updated.isEmpty() && deleted.isEmpty(); }
}
