import { api } from '../http';
import type { MenuTreeNode } from '@/types/menu';

export const menuApi = {
  my: () => api.get<MenuTreeNode[]>('/menu/my'),
};
