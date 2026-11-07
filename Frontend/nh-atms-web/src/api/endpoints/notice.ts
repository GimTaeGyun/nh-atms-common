import { api } from '../http';
import type { Notice, NoticeDeleteRequest, NoticeDeleteResult, NoticeSave, NoticeSearch } from '@/domain/notice';
import type { PageResult } from '@/types/api';
import { compactParams } from '@/utils/object';

/**
 * 공지사항 견본(`sample.notice`) API — API 계약 §3 (`/api/notice…`).
 * 규칙: API 호출은 이 파일에서만, 응답 타입은 domain/notice.ts, 쓰기 성공 문구는 서버가 보내고 http.ts 가 띄운다.
 * 화면의 onSuccess 는 `invalidateQueries({ queryKey: noticeKeys.all })` 만.
 */
export const noticeApi = {
  /** 목록(페이징, NO DESC). 목록의 text 는 null */
  list: (p: NoticeSearch) => api.get<PageResult<Notice>>('/notice', { params: compactParams(p) }),
  /** 1건(text 포함). hit=true 면 서버가 조회수 +1 (상세 팝업 열기). 없으면 404 NTC_001 */
  get: (no: number, hit = false) => api.get<Notice>(`/notice/${no}`, { params: hit ? { hit: 'Y' } : undefined }),
  /** 등록 — 서버 문구 S002 */
  create: (body: NoticeSave) => api.post<Notice>('/notice', body),
  /** 수정 — 서버 문구 S003 */
  update: (no: number, body: NoticeSave) => api.put<Notice>(`/notice/${no}`, body),
  /** 다건 삭제(1~100건) — 서버 문구 S005 '{n}건 삭제되었습니다.' */
  remove: (nos: number[]) => api.post<NoticeDeleteResult>('/notice/delete', { nos } satisfies NoticeDeleteRequest),
};

/** 공지사항 쿼리 키 — `noticeKeys.all` 은 invalidate 용 루트 */
export const noticeKeys = {
  all: ['notice'] as const,
  list: (p: NoticeSearch) => ['notice', 'list', p] as const,
  detail: (no: number) => ['notice', 'detail', no] as const,
};
