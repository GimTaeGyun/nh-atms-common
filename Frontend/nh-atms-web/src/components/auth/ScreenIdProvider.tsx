import type { ReactNode } from 'react';
import { ScreenIdContext } from './screenIdContext';
import type { ScreenKey } from '@/screens/screenIds';

/** 화면 루트에서 한 번 감싸면 하위 AuthButton/AuthGuard/ActionBar 가 screenId 를 자동으로 사용 */
export const ScreenIdProvider = ({ screenKey, children }: { screenKey: ScreenKey; children: ReactNode }) => (
  <ScreenIdContext.Provider value={screenKey}>{children}</ScreenIdContext.Provider>
);
