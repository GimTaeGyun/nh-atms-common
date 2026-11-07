import { http } from 'msw';
import { DISTINCT_TARGETS, type DistinctTarget } from '@/domain/lookup';
import { CORNERS, MACHINES, MODELS, OFFICES, PERSONS, SIDO, SIGUN, SRCS, VENDORS, codesOf, distinctOf, holidaysOf } from '../data/lookup';
import { LATENCY, fail, ok, q } from './_util';
import { dayjs } from '@/utils/date';

/**
 * 공통 조회 목 — API 계약 §2 그대로(경로·파라미터·응답 모양·오류코드).
 * 오류 문구는 백엔드 api-messages.tsv 를 백엔드와 같은 {0} 인자로 채운 글(LKP_001·LKP_002·LKP_404·E404·V001_20·VAL_001~003).
 * 검사 순서·인자는 백엔드 LookupService 와 같다(휴일: VAL_002 from→to, VAL_003 from→to, VAL_001 'from~to').
 */
const has = (v: string | null | undefined, kw: string) => !!v && v.includes(kw);

/** api-messages.tsv 문구({0} 자리) — 백엔드 ApiMessages.text 와 같은 결과 */
const VAL_001 = (arg: string) => `입력값이 올바르지 않습니다: ${arg}`;
const VAL_002 = (arg: string) => `필수 파라미터가 없습니다: ${arg}`;
const VAL_003 = (arg: string) => `파라미터 형식이 올바르지 않습니다: ${arg}`;
/** 휴일 조회 최대 기간(일, 양끝 포함) — 백엔드 LookupRules.MAX_HOLIDAY_DAYS */
const MAX_HOLIDAY_DAYS = 366;
/** YYYYMMDD 8자리 + 실제 날짜 (백엔드 LookupService.isYmd) */
const isYmd = (v: string) => /^\d{8}$/.test(v) && dayjs(v, 'YYYYMMDD', true).isValid();
/** 백엔드 OfficeCode.norm — 빈 값 null, 숫자 1~6자리는 왼쪽 '0' 채움, 그 밖(숫자 아님·7자리 이상)은 'BAD'(→ 400 VAL_003 ofcCode) */
const normOfc = (v: string | null | undefined): string | null | 'BAD' => {
  const t = v?.trim();
  if (!t) return null;
  return /^\d{1,6}$/.test(t) ? t.padStart(6, '0') : 'BAD';
};
const BAD_OFC = () => fail(400, VAL_003('ofcCode'), 'VAL_003');

/** 앞뒤 공백 제거, 빈 값이면 null (백엔드 trimToNull) */
const trimToNull = (v: string | null) => {
  const t = v?.trim();
  return t ? t : null;
};

