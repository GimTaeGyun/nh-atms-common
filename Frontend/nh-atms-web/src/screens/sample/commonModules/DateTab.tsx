/**
 * 탭 1 날짜 — 단독 부품(값/onChange) + 조회조건 팩토리(SearchForm) + 파라미터 매퍼(params.ts).
 * 휴일 표시는 `GET /api/lookup/holidays`(TB_NMS_HDAY) 실제 API. 화면 안 값은 Dayjs, API 로는 'YYYYMMDD'.
 */
import { useMemo, useState } from 'react';
import { DatePicker, Form } from 'antd';
import { SearchForm, type SearchField } from '@/components/search/SearchForm';
import { dateField, periodField, PeriodPicker, timeRangeField, TimeRangeSelect, type PeriodValue, type TimeRangeValue } from '@/components/search/fields';
import { DateSpinner, dateSpinnerField, timeField, TimeSpin, yearMonthField, YearMonthPicker } from '@/components/search/fieldsExt';
import { HolidayDatePicker, holidayDateField, PresetRangePicker, rangeField, yearField, YearPicker } from '@/components/search/dateFields';
import { periodParams, timeParams, ymdOf, ymdRange } from '@/components/search/params';
import { holidayCellRender, useHolidays } from '@/hooks/useHolidays';
import { lastDays, today, toYmd, validateRange, type Dayjs } from '@/utils/date';
import { Demo, DemoGrid, EchoJson } from './CodeSample';

/** 조회조건 값 → API 파라미터(매퍼 전종). 실제 화면은 이것을 api/endpoints/<업무>.ts 에 넘긴다 */
export const toDateParams = (v: Record<string, unknown>) => ({
  date: ymdOf(v.date),
  ...ymdRange(v.period),
  period: periodParams(v.periodRange),
  yyyymm: (v.yyyymm as Dayjs | undefined)?.format('YYYYMM') ?? '',
  year: (v.year as string | undefined) ?? '',
  baseDate: ymdOf(v.baseDate),
  ...timeParams(v.time),
  atTime: (v.atTime as string | undefined) ?? '',
  hday: ymdOf(v.hday),
});

const DATE_FIELDS: SearchField[] = [
  dateField('date', '조회일자'),
  rangeField({ label: '기간', maxDays: 31, holidays: true }),
  dateSpinnerField({ label: '거래일자(◀▶)', maxDaysBack: 7 }),
  yearMonthField(),
  yearField(),
  periodField({ name: 'periodRange', label: '기간(일·월)', required: false, defaultValue: { unit: 'DAY', range: lastDays(7) }, advanced: true }),
  timeRangeField({ advanced: true }),
  timeField({ name: 'atTime', label: '시각', advanced: true }),
  holidayDateField('hday', '휴일표시일자', { advanced: true }),
];

/** 이번 달 휴일 — useHolidays + holidayCellRender 를 직접 쓰는 예 */
const HolidayDemo = () => {
  const [d, setD] = useState<Dayjs | null>(today());
  const base = d ?? today();
  const { days, isFetching } = useHolidays(toYmd(base.startOf('month')), toYmd(base.endOf('month')));
  const list = useMemo(() => Array.from(days).sort(), [days]);
  return (
    <Demo
      title="휴일 표시 (useHolidays + holidayCellRender)"
      desc="TB_NMS_HDAY 를 읽어 빨간 글자로 표시만 한다(영업일 계산은 현업 확인 대기)."
      code={`const { days } = useHolidays(from, to); // YYYYMMDD, 최대 366일
<DatePicker cellRender={holidayCellRender(days)} />`}
      echo={{ loading: isFetching, holidays: list }}
      echoLabel="이번 달 휴일"
    >
      <DatePicker value={d} onChange={setD} cellRender={holidayCellRender(days)} style={{ width: 180 }} aria-label="휴일 달력" />
    </Demo>
  );
};

