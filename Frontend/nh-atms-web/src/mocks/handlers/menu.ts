import { http } from 'msw';
import { MENU_TREE } from '../data/menu';
import { LATENCY, ok } from './_util';

export const menuHandlers = [
  http.get('/api/menu/my', async () => {
    await LATENCY();
    return ok(MENU_TREE);
  }),
];
