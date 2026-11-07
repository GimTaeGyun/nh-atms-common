import { useState } from 'react';
import { Button, Input, Modal, Space, Table } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { usePersons } from '@/hooks/useLookup';
import { useAuthStore, selectOfcCode } from '@/stores/useAuthStore';
import type { Person } from '@/domain/lookup';
import { ModalTitle } from '@/components/display/ModalTitle';
import { OfficeSelector } from './fields';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (person: Person) => void;
  /** 처음 사무소(기본: 내 사무소) */
  defaultOfcCode?: string;
}

/** 팝업이 열릴 때마다 새로 그리는 본문(입력값 초기화) */
const Body = ({ onSelect, onClose, defaultOfcCode }: Omit<Props, 'open'>) => {
  const myOfc = useAuthStore(selectOfcCode);
  const [ofcCode, setOfcCode] = useState<string | undefined>(defaultOfcCode ?? (myOfc || undefined));
  const [kw, setKw] = useState('');
  const [cond, setCond] = useState<{ ofcCode?: string; q?: string }>(() => ({ ofcCode: defaultOfcCode ?? (myOfc || undefined) }));
  const empty = !cond.ofcCode && !cond.q;
  const { data = [], isFetching } = usePersons(cond);
  const search = () => setCond({ ofcCode, q: kw.trim() || undefined });
  const pick = (p: Person) => {
    onSelect(p);
    onClose();
  };
  return (
    <>
      <Space.Compact style={{ width: '100%', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <OfficeSelector value={ofcCode} onChange={setOfcCode} allowEmpty />
        </div>
        <Input
          placeholder="성명 또는 개인번호"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          onPressEnter={(e) => { e.preventDefault(); e.stopPropagation(); search(); }}
          allowClear
          style={{ width: 170 }}
          aria-label="성명 또는 개인번호"
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={search}>조회</Button>
      </Space.Compact>
      <Table<Person>
        size="small"
        rowKey="perNo"
        loading={isFetching}
        dataSource={empty ? [] : data}
        locale={{ emptyText: empty ? '사무소 또는 검색어를 입력하고 [조회]를 누르세요.' : '검색된 데이터가 없습니다.' }}
        pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
        onRow={(r) => ({ onDoubleClick: () => pick(r), style: { cursor: 'pointer' } })}
        columns={[
          { title: '개인번호', dataIndex: 'perNo', width: 100, align: 'center' },
          { title: '성명', dataIndex: 'name', width: 90 },
          { title: '직급', dataIndex: 'jikeubName', width: 90, render: (v: string | null) => v ?? '-' },
          { title: '사무소', dataIndex: 'samusoName', ellipsis: true, render: (v: string | null, r) => v ?? r.samuso ?? '-' },
          { title: '', width: 60, render: (_, r) => <a onClick={() => pick(r)}>선택</a> },
        ]}
      />
      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>행을 더블클릭하거나 [선택]을 누르세요. 최대 200건까지 보입니다.</div>
    </>
  );
};

/**
 * 인원 검색 팝업 (화면키 popup.personSearch, 신규 Q8) — `GET /api/lookup/persons?ofcCode=&q=` (TB_INSA).
 * 사무소·성명·개인번호로 찾고 행 더블클릭으로 고른다. 사무소도 검색어도 없으면 호출하지 않는다(서버 400 LKP_001).
 */
export const PersonSearchModal = ({ open, onClose, onSelect, defaultOfcCode }: Props) => (
  <Modal title={<ModalTitle title="인원 검색" screenKey="popup.personSearch" />} open={open} onCancel={onClose} footer={null} width={640} destroyOnHidden>
    {open && <Body onClose={onClose} onSelect={onSelect} defaultOfcCode={defaultOfcCode} />}
  </Modal>
);
