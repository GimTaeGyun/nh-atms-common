import React from 'react';
import { Button, Result } from 'antd';

interface Props {
  children: React.ReactNode;
  /** 탭 제목 등 식별자 (로그용) */
  scope?: string;
  compact?: boolean;
}
interface State {
  error: Error | null;
}

/** 탭(화면) 단위 오류 격리 — 한 화면의 렌더 오류가 앱 전체를 내리지 않게 한다(B7-FE-09) */
export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // 운영: /api/log/client-error 로 전송(백엔드 B7-BE-04). 여기서는 콘솔.
    console.error(`[ErrorBoundary:${this.props.scope ?? '-'}]`, error, info.componentStack);
  }

  override render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <Result
        status="error"
        title="화면 처리 중 오류가 발생했습니다"
        subTitle={this.props.compact ? this.state.error.message : '계속 반복되면 시스템 관리자에게 문의해 주세요.'}
        style={{ padding: this.props.compact ? 16 : 48 }}
        extra={
          <Button type="primary" onClick={() => this.setState({ error: null })}>
            다시 시도
          </Button>
        }
      />
    );
  }
}
