import { http, type RequestHandler } from 'msw';
import type { McnModel, McnModelBatch, McnModelBatchResult } from '@/domain/mcnModel';
import { dayjs } from '@/utils/date';
import { byteLength } from '@/utils/rules';
import { ME_PERSON, VENDORS } from '../data/lookup';
import { MCN_MODELS } from '../data/mcnModel';
import { LATENCY, fail, ok, q } from './_util';

/**
 * 기기모델코드 견본(`sample.mcnModel`) 목 핸들러 — API 계약 §5 응답 모양·오류코드 그대로.
 * 검사 순서는 백엔드 McnModelService.saveBatch 와 같다(권한 검사만 빠짐 — 목은 DB 권한이 없다):
 *   키·모델명 VAL_001(필드명) → 본문 안 중복 MDL_002 → 삭제 없음 404 MDL_001 → 수정 없음 404 MDL_001 → 추가 중복 MDL_002.
 * 한 건이라도 실패하면 아무것도 바꾸지 않는다(한 트랜잭션 흉내). 쓰기 목 문구는 api-messages.tsv 와 같은 글(S001), 조회 목은 ok(data).
 */

/* api-messages.tsv 문구 — 백엔드 ApiMessages.text 와 같은 결과 */
const MSG = {
  S001: '저장되었습니다.',
  VAL_001: (f: string) => `입력값이 올바르지 않습니다: ${f}`,
  MDL_001: (k: string) => `모델코드를 찾을 수 없습니다. (${k})`,
  MDL_002: (k: string) => `이미 등록된 모델코드입니다. (${k})`,
};

const trimToNull = (v: unknown): string | null => {
  const t = typeof v === 'string' ? v.trim() : '';
  return t ? t : null;
};

const keyText = (r: Pick<McnModel, 'vendCode' | 'mcnType' | 'modelCode'>) => `${r.vendCode}-${r.mcnType}-${r.modelCode}`;
const now14 = () => dayjs().format('YYYYMMDDHHmmss');

/** 백엔드 McnModelService.clean — 키 3개 필수·2자 이내, 모델명 80바이트 이내. 실패면 VAL_001(필드명) */
const clean = (r: Partial<McnModel> | null | undefined, withName: boolean): McnModel | Response => {
  if (!r) return fail(400, MSG.VAL_001('row'), 'VAL_001');
  const keys = { vendCode: trimToNull(r.vendCode), mcnType: trimToNull(r.mcnType), modelCode: trimToNull(r.modelCode) };
  for (const f of ['vendCode', 'mcnType', 'modelCode'] as const) {
    const v = keys[f];
    if (v === null || v.length > 2) return fail(400, MSG.VAL_001(f), 'VAL_001');
  }
  const modelNm = withName ? trimToNull(r.modelNm) : null;
  if (byteLength(modelNm) > 80) return fail(400, MSG.VAL_001('modelNm'), 'VAL_001');
  return { vendCode: keys.vendCode as string, mcnType: keys.mcnType as string, modelCode: keys.modelCode as string, modelNm };
};

export const mcnModelHandlers: RequestHandler[] = [
  http.get('/api/mcn-model', async ({ request }) => {
    await LATENCY();
    const sp = q(request);
    const vendCode = trimToNull(sp.get('vendCode'));
    const mcnType = trimToNull(sp.get('mcnType'));
    const kw = trimToNull(sp.get('q'));
    return ok(
      MCN_MODELS.filter(
        (m) => (!vendCode || m.vendCode === vendCode) && (!mcnType || m.mcnType === mcnType) && (!kw || m.modelCode.includes(kw) || (m.modelNm ?? '').includes(kw)),
      ).map((m) => ({ ...m })),
    );
  }),

  http.post('/api/mcn-model/batch', async ({ request }) => {
    await LATENCY();
    const body = (await request.json()) as Partial<McnModelBatch>;
    const parts: Record<'added' | 'updated' | 'deleted', McnModel[]> = { added: [], updated: [], deleted: [] };
    for (const kind of ['added', 'updated', 'deleted'] as const) {
      for (const r of body[kind] ?? []) {
        const c = clean(r, kind !== 'deleted');
        if (c instanceof Response) return c;
        parts[kind].push(c);
      }
    }
    const seen = new Set<string>();
    for (const r of parts.added) {
      if (seen.has(keyText(r))) return fail(400, MSG.MDL_002(keyText(r)), 'MDL_002');
      seen.add(keyText(r));
    }

    // 사본에서 처리하고 다 되면 바꿔 끼운다(한 트랜잭션 흉내)
    const work = MCN_MODELS.map((m) => ({ ...m }));
    const idx = (r: McnModel) => work.findIndex((m) => keyText(m) === keyText(r));
    const stamp = now14();
    for (const r of parts.deleted) {
      const i = idx(r);
      if (i < 0) return fail(404, MSG.MDL_001(keyText(r)), 'MDL_001');
      work.splice(i, 1);
    }
    for (const r of parts.updated) {
      const i = idx(r);
      if (i < 0) return fail(404, MSG.MDL_001(keyText(r)), 'MDL_001');
      work[i] = { ...work[i], modelNm: r.modelNm, lschgDtm: stamp, lsCmeno: ME_PERSON.perNo };
    }
    for (const r of parts.added) {
      if (idx(r) >= 0) return fail(400, MSG.MDL_002(keyText(r)), 'MDL_002');
      const vendNm = VENDORS.find((v) => v.vendCode === r.vendCode)?.vendNm ?? null;
      work.push({ ...r, vendNm, crtDtm: stamp, crtCmeno: ME_PERSON.perNo, lschgDtm: stamp, lsCmeno: ME_PERSON.perNo });
    }
    work.sort((a, b) => keyText(a).localeCompare(keyText(b)));
    MCN_MODELS.splice(0, MCN_MODELS.length, ...work);
    const result: McnModelBatchResult = { added: parts.added.length, updated: parts.updated.length, deleted: parts.deleted.length };
    return ok(result, MSG.S001);
  }),
];
