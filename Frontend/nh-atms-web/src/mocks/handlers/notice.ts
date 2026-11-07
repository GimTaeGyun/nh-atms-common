import { http, type RequestHandler } from 'msw';
import type { Notice, NoticeDeleteRequest, NoticeDeleteResult, NoticeSave } from '@/domain/notice';
import { dayjs } from '@/utils/date';
import { byteLength } from '@/utils/rules';
import { NOTICES } from '../data/notice';
import { OFFICES } from '../data/lookup';
import { MOCK_ME } from './me';
import { LATENCY, fail, ok, paginate, q } from './_util';

/**
 * 공지사항 견본(`sample.notice`) 목 핸들러 — API 계약 §3 응답 모양·응답코드·문구를 백엔드(NoticeService)와 같게.
 * 쓰기 목은 ok(data, '<api-messages.tsv 와 같은 문구>'), 조회 목은 ok(data). 데이터는 ../data/notice.ts.
 */

/* 응답코드 문구 — api-messages.tsv 와 같은 글 */
const MSG = {
  S002: '등록되었습니다.',
  S003: '수정되었습니다.',
  S005: (n: number) => `${n}건 삭제되었습니다.`,
  NTC_001: '공지사항을 찾을 수 없습니다.',
  VAL_001: (a: string) => `입력값이 올바르지 않습니다: ${a}`,
  VAL_003: (a: string) => `파라미터 형식이 올바르지 않습니다: ${a}`,
};
const notFound = () => fail(404, MSG.NTC_001, 'NTC_001');
const val001 = (a: string) => fail(400, MSG.VAL_001(a), 'VAL_001');
const val003 = (a: string) => fail(400, MSG.VAL_003(a), 'VAL_003');

const isYmd = (v: string) => /^\d{8}$/.test(v) && dayjs(v, 'YYYYMMDD', true).isValid();
const blank = (v: string | null | undefined) => (v ?? '').trim() === '';
const opt = (v: string | null) => (v && v.trim() ? v.trim() : undefined);

/** 사무소코드 정리(서버 OfficeCode.norm): 숫자 1~6자리 → 6자리, 그 밖 VAL_003. 비면 null */
const normOfc = (v: string | null | undefined): string | null | 'BAD' => {
  const t = (v ?? '').trim();
  if (!t) return null;
  return /^\d{1,6}$/.test(t) ? t.padStart(6, '0') : 'BAD';
};
const kanmOf = (ofcCode: string | null) => (ofcCode ? OFFICES.find((o) => o.ofcCode === ofcCode)?.kanm ?? null : null);
const now14 = () => dayjs().format('YYYYMMDDHHmmss');

/** 본문 검사(서버 NoticeService.toNotice 와 같은 순서) — 오류 응답 또는 정리된 값 */
const checkSave = (b: Partial<NoticeSave> | null) => {
  if (!b) return { error: fail(400, '요청 내용을 읽을 수 없습니다. 입력값을 확인하세요.', 'VAL_004') };
  const subject = (b.subject ?? '').trim();
  const text = b.text ?? '';
  if (!subject) return { error: val001('subject') };
  if (blank(text)) return { error: val001('text') };
  if (byteLength(subject) > 200) return { error: val001('subject') };
  if (byteLength(text) > 4000) return { error: val001('text') };
  const ofc = normOfc(b.ofcCode);
  if (ofc === 'BAD') return { error: val003('ofcCode') };
  return { value: { subject, text, ofcCode: ofc } };
};

