import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { nowDisplay } from '@/utils/date';
import './print.css';

export interface PrintCondition {
  label: ReactNode;
  value: ReactNode;
}

interface Props {
  /** 출력물 제목 */
  title: ReactNode;
  /** 조회조건 (라벨/값) */
  conditions?: PrintCondition[];
  /** 조회조건 표의 라벨/값 쌍 열 수 (기본 4) */
  condCols?: number;
  /** 본문 (인쇄용 표 등) */
  children: ReactNode;
  /** 출력자 (기본: 로그인 사용자) */
  printedBy?: string;
  /** 출력일시 (기본: 인쇄 시점) */
  printedAt?: string;
  className?: string;
}

/**
 * 인쇄 양식 — 화면에서는 숨고 @media print 에서만 보인다(.print-only).
 * PageFrame 의 직계 자식으로 두면 인쇄 시 같은 화면의 나머지 영역은 빠지고 이 양식만 A4 가로로 출력된다.
 */
export const PrintLayout = ({ title, conditions, condCols = 4, children, printedBy, printedAt, className }: Props) => {
  const user = useAuthStore((s) => s.user);
  const [stamp, setStamp] = useState(nowDisplay);
  // Ctrl+P 로 인쇄해도 출력일시가 그 시점이 되게
  useEffect(() => {
    const onBefore = () => setStamp(nowDisplay());
    window.addEventListener('beforeprint', onBefore);
    return () => window.removeEventListener('beforeprint', onBefore);
  }, []);

  const by = printedBy ?? (user ? `${user.userName}${user.deptName ? ` (${user.deptName})` : ''}` : '-');
  const at = printedAt ?? stamp;
  const rows: PrintCondition[][] = [];
  (conditions ?? []).forEach((c, i) => {
    if (i % condCols === 0) rows.push([]);
    rows[rows.length - 1].push(c);
  });

  return (
    <div className={`print-only print-layout${className ? ` ${className}` : ''}`}>
      <div className="pl-head">
        <h1 className="pl-title">{title}</h1>
        <div className="pl-meta">출력일시 {at}</div>
      </div>
      {rows.length > 0 && (
        <table className="pl-cond">
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <PrintCell key={ci} c={c} />
                ))}
                {ri === rows.length - 1 && r.length < condCols && <td colSpan={(condCols - r.length) * 2} />}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pl-body">{children}</div>
      <div className="pl-foot">
        <span>출력자 : {by}</span>
        <span>출력일시 : {at}</span>
      </div>
    </div>
  );
};

const PrintCell = ({ c }: { c: PrintCondition }) => (
  <>
    <th>{c.label}</th>
    <td>{c.value ?? '-'}</td>
  </>
);
