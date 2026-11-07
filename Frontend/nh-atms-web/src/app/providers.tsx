import type { ReactNode } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { antdTheme } from '@/theme/antdTheme';
import { AppMessageBridge } from '@/components/feedback/AppMessageBridge';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider locale={koKR} theme={antdTheme} form={{ validateMessages: { required: '${label} 항목을 입력하세요.' } }}>
      <AntApp message={{ maxCount: 3, duration: 2.5 }} notification={{ placement: 'bottomRight' }}>
        <AppMessageBridge />
        <ErrorBoundary scope="root">{children}</ErrorBoundary>
      </AntApp>
    </ConfigProvider>
  </QueryClientProvider>
);
