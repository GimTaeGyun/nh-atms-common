import { create } from 'zustand';
import type { ScreenKey } from '@/screens/screenIds';
import { nowClock } from '@/utils/date';

export type MessageLevel = 'info' | 'success' | 'warn' | 'error';

/** 하단 메시지라인 1건 (AS-IS 메시지라인) */
export interface LineMessage {
  id: number;
  /** 'HH:mm:ss' */
  time: string;
  /** 발생 시각(ms) */
  at: number;
  level: MessageLevel;
  text: string;
  /** 메시지를 낸 화면키(표시는 screenIdOf 로 번호 변환) */
  screenKey?: ScreenKey;
}

/** 보관 개수 */
export const MESSAGE_LINE_MAX = 20;

interface MessageLineState {
  /** 최신 우선 */
  messages: LineMessage[];
  push: (level: MessageLevel, text: string, screenKey?: ScreenKey) => LineMessage;
  clear: () => void;
}

let seq = 0;

export const useMessageLineStore = create<MessageLineState>()((set) => ({
  messages: [],
  push: (level, text, screenKey) => {
    const msg: LineMessage = { id: ++seq, time: nowClock(), at: Date.now(), level, text, screenKey };
    set((s) => ({ messages: [msg, ...s.messages].slice(0, MESSAGE_LINE_MAX) }));
    return msg;
  },
  clear: () => set({ messages: [] }),
}));

/** React 밖(쿼리 onError·http 인터셉터 등)에서도 쓰는 메시지 추가 */
export const pushMessage = (level: MessageLevel, text: string, screenKey?: ScreenKey): LineMessage => useMessageLineStore.getState().push(level, text, screenKey);

export const clearMessages = (): void => useMessageLineStore.getState().clear();
