import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Popover } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, InfoCircleFilled, UpOutlined } from '@ant-design/icons';
import { useMessageLineStore, type LineMessage, type MessageLevel } from '@/stores/useMessageLineStore';
import { screenIdOf, type ScreenKey } from '@/screens/screenIds';

const LEVEL: Record<MessageLevel, { color: string; icon: ReactNode; label: string }> = {
  info: { color: 'var(--info)', icon: <InfoCircleFilled />, label: '안내' },
  success: { color: 'var(--success)', icon: <CheckCircleFilled />, label: '완료' },
  warn: { color: 'var(--warning)', icon: <ExclamationCircleFilled />, label: '주의' },
  error: { color: 'var(--danger)', icon: <CloseCircleFilled />, label: '오류' },
};

const Row = ({ m }: { m: LineMessage }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '5px 2px', borderBottom: '1px dashed var(--border-light)' }}>
    <span className="mono muted" style={{ flex: 'none' }}>{m.time}</span>
    <span style={{ color: LEVEL[m.level].color, flex: 'none' }} aria-label={LEVEL[m.level].label}>{LEVEL[m.level].icon}</span>
    {m.screenKey && <span className="muted" style={{ flex: 'none', fontSize: 11 }}>[{screenIdOf(m.screenKey)}]</span>}
    <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-all' }}>{m.text}</span>
  </div>
);

interface Props {
  /** 이 화면키 메시지만 (없으면 전체) */
  screenKey?: ScreenKey;
  style?: CSSProperties;
  className?: string;
}

/**
 * AS-IS 하단 메시지라인 — 마지막 메시지 1줄(높이 26px) + 최근 메시지 목록(팝오버, 지우기).
 * 메시지는 pushMessage(level, text, screenKey) 로 넣는다(React 밖에서도 가능). 레이아웃 배치는 셸에서 결정.
 */
export const MessageLine = ({ screenKey, style, className }: Props) => {
  const all = useMessageLineStore((s) => s.messages);
  const clear = useMessageLineStore((s) => s.clear);
  const [open, setOpen] = useState(false);
  const list = screenKey ? all.filter((m) => m.screenKey === screenKey) : all;
  const last = list[0];

  const content = (
    <div style={{ width: 460 }}>
      <div className="flex-between" style={{ marginBottom: 4 }}>
        <span style={{ fontWeight: 700 }}>
          최근 메시지 <span className="muted" style={{ fontWeight: 400 }}>({list.length}건)</span>
        </span>
        <Button size="small" onClick={() => { clear(); setOpen(false); }} disabled={all.length === 0}>
          지우기
        </Button>
      </div>
      <div style={{ maxHeight: 320, overflow: 'auto' }}>
        {list.length === 0 ? <div className="muted" style={{ padding: '12px 0', textAlign: 'center' }}>메시지가 없습니다.</div> : list.map((m) => <Row key={m.id} m={m} />)}
      </div>
    </div>
  );

  return (
    <div
      className={`message-line no-print${className ? ` ${className}` : ''}`}
      role="status"
      aria-live="polite"
      style={{ display: 'flex', alignItems: 'center', gap: 8, height: 26, padding: '0 6px 0 12px', fontSize: 12, background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-light)', color: 'var(--text-secondary)', ...style }}
    >
      {last ? (
        <>
          <span style={{ color: LEVEL[last.level].color, display: 'flex' }} aria-label={LEVEL[last.level].label}>{LEVEL[last.level].icon}</span>
          <span className="mono muted">{last.time}</span>
          <span className="ellipsis" style={{ flex: 1, minWidth: 0, color: last.level === 'error' ? 'var(--danger)' : 'var(--text)' }} title={last.text}>
            {last.text}
          </span>
        </>
      ) : (
        <span className="muted" style={{ flex: 1 }}>메시지가 없습니다.</span>
      )}
      <Popover open={open} onOpenChange={setOpen} trigger="click" placement="topRight" content={content} arrow={false}>
        <Button size="small" type="text" icon={<UpOutlined />} aria-label="최근 메시지" style={{ height: 22 }}>
          {list.length > 0 ? list.length : null}
        </Button>
      </Popover>
    </div>
  );
};
