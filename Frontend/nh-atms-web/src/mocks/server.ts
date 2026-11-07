import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** vitest 용 */
export const server = setupServer(...handlers);
