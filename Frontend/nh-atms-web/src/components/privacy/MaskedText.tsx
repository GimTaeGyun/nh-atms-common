import { Button, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { applyMask, type MaskKind } from './maskKinds';

export interface MaskedTextProps {
  value?: string | null;
  kind: MaskKind;
  /** 서버가 이미 마스킹한 값 → 그대로 표시 (CC-06 원칙) */
  masked?: boolean;
  /** kind='custom' 마스킹 함수 */
  mask?: (v: string) => string;
  /** 열람 승인된 원문 (있으면 우선 표시) */
  revealed?: string | null;
  /** 주면 '원문 보기' 버튼 표시 (useUnmask().unmask 연결) */
  onReveal?: () => void;
}

/** 개인정보 마스킹 표시 */
export const MaskedText = ({ value, kind, masked, mask, revealed, onReveal }: MaskedTextProps) => {
  const isRevealed = revealed !== null && revealed !== undefined;
  const text = isRevealed ? revealed : masked ? value || '-' : applyMask(kind, value, mask);
  return (
    <span className={`masked-text mono${isRevealed ? ' revealed' : ''}`}>
      {text}
      {!isRevealed && onReveal && value && (
        <Tooltip title="원문 보기 (열람 사유 필요)">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={onReveal} aria-label="원문 보기" style={{ height: 'auto', padding: '0 2px' }} />
        </Tooltip>
      )}
    </span>
  );
};
