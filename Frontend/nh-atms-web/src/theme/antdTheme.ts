import type { ThemeConfig } from 'antd';
import { theme } from 'antd';
import { colors, font, radius } from './tokens';

/**
 * antd 6 테마. 컴팩트 알고리즘 + 시안 B 토큰.
 * 화면 코드에서 색상 하드코딩을 금지하고 이 토큰(또는 CSS 변수)만 쓴다.
 */
export const antdTheme: ThemeConfig = {
  algorithm: theme.compactAlgorithm, // 시안(2026-10-21): 행 높이 약 28px, 12~13px 글자
  cssVar: { prefix: 'nh' },
  hashed: false,
  token: {
    colorPrimary: colors.primary,
    colorInfo: colors.primary,
    colorSuccess: colors.success,
    colorError: colors.danger,
    colorWarning: colors.warning,
    colorLink: colors.primary,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorBorder: colors.border,
    colorBorderSecondary: colors.borderLight,
    colorBgLayout: colors.bgPage,
    colorBgContainer: colors.bgPanel,
    borderRadius: radius.md,
    borderRadiusSM: radius.sm,
    borderRadiusLG: radius.lg,
    fontFamily: font.family,
    fontSize: font.size,
    controlHeight: 30,
    controlHeightSM: 26,
    controlHeightLG: 38,
  },
  components: {
    Table: {
      headerBg: colors.bgTableHead,
      headerColor: colors.textPrimary,
      headerSplitColor: colors.border,
      borderColor: colors.borderLight,
      rowHoverBg: '#eef5ff',
      rowSelectedBg: '#e3efff',
      rowSelectedHoverBg: '#d6e8ff',
      cellPaddingBlockSM: 4,
      cellPaddingInlineSM: 8,
      fontSize: font.size,
      headerBorderRadius: 0,
    },
    Tabs: { itemSelectedColor: colors.primary, inkBarColor: colors.primary, horizontalItemPadding: '8px 14px' },
    Button: { primaryShadow: 'none', defaultShadow: 'none', fontWeight: 500 },
    Card: { headerBg: 'transparent', paddingLG: 16 },
    Modal: { titleFontSize: 15 },
    Form: { itemMarginBottom: 0, labelColor: colors.textPrimary },
    // 현재 페이지 번호: 남색 바탕에 흰 글자(itemActiveColor 를 안 주면 글자도 남색이라 번호가 안 보인다)
    Pagination: { itemActiveBg: colors.primary, itemActiveColor: '#fff', itemActiveColorHover: '#fff' },
    Tag: { borderRadiusSM: 10 },
    Menu: { itemHeight: 34, subMenuItemBg: 'transparent' },
    Segmented: { itemSelectedBg: colors.primary, itemSelectedColor: '#fff' },
  },
};
