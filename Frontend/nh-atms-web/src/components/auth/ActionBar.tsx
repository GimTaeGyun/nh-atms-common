import { useEffect, useEffectEvent, type CSSProperties, type ReactNode } from 'react';
import type { ScreenKey } from '@/screens/screenIds';
import { Popconfirm, Space, type ButtonProps } from 'antd';
import {
  AlertOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  PrinterOutlined,
  SaveOutlined,
  SearchOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { AuthButton } from './AuthButton';
import { meetsNeed, useScreenPermission, type PermNeed } from './useAllowed';
import { CMSG } from '@/config/messages';

/** AS-IS 표준 버튼 12종 */
export type ActionKey = 'search' | 'excel' | 'save' | 'reset' | 'print' | 'create' | 'update' | 'delete' | 'open' | 'close' | 'urgent' | 'report';

interface ActionDef {
  label: string;
  icon: ReactNode;
  need: PermNeed;
  type?: ButtonProps['type'];
  danger?: boolean;
  /** 기본 확인 문구 */
  confirm?: string;
}

/** 버튼별 기본 라벨·아이콘·권한 (조회성 = read, 변경성 = write) */
export const ACTION_DEFS: Record<ActionKey, ActionDef> = {
  search: { label: '조회', icon: <SearchOutlined />, need: 'read', type: 'primary' },
  excel: { label: '엑셀', icon: <FileExcelOutlined />, need: 'read' },
  save: { label: '저장', icon: <SaveOutlined />, need: 'write', type: 'primary' },
  reset: { label: '초기화', icon: <UndoOutlined />, need: 'write' },
  print: { label: '출력', icon: <PrinterOutlined />, need: 'read' },
  create: { label: '등록', icon: <PlusOutlined />, need: 'write' },
  update: { label: '수정', icon: <EditOutlined />, need: 'write' },
  delete: { label: '삭제', icon: <DeleteOutlined />, need: 'write', danger: true, confirm: CMSG.delete },
  open: { label: '열기', icon: <FolderOpenOutlined />, need: 'read' },
  close: { label: '닫기', icon: <CloseOutlined />, need: 'read' },
  urgent: { label: '긴급', icon: <AlertOutlined />, need: 'write', danger: true },
  report: { label: '보고서', icon: <FileTextOutlined />, need: 'read' },
};

export interface ActionItem {
  key: ActionKey;
  onClick?: () => void | Promise<unknown>;
  disabled?: boolean;
  loading?: boolean;
  label?: ReactNode;
  need?: PermNeed;
  /** 확인 문구 (delete 는 기본 '삭제하시겠습니까?', false 로 끔) */
  confirm?: string | false;
}

interface Props {
  actions: Array<ActionKey | ActionItem>;
  /** 문자열 키 항목(또는 onClick 없는 항목)의 공통 핸들러 */
  onAction?: (key: ActionKey) => void | Promise<unknown>;
  align?: 'left' | 'right';
  size?: ButtonProps['size'];
  screenKey?: ScreenKey;
  /** 권한 없을 때 처리 (기본 disable) */
  mode?: 'hide' | 'disable';
  /** true 면 Ctrl+Enter = 조회 */
  hotkeys?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** 표준 버튼줄: 키만 넘기면 라벨·아이콘·권한·삭제 확인이 기본 적용된다 */
export const ActionBar = ({ actions, onAction, align = 'right', size, screenKey, mode = 'disable', hotkeys = false, className, style }: Props) => {
  const perm = useScreenPermission(screenKey);
  const items = actions.map((a) => (typeof a === 'string' ? { key: a } : a));
  const handlerOf = (it: ActionItem) => it.onClick ?? (onAction ? () => onAction(it.key) : undefined);

  // 단축키: Ctrl+Enter → 조회 (권한·비활성·로딩 상태 존중)
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (!(e.ctrlKey && e.key === 'Enter')) return;
    const it = items.find((x) => x.key === 'search');
    if (!it || it.disabled || it.loading || !meetsNeed(perm, it.need ?? ACTION_DEFS.search.need)) return;
    const fn = handlerOf(it);
    if (!fn) return;
    e.preventDefault();
    void fn();
  });
  useEffect(() => {
    if (!hotkeys) return;
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [hotkeys]);

  return (
    <Space size={6} wrap className={className} style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start', width: '100%', ...style }}>
      {items.map((it) => {
        const def = ACTION_DEFS[it.key];
        const need = it.need ?? def.need;
        const allowed = meetsNeed(perm, need);
        if (!allowed && mode === 'hide') return null;
        const fn = handlerOf(it);
        const confirm = it.confirm === false ? undefined : it.confirm ?? def.confirm;
        const btn = (
          <AuthButton
            key={it.key}
            screenKey={screenKey}
            need={need}
            mode={mode}
            size={size}
            type={def.type}
            danger={def.danger}
            icon={def.icon}
            disabled={it.disabled}
            loading={it.loading}
            onClick={confirm ? undefined : fn}
          >
            {it.label ?? def.label}
          </AuthButton>
        );
        if (!confirm) return btn;
        return (
          <Popconfirm key={it.key} title={confirm} okText="확인" cancelText="취소" okButtonProps={{ danger: def.danger }} disabled={!allowed || it.disabled} onConfirm={fn}>
            {btn}
          </Popconfirm>
        );
      })}
    </Space>
  );
};
