package kr.co.nh.atms.web.lookup.dto;

import lombok.Getter;
import lombok.Setter;

/** 공통 조회 — 기기(기번) (API 계약 §2 Machine). TB_MCN_INFO ⟕ TB_SCRT_INST_PST ⟕ TB_NMS_SRC */
@Getter
@Setter
public class Machine {
    private String ofcCode;
    private String mcnNo;
    private String instPstCode;
    private String instPstNm;
    private String src;
    private String srcNm;
    private String komType;
    private String vendCode;
    private String useYn;
}
