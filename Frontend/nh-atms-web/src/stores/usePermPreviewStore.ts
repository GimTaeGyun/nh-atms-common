import { create } from 'zustand';

/**
 * 권한 미리보기 — **화면 표시만 바꾼다. 서버 검사는 언제나 DB 권한(TB_SCR_AUTH_MENU) 기준이다.**
 * 공통 모듈 화면의 스위치로 "조회만 / 조회+등록 / 전부" 를 골라 버튼이 흐려지거나 숨는 모습을 확인한다.
 *  - off: 메뉴 응답의 실제 권한 그대로
 *  - qry: 조회만 가능한 것처럼
 *  - qry+reg: 조회·등록만 가능한 것처럼
 *  - all: 5개 모두 가능한 것처럼
 * 새로고침하면 off 로 돌아간다(저장하지 않음).
 */
export type PermPreview = 'off' | 'qry' | 'qry+reg' | 'all';

interface PermPreviewState {
  preview: PermPreview;
  setPreview: (p: PermPreview) => void;
}

export const usePermPreviewStore = create<PermPreviewState>()((set) => ({
  preview: 'off',
  setPreview: (preview) => set({ preview }),
}));

export const PERM_PREVIEW_OPTIONS: { value: PermPreview; label: string }[] = [
  { value: 'off', label: '실제 권한' },
  { value: 'qry', label: '조회만' },
  { value: 'qry+reg', label: '조회+등록' },
  { value: 'all', label: '전부' },
];
