import { http, type RequestHandler } from 'msw';
import type { McnInfo, McnInfoSave } from '@/domain/mcnInfo';
import { dayjs } from '@/utils/date';
import { CORNERS, ME_PERSON, OFFICES, VENDORS } from '../data/lookup';
import { MCN_INFOS } from '../data/mcnInfo';
import { LATENCY, fail, ok, paginate, q } from './_util';

/**
 * 기기정보 견본(`sample.mcnInfo`) 목 핸들러 — API 계약 §4 응답 모양·오류코드 그대로.
 * 검사 순서는 백엔드와 같다: 본문 @Valid(VAL_001 필드명) → 사무소(V001_20·VAL_003 ofcCode) → 기번(VAL_003 mcnNo) → 중복(MCN_002)/없음(404 MCN_001).
 * 쓰기 목 문구는 api-messages.tsv 와 같은 글(S002·S003·S004), 조회 목은 ok(data).
 */

/* api-messages.tsv 문구 — 백엔드 ApiMessages.text 와 같은 결과 */
const MSG = {
  S002: '등록되었습니다.',
  S003: '수정되었습니다.',
  S004: '삭제되었습니다.',
  V001_20: '사무소코드는 필수입니다.',
  VAL_001: (f: string) => `입력값이 올바르지 않습니다: ${f}`,
  VAL_003: (f: string) => `파라미터 형식이 올바르지 않습니다: ${f}`,
  MCN_001: (o: string, m: string) => `기기정보를 찾을 수 없습니다. (${o}-${m})`,
  MCN_002: (o: string, m: string) => `이미 등록된 기기입니다. (${o}-${m})`,
};

/** 오류 응답 하나 또는 정리된 값 */
type Checked<T> = { value: T } | { error: Response };

/** 백엔드 OfficeCode.require — 비면 V001_20, 숫자 1~6자리는 앞 0 채움, 그 밖은 VAL_003(ofcCode) */
const requireOfc = (v: unknown): Checked<string> => {
  const t = typeof v === 'string' ? v.trim() : '';
  if (!t) return { error: fail(400, MSG.V001_20, 'V001_20') };
  if (!/^\d{1,6}$/.test(t)) return { error: fail(400, MSG.VAL_003('ofcCode'), 'VAL_003') };
  return { value: t.padStart(6, '0') };
};

/** 백엔드 McnInfoService.mcnNo — 숫자 3자리가 아니면 VAL_003(mcnNo) */
const requireMcnNo = (v: unknown): Checked<string> => {
  const t = typeof v === 'string' ? v.trim() : '';
  return /^\d{3}$/.test(t) ? { value: t } : { error: fail(400, MSG.VAL_003('mcnNo'), 'VAL_003') };
};

const trimToNull = (v: unknown): string | null => {
  const t = typeof v === 'string' ? v.trim() : '';
  return t ? t : null;
};

/** 백엔드 McnInfoSave 의 @Valid(@Size·useYn @NotBlank @Pattern [YN]) — 실패하면 VAL_001(필드명) */
const MAX_LEN: [keyof McnInfoSave, number][] = [['instPstCode', 3], ['src', 2], ['komType', 5], ['vendCode', 2], ['opType', 1], ['inoutType', 1], ['cnrPstSpecCode', 2]];
const validBody = (b: Partial<McnInfoSave>): Response | null => {
  for (const [f, n] of MAX_LEN) {
    const v = b[f];
    if (typeof v === 'string' && v.length > n) return fail(400, MSG.VAL_001(f), 'VAL_001');
  }
  if (b.useYn !== 'Y' && b.useYn !== 'N') return fail(400, MSG.VAL_001('useYn'), 'VAL_001');
  return null;
};

const now14 = () => dayjs().format('YYYYMMDDHHmmss');
const find = (o: string, m: string) => MCN_INFOS.findIndex((r) => r.ofcCode === o && r.mcnNo === m);

/** 저장 본문 → 응답 행(조인 이름은 공통 조회 목 데이터에서) */
const toRow = (o: string, m: string, b: Partial<McnInfoSave>, audit: Pick<McnInfo, 'crtDtm' | 'crtCmeno' | 'lschgDtm' | 'lsCmeno'>): McnInfo => {
  const instPstCode = trimToNull(b.instPstCode);
  const src = trimToNull(b.src);
  const vendCode = trimToNull(b.vendCode);
  return {
    ofcCode: o,
    kanm: OFFICES.find((x) => x.ofcCode === o)?.kanm ?? null,
    mcnNo: m,
    instPstCode,
    instPstNm: CORNERS.find((c) => c.ofcCode === o && c.instPstCode === instPstCode)?.instPstNm ?? null,
    src,
    srcNm: MCN_INFOS.find((r) => r.src === src)?.srcNm ?? null,
    komType: trimToNull(b.komType),
    vendCode,
    vendNm: VENDORS.find((v) => v.vendCode === vendCode)?.vendNm ?? null,
    opType: trimToNull(b.opType),
    inoutType: trimToNull(b.inoutType),
    useYn: b.useYn === 'N' ? 'N' : 'Y',
    cnrPstSpecCode: trimToNull(b.cnrPstSpecCode),
    ...audit,
  };
};