export const noticeHandlers: RequestHandler[] = [
  http.get('/api/notice', async ({ request }) => {
    await LATENCY();
    const sp = q(request);
    const from = opt(sp.get('fromDate'));
    const to = opt(sp.get('toDate'));
    if (from && !isYmd(from)) return val003('fromDate');
    if (to && !isYmd(to)) return val003('toDate');
    if (from && to) {
      const days = dayjs(to, 'YYYYMMDD').diff(dayjs(from, 'YYYYMMDD'), 'day') + 1;
      if (days < 1 || days > 366) return val001('fromDate~toDate');
    }
    const ofc = normOfc(sp.get('ofcCode'));
    if (ofc === 'BAD') return val003('ofcCode');
    const perNo = opt(sp.get('perNo'));
    const rawField = opt(sp.get('field'))?.toUpperCase();
    if (rawField && !['ALL', 'SUBJECT', 'TEXT', 'NAME'].includes(rawField)) return val003('field');
    const keyword = rawField && rawField !== 'ALL' ? opt(sp.get('keyword')) : undefined;
    const hit = (n: Notice) => {
      if (!keyword) return true;
      const v = rawField === 'SUBJECT' ? n.subject : rawField === 'TEXT' ? n.text : n.name;
      return (v ?? '').includes(keyword);
    };
    const rows = NOTICES.filter(
      (n) =>
        (!from || (n.wrtDate ?? '') >= from) &&
        (!to || (n.wrtDate ?? '') <= to) &&
        (!ofc || n.ofcCode === ofc) &&
        (!perNo || n.perNo === perNo) &&
        hit(n),
    )
      .sort((a, b) => b.no - a.no)
      .map((n) => ({ ...n, text: null }));
    return ok(paginate(rows, sp));
  }),

  http.get('/api/notice/:no', async ({ request, params }) => {
    await LATENCY();
    const n = NOTICES.find((x) => x.no === Number(params.no));
    if (!n) return notFound();
    if ((q(request).get('hit') ?? '').toUpperCase() === 'Y') n.visit = (n.visit ?? 0) + 1;
    return ok({ ...n });
  }),

  http.post('/api/notice', async ({ request }) => {
    await LATENCY();
    const r = checkSave((await request.json().catch(() => null)) as Partial<NoticeSave> | null);
    if (r.error) return r.error;
    const no = NOTICES.reduce((m, x) => Math.max(m, x.no), 0) + 1; // 서버 잠정 Q-02 와 같은 MAX+1
    const ts = now14();
    const created: Notice = {
      no,
      ...r.value,
      kanm: kanmOf(r.value.ofcCode),
      visit: 0,
      name: MOCK_ME.name,
      perNo: MOCK_ME.perNo,
      wrtDate: ts.slice(0, 8),
      crtDtm: ts,
      crtCmeno: MOCK_ME.perNo,
      lschgDtm: ts,
      lsCmeno: MOCK_ME.perNo,
    };
    NOTICES.push(created);
    return ok({ ...created }, MSG.S002);
  }),

  http.put('/api/notice/:no', async ({ request, params }) => {
    await LATENCY();
    const r = checkSave((await request.json().catch(() => null)) as Partial<NoticeSave> | null);
    if (r.error) return r.error;
    const n = NOTICES.find((x) => x.no === Number(params.no));
    if (!n) return notFound();
    Object.assign(n, r.value, { kanm: kanmOf(r.value.ofcCode), lschgDtm: now14(), lsCmeno: MOCK_ME.perNo });
    return ok({ ...n }, MSG.S003);
  }),

  http.post('/api/notice/delete', async ({ request }) => {
    await LATENCY();
    const body = (await request.json().catch(() => null)) as Partial<NoticeDeleteRequest> | null;
    const raw = body?.nos;
    if (!Array.isArray(raw) || raw.length === 0 || raw.some((v) => v === null || v === undefined)) return val001('nos');
    const nos = Array.from(new Set(raw.map(Number)));
    if (nos.length > 100) return val001('nos');
    const before = NOTICES.length;
    for (let i = NOTICES.length - 1; i >= 0; i--) if (nos.includes(NOTICES[i].no)) NOTICES.splice(i, 1);
    const count = before - NOTICES.length;
    if (count === 0) return notFound();
    return ok<NoticeDeleteResult>({ count }, MSG.S005(count));
  }),
];
