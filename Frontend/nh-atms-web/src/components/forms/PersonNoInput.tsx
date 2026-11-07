import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Button, Input, Space } from 'antd';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';

/** 개인번호 조회 결과 */
export interface PersonInfo {
  empNo: string;
  name: string;
  deptName?: string;
}

export interface PersonNoInputProps {
  /** 개인번호(Form.Item 연동) */
  value?: string;
  onChange?: (empNo: string) => void;
  /** 개인번호 → 성명 조회. 없으면 null(또는 throw) */
  lookup: (empNo: string) => Promise<PersonInfo | null>;
  /** 조회 성공 시 사람, 실패·값 변경 시 null */
  onResolved?: (person: PersonInfo | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** 입력칸 너비(px) */
  width?: number;
  /** 숫자만 입력 (기본 true) */
  digitsOnly?: boolean;
  maxLength?: number;
  /** 부서명도 같이 표시 (기본 true) */
  showDept?: boolean;
  /** '※ 개인번호 입력 후 엔터키를 눌러주세요.' 안내 표시 */
  showHelp?: boolean;
  helpText?: string;
  id?: string;
  style?: CSSProperties;
}

type LookupState = { status: 'idle' } | { status: 'loading'; empNo: string } | { status: 'ok'; person: PersonInfo } | { status: 'fail'; empNo: string };

export const PERSON_NO_HELP = '※ 개인번호 입력 후 엔터키를 눌러주세요.';
const NOT_FOUND = '개인번호를 확인하세요.';

/**
 * 개인번호 입력 + Enter(또는 돋보기) → 성명 조회 표시 (AS-IS 9300 요청자·7100 권한등록 공통).
 * Enter 는 preventDefault + stopPropagation — 상위 조회조건(SearchForm) 제출로 번지지 않는다.
 */
export const PersonNoInput = ({
  value,
  onChange,
  lookup,
  onResolved,
  placeholder = '개인번호',
  disabled,
  width = 160,
  digitsOnly = true,
  maxLength = 10,
  showDept = true,
  showHelp = false,
  helpText = PERSON_NO_HELP,
  id,
  style,
}: PersonNoInputProps) => {
  const [state, setState] = useState<LookupState>({ status: 'idle' });
  const seq = useRef(0);
  const current = value ?? '';

  const run = async () => {
    const empNo = current.trim();
    if (!empNo || disabled) return;
    const my = ++seq.current;
    setState({ status: 'loading', empNo });
    let person: PersonInfo | null = null;
    try {
      person = await lookup(empNo);
    } catch {
      person = null;
    }
    if (my !== seq.current) return; // 늦게 온 이전 응답 무시
    setState(person ? { status: 'ok', person } : { status: 'fail', empNo });
    onResolved?.(person);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent.isComposing) return;
    void run();
  };

  const change = (raw: string) => {
    const next = digitsOnly ? raw.replace(/\D/g, '') : raw;
    if (state.status !== 'idle') {
      seq.current++;
      setState({ status: 'idle' });
      onResolved?.(null);
    }
    onChange?.(next);
  };

  // 표시 결과는 현재 값과 같은 번호일 때만 (폼 초기화 등 외부 변경 시 자동으로 숨김)
  const shown = (() => {
    if (state.status === 'ok' && state.person.empNo === current.trim()) return state;
    if ((state.status === 'fail' || state.status === 'loading') && state.empNo === current.trim()) return state;
    return null;
  })();

  return (
    <span className="person-no-input" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', ...style }}>
      <Space.Compact style={{ width }}>
        <Input id={id} value={current} onChange={(e) => change(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} disabled={disabled} maxLength={maxLength} inputMode={digitsOnly ? 'numeric' : undefined} autoComplete="off" />
        <Button icon={shown?.status === 'loading' ? <LoadingOutlined /> : <SearchOutlined />} onClick={() => void run()} disabled={disabled} aria-label="성명 조회" />
      </Space.Compact>
      {shown?.status === 'ok' && (
        <span className="person-no-name" style={{ fontWeight: 600 }}>
          {shown.person.name}
          {showDept && shown.person.deptName && <span className="muted" style={{ fontWeight: 400, marginLeft: 4 }}>({shown.person.deptName})</span>}
        </span>
      )}
      {shown?.status === 'fail' && (
        <span className="person-no-error" role="alert" style={{ color: 'var(--danger)', fontSize: 12 }}>
          {NOT_FOUND}
        </span>
      )}
      {showHelp && !shown && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{helpText}</span>}
    </span>
  );
};
