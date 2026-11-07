import type { CSSProperties, ReactNode } from 'react';

export interface DetailItem {
  label: ReactNode;
  value: ReactNode;
  /** 차지할 열 수(라벨+값 쌍 기준) */
  span?: number;
  required?: boolean;
  num?: boolean;
  pre?: boolean;
}

interface Props {
  items: DetailItem[];
  /** 라벨/값 쌍의 열 수 */
  cols?: 1 | 2 | 3 | 4;
  labelWidth?: number;
  style?: CSSProperties;
  className?: string;
}

/** 라벨/값 표 그리드 — 상세 팝업(9101)·등록 폼(9300)의 공통 레이아웃 */
export const DetailGrid = ({ items, cols = 2, labelWidth = 130, style, className }: Props) => {
  const template = Array.from({ length: cols }, () => `${labelWidth}px minmax(0, 1fr)`).join(' ');
  return (
    <div className={`detail-grid${className ? ` ${className}` : ''}`} style={{ gridTemplateColumns: template, ...style }}>
      {items.map((it, i) => {
        const span = Math.min(cols, it.span ?? 1);
        return (
          <DetailCell key={i} item={it} span={span} />
        );
      })}
    </div>
  );
};

const DetailCell = ({ item, span }: { item: DetailItem; span: number }) => (
  <>
    <div className={`dg-k${item.required ? ' req' : ''}`}>{item.label}</div>
    <div className={`dg-v${item.num ? ' num' : ''}${item.pre ? ' pre' : ''}`} style={span > 1 ? { gridColumn: `span ${span * 2 - 1}` } : undefined}>
      {item.value ?? <span className="muted">-</span>}
    </div>
  </>
);
