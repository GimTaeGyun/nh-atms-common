/**
 * 탭 2 콤보 — 공통 조회 API(`/api/lookup/*`) 콤보를 한 SearchForm 안에 모아 종속 관계·배치 규칙(2행 + 상세 필터)을 보여 준다.
 * 종속: 사무소 → 기번·코너·인원 / 기기사 → 모델 / 시도 → 시군. 상위 값이 없으면 하위 콤보는 비활성.
 * `clearOnParentChange` 를 준 하위 콤보는 상위 값이 바뀌면 고른 값도 비운다(안 보이는 값이 조회조건에 남지 않게).
 * 모델 값은 기기구분을 고정하지 않으면 '<mcnType>:<modelCode>' → 서버에 보낼 때 parseModelValue 로 나눈다.
 */
import { useMemo, useState } from 'react';
import { Form, Input, Select, Space } from 'antd';
import { SearchForm, type SearchField } from '@/components/search/SearchForm';
import { codeField, mcnField, officeField, OfficeSelector } from '@/components/search/fields';
import { cornerField, distinctField, modelField, parseModelValue, personField, PersonSelect, sidoField, sigunField, srcField, vendorField, ynField, YnSelect } from '@/components/search/lookupFields';
import { allToUndef } from '@/components/search/params';
import { PersonNoInput, type PersonInfo } from '@/components/forms/PersonNoInput';
import { DISTINCT_TARGETS, type DistinctTarget } from '@/domain/lookup';
import { useAuthStore, selectOfcCode } from '@/stores/useAuthStore';
import { compactParams } from '@/utils/object';
import { Demo, DemoGrid, EchoJson } from './CodeSample';

/** 콤보 조건 값 → API 파라미터. '전체'(빈 값·ALL)는 빠진다 */
export const toComboParams = (v: Record<string, unknown>) =>
  compactParams({
    ofcCode: v.ofcCode as string | undefined,
    mcnNo: v.mcnNo as string | undefined,
    instPstCode: v.instPstCode as string | undefined,
    vendCode: v.vendCode as string | undefined,
    src: v.src as string | undefined,
    ...parseModelValue(v.modelCode as string | undefined),
    perNo: v.perNo as string | undefined,
    reqPerNo: v.reqPerNo as string | undefined,
    code: allToUndef(v.code),
    distinctValue: v.distinctValue as string | undefined,
    sidoCode: v.sidoCode as string | undefined,
    sigunCode: v.sigunCode as string | undefined,
    useYn: allToUndef(v.useYn),
  });

/** 기본 공통코드 구분(목에 있는 견본 코드구분). 실제 DB 의 코드구분을 입력해 바꿔 볼 수 있다 */
export const DEFAULT_CODE_TYPE = 'SAMPLE';

