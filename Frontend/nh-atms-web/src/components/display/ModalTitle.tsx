import { screenIdOf, type ScreenKey } from '@/screens/screenIds';

/** 팝업 제목(▍ 제목 + 화면번호) — PageFrame 의 제목 행과 같은 모양. 번호는 screenKey 로 매핑에서 읽는다(sid 직접 지정은 비표준 팝업용) */
export const ModalTitle = ({ title, screenKey, sid, bar = true }: { title: string; screenKey?: ScreenKey; sid?: string; bar?: boolean }) => {
  const shown = sid ?? (screenKey ? screenIdOf(screenKey) : undefined);
  return (
    <span className="page-title" style={{ display: 'inline-flex' }}>
      {bar && <span className="bar" />}
      <b>{title}</b>
      {shown && <span className="sid">{shown}</span>}
    </span>
  );
};
