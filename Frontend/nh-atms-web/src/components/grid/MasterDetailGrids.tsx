import { useState, type ReactNode } from 'react';
import { SectionCard } from '@/components/display/SectionCard';

export interface MasterDetailGridsProps<M> {
  masterTitle: ReactNode;
  detailTitle: ReactNode | ((master: M | null) => ReactNode);
  /** 상단 마스터 영역. `select(row)` 를 행 클릭에 연결 */
  master: (ctx: { select: (row: M | null) => void; selected: M | null }) => ReactNode;
  /** 하단 디테일 영역. 마스터가 없으면 안내문만 */
  detail: (master: M) => ReactNode;
  masterExtra?: ReactNode | ((selected: M | null) => ReactNode);
  detailExtra?: ReactNode | ((master: M | null) => ReactNode);
  emptyText?: string;
  /** 좌우 배치(기본 상하) */
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * 마스터(상단) 선택 → 디테일(하단) 편집 레이아웃(7202 AriTAMS 코드, 7208 업체/모델).
 * 각 영역에는 EditableGrid 나 DataGrid 를 넣고, 저장/삭제 버튼은 extra 로 둔다.
 */
export function MasterDetailGrids<M>({ masterTitle, detailTitle, master, detail, masterExtra, detailExtra, emptyText = '상단 목록에서 항목을 선택하세요.', layout = 'vertical', className }: MasterDetailGridsProps<M>) {
  const [selected, setSelected] = useState<M | null>(null);
  const fn = <X,>(v: X | ((m: M | null) => X)): X => (typeof v === 'function' ? (v as (m: M | null) => X)(selected) : v);
  return (
    <div className={className} style={layout === 'horizontal' ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } : { display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionCard title={masterTitle} extra={fn(masterExtra)}>{master({ select: setSelected, selected })}</SectionCard>
      <SectionCard title={fn(detailTitle)} extra={fn(detailExtra)}>
        {selected ? detail(selected) : <div className="grid-empty">{emptyText}</div>}
      </SectionCard>
    </div>
  );
}
