import type { ReactNode } from 'react';
import { fmtCount } from '@/utils/format';

interface Props {
  title?: string;
  total?: number | null;
  selected?: number;
  /** 결과 제목 아래/옆 안내문 (예: ※ 코너운영시간은 변경 후 익일부터 적용됩니다.) */
  note?: ReactNode;
  /** 안내문 톤 — AS-IS 빨간 경고문은 danger, 일반 안내는 info(기본) */
  noteTone?: 'danger' | 'info';
  /** 좌측 액션(행 선택 명령 등) */
  leftActions?: ReactNode;
  /** 우측 액션(엑셀/보기 전환 등) */
  children?: ReactNode;
}

/** '조회 결과 (N건) · n건 선택' 헤더 + 좌/우 액션 (시안 B) */
export const ResultHeader = ({ title = '조회 결과', total, selected, note, noteTone = 'info', leftActions, children }: Props) => (
  <div className="result-header">
    <div className="flex" style={{ minWidth: 0, flexWrap: 'wrap' }}>
      <span className="count">
        <b>{title}</b>
        {total !== undefined && total !== null && <span className="n">({fmtCount(total)}건)</span>}
        {!!selected && <span className="sel">{fmtCount(selected)}건 선택</span>}
      </span>
      {note && <span className={`page-note${noteTone === 'info' ? ' info' : ''}`} style={{ margin: 0 }}>{note}</span>}
      {leftActions}
    </div>
    <div className="flex" style={{ flex: 'none' }}>
      {children}
    </div>
  </div>
);
