import { Alert, Descriptions, Tag } from 'antd';
import { useNavStore, findMenuByScreen } from '@/stores/useNavStore';
import { PageFrame } from '@/components/page/PageFrame';
import type { ScreenProps } from '@/types/screen';

/** 레지스트리에 없는(아직 구현되지 않은) 화면의 자동 플레이스홀더 — 메뉴에는 있지만 파일이 없을 때 */
const PlaceholderScreen = ({ screenKey }: ScreenProps) => {
  const menus = useNavStore((s) => s.menus);
  const menu = findMenuByScreen(menus, screenKey);
  return (
    <PageFrame screenKey={screenKey} title={menu?.menuNm ?? screenKey}>
      <Alert type="info" showIcon title="이 화면은 아직 구현되지 않았습니다." description="screens/registry.ts 에 화면을 등록하면 이 자리에 나타납니다(docs/02_프론트_개발가이드.md)." style={{ marginBottom: 16 }} />
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="화면키">{screenKey}</Descriptions.Item>
        <Descriptions.Item label="화면명">{menu?.menuNm ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="대분류">{menu?.l1 ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="메뉴 경로">{menu?.menuPath ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="상태"><Tag>미구현</Tag></Descriptions.Item>
      </Descriptions>
    </PageFrame>
  );
};
export default PlaceholderScreen;
