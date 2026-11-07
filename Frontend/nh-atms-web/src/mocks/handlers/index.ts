/**
 * 목 서버 핸들러 — 업무별 파일을 모은다. 새 화면의 API 는 해당 업무 파일에(없으면 새 파일 + 여기 한 줄).
 * 공통(응답 봉투·페이징·지연·파라미터 기본값)은 `_util.ts`, 데이터 생성은 `../data/*`.
 * 단위 테스트(msw/node)와 브라우저(dev:mock)가 같은 핸들러를 쓴다. `fallbackHandlers` 는 항상 맨 끝.
 */
import { meHandlers } from './me';
import { menuHandlers } from './menu';
import { lookupHandlers } from './lookup';
import { fallbackHandlers } from './fallback';

export const handlers = [
  ...meHandlers,
  ...menuHandlers,
  ...lookupHandlers,
  // 견본 화면 묶음(sample.notice·mcnInfo·mcnModel)은 각 화면 작업에서 여기에 한 줄씩 추가한다
  ...fallbackHandlers,
];
