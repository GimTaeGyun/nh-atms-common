import { PageFrame } from '@/components/page/PageFrame';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { ScreenProps } from '@/types/screen';

/** 기기모델코드 — 자리표시(뼈대 단계). 견본 화면 작업에서 이 파일을 통째로 바꾼다 */
const McnModelPage = ({ screenKey }: ScreenProps) => (
  <PageFrame screenKey={screenKey}>
    <EmptyState text="준비 중" hint="견본 화면 작업에서 채웁니다." />
  </PageFrame>
);
export default McnModelPage;
