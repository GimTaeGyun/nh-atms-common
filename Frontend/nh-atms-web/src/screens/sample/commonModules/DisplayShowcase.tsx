/**
 * 권한·메시지 탭의 표시 부품 모음 — StatusTag·ResultTag·YnIcon·KpiCard·SectionCard·Stack·EchoBar, 그리고 useAutoRefresh.
 */
import { useState } from 'react';
import { Space, Switch } from 'antd';
import { KpiCard } from '@/components/display/KpiCard';
import { SectionCard } from '@/components/display/SectionCard';
import { Stack } from '@/components/display/Stack';
import { ResultTag, StatusTag, YnIcon, type Tone } from '@/components/display/StatusTag';
import { EchoBar } from '@/components/page/EchoBar';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { nowClock } from '@/utils/date';
import { Demo } from './CodeSample';

const TONES: { tone: Tone; label: string }[] = [
  { tone: 'success', label: '정상' },
  { tone: 'danger', label: '장애' },
  { tone: 'warning', label: '주의' },
  { tone: 'info', label: '안내' },
  { tone: 'neutral', label: '미사용' },
];

/** 자동 새로고침 간격(ms) */
export const AUTO_REFRESH_MS = 2000;

/** useAutoRefresh — 켜 두면 2초마다 카운터 +1. 다른 탭으로 가면(active=false) 쉬고, 브라우저 탭이 숨어도 쉰다 */
export const AutoRefreshDemo = ({ active }: { active: boolean }) => {
  const [on, setOn] = useState(false);
  const [count, setCount] = useState(0);
  const [at, setAt] = useState<string | null>(null);
  useAutoRefresh(on, AUTO_REFRESH_MS, () => {
    setCount((n) => n + 1);
    setAt(nowClock());
  }, active);
  return (
    <Demo
      title="자동 새로고침 (useAutoRefresh)"
      desc="현황 화면용. 화면 탭이 비활성이거나 브라우저 탭이 숨으면 멈추고, 다시 보이면 즉시 1회."
      code={`useAutoRefresh(autoOn, 30_000, () => void search.refetch(), active);   // active = 화면 props.active`}
      echo={{ on, active, count, lastAt: at }}
      echoLabel="상태"
    >
      <Space>
        <Switch checked={on} onChange={setOn} aria-label="자동 새로고침" />
        <span>
          {AUTO_REFRESH_MS / 1000}초마다 · {on ? (active ? '동작 중' : '멈춤(탭 비활성)') : '꺼짐'} · <b data-testid="auto-count">{count}</b>회
        </span>
      </Space>
    </Demo>
  );
};

export const DisplayShowcase = () => (
  <Demo
    title="표시 부품 (StatusTag · ResultTag · YnIcon · KpiCard · SectionCard · Stack · EchoBar)"
    code={`<StatusTag tone="danger">장애</StatusTag>  <ResultTag value="정상" />  <YnIcon value="Y" />
<KpiCard label="전체" value={120} unit="대" tone="info" delta={3} />
<SectionCard title="제목" sub="부제" extra={<Button />}>…</SectionCard>
<Stack lines={['에이텍', 'ATM-3200']} />
<EchoBar columns={4} cells={[{ label: '사무소', value: '[000080] 테크부문', align: 'left' }, …]} />`}
  >
    <Space wrap style={{ marginBottom: 10 }}>
      {TONES.map((t) => (
        <StatusTag key={t.tone} tone={t.tone}>
          {t.label}
        </StatusTag>
      ))}
      <ResultTag value="정상" />
      <ResultTag value="오류" />
      <span>
        Y <YnIcon value="Y" /> N <YnIcon value="N" />
      </span>
      <Stack lines={['에이텍', 'ATM-3200']} />
    </Space>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 10 }}>
      <KpiCard label="전체 기기" value={120} unit="대" tone="info" />
      <KpiCard label="정상" value={112} unit="대" tone="success" delta={3} />
      <KpiCard label="장애" value={8} unit="대" tone="danger" delta={-1} deltaGoodWhenUp={false} sub="전일 대비" />
    </div>
    <SectionCard title="SectionCard 제목" sub="부제(기준 시각 등)" style={{ marginBottom: 10 }}>
      카드 안 내용
    </SectionCard>
    <EchoBar
      columns={4}
      cells={[
        { label: '사무소', value: '[000080] 테크부문', align: 'left' },
        { label: '기간', value: '2026-10-08 ~ 2026-11-07' },
        { label: '장애', value: '8', tone: 'danger' },
        { label: '주의', value: '2', tone: 'warn' },
      ]}
    />
  </Demo>
);
