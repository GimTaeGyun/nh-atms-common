import type { ReactNode } from 'react';

export interface EchoCell {
  label: string;
  value: ReactNode;
  tone?: 'danger' | 'warn';
  align?: 'left' | 'right';
}

/** 조회 조건/집계 요약 바(AS-IS 에코바·집계현황표) */
export const EchoBar = ({ cells, columns, template }: { cells: EchoCell[]; columns?: number; template?: string }) => (
  <div className="echo-bar" style={template ? { gridTemplateColumns: template } : columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>
    {cells.map((c, i) => (
      <div className="cell" key={i}>
        <span className="k">{c.label}</span>
        <span className={`v${c.align === 'left' ? ' left' : ''}${c.tone ? ` ${c.tone}` : ''}`}>{c.value}</span>
      </div>
    ))}
  </div>
);
