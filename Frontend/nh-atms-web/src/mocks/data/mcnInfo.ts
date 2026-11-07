/**
 * 기기정보 견본(`sample.mcnInfo`) 목 데이터 — 응답 모양은 domain/mcnInfo.ts(API 계약 §4).
 * 공통 조회 목(data/lookup.ts)의 기기·코너·사무소·기기사와 같은 값에서 만든다(기기 검색 팝업과 목록이 서로 맞게).
 * createRng 로 새로고침해도 같은 값, 컬럼 길이는 db/ddl/TB_MCN_INFO.sql 정본 이내
 * (OFC_CODE 6, MCN_NO 3, INST_PST_CODE 3, SRC 2, KOM_TYPE 5, VEND_CODE 2, OP_TYPE 1, INOUT_TYPE 1, CNR_PST_SPEC_CODE 2, 개인번호 9).
 * 등록·수정·삭제 목이 이 배열을 바꾼다. 테스트는 resetMcnInfos() 로 처음 상태로 돌린다.
 */
import type { McnInfo } from '@/domain/mcnInfo';
import { createRng } from '@/utils/random';
import { CORNERS, MACHINES, OFFICES, PERSONS, VENDORS } from './lookup';

const OP_TYPES = ['0', '1'] as const;
const INOUT_TYPES = ['I', 'O'] as const;
const CNR_SPECS = ['01', '02', '03'] as const;

const build = (): McnInfo[] => {
  const rng = createRng(20261107);
  return MACHINES.map((m, i) => {
    const kanm = OFFICES.find((o) => o.ofcCode === m.ofcCode)?.kanm ?? null;
    const vendNm = VENDORS.find((v) => v.vendCode === m.vendCode)?.vendNm ?? null;
    const corner = CORNERS.find((c) => c.ofcCode === m.ofcCode && c.instPstCode === m.instPstCode);
    const day = String(1 + (i % 28)).padStart(2, '0');
    const crtDtm = `202609${day}${String(8 + (i % 10)).padStart(2, '0')}3000`;
    const changed = rng.chance(0.6);
    const editor = rng.pick(PERSONS).perNo;
    return {
      ofcCode: m.ofcCode,
      kanm,
      mcnNo: m.mcnNo,
      instPstCode: m.instPstCode,
      instPstNm: corner?.instPstNm ?? null,
      src: m.src,
      srcNm: m.srcNm,
      komType: m.komType,
      vendCode: m.vendCode,
      vendNm,
      opType: rng.chance(0.85) ? rng.pick(OP_TYPES) : null,
      inoutType: rng.pick(INOUT_TYPES),
      useYn: m.useYn,
      cnrPstSpecCode: rng.chance(0.8) ? rng.pick(CNR_SPECS) : null,
      crtDtm,
      crtCmeno: 'NHCOMMON',
      lschgDtm: changed ? `202610${day}${String(9 + (i % 9)).padStart(2, '0')}1500` : crtDtm,
      lsCmeno: changed ? editor : 'NHCOMMON',
    };
  });
};

/** 기기정보 목 저장소(등록·수정·삭제 목이 바꾼다) */
export const MCN_INFOS: McnInfo[] = build();

/** 처음 상태로 되돌린다(테스트 격리용) */
export const resetMcnInfos = (): void => {
  MCN_INFOS.splice(0, MCN_INFOS.length, ...build());
};
