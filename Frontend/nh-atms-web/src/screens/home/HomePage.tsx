import { Card, Col, Row, Typography } from 'antd';
import { AppstoreOutlined, DatabaseOutlined, NotificationOutlined, TableOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { PageFrame } from '@/components/page/PageFrame';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOpenScreen } from '@/screens/navigation';
import type { ScreenKey } from '@/screens/screenIds';
import type { ScreenProps } from '@/types/screen';
import './home.css';

/** 홈에 보이는 견본 화면 — 새 화면은 셋 중 비슷한 CRUD 모양을 복사해서 시작한다(설계 §0) */
const CARDS: { key: ScreenKey; title: string; desc: string; icon: ReactNode }[] = [
  { key: 'sample.commonModules', title: '공통 모듈', desc: '날짜·콤보·팝업·표·엑셀·권한·마스킹 부품을 실제 API 로 보여 주는 카탈로그', icon: <AppstoreOutlined /> },
  { key: 'sample.notice', title: '공지사항', desc: '팝업형 CRUD 견본 (TB_NOTICE)', icon: <NotificationOutlined /> },
  { key: 'sample.mcnInfo', title: '기기정보', desc: '목록/편집 탭형 견본 (TB_MCN_INFO)', icon: <DatabaseOutlined /> },
  { key: 'sample.mcnModel', title: '기기모델코드', desc: '표 직접 편집·일괄 저장형 견본 (TB_CO_MODEL)', icon: <TableOutlined /> },
];

/** 홈 — 나(고정 사용자) 인사 + 견본 화면 바로가기 */
const HomePage = ({ screenKey }: ScreenProps) => {
  const me = useAuthStore((s) => s.me);
  const openScreen = useOpenScreen();
  return (
    <PageFrame screenKey={screenKey} title="홈">
      <Typography.Paragraph className="home-hello">
        <b>{me?.name ?? '-'}</b>님{me?.kanm ? ` (${me.kanm})` : ''}, NH-ATMS 공통 뼈대 + 견본입니다. 아래 견본 화면을 열어 보세요.
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        {CARDS.map((c) => (
          <Col key={c.key} xs={24} md={12} xl={6}>
            <Card hoverable className="home-card" onClick={() => openScreen(c.key)} role="link" aria-label={c.title}>
              <div className="home-card-icon">{c.icon}</div>
              <div className="home-card-title">{c.title}</div>
              <div className="home-card-desc">{c.desc}</div>
            </Card>
          </Col>
        ))}
      </Row>
    </PageFrame>
  );
};
export default HomePage;
