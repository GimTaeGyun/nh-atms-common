/**
 * 공지사항 견본(`sample.notice`) 부품 — 조회조건·조건→파라미터·컬럼·인쇄 조건.
 * 화면 본체 NoticePage.tsx, 팝업 popup/NoticeEditModal.tsx·NoticeViewModal.tsx 가 함께 쓴다.
 * 새 "팝업형 CRUD" 화면은 이 파일을 복사해 이름만 바꿔 시작한다.
 */
import { useMemo } from 'react';
import { Form, Input, Typography } from 'antd';
import type { FormInstance } from 'antd';
import { useAuthStore, selectOfcCode } from '@/stores/useAuthStore';
import type { SearchField } from '@/components/search/SearchForm';
import { officeField } from '@/components/search/fields';
import { rangeField } from '@/components/search/dateFields';
import { personField } from '@/components/search/lookupFields';
import { ymdRange } from '@/components/search/params';
import { centerCol, col, countCol, dateCol, indexCol, textCol, type Col } from '@/components/grid/columns';
import type { PrintCondition } from '@/components/print/PrintLayout';
import { fmtDate, fmtOffice } from '@/utils/format';
import { today, type Dayjs } from '@/utils/date';
import { compactParams } from '@/utils/object';
import type { ValueProps } from '@/types/common';
import type { Notice, NoticeField, NoticeSearch } from '@/domain/notice';

/* ---------- 0. 바이트 상한(잠정 Q-07 — 계산은 공통 utils/rules byteLength·maxBytes·byteCount) ---------- */
/** 제목 최대 바이트 — TB_NOTICE.SUBJECT VARCHAR2(200) */
export const SUBJECT_MAX_BYTES = 200;
/** 내용 최대 바이트 — TB_NOTICE.TEXT VARCHAR2(4000) */
export const TEXT_MAX_BYTES = 4000;

/* ---------- 1. 조회조건 ---------- */
/** 검색구분(계약 NoticeField) */
export const FIELD_OPTIONS: { value: NoticeField; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'SUBJECT', label: '제목' },
  { value: 'TEXT', label: '내용' },
  { value: 'NAME', label: '작성자' },
];

/** 기본 기간: 최근 1개월(오늘 포함) — 빠른선택 '1개월' 과 같은 계산 */
export const lastMonth = (): [Dayjs, Dayjs] => [today().subtract(1, 'month').add(1, 'day'), today()];

/** 검색어 칸 — 검색구분이 '전체'면 비활성 */
const KeywordInput = ({ form, value, onChange }: ValueProps<string | undefined> & { form: FormInstance }) => {
  const field = Form.useWatch('field', form) as NoticeField | undefined;
  const off = !field || field === 'ALL';
  return <Input value={value} onChange={(e) => onChange?.(e.target.value)} disabled={off} allowClear placeholder={off ? '검색구분을 고르세요' : '검색어'} aria-label="검색어" />;
};

/** 조회조건: 작성일(최근 1개월, 최대 366일) · 사무소(기본 내 사무소, 비우면 전체) · 작성자 · 검색구분+검색어 */
export const useNoticeFields = (): SearchField[] => {
  const myOfc = useAuthStore(selectOfcCode);
  return useMemo(
    () => [
      rangeField({ name: 'period', label: '작성일', maxDays: 366, defaultValue: lastMonth() }),
      officeField({ required: false, defaultValue: myOfc || undefined }),
      personField({ label: '작성자', clearOnParentChange: true }),
      { name: 'field', label: '검색구분', type: 'select', widthClass: 'code', options: FIELD_OPTIONS, defaultValue: 'ALL', allowClear: false },
      { name: 'keyword', label: '검색어', type: 'custom', widthClass: 'normal', render: (form) => <KeywordInput form={form} /> },
    ],
    [myOfc],
  );
};

/* ---------- 2. 조건값 → API 파라미터 ---------- */
/** 검색구분이 전체(또는 검색어 없음)면 field·keyword 를 보내지 않는다. 빈 값은 빠진다 */
export const toNoticeParams = (v: Record<string, unknown>): Omit<NoticeSearch, 'page' | 'size'> => {
  const { fromDate, toDate } = ymdRange(v.period);
  const field = (v.field as NoticeField | undefined) ?? 'ALL';
  const keyword = field === 'ALL' ? undefined : ((v.keyword as string | undefined) ?? '').trim() || undefined;
  return compactParams<NoticeSearch>({
    fromDate,
    toDate,
    ofcCode: (v.ofcCode as string | undefined) || undefined,
    perNo: (v.perNo as string | undefined) || undefined,
    field: keyword ? field : undefined,
    keyword,
  });
};

/* ---------- 3. 컬럼 (G1) ---------- */
/** 사무소 표시 '[코드] 사무소명' (없으면 '-') */
const officeText = (r: Notice) => fmtOffice(r.ofcCode, r.kanm);

/** 목록 컬럼 — 제목을 누르면 상세(onOpen). 엑셀은 excelColumnsOf(이 컬럼)로 같은 모양 */
export const noticeColumns = (page: number, size: number, onOpen: (r: Notice) => void): Col<Notice>[] => [
  indexCol<Notice>(page, size),
  centerCol<Notice>('번호', 'no', 70, { className: 'num' }),
  col<Notice>('제목', 'subject', 360, {
    render: (v: string | null, r) => (
      <Typography.Link
        onClick={(e) => {
          e.stopPropagation();
          onOpen(r);
        }}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {v || '(제목 없음)'}
      </Typography.Link>
    ),
  }),
  col<Notice>('사무소', 'ofcCode', 200, { render: (_: unknown, r) => officeText(r), excel: officeText }),
  textCol<Notice>('작성자', 'name', 100, { align: 'center' }),
  dateCol<Notice>('작성일', 'wrtDate', 100),
  countCol<Notice>('조회수', 'visit', 80),
];

/* ---------- 4. 인쇄 조건 ---------- */
export const noticePrintConditions = (p: NoticeSearch | null, officeLabel: string): PrintCondition[] => {
  const field = FIELD_OPTIONS.find((o) => o.value === (p?.field ?? 'ALL'))?.label ?? '전체';
  return [
    { label: '작성일', value: p?.fromDate || p?.toDate ? `${fmtDate(p?.fromDate)} ~ ${fmtDate(p?.toDate)}` : '전체' },
    { label: '사무소', value: p?.ofcCode ? officeLabel : '전체' },
    { label: '작성자', value: p?.perNo ?? '전체' },
    { label: '검색', value: p?.keyword ? `${field} : ${p.keyword}` : '전체' },
  ];
};
