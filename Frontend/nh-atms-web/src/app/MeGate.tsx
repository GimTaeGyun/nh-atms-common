import { useEffect, type ReactNode } from 'react';
import { Button, Result, Typography } from 'antd';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';

/**
 * 나(고정 사용자) 확인 관문 — 앱 시작 때 `GET /api/me` 를 한 번 읽는다(설계 Q1, 계약 §1).
 *  - 읽는 중: 로딩
 *  - 실패(401 ME_001 등): 서버 문구를 화면 전체에 그대로 보여 준다. 로그인 화면으로 보내지 않는다(되돌이 없음).
 *    문구는 서버 응답코드 테이블이 만든다(예: "고정 사용자 개인번호가 없거나 … FixedUserConfig.PER_NO 를 확인하세요.").
 *  - 성공: children(앱 셸)
 */
export const MeGate = ({ children }: { children: ReactNode }) => {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const loadMe = useAuthStore((s) => s.loadMe);

  useEffect(() => {
    if (status === 'idle') void loadMe();
  }, [status, loadMe]);

  if (status === 'ready') return <>{children}</>;
  if (status === 'error') {
    return (
      <div className="me-gate" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <Result
          status="warning"
          title="사용자 정보를 확인할 수 없습니다"
          subTitle={
            <>
              <div role="alert" data-testid="me-error">{error?.message}</div>
              {error?.code && <Typography.Text type="secondary" style={{ fontSize: 12 }}>응답코드 {error.code}</Typography.Text>}
            </>
          }
          extra={<Button type="primary" onClick={() => void loadMe(true)}>다시 시도</Button>}
        />
      </div>
    );
  }
  return <LoadingBlock tip="사용자 정보를 확인하는 중…" height={400} />;
};
