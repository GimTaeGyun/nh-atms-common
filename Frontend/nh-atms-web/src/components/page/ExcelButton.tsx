import { Button } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';

/** '엑셀 다운로드' 버튼(시안 2026-10-21) — 결과가 없으면 비활성. 문구는 통일, 꼭 필요할 때만 label 로 바꾼다 */
export const ExcelButton = ({ onClick, disabled, label = '엑셀 다운로드', loading }: { onClick: () => void; disabled?: boolean; label?: string; loading?: boolean }) => (
  <Button icon={<FileExcelOutlined style={{ color: '#217346' }} />} onClick={onClick} disabled={disabled} loading={loading}>
    {label}
  </Button>
);
