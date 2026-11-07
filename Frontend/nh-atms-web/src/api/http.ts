import axios, { type AxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import type { ApiResponse } from '@/types/api';
import { notifySuccess } from '@/hooks/useAppMessage';
import { AppError, KIND_MESSAGE, toAppError } from './errors';

/**
 * HTTP 클라이언트 — [원본] nh-atms `src/api/http.ts` 에서 로그인·토큰 부분을 뺐다(설계 Q1 로그인 없음).
 *  - 응답 봉투(ApiResponse) 해제, 서버 성공 문구 자동 표시(quietSuccess 로 끔)
 *  - 모든 오류를 AppError 로 정규화 (화면은 e.kind / e.userMessage 만 본다)
 *  - 모든 요청에 X-Screen-Key / X-Screen-Name (행위이력·권한 검사용)
 *  - 사용자는 서버가 설정의 고정 개인번호로 정한다. 토큰·Authorization 헤더·401 재시도 없음.
 *    나중에 SSO 를 붙이면 이 파일의 요청 인터셉터와 서버 FixedUserFilter 한 곳을 바꾼다.
 */

/**
 * 화면 컨텍스트 — 지금 활성 탭의 화면키·화면명을 모든 API 요청 헤더(X-Screen-Key / X-Screen-Name)에 싣는다.
 * 백엔드 행위이력과 화면 권한 검사가 "어느 화면에서 한 일인지"의 근거로 쓴다. 탭 스토어가 bind 한다.
 * 화면명은 한글이라 encodeURIComponent 로 싣고 서버가 디코드한다.
 */
export interface ScreenContext {
  getActiveScreen: () => { key: string; name?: string } | null;
}
let screenCtx: ScreenContext | null = null;
export const bindScreenContext = (c: ScreenContext): void => {
  screenCtx = c;
};

export const http = axios.create({
  baseURL: env.apiBase,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  // 배열은 nos=1&nos=2 (대괄호 없이) — Spring 의 List<String> 파라미터가 별도 설정 없이 받는 형태
  paramsSerializer: { indexes: null },
});

http.interceptors.request.use((config) => {
  const screen = screenCtx?.getActiveScreen();
  if (screen?.key) {
    config.headers['X-Screen-Key'] = screen.key;
    if (screen.name) config.headers['X-Screen-Name'] = encodeURIComponent(screen.name);
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (error: unknown) => Promise.reject(toAppError(error)),
);

/**
 * 요청 옵션 — axios 설정 + 성공 문구 표시 여부.
 * 서버가 성공 응답에 message 를 실어 보내면(등록·수정·삭제 등) 화면에 그대로 띄운다. 띄우지 않을 때만 quietSuccess.
 */
export type ApiRequestConfig = AxiosRequestConfig & { quietSuccess?: boolean };

/**
 * 서버 문구를 화면이 표시 방식(성공/경고)만 골라 띄울 때 — 자동 표시하지 않고 문구를 함께 돌려준다.
 * 문구 자체는 여전히 서버(응답코드 테이블)가 만든다.
 */
export const apiWithMessage = {
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<{ data: T; message: string | null }> => {
    const res = await http.post<ApiResponse<T>>(url, body, config);
    const data = unwrap(res.data, { ...config, quietSuccess: true });
    return { data, message: res.data?.message ?? null };
  },
};

/** data 봉투를 벗겨 T 를 반환하는 헬퍼 — 화면/엔드포인트 모듈은 이것만 사용 */
export const api = {
  get: async <T>(url: string, config?: ApiRequestConfig): Promise<T> => {
    const res = await http.get<ApiResponse<T>>(url, config);
    return unwrap(res.data, config);
  },
  post: async <T>(url: string, body?: unknown, config?: ApiRequestConfig): Promise<T> => {
    const res = await http.post<ApiResponse<T>>(url, body, config);
    return unwrap(res.data, config);
  },
  put: async <T>(url: string, body?: unknown, config?: ApiRequestConfig): Promise<T> => {
    const res = await http.put<ApiResponse<T>>(url, body, config);
    return unwrap(res.data, config);
  },
  delete: async <T>(url: string, config?: ApiRequestConfig): Promise<T> => {
    const res = await http.delete<ApiResponse<T>>(url, config);
    return unwrap(res.data, config);
  },
  /** 파일(blob) 다운로드 */
  blob: async (url: string, config?: AxiosRequestConfig): Promise<{ blob: Blob; disposition?: string }> => {
    const res = await http.get<Blob>(url, { ...config, responseType: 'blob' });
    return { blob: res.data, disposition: res.headers['content-disposition'] as string | undefined };
  },
};

/**
 * 봉투 해제. 실패면 서버 문구로 AppError, 성공이면 서버가 보낸 문구(있을 때만)를 그대로 띄운다.
 * 문구는 백엔드 응답코드 테이블(api-messages.tsv)이 만든다 — 화면은 성공 문구를 직접 쓰지 않는다.
 */
const unwrap = <T>(body: ApiResponse<T>, config?: ApiRequestConfig): T => {
  if (body && typeof body === 'object' && 'success' in body) {
    if (!body.success) throw new AppError('server', body.message || KIND_MESSAGE.server, { code: body.code, detail: body.data });
    if (body.message && !config?.quietSuccess) notifySuccess(body.message);
    return body.data;
  }
  // 봉투가 없는 응답(예: actuator)은 그대로
  return body as unknown as T;
};
