import { Tabs } from 'antd';
import { PageFrame } from '@/components/page/PageFrame';
import { PrintLayout } from '@/components/print/PrintLayout';
import { usePrint } from '@/hooks/usePrint';
import { fmtDate, fmtOffice } from '@/utils/format';
import type { ScreenProps } from '@/types/screen';
import { DEMO_ROWS } from './commonModules/demoData';
import DateTab from './commonModules/DateTab';
import ComboTab from './commonModules/ComboTab';
import PopupTab from './commonModules/PopupTab';
import GridTab from './commonModules/GridTab';
import OutputTab from './commonModules/OutputTab';
import AuthMessageTab from './commonModules/AuthMessageTab';

const TITLE = '공통 모듈';
/** 인쇄 견본 행 수 */
const PRINT_ROWS = DEMO_ROWS.slice(0, 15);

/**
 * 공통 모듈 — "가져다 쓰는 부품"을 실제 공통 조회 API(`/api/lookup/*`, `/api/me`, `/api/menu/my`)로 보여 주는 카탈로그(설계 §8.1, §6.2).
 * 전용 백엔드 API 는 없다. 표·출력 시연 자료와 원문 열람·파일 올리기·명령은 화면 안 견본(commonModules/demoData.ts)이다.
 *  - 탭 6개(날짜·콤보·팝업·표·출력·권한·메시지)는 고른 탭만 그린다(destroyOnHidden) — 안 보이는 탭은 API 도 부르지 않는다
 *  - 시연마다 [코드 보기] 로 짧은 사용 예를 보여 준다(CodeSample)
 *  - 인쇄 양식(PrintLayout)은 PageFrame 의 직계 자식이어야 해서 여기 둔다(출력 탭의 [인쇄] 가 부른다)
 * 새 화면은 견본 3개(공지사항·기기정보·기기모델코드) 중 비슷한 것을 복사하고, 부품은 여기서 쓰는 법을 본다.
 */
const CommonModulesPage = ({ screenKey, active }: ScreenProps) => {
  const { print, printing } = usePrint(TITLE);

  return (
    <PageFrame screenKey={screenKey} subtitle="부품 카탈로그 — 시연마다 [코드 보기]">
      <Tabs
        destroyOnHidden
        defaultActiveKey="date"
        items={[
          { key: 'date', label: '날짜', children: <DateTab /> },
          { key: 'combo', label: '콤보', children: <ComboTab /> },
          { key: 'popup', label: '팝업', children: <PopupTab /> },
          { key: 'grid', label: '표', children: <GridTab /> },
          { key: 'output', label: '출력', children: <OutputTab onPrint={() => print()} printing={printing} /> },
          { key: 'auth', label: '권한·메시지', children: <AuthMessageTab screenKey={screenKey} active={active} /> },
        ]}
      />
      <PrintLayout title={`${TITLE} 인쇄 견본`} conditions={[{ label: '자료', value: '화면 안 견본' }, { label: '건수', value: `${PRINT_ROWS.length}건` }]}>
        <table>
          <thead>
            <tr>
              <th>사무소</th>
              <th>기번</th>
              <th>모델</th>
              <th>작성일</th>
              <th>건수</th>
            </tr>
          </thead>
          <tbody>
            {PRINT_ROWS.map((r) => (
              <tr key={r.id}>
                <td>{fmtOffice(r.ofcCode, r.kanm)}</td>
                <td>{r.mcnNo}</td>
                <td>{r.modelNm ?? '-'}</td>
                <td>{fmtDate(r.wrtDate)}</td>
                <td style={{ textAlign: 'right' }}>{r.cnt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintLayout>
    </PageFrame>
  );
};

export default CommonModulesPage;
