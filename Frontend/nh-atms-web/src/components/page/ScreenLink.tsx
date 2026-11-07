import type { ReactNode } from 'react';
import { useOpenScreen } from '@/screens/navigation';
import { screenIdOf, type ScreenKey } from '@/screens/screenIds';

/**
 * 안내문 속 화면번호 링크 — AS-IS '26-1005' 처럼 적힌 번호를 누르면 그 화면 탭을 연다.
 * 글자를 주지 않으면 '26-{ID}' 로 표시한다.
 */
export const ScreenLink = ({ screenKey, children, prefix = '26-' }: { screenKey: ScreenKey; children?: ReactNode; prefix?: string }) => {
  const screenId = screenIdOf(screenKey);
  const openScreen = useOpenScreen();
  return (
    <a className="screen-link" onClick={(e) => { e.preventDefault(); openScreen(screenKey); }} href={`#${screenId}`}>
      {children ?? `${prefix}${screenId}`}
    </a>
  );
};
