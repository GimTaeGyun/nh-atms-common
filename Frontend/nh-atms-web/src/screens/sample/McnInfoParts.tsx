/**
 * 기기정보 견본(`sample.mcnInfo`) 조각 — 조회조건·입력 칸·등록/수정 탭 폼. 페이지(McnInfoPage)는 이 조각을 조립만 한다.
 * 새 "목록/편집 탭형" 화면은 이 파일과 McnInfoColumns.tsx 를 복사해서 시작한다.
 */
import { useMemo, useState } from 'react';
import { AutoComplete, Button, Form, Input, Radio, Space } from 'antd';
import type { FormInstance } from 'antd';
import type { Rule } from 'antd/es/form';
import { SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mcnInfoApi, mcnInfoKeys } from '@/api/endpoints/mcnInfo';
import { useDistinct } from '@/hooks/useLookup';
import { useAuthStore, selectOfcCode } from '@/stores/useAuthStore';
import { ActionBar, type ActionItem } from '@/components/auth/ActionBar';
import { DetailGrid } from '@/components/display/DetailGrid';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingBlock } from '@/components/feedback/LoadingBlock';
import { formItem } from '@/components/forms/formItem';
import { McnSearchModal } from '@/components/search/McnSearchModal';
import type { SearchField } from '@/components/search/SearchForm';
import { OfficeSelector, officeField } from '@/components/search/fields';
import { CornerSelect, SrcSelect, VendorSelect, YN_OPTIONS, distinctField, vendorField, ynField } from '@/components/search/lookupFields';
import { allToUndef } from '@/components/search/params';
import type { ListEditMode } from '@/components/page/ListEditTabs';
import { CMSG } from '@/config/messages';
import { digits, maxLen, req, reqSelect } from '@/utils/rules';
import { fmtDateTime14 } from '@/utils/format';
import type { DistinctTarget } from '@/domain/lookup';
import type { McnInfo, McnInfoSave, McnInfoSearch } from '@/domain/mcnInfo';
import type { ValueProps } from '@/types/common';
import type { ScreenKey } from '@/screens/screenIds';

/* ===================== 조회조건 ===================== */

/**
 * 기번 입력(숫자 3자리) + 🔍 기기 검색 팝업. 팝업에서 고르면 같은 폼의 사무소 칸도 그 기기의 사무소로 바꾼다.
 * 폼 밖에서는 form 을 주지 않으면 기번만 바뀐다.
 */
export const McnNoSearchInput = ({ value, onChange, disabled, form, officeField: oName = 'ofcCode' }: ValueProps<string | undefined> & { form?: FormInstance; officeField?: string }) => {
  const ofcCode = Form.useWatch(oName, form) as string | undefined;
  const [open, setOpen] = useState(false);
  return (
    <>
      <Space.Compact style={{ width: '100%' }}>
        <Input value={value} maxLength={3} placeholder="숫자 3자리" disabled={disabled} aria-label="기번" allowClear onChange={(e) => onChange?.(e.target.value.replace(/\D/g, ''))} />
        <Button icon={<SearchOutlined />} disabled={disabled} aria-label="기기 검색" onClick={() => setOpen(true)} />
      </Space.Compact>
      <McnSearchModal
        open={open}
        onClose={() => setOpen(false)}
        defaultOfcCode={ofcCode || undefined}
        onSelect={(m) => {
          form?.setFieldValue(oName, m.ofcCode);
          onChange?.(m.mcnNo);
        }}
      />
    </>
  );
};

/** 조회조건: 사무소(필수, 기본 내 사무소)·기번(🔍)·기기사·기기유형·운영구분·정내외·사용여부(기본 Y) */
export const useMcnInfoFields = (): SearchField[] => {
  const ofcCode = useAuthStore(selectOfcCode);
  return useMemo(
    () => [
      officeField({ defaultValue: ofcCode || undefined }),
      { name: 'mcnNo', label: '기번', type: 'custom', widthClass: 'normal', rules: [digits(3)], render: (form) => <McnNoSearchInput form={form} /> },
      vendorField(),
      distinctField('komType', '기기유형', 'mcn-kom-type'),
      distinctField('opType', '운영구분', 'mcn-op-type'),
      distinctField('inoutType', '정내외', 'mcn-inout-type'),
      ynField(),
    ],
    [ofcCode],
  );
};

