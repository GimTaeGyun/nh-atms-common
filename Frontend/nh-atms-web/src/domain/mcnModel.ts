/**
 * 기기모델코드 견본(`sample.mcnModel`, TB_CO_MODEL) 타입 — API 계약 §5 와 글자 하나까지 같다.
 * 키 3개(VEND_CODE+MCN_TYPE+MODEL_CODE)는 수정 불가, 수정은 modelNm 만.
 */
import type { Audit, BatchChanges } from '@/types/api';

/** 모델 1행 */
export interface McnModel extends Audit {
  vendCode: string;
  vendNm?: string | null;
  mcnType: string;
  modelCode: string;
  modelNm: string | null;
}

/** `GET /api/mcn-model` 조회조건 (q: 모델코드·모델명) */
export interface McnModelSearch {
  vendCode?: string;
  mcnType?: string;
  q?: string;
}

/** `POST /api/mcn-model/batch` 본문 */
export type McnModelBatch = BatchChanges<McnModel>;

/** `POST /api/mcn-model/batch` 응답 — 종류별 처리 건수 */
export interface McnModelBatchResult {
  added: number;
  updated: number;
  deleted: number;
}
