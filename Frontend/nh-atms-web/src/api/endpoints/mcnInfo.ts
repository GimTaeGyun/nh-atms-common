import { api } from '../http';
import type { McnInfo, McnInfoSave, McnInfoSearch } from '@/domain/mcnInfo';
import type { PageResult } from '@/types/api';
import { compactParams } from '@/utils/object';

/**
 * 기기정보 견본(`sample.mcnInfo`) API — API 계약 §4 (`/api/mcn-info…`).
 * 규칙: API 호출은 이 파일에서만, 응답 타입은 domain/mcnInfo.ts, onSuccess 는 invalidateQueries({ queryKey: mcnInfoKeys.all }) 만.
 * 쓰기 응답의 성공 문구(S002 등록·S003 수정·S004 삭제)는 http.ts 가 서버 문구 그대로 띄운다.
 */
const keyPath = (ofcCode: string, mcnNo: string) => `/mcn-info/${encodeURIComponent(ofcCode)}/${encodeURIComponent(mcnNo)}`;

export const mcnInfoApi = {
  /** 목록(서버 페이징). ofcCode 필수 — 없으면 400 V001_20. 빈 조건은 보내지 않는다 */
  list: (p: McnInfoSearch) => api.get<PageResult<McnInfo>>('/mcn-info', { params: compactParams(p) }),
  /** 1건 (없으면 404 MCN_001) */
  get: (ofcCode: string, mcnNo: string) => api.get<McnInfo>(keyPath(ofcCode, mcnNo)),
  /** 등록 (S002 / 중복 400 MCN_002) */
  create: (body: McnInfoSave) => api.post<McnInfo>('/mcn-info', body),
  /** 수정 — 키는 경로로, 본문 키는 서버가 무시 (S003 / 없음 404 MCN_001) */
  update: (body: McnInfoSave) => api.put<McnInfo>(keyPath(body.ofcCode, body.mcnNo), body),
  /** 삭제 = 사용여부 'N'(논리 삭제, S004 / 없음 404 MCN_001) */
  remove: (key: Pick<McnInfo, 'ofcCode' | 'mcnNo'>) => api.delete<null>(keyPath(key.ofcCode, key.mcnNo)),
};

export const mcnInfoKeys = {
  all: ['mcnInfo'] as const,
  list: (p: McnInfoSearch) => ['mcnInfo', 'list', p] as const,
  detail: (ofcCode: string, mcnNo: string) => ['mcnInfo', 'detail', ofcCode, mcnNo] as const,
};
