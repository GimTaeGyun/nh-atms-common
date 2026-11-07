import type { CSSProperties, ReactNode } from 'react';

interface Props {
  title?: ReactNode;
  sub?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  className?: string;
}

/** 흰 카드 섹션 (대시보드/통계 블록) */
export const SectionCard = ({ title, sub, extra, children, style, bodyStyle, className }: Props) => (
  <div className={`panel${className ? ` ${className}` : ''}`} style={style}>
    {(title || extra) && (
      <div className="flex-between" style={{ padding: '12px 16px 0' }}>
        <div className="section-title">
          {title}
          {sub && <span className="sub">{sub}</span>}
        </div>
        {extra}
      </div>
    )}
    <div className="panel-body" style={bodyStyle}>
      {children}
    </div>
  </div>
);
