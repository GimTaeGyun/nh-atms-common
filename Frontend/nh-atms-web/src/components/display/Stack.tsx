/** 1셀 다단 복합 표시 (AS-IS 사무소/기번/일련번호 3단, 은행/예금주/계좌 3단). 첫 줄은 본문, 나머지는 작은 글씨 */
export const Stack = ({ lines }: { lines: (string | number | undefined | null)[] }) => (
  <div className="cell-stack">
    {lines.filter((l) => l !== undefined && l !== null && l !== '').map((l, i) => (i === 0 ? <div key={i}>{l}</div> : <small key={i}>{l}</small>))}
  </div>
);
