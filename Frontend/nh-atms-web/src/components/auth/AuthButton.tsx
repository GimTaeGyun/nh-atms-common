import type { ReactNode, Ref } from 'react';
import type { ScreenKey } from '@/screens/screenIds';
import { Button, Tooltip, type ButtonProps } from 'antd';
import { DENIED_TEXT, useAllowed, type PermNeed } from './useAllowed';

export interface AuthButtonProps extends ButtonProps {
  /** 화면 ID (생략 시 ScreenIdProvider 값) */
  screenKey?: ScreenKey;
  /** 요구 권한 qry|reg|upd|del|exe|admin (기본 upd) */
  need?: PermNeed;
  /** 권한 없을 때: hide 숨김 / disable 비활성+툴팁 (기본) */
  mode?: 'hide' | 'disable';
  /** 비활성 툴팁 문구 */
  deniedText?: ReactNode;
  /** Popconfirm 등 래퍼가 위치 계산용으로 넘기는 ref (React 19 ref-as-prop) */
  ref?: Ref<HTMLButtonElement | HTMLAnchorElement>;
}

/** 권한 버튼: 권한이 없으면 숨기거나 비활성(툴팁 '권한이 없습니다.') */
export const AuthButton = ({ screenKey, need = 'upd', mode = 'disable', deniedText = DENIED_TEXT, ref, ...rest }: AuthButtonProps) => {
  const allowed = useAllowed(need, screenKey);
  if (allowed) return <Button ref={ref} {...rest} />;
  if (mode === 'hide') return null;
  // 비활성 버튼은 마우스 이벤트가 없어 span 으로 감싸 툴팁을 띄운다
  const { onClick: _onClick, style, ...btn } = rest;
  return (
    <Tooltip title={deniedText}>
      <span className="auth-denied" style={{ display: 'inline-block', cursor: 'not-allowed' }}>
        <Button ref={ref} {...btn} disabled style={{ ...style, pointerEvents: 'none' }} />
      </span>
    </Tooltip>
  );
};

interface AuthGuardProps {
  screenKey?: ScreenKey;
  need?: PermNeed;
  /** 권한 없을 때 대신 보여줄 내용 (기본 null) */
  fallback?: ReactNode;
  children: ReactNode;
}

/** 권한이 있을 때만 children 렌더 */
export const AuthGuard = ({ screenKey, need = 'upd', fallback = null, children }: AuthGuardProps) => {
  const allowed = useAllowed(need, screenKey);
  return <>{allowed ? children : fallback}</>;
};
