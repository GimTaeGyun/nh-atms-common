import type { ReactNode } from 'react';
import { InboxOutlined } from '@ant-design/icons';

export const EmptyState = ({ text = '검색된 데이터가 없습니다.', hint, action, height = 140 }: { text?: string; hint?: string; action?: ReactNode; height?: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: height, color: 'var(--text-muted)', gap: 6 }}>
    <InboxOutlined style={{ fontSize: 26, color: '#c3cdd9' }} />
    <div>{text}</div>
    {hint && <div style={{ fontSize: 12 }}>{hint}</div>}
    {action}
  </div>
);
