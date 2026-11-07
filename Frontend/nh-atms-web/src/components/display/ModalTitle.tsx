import { screenIdOf, type ScreenKey } from '@/screens/screenIds';

/** 팝업 제목(▍ 제목 [+ 화면번호]) — PageFrame 의 제목 행과 같은 모양. 이 저장소는 번호가 없어(설계 Q9) 매핑 값이 '' 이면 번호를 그리지 않는다 */
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
