/**
 * 공지사항 견본(`sample.notice`, TB_NOTICE) 타입 — API 계약 §3 과 글자 하나까지 같다.
 * 필드 = 정본 컬럼 camelCase. `wrtDate` 는 DB DATE 를 서버가 'YYYYMMDD' 문자열로 내린다.
 */
import type { Audit, PageParams } from '@/types/api';

/** 검색구분 */
export type NoticeField = 'ALL' | 'SUBJECT' | 'TEXT' | 'NAME';

/** `GET /api/notice` 조회조건 */
export interface NoticeSearch extends PageParams {
  /** 작성일 시작 YYYYMMDD */
  fromDate?: string;
  /** 작성일 끝 YYYYMMDD */
  toDate?: string;
  ofcCode?: string;
  perNo?: string;
  field?: NoticeField;
  keyword?: string;
}

/** 공지 1건 — 목록 응답에서는 text 가 null */
export interface Notice extends Audit {
  no: number;
  ofcCode: string | null;
  /** 사무소명(TB_OFC_REG_MGT.KANM) */
  kanm: string | null;
  subject: string | null;
  text: string | null;
  /** 조회수 */
  visit: number | null;
  /** 작성자 성명 */
  name: string | null;
  perNo: string | null;
  /** 작성일 YYYYMMDD */
  wrtDate: string | null;
}

/** `POST /api/notice`, `PUT /api/notice/{no}` 본문 */
export interface NoticeSave {
  /** 필수, 200바이트 이내 */
  subject: string;
  /** 필수, 4000바이트 이내 */
  text: string;
  /** 6자리 */
  ofcCode?: string;
}

/** `POST /api/notice/delete` 본문 (1~100건) */
export interface NoticeDeleteRequest {
  nos: number[];
}

/** `POST /api/notice/delete` 응답 */
export interface NoticeDeleteResult {
  count: number;
}
