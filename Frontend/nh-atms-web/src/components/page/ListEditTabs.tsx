import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Tabs } from 'antd';

export type ListEditMode = 'create' | 'edit';

export interface ListEditTabsProps<T> {
  /** 목록 탭 내용. `select(row)` 를 행 더블클릭 등에 연결하면 수정 탭이 열린다 */
  list: (ctx: { select: (row: T) => void; openCreate: () => void; selected: T | null }) => ReactNode;
  /** 등록/수정 탭 내용. mode 에 따라 폼 초기값을 정한다. `done()` 으로 목록 탭으로 돌아간다 */
  edit: (ctx: { mode: ListEditMode; row: T | null; done: () => void }) => ReactNode;
  listLabel?: string;
  editLabel?: string | ((mode: ListEditMode) => string);
  /** 처음 열 탭 */
  defaultTab?: 'list' | 'edit';
  /** 수정 탭을 열 수 없을 때(권한 없음) */
  editDisabled?: boolean;
  /** 탭 우측 추가 요소(버튼 등) */
  extra?: ReactNode;
  onTabChange?: (tab: 'list' | 'edit') => void;
  className?: string;
}

/**
 * AS-IS 에 반복되는 '리스트 탭 + 등록/수정 탭' 묶음(견본: 기기정보 화면).
 *  - 목록에서 행을 고르면 수정 탭, 등록 버튼이면 빈 폼으로 등록 탭
 *  - 저장이 끝나면 `done()` → 목록 탭으로 돌아가고 선택이 풀린다(목록 재조회는 호출 쪽 invalidate)
 */
export function ListEditTabs<T>({ list, edit, listLabel = '목록', editLabel, defaultTab = 'list', editDisabled, extra, onTabChange, className }: ListEditTabsProps<T>) {
  const [tab, setTab] = useState<'list' | 'edit'>(defaultTab);
  const [mode, setMode] = useState<ListEditMode>('create');
  const [row, setRow] = useState<T | null>(null);

  const go = useCallback((t: 'list' | 'edit') => { setTab(t); onTabChange?.(t); }, [onTabChange]);
  const select = useCallback((r: T) => { setRow(r); setMode('edit'); go('edit'); }, [go]);
  const openCreate = useCallback(() => { setRow(null); setMode('create'); go('edit'); }, [go]);
  const done = useCallback(() => { setRow(null); go('list'); }, [go]);

  const editTitle = useMemo(() => (typeof editLabel === 'function' ? editLabel(mode) : editLabel ?? (mode === 'edit' ? '수정' : '등록')), [editLabel, mode]);

  return (
    <Tabs
      className={className}
      activeKey={tab}
      onChange={(k) => go(k as 'list' | 'edit')}
      tabBarExtraContent={extra}
      items={[
        { key: 'list', label: listLabel, children: list({ select, openCreate, selected: row }) },
        { key: 'edit', label: editTitle, disabled: editDisabled, children: edit({ mode, row, done }) },
      ]}
    />
  );
}
