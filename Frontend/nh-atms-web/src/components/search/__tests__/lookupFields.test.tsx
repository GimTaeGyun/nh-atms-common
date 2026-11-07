import { describe, expect, it, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Form, type FormInstance } from 'antd';
import { renderWithProviders } from '@/test/render';
import { CornerSelect, DistinctSelect, ModelSelect, PersonSelect, SidoSelect, SigunSelect, SrcSelect, VendorSelect, YnSelect, codeNameLabel, modelValueOf, parseModelValue, vendorLabel } from '@/components/search/lookupFields';
import { CodeSelect, McnSelect, OfficeSelector } from '@/components/search/fields';
import { SearchForm } from '@/components/search/SearchForm';
import { cornerField, modelField, personField, sidoField, sigunField, vendorField, ynField } from '@/components/search/lookupFields';
import { mcnField, officeField } from '@/components/search/fields';
import { ofcMcnParams, allToUndef } from '@/components/search/params';

/** antd Select 열기 — 콤보 입력칸에 mouseDown */
const openSelect = (name: string) => fireEvent.mouseDown(screen.getByRole('combobox', { name }));

describe('라벨 규칙', () => {
  it("'[코드] 이름', 이름이 없으면 코드만(기기사 Q6)", () => {
    expect(codeNameLabel('01', '에이텍')).toBe('[01] 에이텍');
    expect(codeNameLabel('04', null)).toBe('04');
    expect(vendorLabel({ vendCode: '04', vendNm: null })).toBe('04');
  });
});

