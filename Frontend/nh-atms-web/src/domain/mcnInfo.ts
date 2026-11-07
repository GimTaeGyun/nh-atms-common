/**
 * 기기정보 견본(`sample.mcnInfo`, TB_MCN_INFO) 타입 — API 계약 §4 와 글자 하나까지 같다.
 * 필드 = 정본 컬럼 camelCase. 키는 사무소코드(6자리) + 기번(숫자 3자리).
 */
import type { Audit, PageParams } from '@/types/api';

/** `GET /api/mcn-info` 조회조건 (ofcCode 필수 — 없으면 400 V001_20) */
export interface McnInfoSearch extends PageParams {
  ofcCode: string;
  mcnNo?: string;
  vendCode?: string;
  komType?: string;
  opType?: string;
  inoutType?: string;
  useYn?: 'Y' | 'N';
}

/** 기기정보 1건 */
export interface McnInfo extends Audit {
  ofcCode: string;
  /** 사무소명 */
  kanm: string | null;
  mcnNo: string;
  instPstCode: string | null;
  /** 코너명 */
  instPstNm: string | null;
  src: string | null;
  /** 기종명(TB_NMS_SRC.SRC_NM) */
  srcNm: string | null;
  komType: string | null;
  vendCode: string | null;
  /** 기기사명(원천 잠정 Q6 — null 일 수 있다) */
  vendNm: string | null;
  opType: string | null;
  inoutType: string | null;
  useYn: 'Y' | 'N';
  cnrPstSpecCode: string | null;
}

/** `POST /api/mcn-info`, `PUT /api/mcn-info/{ofcCode}/{mcnNo}`(키 무시) 본문 */
export interface McnInfoSave {
  ofcCode: string;
  /** 숫자 3자리 */
  mcnNo: string;
  instPstCode?: string;
  src?: string;
  komType?: string;
  vendCode?: string;
  opType?: string;
  inoutType?: string;
  useYn: 'Y' | 'N';
  cnrPstSpecCode?: string;
}
