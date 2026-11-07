import { useCallback, useMemo, useState } from 'react';
import { Form } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { noticeApi, noticeKeys } from '@/api/endpoints/notice';
import { usePagedSearch } from '@/hooks/usePagedSearch';
import { useOfficeLabel } from '@/hooks/useLookup';
import { usePrint } from '@/hooks/usePrint';
import { PageFrame } from '@/components/page/PageFrame';
import { ResultHeader } from '@/components/page/ResultHeader';
import { ExcelButton } from '@/components/page/ExcelButton';
import { SearchForm } from '@/components/search/SearchForm';
import { ActionBar, type ActionItem } from '@/components/auth/ActionBar';
import { DataGrid } from '@/components/grid/DataGrid';
import { excelColumnsOf } from '@/components/grid/columns';
import { PrintLayout } from '@/components/print/PrintLayout';
import { downloadExcel } from '@/utils/excel';
import { fmtCount, fmtDate, fmtOffice } from '@/utils/format';
import { CMSG } from '@/config/messages';
import type { Notice, NoticeSearch } from '@/domain/notice';
import type { ScreenProps } from '@/types/screen';
import { NoticeEditModal } from '../popup/NoticeEditModal';
import { NoticeViewModal } from '../popup/NoticeViewModal';
import { noticeColumns, noticePrintConditions, toNoticeParams, useNoticeFields } from './NoticeParts';

const TITLE = '공지사항';

/**
 * 공지사항 — "팝업형 CRUD" 견본(설계 §8.2, API 계약 §3, TB_NOTICE).
 *  조회조건(SearchForm) → [조회] → 서버 페이징 목록(DataGrid G1, 체크 선택) → 제목 클릭·행 더블클릭 = 상세 팝업(조회수 +1)
 *  [등록]·[수정](1건 선택) = 입력 팝업(NoticeEditModal), [삭제](여러 건 선택 + 확인창), [엑셀]·[출력] = 지금 보이는 목록.
 *  성공·오류 문구는 서버가 만들고 자동 표시된다 — 이 화면은 onSuccess 에서 목록 다시 읽기(invalidate)만 한다.
 */
const NoticePage = ({ screenKey }: ScreenProps) => {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number[]>([]);
  const [edit, setEdit] = useState<{ open: boolean; no: number | null }>({ open: false, no: null });
  const [viewOpen, setViewOpen] = useState(false);

  const fields = useNoticeFields();
  const search = usePagedSearch<NoticeSearch, Notice>({ key: noticeKeys.list, fetch: noticeApi.list });
  const officeLabel = useOfficeLabel(search.params?.ofcCode);
  const { print } = usePrint(TITLE);
  const invalidate = () => qc.invalidateQueries({ queryKey: noticeKeys.all });

  // 상세 열기 = 조회수 +1 이 일어나는 요청이라 mutation 으로(다시 그릴 때 저절로 재요청되지 않게). 성공하면 목록의 조회수도 다시 읽는다
  const view = useMutation({ mutationFn: (no: number) => noticeApi.get(no, true), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: noticeApi.remove, onSuccess: invalidate });

  const { mutate: openDetail, isPending: viewPending } = view;
  const openView = useCallback(
    (r: Notice) => {
      if (viewPending) return; // 제목 더블클릭(클릭 2번 + 더블클릭)에도 요청은 한 번만
      setViewOpen(true);
      openDetail(r.no, { onError: () => setViewOpen(false) }); // 오류 문구는 전역에서 띄운다
    },
    [viewPending, openDetail],
  );
  const columns = useMemo(() => noticeColumns(search.page, search.size, openView), [search.page, search.size, openView]);

  const onSearch = (v: Record<string, unknown>) => {
    setSelected([]);
    search.search(toNoticeParams(v));
  };
  const excel = () => downloadExcel<Notice>(excelColumnsOf(columns), search.rows, TITLE);
  const onDelete = () => remove.mutate(selected, { onSuccess: () => setSelected([]) });

  const actions: ActionItem[] = [
    { key: 'search', onClick: () => form.submit(), loading: search.loading },
    { key: 'excel', onClick: excel, disabled: !search.rows.length },
    { key: 'print', onClick: () => print(), disabled: !search.searched },
    { key: 'create', onClick: () => setEdit({ open: true, no: null }) },
    { key: 'update', onClick: () => setEdit({ open: true, no: selected[0] }), disabled: selected.length !== 1 },
    { key: 'delete', onClick: onDelete, disabled: !selected.length, loading: remove.isPending, confirm: CMSG.deleteSelected(selected.length) },
  ];

  return (
    <PageFrame
      screenKey={screenKey}
      lastUpdated={search.lastUpdated}
      onRefresh={() => void search.refetch()}
      refreshing={search.loading}
      extra={<ActionBar screenKey={screenKey} size="small" hotkeys actions={actions} />}
    >
      <SearchForm form={form} fields={fields} onSearch={onSearch} loading={search.loading} onReset={search.reset} />
      <ResultHeader title="공지 목록" total={search.searched ? search.total : undefined} selected={selected.length} note={search.searched ? '제목 클릭·행 더블클릭 = 상세(조회수 +1), 체크 = 수정(1건)·삭제(여러 건) 대상' : undefined}>
        <ExcelButton onClick={excel} disabled={!search.rows.length} />
      </ResultHeader>
      <DataGrid<Notice>
        columns={columns}
        rows={search.rows}
        rowKey="no"
        loading={search.loading}
        searched={search.searched}
        grade="G1"
        pagination={search.pagination}
        rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys.map(Number)) }}
        onRowDoubleClick={openView}
      />
      <NoticeViewModal
        open={viewOpen}
        notice={view.data}
        loading={view.isPending}
        onClose={() => setViewOpen(false)}
        onEdit={(n) => {
          setViewOpen(false);
          setEdit({ open: true, no: n.no });
        }}
      />
      <NoticeEditModal open={edit.open} no={edit.no} onClose={() => setEdit({ open: false, no: null })} />
      <PrintLayout title={TITLE} conditions={noticePrintConditions(search.params, officeLabel)}>
        <table>
          <thead>
            <tr><th>순번</th><th>번호</th><th>제목</th><th>사무소</th><th>작성자</th><th>작성일</th><th>조회수</th></tr>
          </thead>
          <tbody>
            {search.rows.map((r, i) => (
              <tr key={r.no}>
                <td>{(search.page - 1) * search.size + i + 1}</td><td>{r.no}</td><td>{r.subject}</td><td>{fmtOffice(r.ofcCode, r.kanm)}</td><td>{r.name}</td><td>{fmtDate(r.wrtDate)}</td><td>{fmtCount(r.visit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintLayout>
    </PageFrame>
  );
};

export default NoticePage;