const DateTab = () => {
  const [single, setSingle] = useState<Dayjs | undefined>(today());
  const [range, setRange] = useState<[Dayjs, Dayjs] | undefined>(lastDays(7));
  const [period, setPeriod] = useState<PeriodValue | undefined>({ unit: 'MONTH', range: [today().subtract(2, 'month'), today()] });
  const [ym, setYm] = useState<Dayjs | undefined>(today().startOf('month'));
  const [year, setYear] = useState<string | undefined>(today().format('YYYY'));
  const [spin, setSpin] = useState<Dayjs | undefined>(today());
  const [tr, setTr] = useState<TimeRangeValue | undefined>({ from: '0900', to: '1800' });
  const [tm, setTm] = useState<string | undefined>('1030');
  const [params, setParams] = useState<Record<string, unknown> | null>(null);
  const [form] = Form.useForm();
  const rangeError = validateRange(range?.[0], range?.[1], 31);

  return (
    <>
      <Demo
        title="조회조건 안에서 쓰기 (SearchForm + 팩토리 + 매퍼)"
        desc="2행만 보이고 나머지는 [상세 필터]. 기간은 최대 31일 — 넘기면 [조회] 때 칸 아래 오류. [조회] 를 누르면 API 파라미터를 보여 준다."
        code={`const fields = [dateField('date', '조회일자'), rangeField({ maxDays: 31 }), dateSpinnerField({ maxDaysBack: 7 }),
  yearMonthField(), yearField(), periodField({ name: 'periodRange', advanced: true }), timeRangeField({ advanced: true })];
const onSearch = (v) => search.search({ date: ymdOf(v.date), ...ymdRange(v.period), ...periodParams(v.periodRange), ...timeParams(v.time) });
<SearchForm form={form} fields={fields} onSearch={onSearch} />`}
      >
        <SearchForm form={form} fields={DATE_FIELDS} onSearch={(v) => setParams(toDateParams(v))} />
        {params && <EchoJson value={params} label="API 파라미터" />}
      </Demo>
      <HolidayDemo />
      <DemoGrid>
        <Demo title="단일일자 + 휴일 (HolidayDatePicker / dateField)" code={`dateField('date', '조회일자')            // 조회조건
<HolidayDatePicker value={d} onChange={setD} />  // 휴일 빨간 표시`} echo={{ ymd: toYmd(single) }}>
          <HolidayDatePicker value={single} onChange={setSingle} />
        </Demo>
        <Demo
          title="기간 + 빠른선택 + 최대 31일 (PresetRangePicker / rangeField)"
          desc="빠른선택: 오늘·1주·1개월(31일 넘는 3개월은 빠짐)."
          code={`rangeField({ maxDays: 31, holidays: true })  // 값 [Dayjs, Dayjs] → ymdRange(v.period)
validateRange(from, to, 31) // 오류 문구 또는 undefined`}
          echo={{ ...ymdRange(range), error: rangeError ?? null }}
        >
          <PresetRangePicker value={range} onChange={setRange} maxDays={31} holidays />
        </Demo>
        <Demo title="일·월 단위 기간 (PeriodPicker / periodField)" code={`periodField()  // 값 { unit: 'DAY'|'MONTH', range } → periodParams(v.period)`} echo={periodParams(period)}>
          <PeriodPicker value={period} onChange={setPeriod} />
        </Demo>
        <Demo title="기준월 (YearMonthPicker / yearMonthField)" code={`yearMonthField()  // 이름 'yyyymm', 값 Dayjs → v.yyyymm.format('YYYYMM')`} echo={{ yyyymm: ym?.format('YYYYMM') }}>
          <YearMonthPicker value={ym} onChange={setYm} />
        </Demo>
        <Demo title="년도 (YearPicker / yearField)" code={`yearField()  // 이름 'year', 값 'YYYY' 문자열 그대로`} echo={{ year }}>
          <YearPicker value={year} onChange={setYear} />
        </Demo>
        <Demo title="◀ ▶ 하루씩, 과거 7일까지 (DateSpinner / dateSpinnerField)" code={`dateSpinnerField({ maxDaysBack: 7 })  // 미래·8일 전은 고를 수 없음`} echo={{ baseDate: toYmd(spin) }}>
          <DateSpinner value={spin} onChange={setSpin} maxDaysBack={7} />
        </Demo>
        <Demo title="시각 범위 (TimeRangeSelect / timeRangeField)" code={`timeRangeField()  // 값 { from:'HHmm', to:'HHmm' } → timeParams(v.time)`} echo={timeParams(tr)}>
          <TimeRangeSelect value={tr} onChange={setTr} />
        </Demo>
        <Demo title="시각 하나 (TimeSpin / timeField)" code={`timeField({ minuteStep: 10 })  // 값 'HHmm'`} echo={{ time: tm }}>
          <TimeSpin value={tm} onChange={setTm} minuteStep={10} />
        </Demo>
      </DemoGrid>
    </>
  );
};

export default DateTab;
