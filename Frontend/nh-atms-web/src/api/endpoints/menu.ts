import { api } from '../http';
import type { MenuNode } from '@/types/menu';

/** 내 메뉴 트리(권한 5개 포함) — API 계약 §1 */
export const menuApi = {
  my: () => api.get<MenuNode[]>('/menu/my'),
};

export const menuKeys = {
  all: ['menu'] as const,
  my: ['menu', 'my'] as const,
};
