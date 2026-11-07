import { api } from '../http';
import type { Me } from '@/types/auth';

/** 나(고정 사용자) — API 계약 §1. 실패하면 401 ME_001(서버 문구 그대로 표시) */
export const meApi = {
  get: () => api.get<Me>('/me'),
};

export const meKeys = {
  all: ['me'] as const,
};
