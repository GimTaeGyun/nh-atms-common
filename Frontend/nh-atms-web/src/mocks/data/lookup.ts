/**
 * 공통 조회 목 데이터 — API 계약 §2 모양 그대로(필드 이름·타입이 계약서). createRng 로 새로고침해도 같은 값.
 * 실제 값(코드 체계·사무소명)은 개발 DB(TB_ 테이블)에서 확인한다. 여기 값은 화면 확인용 가짜다.
 */
import type { Code, Corner, DistinctTarget, DistinctValue, Holiday, Machine, Model, Office, Person, Sido, Sigun, Vendor } from '@/domain/lookup';
import { createRng } from '@/utils/random';
import { dayjs } from '@/utils/date';

/** 고정 사용자(목 /api/me)의 사무소 */
export const MY_OFC_CODE = '000080';

export const SIDO: Sido[] = [
  { sidoCode: '11', sidoNm: '서울특별시' },
  { sidoCode: '26', sidoNm: '부산광역시' },
  { sidoCode: '30', sidoNm: '대전광역시' },
  { sidoCode: '29', sidoNm: '광주광역시' },
  { sidoCode: '41', sidoNm: '경기도' },
];

export const SIGUN: Sigun[] = [
  { sidoCode: '11', sigunCode: '11110', sigunNm: '종로구' },
  { sidoCode: '11', sigunCode: '11140', sigunNm: '중구' },
  { sidoCode: '11', sigunCode: '11680', sigunNm: '강남구' },
  { sidoCode: '11', sigunCode: '11650', sigunNm: '서초구' },
  { sidoCode: '26', sigunCode: '26350', sigunNm: '해운대구' },
  { sidoCode: '26', sigunCode: '26230', sigunNm: '부산진구' },
  { sidoCode: '30', sigunCode: '30170', sigunNm: '서구' },
  { sidoCode: '29', sigunCode: '29140', sigunNm: '서구' },
  { sidoCode: '41', sigunCode: '41135', sigunNm: '성남시 분당구' },
  { sidoCode: '41', sigunCode: '41111', sigunNm: '수원시 장안구' },
];

const sidoNm = (code: string) => SIDO.find((s) => s.sidoCode === code)?.sidoNm ?? null;

export const OFFICES: Office[] = (
  [
    ['000080', '테크부문', '11'],
    ['000001', '본점영업부', '11'],
    ['000056', '광화문금융센터', '11'],
    ['001234', '강남금융센터', '11'],
    ['001301', '서초중앙지점', '11'],
    ['003105', '분당중앙지점', '41'],
    ['003222', '수원역지점', '41'],
    ['004010', '부산중앙지점', '26'],
    ['004511', '해운대지점', '26'],
    ['005020', '대전둔산지점', '30'],
    ['006003', '광주상무지점', '29'],
    ['007777', '사무소명미등록', null],
  ] as const
).map(([ofcCode, kanm, sido]) => ({ ofcCode, kanm: ofcCode === '007777' ? null : kanm, sidoCode: sido, sidoNm: sido ? sidoNm(sido) : null }));

/** 기기사 — 원천 잠정(Q6): 일부는 이름 없음(vendNm=null) → 화면은 코드만 */
export const VENDORS: Vendor[] = [
  { vendCode: '01', vendNm: '에이텍' },
  { vendCode: '02', vendNm: '효성티엔에스' },
  { vendCode: '03', vendNm: '청호컴넷' },
  { vendCode: '04', vendNm: null },
];

export const MODELS: Model[] = [
  { vendCode: '01', mcnType: 'ATM', modelCode: 'AT3200', modelNm: 'ATM-3200' },
  { vendCode: '01', mcnType: 'ATM', modelCode: 'AT3500', modelNm: 'ATM-3500' },
  { vendCode: '01', mcnType: 'STM', modelCode: 'ATSTM1', modelNm: '에이텍 STM' },
  { vendCode: '02', mcnType: 'ATM', modelCode: 'HY4100', modelNm: 'ATM-4100' },
  { vendCode: '02', mcnType: 'BIL', modelCode: 'HYBIL1', modelNm: '공과금수납기' },
  { vendCode: '03', mcnType: 'ATM', modelCode: 'CH1000', modelNm: '청호 ATM' },
  { vendCode: '04', mcnType: 'ATM', modelCode: 'UN0001', modelNm: null },
];

const SRCS: [string, string][] = [['A1', 'ATM 일반형'], ['A2', 'ATM 365형'], ['S1', 'STM'], ['B1', '공과금수납기']];
const CORNER_WORDS = ['점내', '점내365', '역 2번출구', '지하상가', '대합실', '1층 로비', '테스트실'];
const NAMES = ['김민준', '이서연', '박지호', '최수아', '정예준', '강하윤', '조도윤', '윤지우', '장서준', '임하은', '한시우', '오지민'];
const JIKEUB = ['과장', '차장', '대리', '주임', '계장', '팀장'];

