import { dayjs } from './date';
import { saveBlob } from './download';

export interface ExcelColumn<T> {
  title: string;
  /** 데이터 키 또는 커스텀 추출 함수 */
  key: keyof T | ((row: T) => unknown);
  width?: number;
}

/**
 * 클라이언트 엑셀 다운로드(현재 조회 결과). 대량·전건은 서버 /export 사용(CC-32).
 * xlsx(약 400KB)는 첫 다운로드 때만 불러온다 — 초기 번들에 넣지 않는다.
 */
export const downloadExcel = async <T extends object>(columns: ExcelColumn<T>[], rows: T[], fileName: string, sheetName = 'Sheet1'): Promise<void> => {
  const XLSX = await import('xlsx');
  const header = columns.map((c) => c.title);
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = typeof c.key === 'function' ? c.key(r) : (r as Record<string, unknown>)[c.key as string];
      return v === null || v === undefined ? '' : v;
    }),
  );
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? Math.max(c.title.length * 2, 12) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  saveBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${fileName}_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
};
