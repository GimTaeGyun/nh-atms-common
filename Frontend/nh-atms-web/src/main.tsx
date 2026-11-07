import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { env } from './config/env';
import './theme/global.css';

const bootstrap = async () => {
  if (__MOCK_ENABLED__ && import.meta.env.VITE_MOCK_INLINE === 'true') {
    // 데모 빌드: 서비스 워커 없이 목 핸들러를 앱 안에서 직접 호출 (빌드 시점 상수 → 반대쪽 분기는 번들에서 제거)
    const { installInlineMock } = await import('./mocks/inline');
    installInlineMock();
  } else if (__MOCK_ENABLED__ && env.useMock) {
    // 목 모드에서만 번들에 포함 (동적 import, 운영 빌드는 __MOCK_ENABLED__=false 라 청크도 생기지 않음)
    const { startMockWorker } = await import('./mocks/browser');
    await startMockWorker();
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

void bootstrap();
