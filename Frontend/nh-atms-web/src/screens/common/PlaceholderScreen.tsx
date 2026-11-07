import { Alert, Descriptions, Tag } from 'antd';
import { useNavStore, findMenuByScreen } from '@/stores/useNavStore';
import { PageFrame } from '@/components/page/PageFrame';
import type { ScreenProps } from '@/types/screen';

/** 레지스트리에 없는(아직 구현되지 않은) 화면의 자동 플레이스홀더 — 진척 가시화(§5.3-5) */
const PlaceholderScreen = ({ screenKey, screenId }: ScreenProps) => {
  const menus = useNavStore((s) => s.menus);
  const menu = findMenuByScreen(menus, screenKey);
  return (
    <PageFrame screenKey={screenKey} title={menu?.menuName ?? screenId}>
      <Alert type="info" showIcon title="이 화면은 아직 구현되지 않았습니다." description="AS-IS 화면 명세(Document/3.구현계획)와 공통 컴포넌트(components/)를 기준으로 화면 작업패키지(WP) 순서에 따라 구현됩니다." style={{ marginBottom: 16 }} />
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="화면 ID">{screenId}</Descriptions.Item>
        <Descriptions.Item label="화면명">{menu?.menuName ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="대분류">{menu?.l1 ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="폴더">{menu?.folder ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="관리자 전용">{menu?.adminYn === 'Y' ? <Tag color="blue">A</Tag> : '-'}</Descriptions.Item>
        <Descriptions.Item label="상태"><Tag>미구현</Tag></Descriptions.Item>
      </Descriptions>
    </PageFrame>
  );
};
export default PlaceholderScreen;