/** SearchForm 값 → `GET /api/mcn-info` 파라미터('전체'·빈 값은 뺀다) */
export const toMcnInfoParams = (v: Record<string, unknown>): Omit<McnInfoSearch, 'page' | 'size'> => ({
  ofcCode: String(v.ofcCode ?? ''),
  mcnNo: allToUndef(v.mcnNo),
  vendCode: allToUndef(v.vendCode),
  komType: allToUndef(v.komType),
  opType: allToUndef(v.opType),
  inoutType: allToUndef(v.inoutType),
  useYn: allToUndef(v.useYn) as McnInfoSearch['useYn'],
});

/** 삭제 확인 문구 — 논리 삭제라서 '사용여부 N 처리' 를 밝힌다(설계 Q11) */
export const DELETE_CONFIRM = CMSG.softDelete(1, '기기');

/* ===================== 입력 칸 ===================== */

/**
 * 코드표가 정해지기 전 칸(기기유형·운영구분·정내외·장소특성, 잠정): 있는 값 목록(`/api/lookup/distinct/{target}`)에서 고르거나 새 값을 직접 친다.
 * 최대 글자 수는 정본 컬럼 길이.
 */
export const FreeCodeInput = ({ target, maxLength, value, onChange, disabled, ariaLabel }: ValueProps<string | undefined> & { target: DistinctTarget; maxLength: number; ariaLabel: string }) => {
  const { data = [] } = useDistinct(target);
  const options = useMemo(() => data.map((d) => ({ value: d.value })), [data]);
  return (
    <AutoComplete
      value={value}
      onChange={(v?: string) => onChange?.(v ? v : undefined)}
      options={options}
      maxLength={maxLength}
      allowClear
      disabled={disabled}
      placeholder="선택 또는 입력"
      aria-label={ariaLabel}
      filterOption={(input, o) => String(o?.value ?? '').startsWith(input)}
      style={{ width: '100%' }}
    />
  );
};

/* ===================== 등록·수정 탭 ===================== */

type McnInfoForm = Partial<Omit<McnInfoSave, 'useYn'>> & { useYn: 'Y' | 'N' };

/** 입력 검증 — 길이는 TB_MCN_INFO 정본 컬럼 길이(서버 @Size 와 같은 값) */
const RULES = {
  ofcCode: [reqSelect('사무소')],
  mcnNo: [req('기번'), digits(3)],
  src: [maxLen(2)],
  komType: [maxLen(5)],
  opType: [maxLen(1)],
  inoutType: [maxLen(1)],
  cnrPstSpecCode: [maxLen(2)],
  useYn: [reqSelect('사용여부')],
} satisfies Record<string, Rule[]>;

const opt = (v: string | null | undefined): string | undefined => (v ? v : undefined);
const trimOpt = (v: string | undefined): string | undefined => (v && v.trim() ? v.trim() : undefined);

const toForm = (r: McnInfo): McnInfoForm => ({
  ofcCode: r.ofcCode,
  mcnNo: r.mcnNo,
  instPstCode: opt(r.instPstCode),
  src: opt(r.src),
  komType: opt(r.komType),
  vendCode: opt(r.vendCode),
  opType: opt(r.opType),
  inoutType: opt(r.inoutType),
  useYn: r.useYn,
  cnrPstSpecCode: opt(r.cnrPstSpecCode),
});

/** 폼 값 → 저장 본문(빈 칸은 보내지 않음 = 서버에서 NULL) */
export const toMcnInfoSave = (v: McnInfoForm): McnInfoSave => ({
  ofcCode: v.ofcCode ?? '',
  mcnNo: v.mcnNo ?? '',
  instPstCode: trimOpt(v.instPstCode),
  src: trimOpt(v.src),
  komType: trimOpt(v.komType),
  vendCode: trimOpt(v.vendCode),
  opType: trimOpt(v.opType),
  inoutType: trimOpt(v.inoutType),
  useYn: v.useYn,
  cnrPstSpecCode: trimOpt(v.cnrPstSpecCode),
});

interface EditProps {
  screenKey: ScreenKey;
  mode: ListEditMode;
  row: McnInfo | null;
  done: () => void;
}

/**
 * 등록·수정 탭 내용. 수정은 `GET /api/mcn-info/{ofcCode}/{mcnNo}` 로 최신 1건을 읽은 뒤 폼을 연다.
 * 폼은 키(모드·행)마다 새로 마운트한다(initialValues 가 확실히 적용되게 — 원본 StdEditModal·CornerEditModal 과 같은 이유).
 */
