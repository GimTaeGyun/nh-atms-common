import type { ReactNode } from 'react';
import { useOpenScreen } from '@/screens/navigation';
import { getScreen, screenPath } from '@/screens/registry';
import type { ScreenKey } from '@/screens/screenIds';

/**
 * 안내문 속 화면 링크 — 누르면 그 화면 탭을 연다. 글자를 주지 않으면 레지스트리 제목(없으면 화면키)을 보인다.
 * 화면번호는 쓰지 않는다(설계 Q9).
 */
export const ScreenLink = ({ screenKey, children }: { screenKey: ScreenKey; children?: ReactNode }) => {
  const openScreen = useOpenScreen();
  return (
    <a className="screen-link" onClick={(e) => { e.preventDefault(); openScreen(screenKey); }} href={screenPath(screenKey)}>
      {children ?? getScreen(screenKey)?.title ?? screenKey}
    </a>
  );
};
