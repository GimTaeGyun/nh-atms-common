import axios, { type AxiosError } from 'axios';

export type AppErrorKind = 'network' | 'timeout' | 'unauthorized' | 'forbidden' | 'notFound' | 'validation' | 'server' | 'canceled' | 'unknown';

/** 모든 API 오류를 화면이 다루기 쉬운 단일 형태로 정규화 */
export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly detail?: unknown;

  constructor(kind: AppErrorKind, message: string, opts?: { status?: number; code?: string; detail?: unknown }) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.status = opts?.status;
    this.code = opts?.code;
    this.detail = opts?.detail;
  }

  /** 사용자에게 보여줄 메시지 (서버 message 우선) */
  get userMessage(): string {
    return this.message;
  }
}

interface ServerErrorBody {
  success?: boolean;
  message?: string;
  code?: string;
  data?: unknown;
  errors?: unknown;
}

export const KIND_MESSAGE: Record<AppErrorKind, string> = {
  network: '서버와 통신할 수 없습니다. 네트워크 상태를 확인하세요.',
  timeout: '응답 시간이 초과되었습니다. 잠시 후 다시 시도하세요.',
  unauthorized: '인증이 만료되었습니다. 다시 로그인하세요.',
  forbidden: '해당 기능에 대한 권한이 없습니다.',
  notFound: '요청한 자료를 찾을 수 없습니다.',
  validation: '입력값을 확인하세요.',
  server: '처리 중 오류가 발생했습니다. 반복되면 시스템 관리자에게 문의하세요.',
  canceled: '요청이 취소되었습니다.',
  unknown: '알 수 없는 오류가 발생했습니다.',
};

export const toAppError = (err: unknown): AppError => {
  if (err instanceof AppError) return err;
  if (axios.isCancel(err)) return new AppError('canceled', KIND_MESSAGE.canceled);
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<ServerErrorBody>;
    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') return new AppError('timeout', KIND_MESSAGE.timeout, { code: e.code });
    if (!e.response) return new AppError('network', KIND_MESSAGE.network, { code: e.code });
    const { status, data } = e.response;
    const serverMsg = data?.message;
    const code = data?.code;
    const kind: AppErrorKind =
      status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : status === 404 ? 'notFound' : status === 400 || status === 422 ? 'validation' : status >= 500 ? 'server' : 'unknown';
    return new AppError(kind, serverMsg || KIND_MESSAGE[kind], { status, code, detail: data?.errors ?? data?.data });
  }
  if (err instanceof Error) return new AppError('unknown', err.message || KIND_MESSAGE.unknown, { detail: err });
  return new AppError('unknown', KIND_MESSAGE.unknown, { detail: err });
};
