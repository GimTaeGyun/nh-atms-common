import { beforeEach, describe, expect, it } from 'vitest';
import { MESSAGE_LINE_MAX, clearMessages, pushMessage, useMessageLineStore } from '@/stores/useMessageLineStore';

describe('useMessageLineStore', () => {
  beforeEach(() => clearMessages());

  it('최신 우선으로 쌓고 최대 20건만 보관한다', () => {
    for (let i = 1; i <= 25; i++) pushMessage(i % 2 ? 'info' : 'error', `메시지 ${i}`, 'sample.notice');
    const list = useMessageLineStore.getState().messages;
    expect(MESSAGE_LINE_MAX).toBe(20);
    expect(list).toHaveLength(20);
    expect(list[0].text).toBe('메시지 25');
    expect(list[19].text).toBe('메시지 6');
    expect(list[0]).toMatchObject({ level: 'info', screenKey: 'sample.notice' });
    expect(list[0].time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('지우기', () => {
    pushMessage('warn', 'a');
    clearMessages();
    expect(useMessageLineStore.getState().messages).toEqual([]);
  });
});