describe('VendorSelect / DistinctSelect / SidoSelect / YnSelect / CodeSelect', () => {
  it('기기사: 이름 있으면 [코드] 이름, 없으면 코드', async () => {
    const onChange = vi.fn();
    renderWithProviders(<VendorSelect onChange={onChange} />);
    openSelect('기기사');
    fireEvent.click(await screen.findByTitle('[01] 에이텍'));
    expect(onChange).toHaveBeenCalledWith('01');
    openSelect('기기사');
    expect(await screen.findByTitle('04')).toBeInTheDocument();
  });

  it('있는 값 콤보: 허용 목록 target 의 값 목록', async () => {
    renderWithProviders(<DistinctSelect target="model-mcn-type" />);
    openSelect('model-mcn-type');
    expect(await screen.findByTitle('01')).toBeInTheDocument();
    expect(screen.getByTitle('02')).toBeInTheDocument();
  });

  it('시도 → 시군 종속(프롭으로 시도를 넘길 때)', async () => {
    const Host = () => {
      const [sido, setSido] = useState<string | undefined>();
      return (
        <>
          <SidoSelect value={sido} onChange={setSido} />
          <SigunSelect sidoCode={sido ?? ''} />
        </>
      );
    };
    renderWithProviders(<Host />);
    expect(screen.getByRole('combobox', { name: '시군' })).toBeDisabled();
    openSelect('시도');
    fireEvent.click(await screen.findByTitle('부산광역시'));
    await waitFor(() => expect(screen.getByRole('combobox', { name: '시군' })).toBeEnabled());
    openSelect('시군');
    expect(await screen.findByTitle('해운대구')).toBeInTheDocument();
    expect(screen.queryByTitle('강남구')).toBeNull();
  });

  it('사용여부: 전체(빈 값)/사용(Y)/미사용(N)', async () => {
    const onChange = vi.fn();
    renderWithProviders(<YnSelect onChange={onChange} />);
    expect(screen.getByTitle('전체')).toBeInTheDocument();
    openSelect('사용여부');
    fireEvent.click(await screen.findByTitle('미사용(N)'));
    expect(onChange).toHaveBeenCalledWith('N');
  });

  it('공통코드 콤보: 코드구분의 코드명 + 맨 앞 전체', async () => {
    renderWithProviders(<CodeSelect codeType="SAMPLE" value="ALL" />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(await screen.findByTitle('견본코드2')).toBeInTheDocument();
    expect(screen.getAllByTitle('전체').length).toBeGreaterThan(0);
  });
});

describe('사무소 종속 콤보(폼 안) — 기번·코너·인원, 기기사 종속 — 모델', () => {
  it('사무소를 고르기 전에는 비활성, 고르면 그 사무소 목록', async () => {
    const Host = () => {
      const [form] = Form.useForm();
      return (
        <Form form={form}>
          <Form.Item name="ofcCode"><OfficeSelector /></Form.Item>
          <Form.Item name="mcnNo"><McnSelect form={form} /></Form.Item>
          <Form.Item name="instPstCode"><CornerSelect form={form} /></Form.Item>
          <Form.Item name="perNo"><PersonSelect form={form} /></Form.Item>
          <Form.Item name="vendCode"><VendorSelect /></Form.Item>
          <Form.Item name="modelCode"><ModelSelect form={form} /></Form.Item>
        </Form>
      );
    };
    renderWithProviders(<Host />);
    for (const name of ['코너', '인원', '모델']) expect(screen.getByRole('combobox', { name })).toBeDisabled();
    // 사무소 코드 직접 입력(앞자리 0 채움) → Enter
    const code = screen.getByRole('textbox', { name: '사무소코드' });
    fireEvent.change(code, { target: { value: '80' } });
    await waitFor(async () => {
      fireEvent.keyDown(code, { key: 'Enter' });
      expect(screen.getByRole('combobox', { name: '인원' })).toBeEnabled();
    });
    openSelect('인원');
    expect(await screen.findByTitle('[1234567] 홍길동')).toBeInTheDocument();
    openSelect('코너');
    expect((await screen.findAllByTitle(/^\[001\]/)).length).toBeGreaterThan(0);
    // 기기사 → 모델
    openSelect('기기사');
    fireEvent.click(await screen.findByTitle('[02] 효성티엔에스'));
    await waitFor(() => expect(screen.getByRole('combobox', { name: '모델' })).toBeEnabled());
    openSelect('모델');
    expect(await screen.findByTitle('[01:H1] ATM-4100')).toBeInTheDocument();
    expect(screen.queryByTitle('[01:A1] ATM-3200')).toBeNull();
  });
});

describe('기종 콤보 · 상위 값이 바뀌면 비우기(clearOnParentChange)', () => {
  it('기종: [SRC] 이름, vendCode 를 주면 그 업체 기종만', async () => {
    const onChange = vi.fn();
    renderWithProviders(<SrcSelect vendCode="01" onChange={onChange} />);
    openSelect('기종');
    fireEvent.click(await screen.findByTitle('[S1] STM'));
    expect(onChange).toHaveBeenCalledWith('S1');
    openSelect('기종');
    expect(screen.queryByTitle('[A2] ATM 365형')).toBeNull();
  });

  it('clearOnParentChange: 사무소가 바뀌면 고른 인원을 폼 값에서 비운다(없으면 값은 남는다)', async () => {
    let api: FormInstance | undefined;
    const keep = (f: FormInstance) => {
      api = f;
    };
    const Host = ({ onForm }: { onForm: (f: FormInstance) => void }) => {
      const [form] = Form.useForm();
      useEffect(() => onForm(form), [form, onForm]);
      return (
        <Form form={form} initialValues={{ ofcCode: '000080', perNo: '1234567', perNo2: '1234567' }}>
          <Form.Item name="ofcCode"><OfficeSelector /></Form.Item>
          <Form.Item name="perNo"><PersonSelect form={form} clearOnParentChange /></Form.Item>
          <Form.Item name="perNo2"><PersonSelect form={form} /></Form.Item>
        </Form>
      );
    };
    renderWithProviders(<Host onForm={keep} />);
    // 첫 그림(useWatch undefined → 초기값)에는 지우지 않는다
    await waitFor(() => expect(screen.getAllByRole('combobox', { name: '인원' })[0]).toBeEnabled());
    expect(api?.getFieldValue('perNo')).toBe('1234567');
    act(() => api?.setFieldValue('ofcCode', '000001'));
    await waitFor(() => expect(api?.getFieldValue('perNo')).toBeUndefined());
    expect(api?.getFieldValue('perNo2')).toBe('1234567');
  });
});

describe('ModelSelect 값 규칙 — TB_CO_MODEL PK 3개(VEND_CODE+MCN_TYPE+MODEL_CODE)', () => {
  it("기기구분 고정 안 함: 값 '<mcnType>:<modelCode>' — 같은 기기사 안 MODEL_CODE 가 겹쳐도 값이 다르다", async () => {
    const onChange = vi.fn();
    renderWithProviders(<ModelSelect vendCode="01" onChange={onChange} />);
    openSelect('모델');
    expect(await screen.findByTitle('[01:A1] ATM-3200')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('[02:A1] 에이텍 STM'));
    expect(onChange).toHaveBeenCalledWith('02:A1');
  });

  it('기기구분 고정(mcnType 프롭): 값 = MODEL_CODE', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ModelSelect vendCode="01" mcnType="01" onChange={onChange} />);
    openSelect('모델');
    fireEvent.click(await screen.findByTitle('[A2] ATM-3500'));
    expect(onChange).toHaveBeenCalledWith('A2');
    expect(screen.queryByTitle('[A1] 에이텍 STM')).toBeNull();
  });

  it('modelValueOf / parseModelValue', () => {
    expect(modelValueOf({ mcnType: '02', modelCode: 'A1' }, false)).toBe('02:A1');
    expect(modelValueOf({ mcnType: '02', modelCode: 'A1' }, true)).toBe('A1');
    expect(parseModelValue('02:A1')).toEqual({ mcnType: '02', modelCode: 'A1' });
    expect(parseModelValue('A1')).toEqual({ modelCode: 'A1' });
    expect(parseModelValue(undefined)).toEqual({});
  });
});

describe('xxxField 팩토리 + 파라미터 매퍼', () => {
  it('필드 이름 = 계약 camelCase, 사용여부 기본 Y', () => {
    expect([officeField(), mcnField(), vendorField(), modelField(), personField(), cornerField(), sidoField(), sigunField(), ynField()].map((f) => f.name)).toEqual([
      'ofcCode', 'mcnNo', 'vendCode', 'modelCode', 'perNo', 'instPstCode', 'sidoCode', 'sigunCode', 'useYn',
    ]);
    expect(ynField().defaultValue).toBe('Y');
  });

  it('SearchForm 에서 사무소 기본값 + 조회 → ofcMcnParams', async () => {
    const onSearch = vi.fn();
    renderWithProviders(<SearchForm fields={[officeField({ defaultValue: '000080' }), mcnField(), ynField()]} onSearch={onSearch} />);
    fireEvent.click(screen.getByRole('button', { name: /조회/ }));
    await waitFor(() => expect(onSearch).toHaveBeenCalled());
    const v = onSearch.mock.calls[0][0] as Record<string, unknown>;
    expect(ofcMcnParams(v)).toEqual({ ofcCode: '000080', mcnNo: undefined });
    expect(v.useYn).toBe('Y');
    expect([allToUndef('ALL'), allToUndef(''), allToUndef('Y')]).toEqual([undefined, undefined, 'Y']);
  });
});
