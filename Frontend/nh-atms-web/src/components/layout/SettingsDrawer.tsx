import { Button, Divider, Drawer, Form, InputNumber, Select, Switch, Typography } from 'antd';
import { env } from '@/config/env';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNavStore } from '@/stores/useNavStore';
import { PANEL_AUTO_COLLAPSE_BELOW } from '@/config/constants';

/** 환경설정(사용자 PC 저장): 사이드 패널/상단 메뉴/페이지 크기/알림 */
export const SettingsDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const s = useSettingsStore();
  const setPanelCollapsed = useNavStore((st) => st.setPanelCollapsed);
  const menuSource = useNavStore((st) => st.menuSource);
  return (
    <Drawer title="환경설정" open={open} onClose={onClose} size={380}>
      <Form layout="vertical" size="middle">
        <Form.Item label={`좁은 화면(${PANEL_AUTO_COLLAPSE_BELOW}px 미만)에서 사이드바 기본 접힘`} extra="접힌 상태에서는 왼쪽 아이콘 줄에 마우스를 올리면 메뉴가 펼쳐집니다.">
          <Switch checked={s.collapseOnNarrow} onChange={(v) => s.update({ collapseOnNarrow: v })} />
        </Form.Item>
        <Form.Item label="상단 1뎁스 메뉴 표시" extra="끄면 왼쪽 아이콘 줄이 항상 보이고, 아이콘 줄로 대분류를 이동합니다.">
          <Switch checked={s.showTopNav} onChange={(v) => s.update({ showTopNav: v })} />
        </Form.Item>
        <Form.Item label="조회 결과 기본 페이지 크기">
          <Select value={s.pageSize} onChange={(v) => s.update({ pageSize: v })} options={[20, 50, 100].map((n) => ({ value: n, label: `${n}건` }))} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="신규 장애 발생 시 알림 사운드">
          <Switch checked={s.alarmSound} onChange={(v) => s.update({ alarmSound: v })} />
        </Form.Item>
        <Form.Item label="브라우저 새로고침 시 열린 화면 탭 복원">
          <Switch checked={s.restoreTabs} onChange={(v) => s.update({ restoreTabs: v })} />
        </Form.Item>
        <Form.Item label="무조작 자동 로그아웃(분)" extra="보안 정책값으로 서버 설정을 따릅니다.">
          <InputNumber value={env.idleMinutes} disabled style={{ width: 140 }} />
        </Form.Item>
        <Divider />
        <Button onClick={() => { s.reset(); setPanelCollapsed(false, false); }}>기본값으로 초기화</Button>
        <Divider />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          버전 {env.appVersion} · 빌드 {env.buildTime ? env.buildTime.slice(0, 16).replace('T', ' ') : '-'} · 환경 {env.envLabel.toUpperCase()}
          {menuSource === 'static' && ' · 메뉴 내장 시드'}
        </Typography.Text>
      </Form>
    </Drawer>
  );
};
