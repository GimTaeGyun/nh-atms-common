import { Spin } from 'antd';

export const LoadingBlock = ({ tip = '불러오는 중…', height = 160 }: { tip?: string; height?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: 'var(--text-muted)', gap: 10 }}>
    <Spin size="small" /> {tip}
  </div>
);
