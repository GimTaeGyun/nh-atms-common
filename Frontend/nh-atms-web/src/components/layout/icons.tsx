import type { CSSProperties, ComponentType } from 'react';
import {
  DashboardOutlined, SwapOutlined, FileDoneOutlined, AppstoreOutlined, FileTextOutlined, BarChartOutlined, ToolOutlined,
  NotificationOutlined, SettingOutlined, StarOutlined, StarFilled, BellOutlined, SearchOutlined, UserOutlined, HomeOutlined,
  QuestionCircleOutlined, TeamOutlined, AlertOutlined, PrinterOutlined, FolderOutlined, FolderOpenOutlined,
} from '@ant-design/icons';

type IconComp = ComponentType<{ className?: string; style?: CSSProperties }>;

/** 메뉴 아이콘 — 트리셰이킹을 위해 전체 import 대신 명시 매핑(B7-FE-02) */
export const ICONS: Record<string, IconComp> = {
  DashboardOutlined, SwapOutlined, FileDoneOutlined, AppstoreOutlined, FileTextOutlined, BarChartOutlined, ToolOutlined,
  NotificationOutlined, SettingOutlined, StarOutlined, StarFilled, BellOutlined, SearchOutlined, UserOutlined, HomeOutlined,
  QuestionCircleOutlined, TeamOutlined, AlertOutlined, PrinterOutlined, FolderOutlined, FolderOpenOutlined,
};

export const MenuIcon = ({ name, className, style }: { name?: string; className?: string; style?: CSSProperties }) => {
  const C = name ? ICONS[name] : undefined;
  return C ? <C className={className} style={style} /> : null;
};
