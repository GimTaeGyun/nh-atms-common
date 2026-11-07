import { api } from '../http';
import type { McnModel, McnModelBatch, McnModelBatchResult, McnModelSearch } from '@/domain/mcnModel';
import { compactParams } from '@/utils/object';

/**
 * 기기모델코드 견본(`sample.mcnModel`) API — API 계약 §5 (`/api/mcn-model…`).
 * 규칙: API 호출은 이 파일에서만, 응답 타입은 domain/mcnModel.ts, onSuccess 는 invalidateQueries({ queryKey: mcnModelKeys.all }) 만.
 * 일괄 저장의 성공 문구(S001)는 http.ts 가 서버 문구 그대로 띄운다.
 */
export const mcnModelApi = {
  /** 목록 전체(페이징 없음). vendCode·mcnType 일치, q = 모델코드·모델명 부분일치. 빈 조건은 보내지 않는다 */
  list: (p: McnModelSearch) => api.get<McnModel[]>('/mcn-model', { params: compactParams(p) }),
  /**
   * 일괄 저장 — 처리 순서 삭제 → 수정 → 추가, 한 트랜잭션(S001).
   * 권한은 들어온 종류만 서버가 검사(added REG · updated UPD · deleted DEL, 없으면 403 SYS_403).
   * 오류: 키 비었거나 2자 초과·모델명 80바이트 초과 400 VAL_001 / 중복 400 MDL_002 / 없음 404 MDL_001 (인자 '업체-기기구분-모델').
   */
  saveBatch: (body: McnModelBatch) => api.post<McnModelBatchResult>('/mcn-model/batch', body),
};

export const mcnModelKeys = {
  all: ['mcnModel'] as const,
  list: (p: McnModelSearch) => ['mcnModel', 'list', p] as const,
};
