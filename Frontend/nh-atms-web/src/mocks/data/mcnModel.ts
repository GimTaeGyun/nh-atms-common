/**
 * 기기모델코드 견본(`sample.mcnModel`) 목 데이터 — 응답 모양은 domain/mcnModel.ts(API 계약 §5).
 * 공통 조회 목(data/lookup.ts)의 MODELS·VENDORS 에서 시작해 createRng 로 모델을 더 지어 붙인다(새로고침해도 같은 값).
 * 컬럼 길이는 db/ddl/TB_CO_MODEL.sql 정본 이내: VEND_CODE·MCN_TYPE·MODEL_CODE 2, MODEL_NM 80바이트, 개인번호 9, 일시 14.
 * 일괄 저장 목이 이 배열을 바꾼다. 테스트는 resetMcnModels() 로 처음 상태로 돌린다.
 * (공통 조회 `/api/lookup/models` 목은 data/lookup.ts MODELS 를 그대로 쓴다 — 이 화면에서 저장해도 모델 콤보 목에는 반영되지 않는다)
 */
import type { McnModel } from '@/domain/mcnModel';
import { createRng } from '@/utils/random';
import { ME_PERSON, MODELS, PERSONS, VENDORS } from './lookup';

/** 기기구분(MCN_TYPE) — 코드표가 정본에 없어 있는 값 목록으로 보여 준다(잠정) */
const MCN_TYPES = ['01', '02', '03'] as const;
/** 기기사별 모델코드 앞 글자(2자리 = 글자 1 + 숫자 1) */
const PREFIX: Record<string, string> = { '01': 'A', '02': 'H', '03': 'C', '04': 'U' };
/** 기기구분별 모델명 머리 */
const NAME_HEAD: Record<string, string> = { '01': 'ATM', '02': 'STM', '03': '공과금수납기' };

const keyOf = (r: Pick<McnModel, 'vendCode' | 'mcnType' | 'modelCode'>) => `${r.vendCode}-${r.mcnType}-${r.modelCode}`;
const vendNmOf = (vendCode: string): string | null => VENDORS.find((v) => v.vendCode === vendCode)?.vendNm ?? null;

const build = (): McnModel[] => {
  const rng = createRng(20261108);
  const editors = [ME_PERSON.perNo, ...PERSONS.slice(1, 4).map((p) => p.perNo)];
  const out: McnModel[] = [];
  const seen = new Set<string>();
  const push = (r: Pick<McnModel, 'vendCode' | 'mcnType' | 'modelCode' | 'modelNm'>) => {
    if (seen.has(keyOf(r))) return;
    seen.add(keyOf(r));
    const i = out.length;
    const crtDtm = `2026${String(1 + (i % 9)).padStart(2, '0')}${String(1 + (i % 28)).padStart(2, '0')}0930${String(i % 60).padStart(2, '0')}`;
    const changed = rng.chance(0.5);
    const crtCmeno = rng.pick(editors);
    out.push({
      vendCode: r.vendCode,
      vendNm: vendNmOf(r.vendCode),
      mcnType: r.mcnType,
      modelCode: r.modelCode,
      modelNm: r.modelNm,
      crtDtm,
      crtCmeno,
      lschgDtm: changed ? `202610${String(1 + (i % 28)).padStart(2, '0')}1415${String(i % 60).padStart(2, '0')}` : crtDtm,
      lsCmeno: changed ? rng.pick(editors) : crtCmeno,
    });
  };
  MODELS.forEach((m) => push(m));
  VENDORS.forEach((v) => {
    const n = rng.int(5, 8);
    for (let k = 0; k < n; k++) {
      const mcnType = rng.pick(MCN_TYPES);
      const modelCode = `${PREFIX[v.vendCode] ?? 'M'}${rng.int(1, 9)}`;
      const modelNm = rng.chance(0.15) ? null : `${v.vendNm ?? '기기'} ${NAME_HEAD[mcnType]}-${rng.int(10, 99)}00`;
      push({ vendCode: v.vendCode, mcnType, modelCode, modelNm });
    }
  });
  return out.sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
};

/** 목 저장소(일괄 저장 목이 바꾼다) */
export const MCN_MODELS: McnModel[] = build();

/** 테스트용: 처음 상태로 */
export const resetMcnModels = (): void => {
  MCN_MODELS.splice(0, MCN_MODELS.length, ...build());
};
