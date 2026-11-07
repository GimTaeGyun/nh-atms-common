export interface Brand {
  /** 은행명 */
  bankName: string;
  /** 로고 이미지 경로 (null 이면 문자 마크) */
  logoSrc: string | null;
  logoAlt: string;
  /** 문자 마크 (로고 이미지가 없을 때) */
  markText: string;
}

/** 표기 브랜드 — [원본] nh-atms `src/config/brand.ts` 에서 데모·중립 표기 분기를 뺐다 */
export const brand: Brand = { bankName: 'NH농협은행', logoSrc: `${import.meta.env.BASE_URL}nh-logo.png`, logoAlt: 'NH농협은행', markText: '' };
