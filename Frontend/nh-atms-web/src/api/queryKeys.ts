/**
 * 쿼리 키 — 문자열 키 산재 방지. 업무 묶음은 각 endpoint 파일 안에 `<업무>Keys`(+ `.all` 루트)를 둔다.
 * 예: `lookupKeys`(api/endpoints/lookup.ts), `meKeys`, `menuKeys`. 여기는 그 모음.
 */
import { lookupKeys } from './endpoints/lookup';
import { meKeys } from './endpoints/me';
import { menuKeys } from './endpoints/menu';
import { noticeKeys } from './endpoints/notice';
import { mcnInfoKeys } from './endpoints/mcnInfo';
import { mcnModelKeys } from './endpoints/mcnModel';

export const qk = {
  me: meKeys,
  menu: menuKeys,
  lookup: lookupKeys,
  notice: noticeKeys,
  mcnInfo: mcnInfoKeys,
  mcnModel: mcnModelKeys,
};
