/** 스크린샷/스모크 대상 화면 (레지스트리와 동일 경로). key = 영문 화면키, 화면번호는 쓰지 않는다 */
import type { ScreenKey } from '@/screens/screenIds';

export const SCREENS: { key: ScreenKey; path: string; title: string; search?: boolean; wait?: string; prefill?: { placeholder: RegExp; value: string }[] }[] = [
  { key: 'home', path: '/home', title: '홈', wait: '.home-card' },
  { key: 'sample.commonModules', path: '/sample/common-modules', title: '공통 모듈' },
  { key: 'sample.notice', path: '/sample/notice', title: '공지사항' },
  { key: 'sample.mcnInfo', path: '/sample/mcn-info', title: '기기정보' },
  { key: 'sample.mcnModel', path: '/sample/mcn-model', title: '기기모델코드' },
];
