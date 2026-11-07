/**
 * 디자인 토큰 — GUI 시안 v0.6 Concept B(라이트) + A 아이콘 레일(NH 블루) 색상 실측값.
 * CSS 변수(global.css)와 antd 테마(antdTheme.ts)의 단일 원천.
 */
export const colors = {
  /** NH 브랜드 블루 — 아이콘 레일 배경 (시안 A 실측 #0054a6) */
  nhBlue: '#0054a6',
  nhBlueHover: '#005eb8',
  nhBlueActive: '#003b75',
  /** NH 골드 (로고 마크) */
  nhGold: '#ffb81c',
  /** 주요 액션/선택 — 네이비 (시안 B 조회 버튼·선택 메뉴 실측 #054681) */
  primary: '#054681',
  primaryHover: '#0b5aa3',
  primaryActive: '#043a6b',
  /** 강조 숫자(KPI) 블루 */
  accent: '#1d5fcf',
  /** 상태색 */
  success: '#1f9d55',
  successBg: '#e8f7ee',
  danger: '#e0392c',
  dangerBg: '#fdecec',
  warning: '#f59e0b',
  warningBg: '#fff4e0',
  info: '#2f80ed',
  infoBg: '#eaf2ff',
  neutral: '#8c8c8c',
  neutralBg: '#f0f0f0',
  /** 배경/보더/텍스트 */
  bgPage: '#f4f8fd',
  bgPanel: '#ffffff',
  bgSubtle: '#f7fafd',
  bgSearch: '#f3f8fe',
  bgTableHead: '#f1f5fa',
  bgLabelCell: '#eef4fb',
  border: '#dee1e6',
  borderLight: '#e9edf2',
  textPrimary: '#1f2a37',
  textSecondary: '#5f6b7a',
  textMuted: '#8a94a3',
  textOnDark: '#ffffff',
} as const;

export const radius = { sm: 4, md: 6, lg: 10, xl: 14 } as const;

export const layout = {
  headerHeight: 56,
  tabBarHeight: 38,
  railWidth: 64,
  panelWidth: 220,
  contentPadding: 20,
} as const;

export const font = {
  family: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', sans-serif",
  size: 13,
  sizeSm: 12,
  sizeLg: 14,
} as const;
