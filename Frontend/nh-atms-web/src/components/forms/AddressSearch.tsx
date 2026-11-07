import { useState, type KeyboardEvent } from 'react';
import { AutoComplete, Button, Input, Modal, Select, Space, Table } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useAppMessage } from '@/hooks/useAppMessage';

/** 도로명주소 값 (3단 + 상세 + 우편번호) */
export interface AddressValue {
  sido?: string;
  sigungu?: string;
  road?: string;
  detail?: string;
  zip?: string;
}

/** 주소 검색 결과 1건. sido/sigungu/road 가 없으면 roadAddr 를 나눠 채운다 */
export interface AddressHit {
  zip: string;
  roadAddr: string;
  jibunAddr?: string;
  sido?: string;
  sigungu?: string;
  road?: string;
}

export interface AddressSearchProps {
  value?: AddressValue;
  onChange?: (v: AddressValue) => void;
  /** 주소 검색 API. 없으면 [검색] 이 '연동 전' 안내만 띄운다 */
  search?: (keyword: string) => Promise<AddressHit[]>;
  /** 시도 목록 (기본: 17개 시도) */
  sidoOptions?: string[];
  /** 시도별 시군구 목록. 없거나 빈 배열이면 자유 입력 */
  sigunguOf?: (sido: string) => string[];
  /** 상세주소 줄 표시 (기본 true) */
  showDetail?: boolean;
  disabled?: boolean;
}

export const SIDO_LIST = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원특별자치도', '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
];

/** 도로명주소 문자열 → 시도/시군구/도로명. '경기도 성남시 분당구 …' 처럼 시+구는 시군구로 합친다 */
export const splitRoadAddr = (roadAddr: string): Pick<AddressValue, 'sido' | 'sigungu' | 'road'> => {
  const t = roadAddr.trim().split(/\s+/).filter(Boolean);
  if (t.length === 0) return {};
  if (t[0].endsWith('세종특별자치시')) return { sido: t[0], sigungu: '', road: t.slice(1).join(' ') };
  const twoLevel = t.length > 3 && /시$/.test(t[1]) && /구$/.test(t[2]);
  const n = twoLevel ? 3 : 2;
  return { sido: t[0], sigungu: t.slice(1, n).join(' '), road: t.slice(n).join(' ') };
};

/**
 * 도로명주소 입력 — [검색] · 시도 · 시군구 · 도로명/건물번호 + 우편번호 · 상세주소 (코너 주소 입력 공통화).
 * 검색 팝업에서 1건을 고르면 시도/시군구/도로명/우편번호를 채우고 상세주소는 비운다.
 */
export const AddressSearch = ({ value, onChange, search, sidoOptions = SIDO_LIST, sigunguOf, showDetail = true, disabled }: AddressSearchProps) => {
  const { message } = useAppMessage();
  const [open, setOpen] = useState(false);
  const v = value ?? {};
  const patch = (p: Partial<AddressValue>) => onChange?.({ ...v, ...p });
  const sigunguList = v.sido && sigunguOf ? sigunguOf(v.sido) : [];

  const openSearch = () => {
    if (!search) {
      message.info('주소 검색 API 연동 전입니다.');
      return;
    }
    setOpen(true);
  };

  const pick = (hit: AddressHit) => {
    const parts = hit.sido ? { sido: hit.sido, sigungu: hit.sigungu ?? '', road: hit.road ?? '' } : splitRoadAddr(hit.roadAddr);
    onChange?.({ ...v, ...parts, zip: hit.zip, detail: '' });
    setOpen(false);
  };

  return (
    <div className="address-search" style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <Space.Compact style={{ width: '100%' }}>
        <Button icon={<SearchOutlined />} onClick={openSearch} disabled={disabled}>
          검색
        </Button>
        <Select aria-label="시도" placeholder="시도" style={{ width: 150 }} value={v.sido || undefined} disabled={disabled} allowClear showSearch options={sidoOptions.map((s) => ({ value: s, label: s }))} onChange={(s?: string) => patch({ sido: s ?? '', sigungu: '' })} />
        {sigunguList.length > 0 ? (
          <Select aria-label="시군구" placeholder="시군구" style={{ width: 140 }} value={v.sigungu || undefined} disabled={disabled} allowClear showSearch options={sigunguList.map((s) => ({ value: s, label: s }))} onChange={(s?: string) => patch({ sigungu: s ?? '' })} />
        ) : (
          <AutoComplete aria-label="시군구" placeholder="시군구" style={{ width: 140 }} value={v.sigungu ?? ''} disabled={disabled} onChange={(s: string) => patch({ sigungu: s })} />
        )}
        <Input aria-label="도로명 및 건물번호" placeholder="도로명 및 건물번호" value={v.road ?? ''} disabled={disabled} onChange={(e) => patch({ road: e.target.value })} />
      </Space.Compact>
      {showDetail && (
        <Space.Compact style={{ width: '100%' }}>
          <Input aria-label="우편번호" placeholder="우편번호" value={v.zip ?? ''} readOnly style={{ width: 90, textAlign: 'center' }} disabled={disabled} />
          <Input aria-label="상세주소" placeholder="상세주소" value={v.detail ?? ''} disabled={disabled} onChange={(e) => patch({ detail: e.target.value })} />
        </Space.Compact>
      )}
      {search && (
        <Modal open={open} title="도로명주소 검색" onCancel={() => setOpen(false)} footer={null} width={720} destroyOnHidden>
          <AddressSearchPanel search={search} onPick={pick} />
        </Modal>
      )}
    </div>
  );
};

/** 검색 팝업 본문 — 열릴 때마다 새로 마운트(검색어·결과 초기화) */
const AddressSearchPanel = ({ search, onPick }: { search: (keyword: string) => Promise<AddressHit[]>; onPick: (hit: AddressHit) => void }) => {
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState<AddressHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    const k = keyword.trim();
    if (k.length < 2) {
      setError('검색어를 2자 이상 입력하세요. (예: 세종대로 110, 농협)');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      setRows(await search(k));
    } catch {
      setRows([]);
      setError('주소 검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 포털이어도 React 이벤트는 상위로 버블링된다 — 상위 SearchForm 의 Enter 조회를 막는다
  const stopEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') e.stopPropagation();
  };

  return (
    <div onKeyDown={stopEnter}>
      <Input.Search placeholder="도로명 + 건물번호, 건물명, 지번" value={keyword} onChange={(e) => setKeyword(e.target.value)} onSearch={() => void run()} enterButton="검색" loading={loading} autoFocus allowClear />
      {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{error}</div>}
      <Table<AddressHit>
        size="small"
        className="data-grid"
        style={{ marginTop: 10 }}
        rowKey={(r) => `${r.zip}|${r.roadAddr}`}
        dataSource={rows ?? []}
        loading={loading}
        pagination={rows && rows.length > 10 ? { pageSize: 10, size: 'small', showSizeChanger: false } : false}
        scroll={{ y: 360 }}
        locale={{ emptyText: <div className="grid-empty">{rows ? '검색된 주소가 없습니다.' : '검색어를 입력하고 [검색] 을 누르세요.'}</div> }}
        onRow={(r) => ({ onClick: () => onPick(r), style: { cursor: 'pointer' } })}
        columns={[
          { title: '우편번호', dataIndex: 'zip', width: 90, align: 'center' },
          {
            title: '주소',
            key: 'addr',
            render: (_: unknown, r) => (
              <div className="cell-stack" style={{ whiteSpace: 'normal' }}>
                {r.roadAddr}
                {r.jibunAddr && <small>[지번] {r.jibunAddr}</small>}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
