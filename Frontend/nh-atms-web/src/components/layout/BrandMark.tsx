import { brand } from '@/config/brand';

/** 로고 — 실제 빌드는 은행 로고 이미지, 데모 빌드는 중립 문자 마크 */
export const BrandMark = ({ height = 26 }: { height?: number }) =>
  brand.logoSrc ? (
    <img src={brand.logoSrc} alt={brand.logoAlt} style={{ height }} />
  ) : (
    <span className="brand-mark" style={{ height, fontSize: Math.round(height * 0.46) }} aria-label="자동화기기 종합관리시스템">
      {brand.markText}
    </span>
  );