export const CORNERS: Corner[] = [];
export const MACHINES: Machine[] = [];
export const PERSONS: Person[] = [];

const rng = createRng(20261106);
OFFICES.forEach((o, oi) => {
  const cornerCount = oi === 0 ? 4 : rng.int(1, 3);
  for (let c = 0; c < cornerCount; c++) {
    CORNERS.push({ ofcCode: o.ofcCode, instPstCode: String(c + 1).padStart(3, '0'), instPstNm: c === cornerCount - 1 && oi === 0 ? null : `${(o.kanm ?? '').replace(/금융센터|중앙지점|지점|영업부|부문/g, '')} ${CORNER_WORDS[(oi + c) % CORNER_WORDS.length]}`, useYn: rng.chance(0.9) ? 'Y' : 'N' });
  }
  const mcnCount = oi === 0 ? 6 : rng.int(2, 4);
  for (let m = 0; m < mcnCount; m++) {
    const corner = CORNERS.filter((c) => c.ofcCode === o.ofcCode)[m % cornerCount];
    const [src, srcNm] = rng.pick(SRCS);
    const vendor = rng.pick(VENDORS);
    MACHINES.push({
      ofcCode: o.ofcCode,
      mcnNo: String(m + 1).padStart(3, '0'),
      instPstCode: corner?.instPstCode ?? null,
      instPstNm: corner?.instPstNm ?? null,
      src,
      srcNm,
      komType: rng.pick(['1', '2', '3']),
      vendCode: vendor.vendCode,
      useYn: m === mcnCount - 1 && oi === 0 ? 'N' : 'Y',
    });
  }
  const personCount = oi === 0 ? 8 : rng.int(2, 5);
  for (let p = 0; p < personCount; p++) {
    PERSONS.push({ perNo: String(1000000 + oi * 100 + p + 1), name: NAMES[(oi * 3 + p) % NAMES.length], jikeubName: rng.pick(JIKEUB), samuso: o.ofcCode, samusoName: o.kanm });
  }
});

/** 고정 사용자 본인 — PERSONS 맨 앞에 둔다 */
export const ME_PERSON: Person = { perNo: '1234567', name: '홍길동', jikeubName: '과장', samuso: MY_OFC_CODE, samusoName: '테크부문' };
PERSONS.unshift(ME_PERSON);

/** 공통코드 — 코드구분별. 목에 없는 코드구분은 codesOf 가 3건을 지어서 준다(코드표 미정 Q-03) */
const CODE_TABLE: Record<string, [string, string][]> = {
  SAMPLE: [['01', '견본코드1'], ['02', '견본코드2'], ['03', '견본코드3']],
  USE_YN: [['Y', '사용'], ['N', '미사용']],
};
export const codesOf = (codeType: string): Code[] => {
  const rows = CODE_TABLE[codeType] ?? [['A', `${codeType} 가`], ['B', `${codeType} 나`], ['C', `${codeType} 다`]];
  return rows.map(([code, codeNm], i) => ({ codeType, code, codeNm, desc1: null, desc2: null, desc3: null, sortOrd: i + 1, useYn: 'Y' }));
};

/** 있는 값 목록 — 허용 목록(계약 §2)별 */
const uniq = (vals: (string | null)[]): DistinctValue[] =>
  Array.from(new Set(vals.filter((v): v is string => !!v)))
    .sort()
    .map((value) => ({ value }));
export const distinctOf = (target: DistinctTarget): DistinctValue[] => {
  switch (target) {
    case 'mcn-kom-type':
      return uniq(MACHINES.map((m) => m.komType));
    case 'mcn-op-type':
      return uniq(['0', '1']);
    case 'mcn-inout-type':
      return uniq(['I', 'O']);
    case 'mcn-cnr-pst-spec':
      return uniq(['01', '02', '03']);
    case 'mcn-vend-code':
      return uniq(MACHINES.map((m) => m.vendCode));
    case 'model-mcn-type':
      return uniq(MODELS.map((m) => m.mcnType));
  }
};

/** 휴일 표(TB_NMS_HDAY 모양) — 날짜마다 1행, 토·일·고정 공휴일이면 HDAY_YN='Y' */
const FIXED_HOLIDAYS = ['0101', '0301', '0505', '0606', '0815', '1003', '1009', '1225'];
export const holidaysOf = (from: string, to: string): Holiday[] => {
  const out: Holiday[] = [];
  let d = dayjs(from, 'YYYYMMDD');
  const end = dayjs(to, 'YYYYMMDD');
  while (!d.isAfter(end, 'day')) {
    const dow = d.day();
    const off = dow === 0 || dow === 6 || FIXED_HOLIDAYS.includes(d.format('MMDD'));
    out.push({ hdayDt: d.format('YYYYMMDD'), dayType: dow + 1, hdayYn: off ? 'Y' : 'N', closeYn: off ? 'Y' : 'N' });
    d = d.add(1, 'day');
  }
  return out;
};
