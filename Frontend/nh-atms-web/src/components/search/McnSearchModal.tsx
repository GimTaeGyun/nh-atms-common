import { useState } from 'react';
import { Button, Input, Modal, Space, Table } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useMcns } from '@/hooks/useLookup';
import { useAuthStore, selectOfcCode } from '@/stores/useAuthStore';
import type { Machine } from '@/domain/lookup';
import { ModalTitle } from '@/components/display/ModalTitle';
import { VMSG } from '@/config/messages';
import { OfficeSelector } from './fields';
import { VendorSelect } from './lookupFields';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (mcn: Machine) => void;
  /** 처음 사무소(기본: 내 사무소) */
  defaultOfcCode?: string;
}

const Body = ({ onSelect, onClose, defaultOfcCode }: Omit<Props, 'open'>) => {
  const myOfc = useAuthStore(selectOfcCode);
  const first = defaultOfcCode ?? (myOfc || undefined);
  const [ofcCode, setOfcCode] = useState<string | undefined>(first);
  const [vendCode, setVendCode] = useState<string | undefined>();
  const [kw, setKw] = useState('');
  const [cond, setCond] = useState<{ ofcCode?: string; vendCode?: string; q?: string }>({ ofcCode: first });
  const { data = [], isFetching } = useMcns(cond.ofcCode, { vendCode: cond.vendCode, q: cond.q });
  const search = () => setCond({ ofcCode, vendCode, q: kw.trim() || undefined });
  const pick = (m: Machine) => {
    onSelect(m);
    onClose();
  };
  return (
    <>
      <Space.Compact style={{ width: '100%', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <OfficeSelector value={ofcCode} onChange={setOfcCode} />
        </div>
        <div style={{ width: 140 }}>
          <VendorSelect value={vendCode} onChange={setVendCode} placeholder="기기사 전체" />
        </div>
        <Input placeholder="기번" value={kw} maxLength={3} onChange={(e) => setKw(e.target.value.replace(/\D/g, ''))} onPressEnter={(e) => { e.preventDefault(); e.stopPropagation(); search(); }} allowClear style={{ width: 80 }} aria-label="기번" />
        <Button type="primary" icon={<SearchOutlined />} onClick={search}>조회</Button>
      </Space.Compact>
      <Table<Machine>
        size="small"
        rowKey={(r) => `${r.ofcCode}-${r.mcnNo}`}
        loading={isFetching}
        dataSource={cond.ofcCode ? data : []}
        locale={{ emptyText: cond.ofcCode ? '검색된 데이터가 없습니다.' : VMSG.select('사무소') }}
        pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
        onRow={(r) => ({ onDoubleClick: () => pick(r), style: { cursor: 'pointer' } })}
        columns={[
          { title: '기번', dataIndex: 'mcnNo', width: 60, align: 'center' },
          { title: '코너', dataIndex: 'instPstNm', ellipsis: true, render: (v: string | null, r) => v ?? r.instPstCode ?? '-' },
          { title: '기종', dataIndex: 'srcNm', width: 110, ellipsis: true, render: (v: string | null, r) => v ?? r.src ?? '-' },
          { title: '기기유형', dataIndex: 'komType', width: 70, align: 'center', render: (v: string | null) => v ?? '-' },
          { title: '기기사', dataIndex: 'vendCode', width: 60, align: 'center', render: (v: string | null) => v ?? '-' },
          { title: '사용', dataIndex: 'useYn', width: 50, align: 'center' },
          { title: '', width: 50, render: (_, r) => <a onClick={() => pick(r)}>선택</a> },
        ]}
      />
      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>사무소는 필수입니다. 행을 더블클릭하거나 [선택]을 누르세요.</div>
    </>
  );
};

/**
 * 기기 검색 팝업 (화면키 popup.mcnSearch, 신규 Q8) — `GET /api/lookup/machines?ofcCode=&vendCode=&q=`.
 * 사무소 필수(서버 V001_20), 기기사·기번은 선택. 행 더블클릭으로 고른다.
 */
export const McnSearchModal = ({ open, onClose, onSelect, defaultOfcCode }: Props) => (
  <Modal title={<ModalTitle title="기기 검색" screenKey="popup.mcnSearch" />} open={open} onCancel={onClose} footer={null} width={720} destroyOnHidden>
    {open && <Body onClose={onClose} onSelect={onSelect} defaultOfcCode={defaultOfcCode} />}
  </Modal>
);