export const lookupHandlers = [
  http.get('/api/lookup/offices', async ({ request }) => {
    await LATENCY();
    const kw = q(request).get('q')?.trim();
    return ok(kw ? OFFICES.filter((o) => has(o.ofcCode, kw) || has(o.kanm, kw)) : OFFICES);
  }),
  http.get('/api/lookup/offices/:ofcCode', async ({ params }) => {
    await LATENCY();
    const code = normOfc(String(params.ofcCode));
    if (code === 'BAD') return BAD_OFC();
    const hit = OFFICES.find((o) => o.ofcCode === code);
    return hit ? ok(hit) : fail(404, `사무소를 찾을 수 없습니다. (${String(params.ofcCode)})`, 'LKP_404');
  }),
  http.get('/api/lookup/persons', async ({ request }) => {
    await LATENCY();
    const sp = q(request);
    const ofcCode = normOfc(sp.get('ofcCode'));
    if (ofcCode === 'BAD') return BAD_OFC();
    const kw = trimToNull(sp.get('q'));
    if (!ofcCode && !kw) return fail(400, '사무소 또는 검색어를 입력하세요.', 'LKP_001');
    // 백엔드 LookupMapper.xml selectPersons: NAME LIKE '%q%' OR PER_NO LIKE 'q%'
    const rows = PERSONS.filter((p) => (!ofcCode || (p.samuso ?? '').trim() === ofcCode) && (!kw || p.name.includes(kw) || p.perNo.startsWith(kw)));
    return ok(rows.slice(0, 200));
  }),
  http.get('/api/lookup/persons/:perNo', async ({ params }) => {
    await LATENCY();
    const hit = PERSONS.find((p) => p.perNo === params.perNo);
    return hit ? ok(hit) : fail(404, '개인번호를 확인하세요.', 'E404');
  }),
  http.get('/api/lookup/vendors', async () => {
    await LATENCY();
    return ok(VENDORS);
  }),
  http.get('/api/lookup/models', async ({ request }) => {
    await LATENCY();
    const sp = q(request);
    const vendCode = sp.get('vendCode');
    const mcnType = sp.get('mcnType');
    return ok(MODELS.filter((m) => (!vendCode || m.vendCode === vendCode) && (!mcnType || m.mcnType === mcnType)));
  }),
  http.get('/api/lookup/srcs', async ({ request }) => {
    await LATENCY();
    const vendCode = trimToNull(q(request).get('vendCode'));
    return ok(SRCS.filter((r) => !vendCode || r.vendCode === vendCode));
  }),
  http.get('/api/lookup/machines', async ({ request }) => {
    await LATENCY();
    const sp = q(request);
    const ofcCode = normOfc(sp.get('ofcCode'));
    if (!ofcCode) return fail(400, '사무소코드는 필수입니다.', 'V001_20');
    if (ofcCode === 'BAD') return BAD_OFC();
    const vendCode = trimToNull(sp.get('vendCode'));
    const kw = trimToNull(sp.get('q'));
    return ok(MACHINES.filter((m) => m.ofcCode === ofcCode && (!vendCode || m.vendCode === vendCode) && (!kw || m.mcnNo.includes(kw))));
  }),
  http.get('/api/lookup/corners', async ({ request }) => {
    await LATENCY();
    const ofcCode = normOfc(q(request).get('ofcCode'));
    if (!ofcCode) return fail(400, '사무소코드는 필수입니다.', 'V001_20');
    if (ofcCode === 'BAD') return BAD_OFC();
    return ok(CORNERS.filter((c) => c.ofcCode === ofcCode));
  }),
  http.get('/api/lookup/codes/:codeType', async ({ params }) => {
    await LATENCY();
    return ok(codesOf(String(params.codeType)));
  }),
  http.get('/api/lookup/distinct/:target', async ({ params }) => {
    await LATENCY();
    const target = String(params.target);
    if (!(DISTINCT_TARGETS as readonly string[]).includes(target)) return fail(400, `조회할 수 없는 항목입니다. (${target})`, 'LKP_002');
    return ok(distinctOf(target as DistinctTarget));
  }),
  http.get('/api/lookup/sido', async () => {
    await LATENCY();
    return ok(SIDO);
  }),
  http.get('/api/lookup/sigun', async ({ request }) => {
    await LATENCY();
    const sidoCode = trimToNull(q(request).get('sidoCode'));
    if (!sidoCode) return fail(400, VAL_002('sidoCode'), 'VAL_002');
    return ok(SIGUN.filter((s) => s.sidoCode === sidoCode));
  }),
  http.get('/api/lookup/holidays', async ({ request }) => {
    await LATENCY();
    const sp = q(request);
    const from = trimToNull(sp.get('from'));
    const to = trimToNull(sp.get('to'));
    if (!from) return fail(400, VAL_002('from'), 'VAL_002');
    if (!to) return fail(400, VAL_002('to'), 'VAL_002');
    if (!isYmd(from)) return fail(400, VAL_003('from'), 'VAL_003');
    if (!isYmd(to)) return fail(400, VAL_003('to'), 'VAL_003');
    const days = dayjs(to, 'YYYYMMDD').diff(dayjs(from, 'YYYYMMDD'), 'day') + 1;
    if (days < 1 || days > MAX_HOLIDAY_DAYS) return fail(400, VAL_001('from~to'), 'VAL_001');
    return ok(holidaysOf(from, to));
  }),
];
