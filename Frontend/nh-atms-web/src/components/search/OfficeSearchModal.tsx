import { useMemo, useState } from 'react';
import { Input, Modal, Table } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useOffices } from '@/hooks/useLookup';
import type { Office } from '@/domain/lookup';
import { ModalTitle } from '@/components/display/ModalTitle';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (office: Office) => void;
}

/**
 * 공통 사무소 검색 팝업 (화면키 popup.officeSearch) — `GET /api/lookup/offices` 목록을 화면에서 거른다.
 * 사무소코드·사무소명(KANM)·시도명으로 찾고, 행 더블클릭 또는 [선택].
 */
export const OfficeSearchModal = ({ open, onClose, onSelect }: Props) => {
  const { data = [], isLoading } = useOffices();
  const [kw, setKw] = useState('');
  const rows = useMemo(() => {
    const q = kw.trim();
    return q ? data.filter((o) => o.ofcCode.includes(q) || (o.kanm ?? '').includes(q) || (o.sidoNm ?? '').includes(q)) : data;
  }, [data, kw]);
  const pick = (r: Office) => {
    onSelect(r);
    onClose();
  };
  return (
    <Modal title={<ModalTitle title="사무소 검색" screenKey="popup.officeSearch" />} open={open} onCancel={onClose} footer={null} width={560} destroyOnHidden>
      <Input prefix={<SearchOutlined />} placeholder="사무소코드 또는 사무소명" value={kw} onChange={(e) => setKw(e.target.value)} allowClear autoFocus style={{ marginBottom: 10 }} />
      <Table<Office>
        size="small"
        rowKey="ofcCode"
        loading={isLoading}
        dataSource={rows}
        pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
        onRow={(r) => ({ onDoubleClick: () => pick(r), style: { cursor: 'pointer' } })}
        columns={[
          { title: '사무소코드', dataIndex: 'ofcCode', width: 110, align: 'center' },
          { title: '사무소명', dataIndex: 'kanm', render: (v: string | null) => v ?? '-' },
          { title: '시도', dataIndex: 'sidoNm', width: 100, align: 'center', render: (v: string | null) => v ?? '-' },
          { title: '', width: 70, render: (_, r) => <a onClick={() => pick(r)}>선택</a> },
        ]}
      />
      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>행을 더블클릭하거나 [선택]을 누르세요.</div>
    </Modal>
  );
};
