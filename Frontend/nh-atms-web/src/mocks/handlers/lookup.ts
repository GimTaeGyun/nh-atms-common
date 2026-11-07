import { http } from 'msw';
import { DISTINCT_TARGETS, type DistinctTarget } from '@/domain/lookup';
import { CORNERS, MACHINES, MODELS, OFFICES, PERSONS, SIDO, SIGUN, VENDORS, codesOf, distinctOf, holidaysOf } from '../data/lookup';
import { LATENCY, fail, ok, q } from './_util';
import { dayjs } from '@/utils/date';

/**
 * 공통 조회 목 — API 계약 §2 그대로(경로·파라미터·응답 모양·오류코드).
 * 오류 문구는 백엔드 api-messages.tsv 와 같은 글(LKP_001·LKP_002·LKP_404·E404·V001_20·VAL_002).
 */
const has = (v: string | null | undefined, kw: string) => !!v && v.includes(kw);

export const lookupHandlers = [
  http.get('/api/lookup/offices', async ({ request }) => {
    await LATENCY();
    const kw = q(request).get('q')?.trim();
    return ok(kw ? OFFICES.filter((o) => has(o.ofcCode, kw) || has(o.kanm, kw)) : OFFICES);
  }),
  http.get('/api/lookup/offices/:ofcCode', async ({ params }) => {
    await LATENCY();
    const hit = OFFICES.find((o) => o.ofcCode === params.ofcCode);
    return hit ? ok(hit) : fail(404, `사무소를 찾을 수 없습니다. (${String(params.ofcCode)})`, 'LKP_404');
  }),
  http.get('/api/lookup/persons', async ({ request }) => {
    await LATENCY();
    const sp = q(request);
    const ofcCode = sp.get('ofcCode')?.trim();
    const kw = sp.get('q')?.trim();
    if (!ofcCode && !kw) return fail(400, '사무소 또는 검색어를 입력하세요.', 'LKP_001');
    const rows = PERSONS.filter((p) => (!ofcCode || (p.samuso ?? '').trim() === ofcCode) && (!kw || p.name.includes(kw) || p.perNo.includes(kw)));
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
  http.get('/api/lookup/machines', async ({ request }) => {
    await LATENCY();
    const sp = q(request);
    const ofcCode = sp.get('ofcCode');
    if (!ofcCode) return fail(400, '사무소코드는 필수입니다.', 'V001_20');
    const vendCode = sp.get('vendCode');
    const kw = sp.get('q')?.trim();
    return ok(MACHINES.filter((m) => m.ofcCode === ofcCode && (!vendCode || m.vendCode === vendCode) && (!kw || m.mcnNo.includes(kw))));
  }),
  http.get('/api/lookup/corners', async ({ request }) => {
    await LATENCY();
    const ofcCode = q(request).get('ofcCode');
    if (!ofcCode) return fail(400, '사무소코드는 필수입니다.', 'V001_20');
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
    const sidoCode = q(request).get('sidoCode');
    if (!sidoCode) return fail(400, '필수 파라미터가 없습니다: sidoCode', 'VAL_002');
    return ok(SIGUN.filter((s) => s.sidoCode === sidoCode));
  }),
  http.get('/api/lookup/holidays', async ({ request }) => {
    await LATENCY();
    const sp = q(request);
    const from = sp.get('from');
    const to = sp.get('to');
    if (!from || !to) return fail(400, `필수 파라미터가 없습니다: ${!from ? 'from' : 'to'}`, 'VAL_002');
    if (dayjs(to, 'YYYYMMDD').diff(dayjs(from, 'YYYYMMDD'), 'day') + 1 > 366) return fail(400, '입력값이 올바르지 않습니다: 최대 366일', 'VAL_001');
    return ok(holidaysOf(from, to));
  }),
];