export const mcnInfoHandlers: RequestHandler[] = [
  http.get('/api/mcn-info', async ({ request }) => {
    await LATENCY();
    const sp = q(request);
    const ofc = requireOfc(sp.get('ofcCode'));
    if ('error' in ofc) return ofc.error;
    const mcnRaw = trimToNull(sp.get('mcnNo'));
    let mcnNo: string | null = null;
    if (mcnRaw) {
      const m = requireMcnNo(mcnRaw);
      if ('error' in m) return m.error;
      mcnNo = m.value;
    }
    const useYn = trimToNull(sp.get('useYn'));
    if (useYn && useYn !== 'Y' && useYn !== 'N') return fail(400, MSG.VAL_003('useYn'), 'VAL_003');
    const vendCode = trimToNull(sp.get('vendCode'));
    const komType = trimToNull(sp.get('komType'));
    const opType = trimToNull(sp.get('opType'));
    const inoutType = trimToNull(sp.get('inoutType'));
    const rows = MCN_INFOS.filter(
      (r) =>
        r.ofcCode === ofc.value &&
        (!mcnNo || r.mcnNo === mcnNo) &&
        (!vendCode || r.vendCode === vendCode) &&
        (!komType || r.komType === komType) &&
        (!opType || r.opType === opType) &&
        (!inoutType || r.inoutType === inoutType) &&
        (!useYn || r.useYn === useYn),
    ).sort((a, b) => (a.ofcCode + a.mcnNo).localeCompare(b.ofcCode + b.mcnNo));
    return ok(paginate(rows, sp));
  }),

  http.get('/api/mcn-info/:ofcCode/:mcnNo', async ({ params }) => {
    await LATENCY();
    const ofc = requireOfc(params.ofcCode);
    if ('error' in ofc) return ofc.error;
    const mcn = requireMcnNo(params.mcnNo);
    if ('error' in mcn) return mcn.error;
    const i = find(ofc.value, mcn.value);
    return i < 0 ? fail(404, MSG.MCN_001(ofc.value, mcn.value), 'MCN_001') : ok(MCN_INFOS[i]);
  }),

  http.post('/api/mcn-info', async ({ request }) => {
    await LATENCY();
    const b = (await request.json()) as Partial<McnInfoSave>;
    const invalid = validBody(b);
    if (invalid) return invalid;
    const ofc = requireOfc(b.ofcCode);
    if ('error' in ofc) return ofc.error;
    const mcn = requireMcnNo(b.mcnNo);
    if ('error' in mcn) return mcn.error;
    if (find(ofc.value, mcn.value) >= 0) return fail(400, MSG.MCN_002(ofc.value, mcn.value), 'MCN_002');
    const t = now14();
    const row = toRow(ofc.value, mcn.value, b, { crtDtm: t, crtCmeno: ME_PERSON.perNo, lschgDtm: t, lsCmeno: ME_PERSON.perNo });
    MCN_INFOS.push(row);
    return ok(row, MSG.S002);
  }),

  http.put('/api/mcn-info/:ofcCode/:mcnNo', async ({ params, request }) => {
    await LATENCY();
    const b = (await request.json()) as Partial<McnInfoSave>;
    const invalid = validBody(b);
    if (invalid) return invalid;
    const ofc = requireOfc(params.ofcCode);
    if ('error' in ofc) return ofc.error;
    const mcn = requireMcnNo(params.mcnNo);
    if ('error' in mcn) return mcn.error;
    const i = find(ofc.value, mcn.value);
    if (i < 0) return fail(404, MSG.MCN_001(ofc.value, mcn.value), 'MCN_001');
    const prev = MCN_INFOS[i];
    const row = toRow(ofc.value, mcn.value, b, { crtDtm: prev.crtDtm, crtCmeno: prev.crtCmeno, lschgDtm: now14(), lsCmeno: ME_PERSON.perNo });
    MCN_INFOS[i] = row;
    return ok(row, MSG.S003);
  }),

  http.delete('/api/mcn-info/:ofcCode/:mcnNo', async ({ params }) => {
    await LATENCY();
    const ofc = requireOfc(params.ofcCode);
    if ('error' in ofc) return ofc.error;
    const mcn = requireMcnNo(params.mcnNo);
    if ('error' in mcn) return mcn.error;
    const i = find(ofc.value, mcn.value);
    if (i < 0) return fail(404, MSG.MCN_001(ofc.value, mcn.value), 'MCN_001');
    MCN_INFOS[i] = { ...MCN_INFOS[i], useYn: 'N', lschgDtm: now14(), lsCmeno: ME_PERSON.perNo };
    return ok(null, MSG.S004);
  }),
];
