import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { App, ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/** 테스트 렌더 — 매번 새 react-query 캐시(재시도 없음) + antd App. 목 API(MSW)는 test/setup.ts 가 켠다 */
export const renderWithProviders = (ui: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ConfigProvider>
        <App>{ui}</App>
      </ConfigProvider>
    </QueryClientProvider>,
  );
