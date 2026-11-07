/**
 * 공통 조회(`/api/lookup/*`) 응답 타입 — API 계약 §2 와 글자 하나까지 같다.
 * 필드 = TO-BE 정본 컬럼명의 camelCase(`OFC_CODE` → `ofcCode`). 날짜는 문자열 YYYYMMDD.
 */

/** 사무소 — TB_OFC_REG_MGT ⟕ TB_CO_SIDO */
export interface Office {
  ofcCode: string;
  /** 사무소명 */
  kanm: string | null;
  sidoCode: string | null;
  sidoNm: string | null;
}

/** 인원 — TB_INSA */
export interface Person {
  perNo: string;
  name: string;
  jikeubName: string | null;
  samuso: string | null;
  samusoName: string | null;
}

/** 기기사(업체) — 원천 잠정(설계 Q6): 이름이 없으면 vendNm=null */
export interface Vendor {
  vendCode: string;
  vendNm: string | null;
}

/** 모델 — TB_CO_MODEL */
export interface Model {
  vendCode: string;
  mcnType: string;
  modelCode: string;
  modelNm: string | null;
}

/** 기종(SRC) — TB_NMS_SRC (PK SRC) */
export interface Src {
  src: string;
  srcNm: string | null;
  vendCode: string | null;
  komType: string | null;
}

/** 기기 — TB_MCN_INFO ⟕ TB_SCRT_INST_PST ⟕ TB_NMS_SRC */
export interface Machine {
  ofcCode: string;
  /** 기번 */
  mcnNo: string;
  instPstCode: string | null;
  instPstNm: string | null;
  src: string | null;
  srcNm: string | null;
  komType: string | null;
  vendCode: string | null;
  useYn: 'Y' | 'N';
}

/** 코너(설치장소) — TB_SCRT_INST_PST */
export interface Corner {
  ofcCode: string;
  instPstCode: string;
  instPstNm: string | null;
  useYn: 'Y' | 'N';
}

/** 공통코드 — TB_CO_CODE (USE_YN='Y' 만, SORT_ORD,CODE 순) */
export interface Code {
  codeType: string;
  code: string;
  codeNm: string | null;
  desc1: string | null;
  desc2: string | null;
  desc3: string | null;
  sortOrd: number | null;
  useYn: 'Y' | 'N';
}

/** 있는 값 목록(코드표 없는 컬럼용) */
export interface DistinctValue {
  value: string;
}

/** `/api/lookup/distinct/{target}` 허용 목록 — 그 밖은 400 LKP_002 */
export type DistinctTarget = 'mcn-kom-type' | 'mcn-op-type' | 'mcn-inout-type' | 'mcn-cnr-pst-spec' | 'mcn-vend-code' | 'model-mcn-type';

export const DISTINCT_TARGETS: readonly DistinctTarget[] = ['mcn-kom-type', 'mcn-op-type', 'mcn-inout-type', 'mcn-cnr-pst-spec', 'mcn-vend-code', 'model-mcn-type'];

/** 시도 — TB_CO_SIDO */
export interface Sido {
  sidoCode: string;
  sidoNm: string | null;
}

/** 시군 — TB_CO_SIGUN */
export interface Sigun {
  sidoCode: string;
  sigunCode: string;
  sigunNm: string | null;
}

/** 휴일 — TB_NMS_HDAY (표시만, 영업일 계산은 H-068 대기) */
export interface Holiday {
  hdayDt: string;
  dayType: number | null;
  hdayYn: string | null;
  closeYn: string | null;
}
