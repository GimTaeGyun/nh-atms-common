import { useMemo, useState } from 'react';
import { Input, Modal, Table } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useOffices } from '@/hooks/useCodes';
import type { Office } from '@/domain/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (office: Office) => void;
}

/** 공통 사무소 검색 팝업 (AS-IS 전 화면 공통 돋보기) */
export const OfficeSearchModal = ({ open, onClose, onSelect }: Props) => {
  const { data = [], isLoading } = useOffices();
  const [kw, setKw] = useState('');
  const rows = useMemo(() => {
    const q = kw.trim();
    return q ? data.filter((o) => o.officeCd.includes(q) || o.officeName.includes(q) || o.regionName.includes(q)) : data;
  }, [data, kw]);
  return (
    <Modal title="사무소 검색" open={open} onCancel={onClose} footer={null} width={560} destroyOnHidden>
      <Input prefix={<SearchOutlined />} placeholder="사무소코드 또는 사무소명" value={kw} onChange={(e) => setKw(e.target.value)} allowClear autoFocus style={{ marginBottom: 10 }} />
      <Table<Office>
        size="small"
        rowKey="officeCd"
        loading={isLoading}
        dataSource={rows}
        pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
        onRow={(r) => ({ onDoubleClick: () => { onSelect(r); onClose(); }, style: { cursor: 'pointer' } })}
        columns={[
          { title: '사무소코드', dataIndex: 'officeCd', width: 110, align: 'center' },
          { title: '사무소명', dataIndex: 'officeName' },
          { title: '지역본부', dataIndex: 'regionName', width: 100, align: 'center' },
          { title: '', width: 70, render: (_, r) => <a onClick={() => { onSelect(r); onClose(); }}>선택</a> },
        ]}
      />
      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>행을 더블클릭하거나 [선택]을 누르세요.</div>
    </Modal>
  );
};
