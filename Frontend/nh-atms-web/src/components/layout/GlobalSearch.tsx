import { useEffect, useMemo, useRef, useState } from 'react';
import { AutoComplete, Input, Select, Tag, type InputRef } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavStore, flattenScreens } from '@/stores/useNavStore';
import { useOpenScreen } from '@/screens/navigation';
import { isScreenKey } from '@/screens/screenIds';
import { L1_BY_NAME } from '@/screens/l1';
import { STORAGE_PREFIX } from '@/config/constants';
import { MenuIcon } from './icons';

type Scope = 'ALL' | 'NAME' | 'ID';

export const GLOBAL_SEARCH_ID = 'global-screen-search';
const RECENT_KEY = `${STORAGE_PREFIX}:search-recent`;
const MAX_RECENT = 6;

const loadRecent = (): string[] => {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};
const saveRecent = (list: string[]) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* 저장 불가(사생활 모드 등)면 무시 */
  }
};

/** 검색어와 일치하는 부분을 파랑 굵게(시안: "저널 조회"의 '저널') */
const Highlight = ({ text, q }: { text: string; q: string }) => {
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const parts: { s: string; hit: boolean }[] = [];
  let i = 0;
  while (i < text.length) {
    const at = lower.indexOf(ql, i);
    if (at < 0) {
      parts.push({ s: text.slice(i), hit: false });
      break;
    }
    if (at > i) parts.push({ s: text.slice(i, at), hit: false });
    parts.push({ s: text.slice(at, at + q.length), hit: true });
    i = at + q.length;
  }
  return <>{parts.map((p, k) => (p.hit ? <b key={k} className="hl">{p.s}</b> : <span key={k}>{p.s}</span>))}</>;
};

/**
 * 헤더 화면 검색(시안 2026-10-21 p.11): "전체 ▾ | 검색어를 입력하세요" → 드롭다운에 최근 검색어 칩 + "검색 결과 (N)" +
 * 행마다 대분류 아이콘·화면명(검색어 강조)·경로. 화면번호로도 찾는다. Ctrl+K 로 포커스.
 */
export const GlobalSearch = () => {
  const menus = useNavStore((s) => s.menus);
  const openScreen = useOpenScreen();
  const [scope, setScope] = useState<Scope>('ALL');
  const [kw, setKw] = useState('');
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const ref = useRef<InputRef>(null);

  const screens = useMemo(() => flattenScreens(menus), [menus]);
  const q = kw.trim();
  const hits = useMemo(() => {
    const ql = q.toLowerCase();
    if (!ql) return [];
    return screens
      .filter((s) => (scope === 'ID' ? s.screenId?.startsWith(ql) : scope === 'NAME' ? s.menuName.toLowerCase().includes(ql) : s.screenId?.startsWith(ql) || s.menuName.toLowerCase().includes(ql)))
      .slice(0, 12);
  }, [q, scope, screens]);
  const options = useMemo(
    () =>
      hits.map((s) => {
        const l1 = s.l1 ? L1_BY_NAME[s.l1] : undefined;
        return {
          value: s.screenKey!,
          label: (
            <div className="gs-item">
              <span className="gs-icon"><MenuIcon name={l1?.icon} /></span>
              <span className="gs-main">
                <span className="gs-name"><Highlight text={s.menuName} q={q} /><small>{s.screenId}</small></span>
                <span className="gs-path">{l1?.label ?? s.l1} › {s.folder} › {s.menuName}</span>
              </span>
            </div>
          ),
        };
      }),
    [hits, q],
  );

  const remember = (word: string) => {
    const w = word.trim();
    if (!w) return;
    const next = [w, ...recent.filter((r) => r !== w)].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecent(next);
  };
  const forget = (word?: string) => {
    const next = word === undefined ? [] : recent.filter((r) => r !== word);
    setRecent(next);
    saveRecent(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ref]);

  const showRecent = recent.length > 0;
  const popupOpen = open && (showRecent || !!q);

  return (
    <div className="global-search" style={{ display: 'flex', gap: 6 }}>
      <Select<Scope> className="search-scope" value={scope} onChange={setScope} size="middle" style={{ width: 86 }} options={[{ value: 'ALL', label: '전체' }, { value: 'NAME', label: '화면명' }, { value: 'ID', label: '화면번호' }]} />
      <AutoComplete
        value={kw}
        options={options}
        open={popupOpen}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={setKw}
        onSelect={(v: string) => {
          if (isScreenKey(v)) openScreen(v);
          remember(kw);
          setKw('');
          setOpen(false);
        }}
        style={{ width: 250 }}
        popupMatchSelectWidth={380}
        popupRender={(menu) => (
          <div className="gs-popup" onMouseDown={(e) => e.preventDefault()}>
            {showRecent && (
              <div className="gs-recent">
                <div className="gs-head">
                  <span>최근 검색어</span>
                  <button type="button" className="gs-link" onClick={() => forget()}>전체 삭제</button>
                </div>
                <div className="gs-chips">
                  {recent.map((r) => (
                    <Tag key={r} closable onClose={(e) => { e.preventDefault(); forget(r); }} onClick={() => setKw(r)}>{r}</Tag>
                  ))}
                </div>
              </div>
            )}
            {q && (
              <div className="gs-head gs-count">
                <span>검색 결과 ({hits.length})</span>
              </div>
            )}
            {q && hits.length === 0 ? <div className="gs-empty">일치하는 화면이 없습니다</div> : menu}
          </div>
        )}
      >
        <Input ref={ref} id={GLOBAL_SEARCH_ID} placeholder="검색어를 입력하세요 (Ctrl+K)" suffix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />} allowClear />
      </AutoComplete>
    </div>
  );
};
