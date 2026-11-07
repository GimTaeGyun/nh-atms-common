import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import type { ApiResponse } from '@/types/api';
import type { TokenPair, UserInfo } from '@/types/auth';
import { notifySuccess } from '@/hooks/useAppMessage';
import { AppError, KIND_MESSAGE, toAppError } from './errors';

/**
 * HTTP 클라이언트.
 *  - Access Token 자동 첨부
 *  - 401 → refresh 단일 비행(single-flight): 동시 다발 401 이 refresh 를 N번 호출하지 않도록 큐잉
 *  - 모든 오류를 AppError 로 정규화 (화면은 e.kind / e.userMessage 만 본다)
 *  - 인증 상태는 스토어가 소유. 여기서는 콜백으로만 접근(순환 import 방지)
 */
export interface AuthBridge {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onRefreshed: (tokens: TokenPair, user?: UserInfo) => void;
  onAuthFailed: () => void;
}

let bridge: AuthBridge | null = null;
export const bindAuthBridge = (b: AuthBridge): void => {
  bridge = b;
};

/**
 * 화면 컨텍스트 — 지금 활성 탭의 화면키·화면명을 모든 API 요청 헤더(X-Screen-Key / X-Screen-Name)에 싣는다.
 * 백엔드 행위 이력(7211, UserActionLogAspect)이 "어느 화면에서 한 일인지" 기록하는 근거. 탭 스토어가 bind 한다.
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
  // 배열은 regions=a&regions=b (대괄호 없이) — Spring 의 List<String> 파라미터가 별도 설정 없이 받는 형태
  paramsSerializer: { indexes: null },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean; skipAuth?: boolean };

http.interceptors.request.use((config: RetriableConfig) => {
  const token = bridge?.getAccessToken();
  if (token && !config.skipAuth) config.headers.Authorization = `Bearer ${token}`;
  const screen = screenCtx?.getActiveScreen();
  if (screen?.key) {
    config.headers['X-Screen-Key'] = screen.key;
    if (screen.name) config.headers['X-Screen-Name'] = encodeURIComponent(screen.name);
  }
  return config;
});

let refreshing: Promise<string> | null = null;

/** 인증 경로는 401 이어도 refresh 재시도를 하지 않는다(SSO 진입 경로 포함) */
const isAuthPath = (url?: string): boolean => !!url && /\/auth\/(login|logout|refresh|sso\/)/.test(url);

/** refresh 토큰으로 access 토큰 재발급 — 인터셉터와 세션 타이머(연장 버튼)가 같이 쓴다 */
export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = bridge?.getRefreshToken();
  if (!refreshToken) throw new AppError('unauthorized', '세션이 만료되었습니다.');
  // 인터셉터 순환을 피하려고 raw axios 사용
  const res = await axios.post<ApiResponse<TokenPair & { user?: UserInfo }>>(`${env.apiBase}/auth/refresh`, { refreshToken }, { timeout: 15_000 });
  const data = res.data.data;
  bridge?.onRefreshed({ accessToken: data.accessToken, refreshToken: data.refreshToken, accessExpiresAt: data.accessExpiresAt }, data.user);
  return data.accessToken;
};

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (!original || isAuthPath(original.url) || error.response?.status !== 401 || original._retry) {
      return Promise.reject(toAppError(error));
    }
    original._retry = true;
    try {
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      original.headers.Authorization = `Bearer ${token}`;
      return http(original);
    } catch (e) {
      bridge?.onAuthFailed();
      return Promise.reject(toAppError(e));
    }
  },
);

/**
 * 요청 옵션 — axios 설정 + 성공 문구 표시 여부.
 * 서버가 성공 응답에 message 를 실어 보내면(등록·수정·삭제 등) 화면에 그대로 띄운다. 띄우지 않을 때만 quietSuccess.
 */
export type ApiRequestConfig = AxiosRequestConfig & { quietSuccess?: boolean };

/**
 * 서버 문구를 화면이 표시 방식(성공/경고)만 골라 띄울 때 — 자동 표시하지 않고 문구를 함께 돌려준다.
 * 예: 원격명령 결과가 "기기 응답 없음"이면 경고로. 문구 자체는 여전히 서버(T_API_MESSAGE)가 만든다.
 */
export const apiWithMessage = {
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<{ data: T; message: string | null }> => {
    const res = await http.post<ApiResponse<T>>(url, body, config);
    const data = unwrap(res.data, { ...config, quietSuccess: true });
    return { data, message: res.data?.message ?? null };
  },
};

/** data 봉투를 벗겨 T 를 반환하는 헬퍼 — 화면/엔드포인트 모듈은 이 4개만 사용 */
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
 * 문구는 백엔드 응답코드 테이블(T_API_MESSAGE)이 만든다 — 화면은 성공 문구를 직접 쓰지 않는다.
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
