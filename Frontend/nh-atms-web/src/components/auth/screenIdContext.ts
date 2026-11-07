import { createContext, useContext } from 'react';

import type { ScreenKey } from '@/screens/screenIds';

/** 현재 화면키 — PageFrame 하위 버튼이 screenKey 를 반복 지정하지 않도록 공유 */
export const ScreenIdContext = createContext<ScreenKey | undefined>(undefined);

/** 가장 가까운 ScreenIdProvider 의 화면키 (없으면 undefined) */
export const useScreenId = (): ScreenKey | undefined => useContext(ScreenIdContext);
