/**
 * 화면키 목록 — 소스(파일명·라우트·화면 간 이동·팝업 제목·권한)는 전부 이 영문 화면키를 쓴다.
 * 키 규칙: `{대분류 slug}.{camelCase 이름}`, 팝업은 `popup.{이름}`. 라우트는 `/{slug}/{kebab 이름}`.
 *
 * 화면번호: 이 저장소의 견본은 AS-IS 번호가 없어 **번호를 쓰지 않는다**(설계 Q9). 그래서 값은 모두 '' 이고
 * `screenIdOf()` 도 '' 를 돌려준다 → PageFrame·ModalTitle·화면 검색은 번호 자리를 그리지 않는다.
 * 새 화면을 추가할 때도 번호 없이 키만 한 줄 넣는다(값 '').
 */
export const SCREEN_IDS = {
  // ---- home ----
  'home': '',
  // ---- 견본(sample) ----
  'sample.commonModules': '',
  'sample.notice': '',
  'sample.mcnInfo': '',
  'sample.mcnModel': '',
  // ---- 팝업 ----
  'popup.officeSearch': '',
  'popup.personSearch': '',
  'popup.mcnSearch': '',
  'popup.noticeEdit': '',
  'popup.noticeView': '',
} as const;

export type ScreenKey = keyof typeof SCREEN_IDS;

export const HOME_SCREEN_KEY: ScreenKey = 'home';

/** 화면키 → 표시용 화면번호. 이 저장소는 번호가 없어 항상 '' (호출하는 쪽은 빈 값이면 번호를 그리지 않는다) */
export const screenIdOf = (key: ScreenKey | string): string => (SCREEN_IDS as Record<string, string>)[key] ?? '';

export const isScreenKey = (v: unknown): v is ScreenKey => typeof v === 'string' && v in SCREEN_IDS;
