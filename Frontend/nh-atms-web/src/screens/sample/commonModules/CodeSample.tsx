/**
 * 공통 모듈 화면의 시연 틀 — 시연 1개 = 제목 + 살아 있는 부품 + 선택값 표시 + [코드 보기](짧은 사용 예).
 *  - `Demo`      : 시연 카드(SectionCard). `code` 는 복사해 쓸 짧은 예시 문자열
 *  - `CodeSample`: [코드 보기] 토글 + 예시 코드 <pre>
 *  - `EchoJson`  : 선택값·API 파라미터를 JSON 으로 보여 준다(Dayjs 는 'YYYY-MM-DD' 로)
 */
import { useState, type ReactNode } from 'react';
import { Button } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { SectionCard } from '@/components/display/SectionCard';
import { dayjs } from '@/utils/date';

const preStyle = { margin: '8px 0 0', padding: '8px 10px', borderRadius: 6, fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all' } as const;

/** JSON 표시용 평탄화 — Dayjs → 'YYYY-MM-DD', undefined 는 빠진다(JSON 과 같음) */
export const plain = (v: unknown): unknown => {
  if (dayjs.isDayjs(v)) return v.format('YYYY-MM-DD');
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    Object.keys(v as Record<string, unknown>).forEach((k) => {
      out[k] = plain((v as Record<string, unknown>)[k]);
    });
    return out;
  }
  return v;
};

/** 선택값/파라미터 JSON 표시 */
export const EchoJson = ({ value, label = '값' }: { value: unknown; label?: string }) => (
  <pre className="demo-echo" aria-label={label} style={{ ...preStyle, background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border-light)' }}>
    <span style={{ color: 'var(--text-muted)' }}>{label} = </span>
    {value === undefined ? 'undefined' : JSON.stringify(plain(value), null, 2)}
  </pre>
);

/** [코드 보기] 토글 + 짧은 사용 예 */
export const CodeSample = ({ code, label = '코드 보기' }: { code: string; label?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="demo-code">
      <Button size="small" type="link" icon={<CodeOutlined />} onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{ padding: 0 }}>
        {open ? '코드 닫기' : label}
      </Button>
      {open && (
        <pre className="code-sample" style={{ ...preStyle, background: '#1f2430', color: '#e6e6e6' }}>
          {code.trim()}
        </pre>
      )}
    </div>
  );
};

interface DemoProps {
  title: ReactNode;
  /** 한 줄 설명(근거·주의) */
  desc?: ReactNode;
  /** 짧은 사용 예(복사용) */
  code: string;
  /** 주면 선택값 JSON 을 아래에 표시 */
  echo?: unknown;
  echoLabel?: string;
  children: ReactNode;
}

/** 시연 카드 하나 */
export const Demo = ({ title, desc, code, echo, echoLabel, children }: DemoProps) => (
  <SectionCard title={title} sub={desc} style={{ marginBottom: 12 }}>
    {children}
    {echo !== undefined && <EchoJson value={echo} label={echoLabel} />}
    <CodeSample code={code} />
  </SectionCard>
);

/** 2열 배치(좁으면 1열) */
export const DemoGrid = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, alignItems: 'start' }}>{children}</div>
);
