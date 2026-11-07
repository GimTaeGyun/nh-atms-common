/** 백엔드 공통 응답 봉투 (atms-common ApiResponse) — 프로젝트 전체에서 이 타입만 사용 */
export interface ApiResponse<T> {
  success: boolean;
  /** 서버 응답코드 테이블(T_API_MESSAGE)의 문구 — 성공 응답은 알릴 말이 있을 때만, 없으면 null. 화면은 그대로 보여준다 */
  message: string | null;
  /** 성공 '0000', 실패는 응답코드(예: USR_001) */
  code: string;
  data: T;
}

/** 페이징 결과 (atms-common PageResult) */
export interface PageResult<T> {
  content: T[];
  totalCount: number;
  /** 1-based */
  page: number;
  size: number;
  totalPages: number;
}

/** 페이징 요청 공통 파라미터 */
export interface PageParams {
  /** 1-based */
  page?: number;
  size?: number;
  sort?: string;
}

/** 날짜 문자열 규격: YYYYMMDD / HHMMSS (백엔드·AS-IS 전문 포맷) */
export type Ymd = string;
export type Hms = string;
