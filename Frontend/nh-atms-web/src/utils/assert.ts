export const assertNever = (x: never, msg = 'Unexpected value'): never => {
  throw new Error(`${msg}: ${String(x)}`);
};

/** @deprecated `@/utils/object` 로 옮김 — 남은 import 호환용 */
export { compactParams, isNonEmpty } from './object';