const ComboTab = () => {
  const myOfc = useAuthStore(selectOfcCode);
  const [codeType, setCodeType] = useState(DEFAULT_CODE_TYPE);
  const [target, setTarget] = useState<DistinctTarget>('mcn-kom-type');
  const [params, setParams] = useState<Record<string, unknown> | null>(null);
  const [form] = Form.useForm();

  const fields = useMemo<SearchField[]>(
    () => [
      officeField({ defaultValue: myOfc || undefined }),
      mcnField(),
      cornerField({ clearOnParentChange: true }),
      vendorField(),
      modelField({ clearOnParentChange: true }),
      personField({ clearOnParentChange: true }),
      codeField('code', `공통코드(${codeType})`, codeType, { newRow: true }),
      distinctField('distinctValue', `있는 값(${target})`, target),
      ynField(),
      sidoField({ advanced: true }),
      sigunField({ advanced: true, clearOnParentChange: true }),
      srcField({ advanced: true }),
      { name: 'reqPerNo', label: '개인번호', type: 'custom', widthClass: 'long', advanced: true, render: () => <PersonNoInput width={120} /> },
    ],
    [myOfc, codeType, target],
  );

  // 단독(폼 밖) 사용: 상위 값을 프롭으로 넘긴다
  const [ofc, setOfc] = useState<string | undefined>(myOfc || undefined);
  const [per, setPer] = useState<string | undefined>();
  const [yn, setYn] = useState<string | undefined>('');
  const [perNo, setPerNo] = useState('');
  const [resolved, setResolved] = useState<PersonInfo | null>(null);

  return (
    <>
      <Demo
        title="조회조건 안 콤보 묶음 (SearchForm)"
        desc="1행: 사무소 → 기번·코너, 기기사 → 모델, 인원(상위가 바뀌면 비움: clearOnParentChange). 2행: 공통코드·있는 값·사용여부. 시도 → 시군·기종·개인번호는 [상세 필터]."
        code={`const fields = [officeField({ defaultValue: myOfc }), mcnField(), cornerField({ clearOnParentChange: true }), vendorField(),
  modelField({ clearOnParentChange: true }), personField({ clearOnParentChange: true }),
  codeField('code', '구분', 'SAMPLE', { newRow: true }), distinctField('kom', '기기유형', 'mcn-kom-type'), ynField(),
  sidoField({ advanced: true }), sigunField({ advanced: true, clearOnParentChange: true }), srcField({ advanced: true })];
const onSearch = (v) => search.search({ ...v, ...parseModelValue(v.modelCode), code: allToUndef(v.code) });`}
      >
        <Space wrap style={{ marginBottom: 8 }}>
          <span>공통코드 구분</span>
          <Input value={codeType} onChange={(e) => setCodeType(e.target.value.trim().toUpperCase())} maxLength={20} style={{ width: 140 }} aria-label="코드구분" />
          <span>있는 값 대상</span>
          <Select<DistinctTarget> value={target} onChange={setTarget} options={DISTINCT_TARGETS.map((t) => ({ value: t, label: t }))} style={{ width: 180 }} aria-label="있는 값 대상" />
        </Space>
        <SearchForm form={form} fields={fields} onSearch={(v) => setParams(toComboParams(v))} />
        {params && <EchoJson value={params} label="API 파라미터" />}
      </Demo>
      <DemoGrid>
        <Demo
          title="폼 밖에서 종속 콤보 (OfficeSelector → PersonSelect)"
          desc="폼이 없으면 상위 값을 프롭(ofcCode)으로 준다. 사무소는 콤보 + 코드 직접입력(앞 0 채움) + 돋보기 팝업."
          code={`<OfficeSelector value={ofc} onChange={setOfc} />
<PersonSelect ofcCode={ofc} value={per} onChange={setPer} />`}
          echo={{ ofcCode: ofc, perNo: per }}
        >
          <Space orientation="vertical" style={{ width: '100%' }}>
            <OfficeSelector value={ofc} onChange={(v) => { setOfc(v); setPer(undefined); }} />
            <PersonSelect ofcCode={ofc ?? ''} value={per} onChange={setPer} />
          </Space>
        </Demo>
        <Demo
          title="개인번호 입력 (PersonNoInput)"
          desc="개인번호를 넣고 Enter → GET /api/lookup/persons/{perNo} 로 성명 표시. 없으면 오류 표시."
          code={`<PersonNoInput value={perNo} onChange={setPerNo} onResolved={(p) => setPerson(p)} showHelp />`}
          echo={{ perNo, resolved }}
          echoLabel="개인번호 결과"
        >
          <PersonNoInput value={perNo} onChange={setPerNo} onResolved={setResolved} showHelp />
        </Demo>
        <Demo title="사용여부 (YnSelect)" desc="고정 옵션 전체('')/Y/N. '' 는 파라미터에서 빠진다." code={`<YnSelect value={yn} onChange={setYn} />   // 조회조건: ynField()`} echo={{ useYn: yn }}>
          <YnSelect value={yn} onChange={setYn} />
        </Demo>
      </DemoGrid>
    </>
  );
};

export default ComboTab;