export const McnInfoEditPane = ({ screenKey, mode, row, done }: EditProps) => {
  const editing = mode === 'edit' && !!row;
  const detail = useQuery({
    queryKey: mcnInfoKeys.detail(row?.ofcCode ?? '', row?.mcnNo ?? ''),
    queryFn: () => mcnInfoApi.get(row?.ofcCode ?? '', row?.mcnNo ?? ''),
    enabled: editing,
  });
  if (!editing) return <McnInfoEditForm key="create" screenKey={screenKey} initial={null} done={done} />;
  if (detail.isError) return <EmptyState text="기기정보를 불러오지 못했습니다." action={<Button onClick={done}>목록</Button>} />;
  if (!detail.data) return <LoadingBlock />;
  return <McnInfoEditForm key={`${detail.data.ofcCode}-${detail.data.mcnNo}`} screenKey={screenKey} initial={detail.data} done={done} />;
};

const McnInfoEditForm = ({ screenKey, initial, done }: { screenKey: ScreenKey; initial: McnInfo | null; done: () => void }) => {
  const [form] = Form.useForm<McnInfoForm>();
  const qc = useQueryClient();
  const myOfc = useAuthStore(selectOfcCode);
  const isEdit = !!initial;
  const initialValues = useMemo<McnInfoForm>(() => (initial ? toForm(initial) : { ofcCode: myOfc || undefined, useYn: 'Y' }), [initial, myOfc]);

  const saved = () => {
    void qc.invalidateQueries({ queryKey: mcnInfoKeys.all });
    done();
  };
  const create = useMutation({ mutationFn: mcnInfoApi.create, onSuccess: saved });
  const update = useMutation({ mutationFn: mcnInfoApi.update, onSuccess: saved });
  const remove = useMutation({ mutationFn: mcnInfoApi.remove, onSuccess: saved });

  const onFinish = (v: McnInfoForm) => (isEdit ? update.mutate(toMcnInfoSave(v)) : create.mutate(toMcnInfoSave(v)));
  const back: ActionItem = { key: 'close', label: '목록', onClick: done };
  const actions: ActionItem[] = isEdit && initial
    ? [{ key: 'update', loading: update.isPending, onClick: () => form.submit() }, { key: 'delete', confirm: DELETE_CONFIRM, loading: remove.isPending, onClick: () => remove.mutate(initial) }, back]
    : [{ key: 'create', loading: create.isPending, onClick: () => form.submit() }, back];

  const free = (name: keyof McnInfoForm, target: DistinctTarget, max: number, label: string) => formItem(name, <FreeCodeInput target={target} maxLength={max} ariaLabel={label} />, RULES[name as keyof typeof RULES]);

  return (
    <Form<McnInfoForm>
      form={form}
      component={false}
      initialValues={initialValues}
      onFinish={onFinish}
    >
      <DetailGrid
        cols={3}
        labelWidth={110}
        items={[
          { label: '사무소', required: true, value: formItem('ofcCode', <OfficeSelector disabled={isEdit} />, RULES.ofcCode) },
          { label: '기번', required: true, value: formItem('mcnNo', <Input maxLength={3} placeholder="숫자 3자리" disabled={isEdit} aria-label="기번 입력" />, RULES.mcnNo) },
          { label: '코너', value: formItem('instPstCode', <CornerSelect form={form} placeholder="선택" clearOnParentChange />) },
          { label: '기종(SRC)', value: formItem('src', <SrcSelect placeholder="선택" />, RULES.src) },
          { label: '기기유형', value: free('komType', 'mcn-kom-type', 5, '기기유형 입력') },
          { label: '기기사', value: formItem('vendCode', <VendorSelect placeholder="선택" />) },
          { label: '운영구분', value: free('opType', 'mcn-op-type', 1, '운영구분 입력') },
          { label: '정내외', value: free('inoutType', 'mcn-inout-type', 1, '정내외 입력') },
          { label: '장소특성', value: free('cnrPstSpecCode', 'mcn-cnr-pst-spec', 2, '장소특성 입력') },
          { label: '사용여부', required: true, value: formItem('useYn', <Radio.Group options={YN_OPTIONS} />, RULES.useYn) },
          ...(initial
            ? [
                { label: '최초등록', value: `${fmtDateTime14(initial.crtDtm)} ${initial.crtCmeno ?? ''}` },
                { label: '최종변경', value: `${fmtDateTime14(initial.lschgDtm)} ${initial.lsCmeno ?? ''}` },
              ]
            : []),
        ]}
      />
      <div style={{ marginTop: 12 }}>
        <ActionBar screenKey={screenKey} actions={actions} />
      </div>
    </Form>
  );
};
