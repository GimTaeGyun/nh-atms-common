import { useState, type ReactNode } from 'react';
import { Button, Tooltip } from 'antd';
import { StatusTag } from '@/components/display/StatusTag';

export interface RowCommandResult {
  ok: boolean;
  /** 셀에 짧게 보여줄 결과(예: 'OK 12ms', '응답 없음') */
  text?: string;
}

interface Props {
  label: ReactNode;
  /** 행 단위 명령 실행. 성공/실패와 짧은 결과 문구를 돌려준다 */
  run: () => Promise<RowCommandResult>;
  disabled?: boolean;
  size?: 'small' | 'middle';
  /** 결과 문구를 버튼 옆에 표시(기본 true) */
  showResult?: boolean;
}

/**
 * 그리드 행마다 두는 원격명령 버튼(4001 접속재시도, 4101 PING 등).
 * 누르면 로딩 → 결과 태그(성공/실패)를 같은 셀에 표시한다. 폴링이 필요한 긴 명령은 useCommandPoll 을 run 안에서 쓴다.
 */
export const RowCommandButton = ({ label, run, disabled, size = 'small', showResult = true }: Props) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RowCommandResult | null>(null);
  const onClick = async () => {
    setLoading(true);
    try {
      setResult(await run());
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : '실패' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Button size={size} onClick={() => void onClick()} loading={loading} disabled={disabled}>{label}</Button>
      {showResult && result && (
        <Tooltip title={result.text}>
          <span><StatusTag tone={result.ok ? 'success' : 'danger'} icon={false}>{result.text ?? (result.ok ? '성공' : '실패')}</StatusTag></span>
        </Tooltip>
      )}
    </span>
  );
};
